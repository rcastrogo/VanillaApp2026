import { buildAndInterpolate } from "../dom";
import { FloatingPortal } from "../floating-portal";

export function setupTooltip(root: HTMLElement = document.body) {
  root.addEventListener('mouseover', handleTooltipEnter);
  root.addEventListener('focusin',   handleTooltipEnter);
  root.addEventListener('mouseout',  handleTooltipLeave);
  root.addEventListener('focusout',  handleTooltipLeave);
}

function handleTooltipEnter(e: Event) {
  const target = (e.target as HTMLElement).closest<HTMLElement>('[data-tooltip]');
  if (target){
    const text = target.dataset.tooltip!;
    const pos  = target.dataset.tooltipPos ?? 'top';
    tooltip.show(target, text, pos);
  }
}

function handleTooltipLeave(e: Event) {
  const target = (e.target as HTMLElement).closest<HTMLElement>('[data-tooltip]');
  if (target) tooltip.hide();
}

class TooltipService {

  private activePortal: FloatingPortal | null = null;
  private tooltipEl: HTMLElement | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  show(anchor: HTMLElement, text: string, pos = 'top-end') {
    this.cancelPending();
    this.timer = setTimeout(() => {
      this.render(anchor, text, pos);
    }, 350);
  }

  hide() {
    this.cancelPending();
    this.activePortal?.close();
    this.activePortal = null;
    this.tooltipEl = null;
  }

  private cancelPending() {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private render(anchor: HTMLElement, text: string, pos: string) {
    const template = `
      <div class="
        inline-flex items-start gap-2
        px-3 py-2 max-w-55 text-center
        text-xs font-medium leading-snug tracking-wide text-slate-100
        bg-slate-900 dark:bg-slate-800
        rounded-lg
        pointer-events-none transition-all duration-350
      ">
        {text}
      </div>
    `;
    this.tooltipEl = buildAndInterpolate(template, { text });
    this.activePortal = new FloatingPortal(anchor, this.tooltipEl, {
      placement: pos,
      offset: 4,
      type: 'tooltip',
      onClose: () => this.hide(),
    });
    this.activePortal.open();
  }
}

export const tooltip = new TooltipService();