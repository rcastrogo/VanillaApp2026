
import type { ComponentContext, ComponentInitValue } from '@/components/component.model';
import { $, buildAndInterpolate } from '@/core/dom';
import { FloatingPortal } from '@/core/floating-portal';
import { getValue } from '@/core/template';
import { BaseComponent } from '@/core/types';

export interface ToolbarAction {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  tooltip?: string;
}

export class OverflowToolbarComponent extends BaseComponent {

  public actionclick?: (action: ToolbarAction) => void;

  private portal: FloatingPortal | null = null;
  private portalOpen = false;
  private overflowItems: ToolbarAction[] = [];
  private resizeObserver: ResizeObserver | null = null;
  private rafId = 0;

  private actions: ToolbarAction[] | null = null;

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  init(ctx: ComponentInitValue): void {
    super.init(ctx);
    let actions: ToolbarAction[] = [];
    try {
      console.log(this.actions);
      actions = this.actions || this.resolveDataSource() || '[]';
    } catch { /* ignore */ }
    this.setState({ actions });
  }

  private resolveDataSource(): ToolbarAction[] {
    const key = this.props.actions;
    if (!key) return [];
    const raw = getValue(key, this.ctx);
    return raw;
  }

  clickAction(_el: HTMLElement, _ev: Event, actionId: string): void {
    const actions: ToolbarAction[] = this.state.actions;
    const action = actions.find((a: ToolbarAction) => a.id === actionId);
    if (!action || action.disabled) return;
    this.actionclick?.(action);
    if (this.portalOpen) this.closeOverflow();
  }

  toggleOverflow(): void {
    if(this.portalOpen)
      this.closeOverflow() 
    else
      this.openOverflow();
  }

  private openOverflow(): void {
    if (this.portalOpen || !this.overflowItems.length) return;
    const triggerEl = $('[data-overflow-trigger]', this.element).one();
    if (!triggerEl) return;

    const dropdownTemplate = `
      <div class="min-w-40 p-1 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 shadow-2xl">
        <div data-each="action in overflowItems" class="contents">
          <button
            title="{action.tooltip | default : @action.label}"
            on-click="clickAction:{action.id}"
            class="flex items-center gap-2 w-full px-3 py-2 text-sm text-left rounded-md transition-colors
                   @if(action.disabled) opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-500  @endif
                   @if(!action.disabled) text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer @endif"
          >
            @if(action.icon)
              <i data-icon="{action.icon}" class="size-4 shrink-0"></i>
            @endif
            <span>{action.label}</span>
          </button>
        </div>
      </div>
    `;

    const content = buildAndInterpolate(dropdownTemplate, { ...this, overflowItems: this.overflowItems });

    this.portal = new FloatingPortal(triggerEl, content as HTMLElement, {
      onClose: () => this.closeOverflow(),
    });
    this.portalOpen = true;
    this.portal.open();
  }

  private closeOverflow(): void {
    if (!this.portalOpen) return;
    this.portalOpen = false;
    this.portal?.close();
    this.portal = null;
  }

  private updateOverflowLayout(): void {
    if (!this.element) return;
    this.closeOverflow();

    const actionBtns = $<HTMLButtonElement>('[data-action-btn]', this.element).all();
    const moreBtn = $<HTMLButtonElement>('[data-overflow-trigger]', this.element).one();

    // Reset: show all action buttons, hide the "more" button
    actionBtns.forEach(btn => (btn.style.display = ''));
    if (moreBtn) moreBtn.style.display = 'none';

    const containerWidth = this.element.offsetWidth;
    const totalWidth = actionBtns.reduce((acc, btn) => acc + btn.offsetWidth + 4, 0);

    if (totalWidth <= containerWidth) {
      this.overflowItems = [];
      return;
    }

    // Temporarily show the "more" button to measure its width
    if (moreBtn) moreBtn.style.display = 'flex';
    const moreBtnWidth = moreBtn ? moreBtn.offsetWidth + 4 : 44;
    if (moreBtn) moreBtn.style.display = 'none';

    let usedWidth = moreBtnWidth;
    let visibleCount = 0;

    for (const btn of actionBtns) {
      const btnWidth = btn.offsetWidth + 4;
      if (usedWidth + btnWidth <= containerWidth) {
        usedWidth += btnWidth;
        visibleCount++;
      } else {
        break;
      }
    }

    actionBtns.slice(visibleCount).forEach(btn => (btn.style.display = 'none'));
    this.overflowItems = (this.state.actions as ToolbarAction[]).slice(visibleCount);

    if (moreBtn) {
      moreBtn.style.display = 'flex';
    }
  }

  mounted(): void {
    if (!this.element) return;

    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(this.rafId);
      this.rafId = requestAnimationFrame(() => this.updateOverflowLayout());
    });
    this.resizeObserver.observe(this.element);

    this.addCleanup(() => {
      cancelAnimationFrame(this.rafId);
      this.resizeObserver?.disconnect();
      this.resizeObserver = null;
    });

    requestAnimationFrame(() => this.updateOverflowLayout());
  }

  destroy(): void {
    this.closeOverflow();
    super.destroy();
  }

  render(changedProp?: string): HTMLElement | null {
    if (changedProp && this.element) {
      this.updateBindings();
      return this.element;
    }
    const actions: ToolbarAction[] = this.state.actions || [];

    const template = `
      <div class="flex items-center gap-1 overflow-hidden w-full">
        <div data-each="action in actions" class="contents">
          <button
            data-action-btn="{action.id}"
            title="{action.tooltip | default : @action.label}"
            on-click="clickAction:{action.id}"
            class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap shrink-0 transition-colors
                   @if(action.disabled)
                     opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-500
                   @endif
                   @if(!action.disabled)
                     text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer
                   @endif"
          >
            @if(action.icon)
              <i data-icon="{action.icon}" class="size-4 shrink-0"></i>
            @endif
            <span>{action.label}</span>
          </button>
        </div>
        <button
          data-overflow-trigger
          title="Más opciones"
          on-click="toggleOverflow"
          style="display: none"
          class="flex items-center justify-center gap-1 px-2 py-1.5 rounded-md shrink-0
                 text-slate-600 dark:text-slate-400
                 hover:bg-slate-100 dark:hover:bg-slate-700
                 transition-colors"
        >
          <i data-icon="more-horizontal" class="size-4"></i>
        </button>
      </div>
    `;

    return buildAndInterpolate(template, { ...this, actions });
  }

}

export default OverflowToolbarComponent;
