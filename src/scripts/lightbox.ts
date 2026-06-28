/**
 * 轻量级 Lightbox —— 图片灯箱查看组件
 *
 * 功能：
 * - 点击 [data-lightbox] 元素弹出灯箱 overlay
 * - 支持画廊分组（data-lightbox="gallery-name"）
 * - 画廊内左右切换（按钮 + 键盘左右箭头）—— 附带滑入/滑出动画
 * - 关闭（按钮 + Esc 键 + 点击背景）
 * - 缩放（双击放大/还原，滚轮缩放）—— 以鼠标指针位置为中心
 * - 拖拽移动放大后的图片—— 自由平移查看溢出区域
 * - 触屏手势（单指拖拽、双指缩放）
 * - 完整过渡动画系统（打开 / 切换 / 关闭 各阶段独立控制）
 * - 兼容 Astro View Transitions（事件委托 + DOM/样式自动恢复）
 *
 */

type GalleryItem = {
  src: string;
  caption?: string;
  el: HTMLElement;
};

/* ──────────────────────────────────────────────────────────────────
 * CSS 动画系统
 *
 * 核心原则：
 *  1. overlay 只管 visibility（不参与 opacity），避免子元素背景闪烁
 *  2. backdrop / content / btn 各自独立 opacity，分层淡入淡出
 *  3. 图片缩放动画用 CSS class 触发（lb-enter / lb-exit / lb-slide-*）
 *     完成后立即移除 class，不干扰 JS 缩放 transform
 *  4. 图片切换用 lb-slide-prev / lb-slide-next 实现方向性滑入滑出
 * ────────────────────────────────────────────────────────────────── */
