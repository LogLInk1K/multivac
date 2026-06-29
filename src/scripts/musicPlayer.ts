// 共享音乐播放器模块 —— LeftSidebar 和 BlogPost 共用

export interface SongData {
  name?: string;
  title?: string;
  artist?: string;
  author?: string;
  url: string;
  pic?: string;
  cover?: string;
  lrc?: string;
  playlist_name?: string;
}

export interface APlayerInstance {
  audio: HTMLAudioElement & { duration: number };
  list: {
    audios: { name: string; artist: string; cover: string; url: string; lrc: string }[];
    index: number;
    switch(index: number): void;
  };
  play(): void;
  pause(): void;
  seek(time: number): void;
  on(event: string, callback: () => void): void;
}

export interface MusicPlayerState {
  ap: APlayerInstance | null;
  songsData: SongData[];
  isInitialized: boolean;
  updateTimer: ReturnType<typeof setInterval> | null;
  previousIndex?: number;
  uiUpdaters: (() => void)[];
  progressUpdaters: (() => void)[];
}

declare const APlayer: {
  new (options: {
    container: HTMLElement | null;
    autoplay: boolean;
    theme: string;
    loop: string;
    preload: string;
    volume: number;
    mutex: boolean;
    audio: { name: string; artist: string; url: string; cover: string; lrc: string }[];
  }): APlayerInstance;
};

// 确保 window 类型扩展
declare global {
  interface Window {
    musicPlayerState: MusicPlayerState;
    togglePlay: (() => void) | undefined;
    playPrev: (() => void) | undefined;
    playNext: (() => void) | undefined;
  }
}

function ensureState(): MusicPlayerState {
  window.musicPlayerState = window.musicPlayerState || {
    ap: null,
    songsData: [],
    isInitialized: false,
    updateTimer: null,
    uiUpdaters: [],
    progressUpdaters: [],
  };
  return window.musicPlayerState;
}

function loadAPlayerScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof APlayer !== 'undefined') {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = '/libs/aplayer/APlayer.min.js';
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function startPeriodicUpdate() {
  const state = ensureState();
  if (state.updateTimer) clearInterval(state.updateTimer);
  state.updateTimer = setInterval(() => {
    state.uiUpdaters.forEach((fn) => fn());
    state.progressUpdaters.forEach((fn) => fn());
  }, 100);
}

/** 初始化播放器核心（加载脚本 + 拉取歌单 + 创建 APlayer 实例） */
export async function initPlayerCore(containerId: string): Promise<boolean> {
  const state = ensureState();
  if (state.isInitialized) return true;

  try {
    await loadAPlayerScript();

    // 从 DOM data 属性读取 API 端点列表
    const musicDataEl = document.getElementById('music-data') || document.getElementById('sidebar-data');
    const raw = musicDataEl?.getAttribute('data-api-endpoints') || '';
    let apiEndpoints: string[] = [];
    try {
      apiEndpoints = JSON.parse(raw);
    } catch (error) {
      console.error('音乐播放器 API 端点解析异常:', error);
    }
    if (!apiEndpoints.length) {
      console.warn('Music Player: No API endpoints configured.');
      return false;
    }

    let data: SongData[] | null = null;
    for (const endpoint of apiEndpoints) {
      try {
        const response = await fetch(endpoint);
        const responseData: SongData[] = await response.json();
        if (Array.isArray(responseData) && responseData.length > 0) {
          data = responseData;
          break;
        }
      } catch {
        /* try next */
      }
    }

    if (!data || data.length === 0) {
      console.warn('Playlist Sync: All API endpoints offline.');
      return false;
    }

    // 确保容器存在
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      container.style.display = 'none';
      document.body.appendChild(container);
    }

    const audioList = data.map((item) => ({
      name: item.name || item.title || '未知歌曲',
      artist: item.artist || item.author || '未知艺术家',
      url: item.url,
      cover: item.pic || item.cover || '',
      lrc: item.lrc || '',
    }));

    const ap = new APlayer({
      container,
      autoplay: false,
      theme: '#3b82f6',
      loop: 'all',
      preload: 'auto',
      volume: 0.7,
      mutex: true,
      audio: audioList,
    });

    state.ap = ap;
    state.songsData = data;
    state.isInitialized = true;

    ap.on('play', () => state.uiUpdaters.forEach((fn) => fn()));
    ap.on('pause', () => state.uiUpdaters.forEach((fn) => fn()));
    ap.on('timeupdate', () => state.progressUpdaters.forEach((fn) => fn()));

    registerGlobalControls();
    startPeriodicUpdate();

    return true;
  } catch (error) {
    console.error('Failed to initialize player:', error);
    return false;
  }
}

