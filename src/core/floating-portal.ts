export interface PortalOptions {
  offset?: number;
  onClose?: () => void;
}

export class FloatingPortal {
  private portalElement: HTMLElement;
  private triggerElement: HTMLElement;
  private options: PortalOptions;
  private rafId = 0;
  private isQueued = false;
  private resizeObs: ResizeObserver;

  constructor(trigger: HTMLElement, content: HTMLElement, options: PortalOptions = {}) {
    this.triggerElement = trigger;
    this.portalElement = content;
    this.options = { offset: 4, ...options };
    Object.assign(this.portalElement.style, {
      position: 'fixed',
      zIndex: '9999',
      margin: '0',
    });

    this.resizeObs = new ResizeObserver(() => this.scheduleUpdate());
  }

  public open() {
    document.body.appendChild(this.portalElement);
    this.resizeObs.observe(this.triggerElement);
    
    window.addEventListener('resize', this.updateBound);
    document.addEventListener('scroll', this.updateBound, { capture: true, passive: true });
    document.addEventListener('click', this.clickOutsideBound, true);

    this.scheduleUpdate();
  }

  public close() {
    cancelAnimationFrame(this.rafId);
    this.resizeObs.disconnect();
    window.removeEventListener('resize', this.updateBound);
    document.removeEventListener('scroll', this.updateBound, true);
    document.removeEventListener('click', this.clickOutsideBound, true);
    
    if (this.portalElement.parentNode === document.body) {
      document.body.removeChild(this.portalElement);
    }
  }

  private scheduleUpdate() {
    if (this.isQueued) return;
    this.isQueued = true;
    this.rafId = requestAnimationFrame(() => {
      this.isQueued = false;
      this.updatePosition();
    });
  }

  private updatePosition() {
    const rect = this.triggerElement.getBoundingClientRect();
    const portalHeight = this.portalElement.offsetHeight;
    const viewportHeight = window.innerHeight;
    const offset = this.options.offset!;

    const spaceBelow = viewportHeight - rect.bottom;
    const shouldShowAbove = spaceBelow < portalHeight && rect.top > portalHeight;

    this.portalElement.style.minWidth = `${this.triggerElement.offsetWidth}px`;
    this.portalElement.style.left = `${rect.left}px`;

    if (shouldShowAbove) {
      this.portalElement.style.top = `${rect.top - portalHeight - offset}px`;
      this.portalElement.classList.add('origin-bottom');
    } else {
      this.portalElement.style.top = `${rect.bottom + offset}px`;
      this.portalElement.classList.remove('origin-bottom');
    }
  }

  private updateBound = () => this.scheduleUpdate();

  private clickOutsideBound = (e: MouseEvent) => {
    const target = e.target as Node;
    if (!this.triggerElement.contains(target) && !this.portalElement.contains(target)) {
      this.options.onClose?.();
    }
  };
}