const LB_STYLES = `
/* ── Overlay 容器 ── */
.lb-overlay {
  position: fixed; inset: 0; z-index: 99999;
  display: flex; align-items: center; justify-content: center;
  visibility: hidden;
  /* 关闭时：等所有淡出动画结束(300ms)后再隐藏，防止突然消失 */
  transition: visibility 0s 0.3s;
}
.lb-overlay.active {
  visibility: visible;
  /* 打开时：立即可见，无延迟 */
  transition: visibility 0s;
}

/* ── Backdrop（深色背景层）── */
.lb-backdrop {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.85);
  opacity: 0;
  transition: opacity 0.3s ease;
}
.lb-overlay.active .lb-backdrop {
  opacity: 1;
}

/* ── Content（图片+文字层）── */
.lb-content {
  position: relative; z-index: 1;
  display: flex; flex-direction: column; align-items: center;
  /* 初始隐藏，比 backdrop 晚 50ms 出现（层次感） */
  opacity: 0;
  transition: opacity 0.25s ease 0.05s;
}
.lb-overlay.active .lb-content {
  opacity: 1;
}

/* ── 图片容器 ── */
.lb-img-wrap {
  position: relative;
  overflow: visible;
  touch-action: none;
  user-select: none;
  line-height: 0;
}
.lb-img-wrap.lb-dragging { cursor: grabbing; }
.lb-img-wrap.lb-zoomed { cursor: grab; }
.lb-img-wrap:not(.lb-zoomed) { cursor: pointer; }

/* ── 图片 ── */
.lb-img {
  max-width: 90vw; max-height: 85vh;
  object-fit: contain;
  /* 缩放/拖拽过渡（仅 transform，不含 opacity，避免与开关动画冲突） */
  transition: transform 0.2s ease-out;
  transform-origin: 0 0;
  border-radius: 6px;
  display: block;
}
.lb-img.lb-no-transition {
  transition: none;
}

/* ── 图片打开动画（scale + opacity）── */
.lb-img.lb-enter {
  opacity: 0;
  transform: scale(0.92) !important;
  transition: opacity 0.25s ease 0.05s, transform 0.25s cubic-bezier(0.16,1,0.3,1) 0.05s !important;
}
.lb-img.lb-enter-active {
  opacity: 1;
  transform: scale(1) !important;
}

/* ── 图片关闭动画 ── */
.lb-img.lb-exit {
  opacity: 1;
  transform: scale(1) !important;
  transition: opacity 0.2s ease, transform 0.2s ease !important;
}
.lb-img.lb-exit-active {
  opacity: 0;
  transform: scale(0.92) !important;
}

/* ── 图片切换动画（方向性滑入/滑出）── */
.lb-img.lb-slide-out-prev {
  opacity: 1; transform: translateX(0) scale(1) !important;
  transition: opacity 0.2s ease, transform 0.2s ease !important;
}
.lb-img.lb-slide-out-prev-active {
  opacity: 0; transform: translateX(40px) scale(0.95) !important;
}
.lb-img.lb-slide-out-next {
  opacity: 1; transform: translateX(0) scale(1) !important;
  transition: opacity 0.2s ease, transform 0.2s ease !important;
}
.lb-img.lb-slide-out-next-active {
  opacity: 0; transform: translateX(-40px) scale(0.95) !important;
}
.lb-img.lb-slide-in-prev {
  opacity: 0; transform: translateX(-40px) scale(0.95) !important;
  transition: opacity 0.25s cubic-bezier(0.16,1,0.3,1),
              transform 0.25s cubic-bezier(0.16,1,0.3,1) !important;
}
.lb-img.lb-slide-in-prev-active {
  opacity: 1; transform: translateX(0) scale(1) !important;
}
.lb-img.lb-slide-in-next {
  opacity: 0; transform: translateX(40px) scale(0.95) !important;
  transition: opacity 0.25s cubic-bezier(0.16,1,0.3,1),
              transform 0.25s cubic-bezier(0.16,1,0.3,1) !important;
}
.lb-img.lb-slide-in-next-active {
  opacity: 1; transform: translateX(0) scale(1) !important;
}

/* ── Caption ── */
.lb-caption {
  color: rgba(255,255,255,0.8);
  font-size: 14px; line-height: 1.5;
  text-align: center;
  padding: 8px 16px 0;
  max-width: 90vw;
  word-break: break-word;
  opacity: 0;
  transition: opacity 0.2s ease 0.12s;
}
.lb-overlay.active .lb-caption {
  opacity: 1;
}
.lb-caption:empty { display: none; }

/* ── Counter ── */
.lb-counter {
  color: rgba(255,255,255,0.5);
  font-size: 13px;
  padding: 4px 0 0;
  opacity: 0;
  transition: opacity 0.2s ease 0.12s;
}
.lb-overlay.active .lb-counter {
  opacity: 1;
}

/* ── 操作按钮 ── */
.lb-btn {
  position: absolute; z-index: 2;
  width: 44px; height: 44px;
  border: none; border-radius: 50%;
  background: rgba(255,255,255,0.1);
  color: #fff; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  /* 按钮独立淡入淡出，不影响其 background 色值 */
  opacity: 0;
  transition: opacity 0.15s ease 0.1s, background 0.2s ease;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
.lb-overlay.active .lb-btn {
  opacity: 1;
  transition: opacity 0.15s ease 0.1s, background 0.2s ease, transform 0.2s ease;
}
.lb-btn:hover { background: rgba(255,255,255,0.25); }
.lb-btn svg { width: 20px; height: 20px; }

/* ── 按钮定位（hover 时 scale 不可覆盖 translateY）── */
.lb-close { top: 16px; right: 16px; }
.lb-close:hover { transform: scale(1.1); }
.lb-prev { left: 16px; top: 50%; margin-top: -22px; }
.lb-prev:hover { transform: scale(1.1); }
.lb-next { right: 16px; top: 50%; margin-top: -22px; }
.lb-next:hover { transform: scale(1.1); }

/* ── 单图模式 ── */
.lb-overlay.lb-single .lb-prev,
.lb-overlay.lb-single .lb-next,
.lb-overlay.lb-single .lb-counter { display: none; }

/* ── 响应式 ── */
@media (max-width: 640px) {
  .lb-btn { width: 36px; height: 36px; }
  .lb-btn svg { width: 16px; height: 16px; }
  .lb-close { top: 12px; right: 12px; }
  .lb-prev { left: 8px; }
  .lb-next { right: 8px; }
  .lb-caption { font-size: 13px; padding: 6px 12px 0; }
  .lb-counter { font-size: 12px; }
  .lb-img.lb-slide-out-prev-active { transform: translateX(24px) scale(0.95) !important; }
  .lb-img.lb-slide-out-next-active { transform: translateX(-24px) scale(0.95) !important; }
  .lb-img.lb-slide-in-prev { transform: translateX(-24px) scale(0.95) !important; }
  .lb-img.lb-slide-in-next { transform: translateX(40px) scale(0.95) !important; }
}
`;