/** 注册全局控制函数（幂等） */
export function registerGlobalControls() {
  if (!window.togglePlay) {
    window.togglePlay = function () {
      const currentAp = ensureState().ap;
      if (!currentAp || !currentAp.list.audios.length) return;
      if (currentAp.audio.paused) {
        currentAp.play();
      } else {
        currentAp.pause();
      }
    };
  }
  if (!window.playPrev) {
    window.playPrev = function () {
      const currentAp = ensureState().ap;
      if (!currentAp || !currentAp.list.audios.length) return;
      currentAp.list.switch(currentAp.list.index - 1 < 0 ? currentAp.list.audios.length - 1 : currentAp.list.index - 1);
      currentAp.play();
    };
  }
  if (!window.playNext) {
    window.playNext = function () {
      const currentAp = ensureState().ap;
      if (!currentAp || !currentAp.list.audios.length) return;
      currentAp.list.switch(currentAp.list.index + 1 >= currentAp.list.audios.length ? 0 : currentAp.list.index + 1);
      currentAp.play();
    };
  }
}

/** LeftSidebar 专用：更新播放状态 UI */
export function updateSidebarUI() {
  const state = ensureState();
  const currentAp = state.ap;
  if (!currentAp) return;

  const isPlaying = !currentAp.audio.paused;
  const currentSong = currentAp.list.audios[currentAp.list.index];
  const currentIndex = currentAp.list.index;

  const controlPlayIcon = document.getElementById('control-play-icon');
  const controlPauseIcon = document.getElementById('control-pause-icon');
  const indicator = document.getElementById('playing-indicator');
  const currentSongEl = document.getElementById('current-song');
  const coverImg = document.getElementById('playlist-cover') as HTMLImageElement | null;
  const vinylRecord = document.querySelector('.vinyl-record');

  const previousIndex = state.previousIndex ?? -1;
  const hasChangedSong = previousIndex !== currentIndex;

  if (isPlaying) {
    vinylRecord?.classList.add('playing');
    vinylRecord?.classList.remove('paused');
  } else {
    vinylRecord?.classList.add('paused');
  }

  if (currentSong) {
    if (currentSongEl) {
      currentSongEl.textContent = `${currentSong.name} - ${currentSong.artist}`;
    }
    if (hasChangedSong && coverImg && currentSong.cover && coverImg.src !== currentSong.cover) {
      coverImg.style.opacity = '0';
      setTimeout(() => {
        coverImg.src = currentSong.cover;
        coverImg.style.opacity = '1';
      }, 250);
    } else if (!hasChangedSong && coverImg && currentSong.cover && coverImg.src !== currentSong.cover) {
      coverImg.src = currentSong.cover;
    }
  }

  state.previousIndex = currentIndex;

  if (isPlaying) {
    controlPlayIcon?.classList.add('hidden');
    controlPauseIcon?.classList.remove('hidden');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        indicator?.classList.remove('opacity-0');
      });
    });
  } else {
    controlPlayIcon?.classList.remove('hidden');
    controlPauseIcon?.classList.add('hidden');
    indicator?.classList.add('opacity-0');
  }
}

/** LeftSidebar 专用：更新进度条 */
export function updateSidebarProgress() {
  const currentAp = ensureState().ap;
  if (!currentAp) return;

  const progressBar = document.getElementById('progress-bar');
  const currentTimeEl = document.getElementById('current-time');
  const totalTimeEl = document.getElementById('total-time');

  if (progressBar) {
    const percent = (currentAp.audio.currentTime / currentAp.audio.duration) * 100 || 0;
    progressBar.style.width = `${percent}%`;
  }
  if (currentTimeEl) {
    currentTimeEl.textContent = formatTime(currentAp.audio.currentTime);
  }
  if (totalTimeEl) {
    totalTimeEl.textContent = formatTime(currentAp.audio.duration || 0);
  }
}

