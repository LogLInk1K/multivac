/**
 * 轻量级 Lightbox —— 图片灯箱查看组件
 *
 * 功能：
 * - 点击 [data-lightbox] 元素弹出灯箱 overlay
 * - 支持画廊分组（data-lightbox="gallery-name"）
 * - 画廊内左右切换（按钮 + 键盘左右箭头）
 * - 关闭（按钮 + Esc 键 + 点击背景）
 * - 缩放（双击放大/还原，滚轮缩放）
 * - 拖拽移动放大后的图片
 * - 触屏手势（单指拖拽、双指缩放）
 * - CSS 过渡动画
 * - 兼容 Astro View Transitions（事件委托 + DOM/样式自动恢复）
 */

type GalleryItem = {
  src: string;
  caption?: string;
  el: HTMLElement;
};




const LB_STYLES = `
.lb-overlay {
  position: fixed; inset: 0; z-index: 99999;
  display: flex; align-items: center; justify-content: center;
  opacity: 0; visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}
.lb-overlay.active {
  opacity: 1; visibility: visible;
}
.lb-backdrop {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.85);
}
.lb-content {
  position: relative; z-index: 1;
  max-width: 92vw; max-height: 88vh;
  display: flex; flex-direction: column; align-items: center;
}
.lb-img-wrap {
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  touch-action: none;
  user-select: none;
}
.lb-img-wrap.lb-dragging { cursor: grabbing; }
.lb-img-wrap:not(.lb-dragging) { cursor: grab; }
.lb-img-wrap.lb-zoomed { cursor: grab; }
.lb-img-wrap:not(.lb-zoomed) { cursor: pointer; }
.lb-img {
  max-width: 90vw; max-height: 85vh;
  object-fit: contain;
  transition: transform 0.2s ease-out;
  transform-origin: center center;
  border-radius: 6px;
}
.lb-img.lb-no-transition {
  transition: none;
}
.lb-caption {
  color: rgba(255,255,255,0.8);
  font-size: 14px; line-height: 1.5;
  text-align: center;
  padding: 8px 16px 0;
  max-width: 90vw;
  word-break: break-word;
}
.lb-caption:empty { display: none; }
.lb-counter {
  color: rgba(255,255,255,0.5);
  font-size: 13px;
  padding: 4px 0 0;
}
.lb-btn {
  position: absolute; z-index: 2;
  width: 44px; height: 44px;
  border: none; border-radius: 50%;
  background: rgba(255,255,255,0.1);
  color: #fff; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s, transform 0.2s;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
.lb-btn:hover { background: rgba(255,255,255,0.25); transform: scale(1.1); }
.lb-btn svg { width: 20px; height: 20px; }
.lb-close { top: 16px; right: 16px; }
.lb-prev { left: 16px; top: 50%; transform: translateY(-50%); }
.lb-next { right: 16px; top: 50%; transform: translateY(-50%); }
.lb-prev:hover, .lb-next:hover { transform: translateY(-50%) scale(1.1); }
.lb-overlay.lb-single .lb-prev,
.lb-overlay.lb-single .lb-next { display: none; }
.lb-overlay.lb-single .lb-counter { display: none; }
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

  // 缩放 / 拖拽状态
  private scale = 1;
  private translateX = 0;
  private translateY = 0;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragStartTX = 0;
  private dragStartTY = 0;
  private lastTouchDist = 0;

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

  // ───────── DOM / 样式恢复（View Transition 核心保障） ─────────

  /**
   * 恢复 overlay 和 style 到当前 DOM。
   * Astro View Transition 会替换 body 和合并 head，
   * 导致动态挂载的 overlay 和 style 丢失。
   * 此方法确保两者始终在场。
   */
  private recover() {
    if (!document.body.contains(this.overlay)) {
      document.body.appendChild(this.overlay);
    }
    if (!document.head.contains(this.styleEl)) {
      document.head.appendChild(this.styleEl);
    }
  }

  /**
   * 注册多个生命周期事件，确保 View Transition 后 DOM/样式始终恢复。
   * astro:after-swap — body/head 已被替换，此时恢复
   * astro:page-load  — 兜底恢复（某些场景 after-swap 可能未触发）
   */
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
    // 键盘
    document.addEventListener('keydown', (e) => {
      if (!this.overlay.classList.contains('active')) return;
      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowLeft') this.prev();
      if (e.key === 'ArrowRight') this.next();
    });

    // 鼠标双击缩放
    this.imgContainer.addEventListener('dblclick', (e) => {
      e.preventDefault();
      if (this.scale > 1) {
        this.resetZoom();
      } else {
        this.zoomTo(2.5, e.clientX, e.clientY);
      }
    });

    // 滚轮缩放
    this.imgContainer.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      const newScale = Math.max(1, Math.min(8, this.scale + delta));
      if (newScale !== this.scale) {
        this.zoomTo(newScale, e.clientX, e.clientY);
      }
    }, { passive: false });

    // 鼠标拖拽
    this.imgContainer.addEventListener('mousedown', (e) => {
      if (this.scale <= 1) return;
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

    // 触屏手势
    this.imgContainer.addEventListener('touchstart', (e) => {
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

    // 图片加载后自适应
    this.img.addEventListener('load', () => {
      this.resetZoom();
    });
  }

  private getTouchDist(touches: TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // ───────── 缩放 ─────────

  private zoomTo(newScale: number, cx?: number, cy?: number) {
    if (cx !== undefined && cy !== undefined) {
      const rect = this.img.getBoundingClientRect();
      const imgCX = rect.left + rect.width / 2;
      const imgCY = rect.top + rect.height / 2;
      const ratio = newScale / this.scale;
      this.translateX = cx - ratio * (cx - imgCX - this.translateX) - imgCX;
      this.translateY = cy - ratio * (cy - imgCY - this.translateY) - imgCY;
    }
    this.scale = newScale;
    this.applyTransform(false);

    if (this.scale > 1) {
      this.imgContainer.classList.add('lb-zoomed');
    } else {
      this.imgContainer.classList.remove('lb-zoomed');
      this.translateX = 0;
      this.translateY = 0;
      this.applyTransform(false);
    }
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

  // ───────── 公共 API ─────────

  /**
   * 使用事件委托绑定点击。
   * listener 挂在 document 上，View Transition 替换 DOM 后依然有效。
   * 打开灯箱前先 recover() 确保 overlay + style 在场。
   */
  static bind(_selector: string = '[data-lightbox]', _options?: { Hash?: boolean; hideScrollbar?: boolean }) {
    const lb = Lightbox.getInstance();

    if (!Lightbox.delegated) {
      Lightbox.delegated = true;

      // 在 capture 阶段注册，确保在 Astro View Transitions 路由器之前拦截。
      // Astro 路由器也在 document 上监听 <a> 的 click（bubble 阶段），
      // 如果在 bubble 阶段注册，Astro 路由器可能先执行 navigate() 导致页面跳转。
      // capture 阶段 + stopImmediatePropagation 确保灯箱拦截优先。
      document.addEventListener('click', (e: MouseEvent) => {
        const target = Lightbox.closestDataLightbox(e.target as Element);
        if (!target) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        lb.recover();
        lb.openFrom(target);
      }, true); // true = capture phase
    }
  }

  /**
   * 从点击元素向上查找 [data-lightbox] 元素。
   * 跨越 SVG namespace 边界：先在当前 namespace 中 closest，
   * 未找到则检查宿主 <img> / <object> 元素。
   */
  private static closestDataLightbox(el: Element): HTMLElement | null {
    // 先尝试常规 closest（HTML namespace）
    const hit = el.closest('[data-lightbox]');
    if (hit) return hit as HTMLElement;

    // 如果 el 在 SVG namespace 中，closest 不跨越到 HTML。
    // 检查是否是 <svg> 内部元素，向上找宿主 <img> 或 <object>
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

    this.show();
  }

  private show() {
    const item = this.gallery[this.currentIndex];
    if (!item) return;

    this.resetZoom();

    // 清除之前可能遗留的 <object>/<iframe>
    const existing = this.imgContainer.querySelectorAll('.lb-alt-media');
    existing.forEach(n => n.remove());

    // 判断是否需要用 <object> 渲染（SVG 等矢量格式）
    const srcLower = item.src.split('?')[0].split('#')[0].toLowerCase();
    const isSvg = srcLower.endsWith('.svg');

    if (isSvg) {
      // SVG 用 <object> 渲染，支持交互式 SVG 且不依赖 <img> 的安全沙箱
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

    this.overlay.classList.add('active');
  }

  private close() {
    this.overlay.classList.remove('active');
    this.resetZoom();
    this.img.src = '';
    this.img.style.display = '';
    // 清理 <object> 等替代渲染元素
    this.imgContainer.querySelectorAll('.lb-alt-media').forEach(n => n.remove());
  }

  private prev() {
    if (this.gallery.length <= 1) return;
    this.currentIndex = (this.currentIndex - 1 + this.gallery.length) % this.gallery.length;
    this.show();
  }

  private next() {
    if (this.gallery.length <= 1) return;
    this.currentIndex = (this.currentIndex + 1) % this.gallery.length;
    this.show();
  }
}

export { Lightbox };