class Lightbox {
  private overlay!: HTMLElement;
  private imgContainer!: HTMLElement;
  private img!: HTMLImageElement;
  private captionEl!: HTMLElement;
  private counterEl!: HTMLElement;
  private closeBtn!: HTMLElement;
  private prevBtn!: HTMLElement;
  private nextBtn!: HTMLElement;
  private styleEl!: HTMLStyleElement;

  private gallery: GalleryItem[] = [];
  private currentIndex = 0;

  // ── 缩放 / 拖拽状态 ──
  private scale = 1;
  private translateX = 0;
  private translateY = 0;

  // 拖拽
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragStartTX = 0;
  private dragStartTY = 0;

  // 触屏双指缩放
  private lastTouchDist = 0;

  // 动画锁：切换/关闭动画进行中时不接受新操作
  private animating = false;

  private static instance: Lightbox | null = null;
  private static delegated = false;

  private constructor() {
    this.overlay = this.createOverlay();
    this.styleEl = this.createStyle();
    this.recover();
    this.bindOverlayEvents();
    this.bindInteractionEvents();
    this.setupRecoveryHooks();
  }

  static getInstance(): Lightbox {
    if (!Lightbox.instance) {
      Lightbox.instance = new Lightbox();
    }
    return Lightbox.instance;
  }

  // ───────── DOM / 样式恢复 ─────────

  private recover() {
    if (!document.body.contains(this.overlay)) {
      document.body.appendChild(this.overlay);
    }
    if (!document.head.contains(this.styleEl)) {
      document.head.appendChild(this.styleEl);
    }
  }

  private setupRecoveryHooks() {
    const recover = () => this.recover();
    document.addEventListener('astro:after-swap', recover);
    document.addEventListener('astro:page-load', recover);
  }

  // ───────── DOM 构建 ─────────

  private createOverlay(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'lb-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', '图片灯箱');

    overlay.innerHTML = `
      <div class="lb-backdrop"></div>
      <div class="lb-content">
        <div class="lb-img-wrap">
          <img class="lb-img" alt="" />
        </div>
        <div class="lb-caption"></div>
        <div class="lb-counter"></div>
      </div>
      <button class="lb-btn lb-close" aria-label="关闭" title="关闭">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <button class="lb-btn lb-prev" aria-label="上一张" title="上一张">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <button class="lb-btn lb-next" aria-label="下一张" title="下一张">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>
      </button>
    `;

    this.imgContainer = overlay.querySelector('.lb-img-wrap')!;
    this.img = overlay.querySelector('.lb-img')!;
    this.captionEl = overlay.querySelector('.lb-caption')!;
    this.counterEl = overlay.querySelector('.lb-counter')!;
    this.closeBtn = overlay.querySelector('.lb-close')!;
    this.prevBtn = overlay.querySelector('.lb-prev')!;
    this.nextBtn = overlay.querySelector('.lb-next')!;