/** SidebarOfContents 音乐面板专用：更新播放状态 UI */
export function updateMusicPanelUI() {
  const state = ensureState();
  const currentAp = state.ap;
  if (!currentAp) return;

  const isPlaying = !currentAp.audio.paused;
  const currentSong = currentAp.list.audios[currentAp.list.index];

  const songEl = document.getElementById('sidebar-song');
  const artistEl = document.getElementById('sidebar-artist');
  const coverEl = document.getElementById('sidebar-cover') as HTMLImageElement | null;
  const btnCover = document.getElementById('sidebar-btn-cover') as HTMLImageElement | null;
  const playIcon = document.getElementById('sidebar-play-icon');
  const pauseIcon = document.getElementById('sidebar-pause-icon');
  const btnVinyl = document.getElementById('sidebar-btn-vinyl');

  if (currentSong) {
    if (songEl) songEl.textContent = currentSong.name;
    if (artistEl) artistEl.textContent = currentSong.artist;
    if (coverEl && currentSong.cover && coverEl.src !== currentSong.cover) {
      coverEl.src = currentSong.cover;
    }
    if (btnCover && currentSong.cover && btnCover.src !== currentSong.cover) {
      btnCover.src = currentSong.cover;
    }
  }

  if (isPlaying) {
    playIcon?.classList.add('hidden');
    pauseIcon?.classList.remove('hidden');
    btnVinyl?.classList.add('is-playing');
    btnVinyl?.classList.remove('is-paused');
  } else {
    playIcon?.classList.remove('hidden');
    pauseIcon?.classList.add('hidden');
    btnVinyl?.classList.remove('is-playing');
    btnVinyl?.classList.add('is-paused');
  }
}

/** SidebarOfContents 音乐面板专用：更新进度条和时间 */
export function updateMusicPanelProgress() {
  const currentAp = ensureState().ap;
  if (!currentAp) return;

  const progressBar = document.getElementById('sidebar-progress-bar');
  const currentTimeEl = document.getElementById('sidebar-current-time');
  const totalTimeEl = document.getElementById('sidebar-total-time');

  if (currentAp.audio.duration) {
    const percent = (currentAp.audio.currentTime / currentAp.audio.duration) * 100;
    if (progressBar) progressBar.style.width = `${percent}%`;
  }
  if (currentTimeEl) currentTimeEl.textContent = formatTime(currentAp.audio.currentTime);
  if (totalTimeEl) totalTimeEl.textContent = formatTime(currentAp.audio.duration);
}

/** 通用：进度条点击/拖拽跳转 */
export function initProgressBarClick(progressBarId: string = 'progress-bar') {
  const progressBar = document.getElementById(progressBarId);
  const progressContainer = progressBar?.parentElement;

  if (progressContainer && !progressContainer.dataset.clickBound) {
    const seekToPosition = (clientX: number) => {
      const currentAp = ensureState().ap;
      if (!currentAp || !currentAp.audio.duration) return;

      const rect = progressContainer.getBoundingClientRect();
      let percentage = (clientX - rect.left) / rect.width;
      percentage = Math.max(0, Math.min(1, percentage));

      currentAp.seek(percentage * currentAp.audio.duration);
    };

    // 点击跳转
    progressContainer.addEventListener('click', function (e: MouseEvent) {
      seekToPosition(e.clientX);
    });

    // 拖拽跳转
    let isDragging = false;

    progressContainer.addEventListener('mousedown', (e: MouseEvent) => {
      isDragging = true;
      seekToPosition(e.clientX);
    });

    document.addEventListener('mousemove', (e: MouseEvent) => {
      if (!isDragging) return;
      seekToPosition(e.clientX);
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });

    progressContainer.dataset.clickBound = 'true';
  }
}

/** LeftSidebar 专用：恢复侧边栏元数据 UI */
export function restoreSidebarMeta() {
  const state = ensureState();
  const songsData = state.songsData;
  if (songsData && songsData.length > 0) {
    const countEl = document.getElementById('playlist-count');
    if (countEl) countEl.textContent = `${songsData.length} 首歌曲`;

    if (songsData[0]?.playlist_name) {
      const nameEl = document.getElementById('playlist-name');
      if (nameEl) nameEl.textContent = songsData[0].playlist_name;
    }

    if (songsData[0]?.pic) {
      const coverEl = document.getElementById('playlist-cover') as HTMLImageElement | null;
      if (coverEl) coverEl.src = songsData[0].pic;
    }
  }

  const currentAp = state.ap;
  if (currentAp && currentAp.list.audios.length > 0) {
    const currentSong = currentAp.list.audios[currentAp.list.index];
    const coverEl = document.getElementById('playlist-cover') as HTMLImageElement | null;
    if (coverEl && currentSong?.cover) {
      coverEl.src = currentSong.cover;
    }
  }
}

/** 注册 UI 更新回调（播放/暂停/切歌时触发） */
export function registerUIUpdater(fn: () => void) {
  const state = ensureState();
  if (!state.uiUpdaters.includes(fn)) {
    state.uiUpdaters.push(fn);
  }
}

/** 注册进度更新回调（定时触发） */
export function registerProgressUpdater(fn: () => void) {
  const state = ensureState();
  if (!state.progressUpdaters.includes(fn)) {
    state.progressUpdaters.push(fn);
  }
}

export { ensureState, startPeriodicUpdate, formatTime };
