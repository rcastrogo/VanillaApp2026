import { buildAndInterpolate } from "../../core/dom";
import { BaseComponent } from "../../core/types";
import type { ComponentContext, ComponentInitValue } from "../component.model";

import { notificationService } from "@/core/services/notification.service";

export class BindingReferenceComponent extends BaseComponent {

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  get isBusy() {
    return !!this.state.isBusy;
  }

  get updatedAt() {
    return this.state.updatedAt ?? "-";
  }

  init(ctx: ComponentInitValue): void {
    super.init(ctx);
    this.setState({
      count: Number(this.props.start || 0),
      isBusy: false,
      updatedAt: new Date().toLocaleTimeString(),
    });
  }

  increment() {
    this.state.count = this.state.count + 1;
  }

  toggleBusy() {
    this.state.isBusy = !this.isBusy;
  }

  refreshTimestamp() {
    this.state.updatedAt = new Date().toLocaleTimeString();
  }

  showNotification() {
    notificationService.info("¡Botón clickeado!");
  }

  render(changedProp?: string): HTMLElement | null {
    
    if (changedProp && this.element) {
      const phaseEl = this.element.querySelector<HTMLElement>("[data-render-phase]");
      const propEl = this.element.querySelector<HTMLElement>("[data-last-prop]");
      if (phaseEl) phaseEl.innerText = "render reactivo";
      if (propEl) propEl.innerText = changedProp;
      this.updateBindings();
      return this.element;
    }

    const template = `
      <section class="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div class="mb-4 flex items-start justify-between gap-4 border-b border-slate-200 pb-3 dark:border-slate-800">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.2em] text-indigo-500">Binding Reference</p>
            <h3 class="text-xl font-black text-slate-800 dark:text-slate-100">Render inicial + actualización reactiva</h3>
          </div>
          <div class="text-right text-xs text-slate-500 dark:text-slate-400">
            <div data-render-phase>render inicial</div>
            <div>changedProp: <span data-last-prop>-</span></div>
          </div>
        </div>

        <div class="grid gap-3 md:grid-cols-2">
          <article class="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
            <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">Bindings de texto y value</p>
            <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">Count: <strong data-bind="text:count">0</strong></p>
            <p class="text-sm text-slate-600 dark:text-slate-400">Updated at: <span data-bind="text:updatedAt">-</span></p>
            <input
              class="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              data-bind="value:state.count"
              
            />
          </article>

          <article class="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
            <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">Bindings toggle, show, hide y disabled</p>
            <div data-bind="toggle.ring-2:isBusy" class="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700 transition-all dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
              El binding <code>toggle</code> activa un highlight cuando <strong>isBusy</strong> es true.
            </div>
            <p class="mt-3 text-sm text-emerald-600 dark:text-emerald-400" data-bind="hide:isBusy">Estado disponible</p>
            <p class="mt-3 text-sm text-rose-600 dark:text-rose-400" data-bind="show:isBusy">Estado ocupado</p>
            <button 
                on-click="showNotification" 
                class="app-button btn-secondary mt-3" 
                data-bind="
                  disabled:isBusy;
                  text:isBusy | iif : Deshabilitado : Habilitado | upper
                "></button>
          </article>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <button on-click="increment" class="app-button btn-primary">Incrementar</button>
          <button on-click="toggleBusy" class="app-button btn-primary">Toggle busy</button>
          <button on-click="refreshTimestamp" class="app-button btn-primary">Refrescar hora</button>
        </div>
      </section>
    `;

    return buildAndInterpolate(template, this);
  }
}