    return overlay;
  }

  private createStyle(): HTMLStyleElement {
    const style = document.createElement('style');
    style.setAttribute('data-lb', 'true');
    style.textContent = LB_STYLES;
    return style;
  }

  // ───────── overlay 内部按钮事件 ─────────

  private bindOverlayEvents() {
    this.closeBtn.addEventListener('click', () => this.close());
    this.overlay.querySelector('.lb-backdrop')!.addEventListener('click', () => this.close());
    this.prevBtn.addEventListener('click', () => this.prev());
    this.nextBtn.addEventListener('click', () => this.next());
  }

  // ───────── 缩放 / 拖拽 / 键盘事件 ─────────

  private bindInteractionEvents() {
    document.addEventListener('keydown', (e) => {
      if (!this.overlay.classList.contains('active')) return;
      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowLeft') this.prev();
      if (e.key === 'ArrowRight') this.next();
    });

    this.imgContainer.addEventListener('dblclick', (e) => {
      e.preventDefault();
      if (this.animating) return;
      if (this.scale > 1) {
        this.resetZoom();
      } else {
        this.zoomTo(2.5, e.clientX, e.clientY);
      }
    });

    this.imgContainer.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (this.animating) return;
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      const newScale = Math.max(1, Math.min(8, this.scale + delta));
      if (newScale !== this.scale) {
        this.zoomTo(newScale, e.clientX, e.clientY);
      }
    }, { passive: false });

    this.imgContainer.addEventListener('mousedown', (e) => {
      if (this.scale <= 1 || this.animating) return;
      e.preventDefault();
      this.isDragging = true;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.dragStartTX = this.translateX;
      this.dragStartTY = this.translateY;
      this.imgContainer.classList.add('lb-dragging');
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      this.translateX = this.dragStartTX + (e.clientX - this.dragStartX);
      this.translateY = this.dragStartTY + (e.clientY - this.dragStartY);
      this.applyTransform(true);
    });

    document.addEventListener('mouseup', () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.imgContainer.classList.remove('lb-dragging');
      this.applyTransform(false);
    });

    this.imgContainer.addEventListener('touchstart', (e) => {
      if (this.animating) return;
      if (e.touches.length === 1 && this.scale > 1) {
        this.isDragging = true;
        this.dragStartX = e.touches[0].clientX;
        this.dragStartY = e.touches[0].clientY;
        this.dragStartTX = this.translateX;
        this.dragStartTY = this.translateY;
      } else if (e.touches.length === 2) {
        this.isDragging = false;
        this.lastTouchDist = this.getTouchDist(e.touches);
      }
    }, { passive: true });

    this.imgContainer.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && this.isDragging) {
        e.preventDefault();
        this.translateX = this.dragStartTX + (e.touches[0].clientX - this.dragStartX);
        this.translateY = this.dragStartTY + (e.touches[0].clientY - this.dragStartY);
        this.applyTransform(true);
      } else if (e.touches.length === 2) {
        e.preventDefault();
        const dist = this.getTouchDist(e.touches);
        const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const scaleFactor = dist / this.lastTouchDist;
        const newScale = Math.max(1, Math.min(8, this.scale * scaleFactor));
        this.zoomTo(newScale, cx, cy);
        this.lastTouchDist = dist;
      }
    }, { passive: false });

    this.imgContainer.addEventListener('touchend', () => {
      this.isDragging = false;
    }, { passive: true });

    this.img.addEventListener('load', () => {
      this.resetZoom();
    });
  }

  private getTouchDist(touches: TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // ───────── 缩放逻辑 ─────────

  private zoomTo(newScale: number, cx?: number, cy?: number) {
    const oldScale = this.scale;
    const oldTX = this.translateX;
    const oldTY = this.translateY;
    const ratio = newScale / oldScale;

    const rect = this.img.getBoundingClientRect();
    const cssLeft = rect.left - oldTX;
    const cssTop = rect.top - oldTY;

    if (cx !== undefined && cy !== undefined) {
      this.translateX = cx - (cx - cssLeft - oldTX) * ratio - cssLeft;
      this.translateY = cy - (cy - cssTop - oldTY) * ratio - cssTop;
    } else {
      const imgCX = cssLeft + oldTX + this.img.clientWidth / 2 * oldScale;
      const imgCY = cssTop + oldTY + this.img.clientHeight / 2 * oldScale;
      this.translateX = imgCX - (imgCX - cssLeft - oldTX) * ratio - cssLeft;
      this.translateY = imgCY - (imgCY - cssTop - oldTY) * ratio - cssTop;
    }

    this.scale = newScale;

    if (this.scale <= 1) {
      this.scale = 1;
      this.translateX = 0;
      this.translateY = 0;
      this.imgContainer.classList.remove('lb-zoomed');
    } else {
      this.imgContainer.classList.add('lb-zoomed');
    }

    this.applyTransform(false);
  }

  private resetZoom() {
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.imgContainer.classList.remove('lb-zoomed');
    this.applyTransform(false);
  }

  private applyTransform(noTransition: boolean) {
    if (noTransition) {
      this.img.classList.add('lb-no-transition');
    } else {
      this.img.classList.remove('lb-no-transition');
    }
    this.img.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
  }

  // ───────── CSS class 动画辅助 ─────────

  /**
   * 触发 CSS class 动画：先设初始 class → 强制 reflow → 加 active class → 过渡完成后清理。
   * 动画 class 用 !important 覆盖 JS transform，完成后移除恢复 JS 控制。
   */
  private animateClass(el: HTMLElement, startClass: string, activeClass: string, duration: number): Promise<void> {
    this.animating = true;
    el.classList.add(startClass);

    // 强制浏览器应用初始状态（否则 transition 可能不触发）
    void el.offsetWidth;

    el.classList.add(activeClass);

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        el.classList.remove(startClass, activeClass);
        this.animating = false;
        resolve();
      }, duration);
    });
  }

  // ───────── 公共 API ─────────

  static bind(_selector: string = '[data-lightbox]', _options?: { Hash?: boolean; hideScrollbar?: boolean }) {
    const lb = Lightbox.getInstance();

    if (!Lightbox.delegated) {
      Lightbox.delegated = true;

      document.addEventListener('click', (e: MouseEvent) => {
        const target = Lightbox.closestDataLightbox(e.target as Element);
        if (!target) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        lb.recover();
        lb.openFrom(target);
      }, true);
    }
  }

  private static closestDataLightbox(el: Element): HTMLElement | null {
    const hit = el.closest('[data-lightbox]');
    if (hit) return hit as HTMLElement;

    let node: Node | null = el;
    while (node) {
      if (node instanceof HTMLElement && node.hasAttribute('data-lightbox')) {
        return node;
      }
      node = node.parentNode;
    }

    return null;
  }

  static unbind(_selector: string = '[data-lightbox]') {
    // 事件委托模式下无需操作
  }

  static close() {
    Lightbox.getInstance().close();
  }

  // ───────── 打开 / 关闭 / 切换 ─────────

  private openFrom(el: HTMLElement) {
    const galleryName = el.getAttribute('data-lightbox') || '';
    const src = el.getAttribute('data-src') || el.getAttribute('href') || (el as HTMLImageElement).src || '';
    const caption = el.getAttribute('data-caption') || el.getAttribute('alt') || '';

    if (!src) return;

    if (galleryName) {
      this.gallery = [];
      document.querySelectorAll<HTMLElement>(`[data-lightbox="${galleryName}"]`).forEach((item) => {
        const itemSrc = item.getAttribute('data-src') || item.getAttribute('href') || (item as HTMLImageElement).src || '';
        if (itemSrc) {
          this.gallery.push({
            src: itemSrc,
            caption: item.getAttribute('data-caption') || item.getAttribute('alt') || '',
            el: item,
          });
        }
      });
      this.currentIndex = this.gallery.findIndex((g) => g.src === src);
      if (this.currentIndex < 0) this.currentIndex = 0;
    } else {
      this.gallery = [{ src, caption, el }];
      this.currentIndex = 0;
    }

    this.open();
  }

  /**
   * 打开灯箱 —— 设置内容 → 触发打开动画
   */
  private open() {
    const item = this.gallery[this.currentIndex];
    if (!item) return;

    this.resetZoom();
    this.img.style.transform = '';

    // 清除之前可能遗留的替代渲染元素
    this.imgContainer.querySelectorAll('.lb-alt-media').forEach(n => n.remove());

    const srcLower = item.src.split('?')[0].split('#')[0].toLowerCase();
    const isSvg = srcLower.endsWith('.svg');

    if (isSvg) {
      this.img.style.display = 'none';
      const obj = document.createElement('object');
      obj.className = 'lb-alt-media';
      obj.type = 'image/svg+xml';
      obj.data = item.src;
      obj.style.cssText = 'max-width:90vw;max-height:85vh;width:100%;height:auto;border-radius:6px;';
      this.imgContainer.appendChild(obj);
    } else {
      this.img.style.display = '';
      this.img.src = item.src;
    }

    this.img.alt = item.caption || '';
    this.captionEl.textContent = item.caption || '';

    const isSingle = this.gallery.length <= 1;
    this.overlay.classList.toggle('lb-single', isSingle);
    this.counterEl.textContent = isSingle ? '' : `${this.currentIndex + 1} / ${this.gallery.length}`;
    this.prevBtn.style.display = isSingle ? 'none' : '';
    this.nextBtn.style.display = isSingle ? 'none' : '';

    // 先让 overlay 可见（visibility: visible），然后触发图片进入动画
    this.overlay.classList.add('active');

    // 图片从缩小+透明 → 正常大小+可见（250ms）
    this.animateClass(this.img, 'lb-enter', 'lb-enter-active', 300);
  }

  /**
   * 关闭灯箱 —— 触发关闭动画 → 延迟清理
   */
  private close() {
    if (this.animating) return;

    // 图片从正常 → 缩小+透明（200ms）
    const promise = this.animateClass(this.img, 'lb-exit', 'lb-exit-active', 250);

    // 同时移除 active，触发 backdrop/content/btn 淡出
    this.overlay.classList.remove('active');

    // overlay visibility 有 0.3s 延迟，确保淡出完成后才隐藏
    promise.then(() => {
      this.resetZoom();
      this.img.style.transform = '';
      this.img.src = '';
      this.img.style.display = '';
      this.imgContainer.querySelectorAll('.lb-alt-media').forEach(n => n.remove());
    });
  }

  /**
   * 切换到上一张 —— 旧图向右滑出，新图从左侧滑入
   */
  private prev() {
    if (this.gallery.length <= 1 || this.animating) return;
    this.slideTo((this.currentIndex - 1 + this.gallery.length) % this.gallery.length, 'prev');
  }

  /**
   * 切换到下一张 —— 旧图向左滑出，新图从右侧滑入
   */
  private next() {
    if (this.gallery.length <= 1 || this.animating) return;
    this.slideTo((this.currentIndex + 1) % this.gallery.length, 'next');
  }

  /**
   * 方向性滑入/滑出切换图片
   * direction: 'prev' → 旧图右滑出+新图左滑入, 'next' → 旧图左滑出+新图右滑入
   */
  private slideTo(newIndex: number, direction: 'prev' | 'next') {
    const slideOutClass = direction === 'prev' ? 'lb-slide-out-prev' : 'lb-slide-out-next';
    const slideOutActiveClass = direction === 'prev' ? 'lb-slide-out-prev-active' : 'lb-slide-out-next-active';
    const slideInClass = direction === 'prev' ? 'lb-slide-in-prev' : 'lb-slide-in-next';
    const slideInActiveClass = direction === 'prev' ? 'lb-slide-in-prev-active' : 'lb-slide-in-next-active';

    this.animating = true;

    // Phase 1：旧图滑出（200ms）
    this.img.classList.add(slideOutClass);
    void this.img.offsetWidth;
    this.img.classList.add(slideOutActiveClass);

    setTimeout(() => {
      // Phase 2：旧图动画结束，清理 class，换新图 src
      this.img.classList.remove(slideOutClass, slideOutActiveClass);
      this.img.style.transform = '';
      this.resetZoom();

      this.currentIndex = newIndex;
      const item = this.gallery[this.currentIndex];
      if (!item) { this.animating = false; return; }

      // 更新内容
      this.imgContainer.querySelectorAll('.lb-alt-media').forEach(n => n.remove());
      const srcLower = item.src.split('?')[0].split('#')[0].toLowerCase();
      const isSvg = srcLower.endsWith('.svg');

      if (isSvg) {
        this.img.style.display = 'none';
        const obj = document.createElement('object');
        obj.className = 'lb-alt-media';
        obj.type = 'image/svg+xml';
        obj.data = item.src;
        obj.style.cssText = 'max-width:90vw;max-height:85vh;width:100%;height:auto;border-radius:6px;';
        this.imgContainer.appendChild(obj);
      } else {
        this.img.style.display = '';
        this.img.src = item.src;
      }

      this.img.alt = item.caption || '';
      this.captionEl.textContent = item.caption || '';
      const isSingle = this.gallery.length <= 1;
      this.overlay.classList.toggle('lb-single', isSingle);
      this.counterEl.textContent = isSingle ? '' : `${this.currentIndex + 1} / ${this.gallery.length}`;
      this.prevBtn.style.display = isSingle ? 'none' : '';
      this.nextBtn.style.display = isSingle ? 'none' : '';

      // Phase 3：新图滑入（250ms）
      this.img.classList.add(slideInClass);
      void this.img.offsetWidth;
      this.img.classList.add(slideInActiveClass);

      setTimeout(() => {
        this.img.classList.remove(slideInClass, slideInActiveClass);
        this.img.style.transform = '';
        this.animating = false;
      }, 300);
    }, 250);
  }
}

export { Lightbox };
