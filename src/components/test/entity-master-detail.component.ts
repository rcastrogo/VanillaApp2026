import { buildAndInterpolate } from "../../core/dom";
import { BaseComponent } from "../../core/types";
import type { ComboItem, ComponentContext, ComponentInitValue } from "../component.model";

import { notificationService } from "@/core/services/notification.service";

interface CatalogEntity {
  id: string;
  name: string;
  sku: string;
  category: string;
  supplier: string;
  warehouse: string;
  status: string;
  unit: string;
  country: string;
  description: string;
  price: number;
  stock: number;
  reorderLevel: number;
  rating: number;
  isFeatured: boolean;
  isActive: boolean;
};

const CATALOG: CatalogEntity[] = [
  {
    id: "PRD-1001",
    name: "Monitor Aurora 34",
    sku: "AUR-34-UW",
    category: "Monitores",
    supplier: "Northwind Visual Systems",
    warehouse: "Madrid Norte",
    status: "Activo",
    unit: "unidad",
    country: "España",
    description: "Monitor ultrapanorámico para puestos híbridos con panel de baja fatiga visual y soporte ajustable.",
    price: 879,
    stock: 18,
    reorderLevel: 10,
    rating: 4.7,
    isFeatured: true,
    isActive: true,
  },
  {
    id: "PRD-1002",
    name: "Dock Atlas 12-en-1",
    sku: "ATL-DOCK-12",
    category: "Accesorios",
    supplier: "Port Labs Europe",
    warehouse: "Barcelona Hub",
    status: "Activo",
    unit: "unidad",
    country: "Portugal",
    description: "Base de expansión USB-C con salida dual 4K, red cableada y carga pasante de alta potencia.",
    price: 229,
    stock: 42,
    reorderLevel: 20,
    rating: 4.4,
    isFeatured: false,
    isActive: true,
  },
  {
    id: "PRD-1003",
    name: "Silla Nimbus Pro",
    sku: "NMB-SEAT-PRO",
    category: "Mobiliario",
    supplier: "Ergo Habitat",
    warehouse: "Valencia Costa",
    status: "Revisión",
    unit: "unidad",
    country: "Italia",
    description: "Silla ergonómica con respaldo dinámico, soporte lumbar de doble tensión y tapizado técnico transpirable.",
    price: 649,
    stock: 9,
    reorderLevel: 12,
    rating: 4.9,
    isFeatured: true,
    isActive: false,
  },
  {
    id: "PRD-1004",
    name: "Teclado Vector MX",
    sku: "VEC-MX-75",
    category: "Periféricos",
    supplier: "Input Forge",
    warehouse: "Sevilla Sur",
    status: "Borrador",
    unit: "unidad",
    country: "Alemania",
    description: "Teclado mecánico compacto para entornos productivos con perfil silencioso y conectividad triple.",
    price: 189,
    stock: 64,
    reorderLevel: 24,
    rating: 4.2,
    isFeatured: false,
    isActive: true,
  },
];

const SELECT_OPTIONS = {
  categories: ["Monitores", "Accesorios", "Mobiliario", "Periféricos", "Audio"],
  warehouses: ["Madrid Norte", "Barcelona Hub", "Valencia Costa", "Sevilla Sur", "Bilbao Centro"],
  statuses: ["Activo", "Revisión", "Borrador", "Pausado"],
  countries: ["España", "Portugal", "Italia", "Alemania", "Francia"],
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatUnits(value: number) {
  return new Intl.NumberFormat("es-ES").format(value);
}

function createViewModel(entity: CatalogEntity) {
  const needsRestock = entity.stock <= entity.reorderLevel;

  return {
    current: { ...entity },
    selectedId: entity.id,
    selectedTitle: `${entity.name} · ${entity.sku}`,
    inventoryValueLabel: formatCurrency(entity.price * entity.stock),
    stockLabel: `${formatUnits(entity.stock)} uds.`,
    restockLabel: needsRestock ? "Reposición recomendada" : "Cobertura estable",
    restockClass: needsRestock
      ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
      : "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
    featuredLabel: entity.isFeatured ? "Colección destacada" : "Línea estándar",
    availabilityLabel: entity.isActive ? "Disponible para venta" : "Edición pausada",
    statusLabel: `${entity.status} · ${entity.country}`,
    lastEditedAt: new Date().toLocaleTimeString("es-ES"),
  };
}

export default class EntityMasterDetailComponent extends BaseComponent {
  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  get view() {
    return this.state.view ?? createViewModel(CATALOG[0]);
  }

  get current(): CatalogEntity {
    return this.view.current as CatalogEntity;
  }

  init(ctx: ComponentInitValue): void {
    super.init(ctx);
    this.setState({ view: createViewModel(CATALOG[0]) });
  }

  mounted(): void {
    this.syncSelectionUI();
    this.syncRestockUI();
  }

  private applyEntity(entity?: CatalogEntity) {
    if (!entity) return;

    const nextView = createViewModel(entity);
    this.state.view = nextView;
  }

  private syncSelectionUI() {
    if (!this.element) return;

    const cards = this.element.querySelectorAll<HTMLElement>("[data-entity-id]");
    cards.forEach((card) => {
      const isSelected = card.dataset.entityId === this.view.selectedId;
      card.classList.toggle("ring-2", isSelected);
      card.classList.toggle("ring-cyan-500", isSelected);
      card.classList.toggle("border-cyan-300", isSelected);
      card.classList.toggle("bg-white", isSelected);
      card.classList.toggle("dark:bg-slate-900", isSelected);
      card.classList.toggle("shadow-lg", isSelected);
      card.classList.toggle("-translate-y-0.5", isSelected);
      card.classList.toggle("border-slate-200/80", !isSelected);
      card.classList.toggle("dark:border-slate-800", !isSelected);
      card.setAttribute("aria-current", isSelected ? "true" : "false");
    });
  }

  private syncRestockUI(target: HTMLElement | null = null) {
    if (!this.element) return;
    if (!target) return;

    const warningClasses = [
      "border-amber-300",
      "bg-amber-50",
      "text-amber-700",
      "dark:border-amber-500/30",
      "dark:bg-amber-500/10",
      "dark:text-amber-300",
    ];
    const healthyClasses = [
      "border-emerald-300",
      "bg-emerald-50",
      "text-emerald-700",
      "dark:border-emerald-500/30",
      "dark:bg-emerald-500/10",
      "dark:text-emerald-300",
    ];
    const activeClasses = this.view.restockLabel === "Reposición recomendada" ? warningClasses : healthyClasses;
    const inactiveClasses = this.view.restockLabel === "Reposición recomendada" ? healthyClasses : warningClasses;
    target.classList.remove(...inactiveClasses);
    target.classList.add(...activeClasses);
  }

  selectEntity(_el: HTMLElement, _event: Event, entityId: string) {
    const entity = CATALOG.find((item) => item.id === entityId);
    this.applyEntity(entity);
    this.syncSelectionUI();
  }

  updateWarehouseField(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, _event: Event, item: ComboItem) {
    if(el.attributes.getNamedItem('app-combo-box')) {
      this.syncDraft({ warehouse: item.id });
    }
  }

  updateTextField(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, _event: Event, field: string) {
    this.syncDraft({ [field]: el.value });
  }

  updateNumberField(el: HTMLInputElement, _event: Event, field: string) {
    const parsedValue = Number(el.value || 0);
    this.syncDraft({ [field]: Number.isFinite(parsedValue) ? parsedValue : 0 });
  }

  updateCheckedField(el: HTMLInputElement, _event: Event, field: string) {
    this.syncDraft({ [field]: el.checked });
  }

  private syncDraft(patch: Record<string, string | number | boolean>) {
    const nextCurrent: CatalogEntity = {
      ...this.current,
      ...patch,
    };

    const nextView = createViewModel(nextCurrent);
    this.state.view = nextView;
  }

  runAction(_el: HTMLButtonElement, event: Event, action: string) {
    event.preventDefault();
    const subject = this.current.name || "el registro actual";

    if (action === "save") {
      notificationService.success(`Cambios preparados para ${subject}.`);
      return;
    }

    if (action === "delete") {
      notificationService.warning(`Solicitud de eliminación enviada para ${subject}.`);
      return;
    }

    if (action === "duplicate") {
      notificationService.info(`Se ha generado un duplicado visual de ${subject}.`);
      return;
    }

    notificationService.info(`Acción ejecutada sobre ${subject}.`);
  }

  render(changedProp?: string): HTMLElement | null {
    if (changedProp && this.element) {
      this.updateBindings();
      this.syncRestockUI();
      this.syncSelectionUI();
      return this.element;
    }

    const listMarkup = CATALOG.map((entity) => {
      const isSelected = this.view.selectedId === entity.id;
      const selectionClasses = isSelected
        ? "ring-2 ring-cyan-500 border-cyan-300 bg-white dark:bg-slate-900 shadow-lg -translate-y-0.5"
        : "border-slate-200/80 bg-white/75 dark:border-slate-800 dark:bg-slate-950/50";

      return `
        <article
          data-entity-id="${entity.id}"
          aria-current="${isSelected ? "true" : "false"}"
          on-click="selectEntity:${entity.id}"
          class="group cursor-pointer rounded-3xl border p-4 transition-all duration-200 ${selectionClasses}">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-[11px] font-black uppercase tracking-[0.3em] text-cyan-600 dark:text-cyan-300">${entity.category}</p>
              <h3 class="mt-2 text-lg font-black text-slate-900 dark:text-slate-100">${entity.name}</h3>
              <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">${entity.supplier}</p>
            </div>
            <span class="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">${entity.status}</span>
          </div>

          <dl class="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600 dark:text-slate-300">
            <div>
              <dt class="text-[11px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">SKU</dt>
              <dd class="font-semibold">${entity.sku}</dd>
            </div>
            <div>
              <dt class="text-[11px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Stock</dt>
              <dd class="font-semibold">${formatUnits(entity.stock)} uds.</dd>
            </div>
            <div>
              <dt class="text-[11px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Precio</dt>
              <dd class="font-semibold">${formatCurrency(entity.price)}</dd>
            </div>
            <div>
              <dt class="text-[11px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Rating</dt>
              <dd class="font-semibold">${entity.rating.toFixed(1)} / 5</dd>
            </div>
          </dl>

          <button
            on-click="selectEntity:${entity.id}"
            class="mt-4 inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition-colors group-hover:border-cyan-300 group-hover:text-cyan-700 dark:border-slate-700 dark:text-slate-200 dark:group-hover:border-cyan-500/50 dark:group-hover:text-cyan-200">
            Abrir ficha
          </button>
        </article>
      `;
    }).join("");

    const categoryOptions = SELECT_OPTIONS.categories.map((option) => `<option value="${option}">${option}</option>`).join("");
    const warehouseOptions = SELECT_OPTIONS.warehouses.map((option) => `<option value="${option}">${option}</option>`).join("");
    const statusOptions = SELECT_OPTIONS.statuses.map((option) => `<option value="${option}">${option}</option>`).join("");
    const countryOptions = SELECT_OPTIONS.countries.map((option) => `<option value="${option}">${option}</option>`).join("");

    const warehouseItems = SELECT_OPTIONS.warehouses.map((name) => ({ value: name, label: name }));

    const template = `
      <section class="overflow-hidden rounded-4xl border border-slate-200/80 bg-linear-to-br from-white via-cyan-50/70 to-slate-100 shadow-[0_30px_80px_-45px_rgba(8,47,73,0.45)] dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-cyan-950/30">
        <div class="border-b border-slate-200/80 px-5 py-6 dark:border-slate-800 sm:px-8">
          <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div class="max-w-3xl">
              <p class="text-xs font-black uppercase tracking-[0.35em] text-cyan-700 dark:text-cyan-300">Binding Master Detail</p>
              <h2 class="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">Catálogo operativo con formulario reactivo</h2>
              <p class="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
                La columna izquierda funciona como selector de entidades y la derecha refleja la ficha en inputs, checks, textarea y combos usando bindings del framework.
              </p>
            </div>

            <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div class="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
                <p class="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">Entidades</p>
                <p class="mt-2 text-2xl font-black text-slate-900 dark:text-white">${CATALOG.length}</p>
              </div>
              <div class="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
                <p class="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">Valor</p>
                <p class="mt-2 text-xl font-black text-slate-900 dark:text-white" data-bind="text:view.inventoryValueLabel"></p>
              </div>
              <div 
                data-restock-surface-bak 
                class="rounded-2xl border px-4 py-3 backdrop-blur"
                data-bind="fn:syncRestockUI">
                <p class="text-[11px] font-bold uppercase tracking-[0.25em]">Cobertura</p>
                <p class="mt-2 text-sm font-black" data-bind="text:view.restockLabel"></p>
              </div>
              <div class="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
                <p class="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">Edición</p>
                <p class="mt-2 text-sm font-black text-slate-900 dark:text-white" data-bind="text:view.lastEditedAt"></p>
              </div>
            </div>
          </div>
        </div>

        <div class="grid gap-6 p-5 lg:grid-cols-[minmax(300px,0.95fr)_minmax(0,1.35fr)] lg:p-8">
          <aside class="flex flex-col gap-4">
            <div class="rounded-[1.75rem] border border-slate-200/80 bg-white/85 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
              <div class="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p class="text-xs font-black uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">Inventario</p>
                  <h3 class="mt-1 text-xl font-black text-slate-900 dark:text-white">Selección rápida</h3>
                </div>
                <span class="rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">Responsive</span>
              </div>

              <div class="space-y-3">
                ${listMarkup}
              </div>
            </div>
          </aside>

          <div class="rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 sm:p-6">
            <div class="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 md:flex-row md:items-start md:justify-between">
              <div>
                <p class="text-xs font-black uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">Ficha activa</p>
                <h3 class="mt-2 text-2xl font-black text-slate-950 dark:text-white" data-bind="text:view.selectedTitle"></h3>
                <p class="mt-2 text-sm text-slate-500 dark:text-slate-400" data-bind="text:view.statusLabel"></p>
              </div>

              <div class="flex flex-wrap gap-2">
                <span class="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" data-bind="text:view.stockLabel"></span>
                <span class="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300" data-bind="text:view.featuredLabel"></span>
                <span class="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300" data-bind="text:view.availabilityLabel"></span>
              </div>
            </div>

            <div class="mt-6 grid gap-4 md:grid-cols-2">
              <label class="space-y-2">
                <span class="text-xs font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Nombre</span>
                <input
                  on-input="updateTextField:name"
                  data-bind="value:view.current.name"
                  class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/10"
                />
              </label>

              <label class="space-y-2">
                <span class="text-xs font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">SKU</span>
                <input
                  on-input="updateTextField:sku"
                  data-bind="value:view.current.sku"
                  class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/10"
                />
              </label>

              <label class="space-y-2">
                <span class="text-xs font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Categoría</span>
                <select
                  on-change="updateTextField:category"
                  data-bind="value:view.current.category"
                  class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/10">
                  ${categoryOptions}
                </select>
              </label>

              <label class="space-y-2">
                <span class="text-xs font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Proveedor</span>
                <input
                  on-input="updateTextField:supplier"
                  data-bind="value:view.current.supplier"
                  class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/10"
                />
              </label>

              <label class="space-y-2">
                <span class="text-xs font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Almacén</span>
                
                <div class="w-full"
                     data-component="app-combo-box"
                     data-items="warehouseItems"
                     data-placeholder="Elige un almacén"
                     data-name="warehouse"
                     (selected)="updateWarehouseField"
                     data-bind="value:view.current.warehouse"
                  >
                </div>  
                
                <select
                  on-change="updateTextField:warehouse"
                  data-bind="value:view.current.warehouse"
                  class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/10">
                  ${warehouseOptions}
                </select>
              </label>

              <label class="space-y-2">
                <span class="text-xs font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Estado</span>
                <select
                  on-change="updateTextField:status"
                  data-bind="value:view.current.status"
                  class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/10">
                  ${statusOptions}
                </select>
              </label>

              <label class="space-y-2">
                <span class="text-xs font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Precio</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  on-input="updateNumberField:price"
                  data-bind="value:view.current.price"
                  class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/10"
                />
              </label>

              <label class="space-y-2">
                <span class="text-xs font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Stock actual</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  on-input="updateNumberField:stock"
                  data-bind="value:view.current.stock"
                  class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/10"
                />
              </label>

              <label class="space-y-2">
                <span class="text-xs font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Mínimo reposición</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  on-input="updateNumberField:reorderLevel"
                  data-bind="value:view.current.reorderLevel"
                  class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/10"
                />
              </label>

              <label class="space-y-2">
                <span class="text-xs font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Rating</span>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  on-input="updateNumberField:rating"
                  data-bind="value:view.current.rating"
                  class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/10"
                />
              </label>

              <label class="space-y-2">
                <span class="text-xs font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">País origen</span>
                <select
                  on-change="updateTextField:country"
                  data-bind="value:view.current.country"
                  class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/10">
                  ${countryOptions}
                </select>
              </label>

              <div class="md:col-span-2 grid gap-3 rounded-3xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60 sm:grid-cols-2">
                <label class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                  <input type="checkbox" on-change="updateCheckedField:isFeatured" data-bind="checked:view.current.isFeatured" class="size-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
                  Destacar en portada
                </label>

                <label class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                  <input type="checkbox" on-change="updateCheckedField:isActive" data-bind="checked:view.current.isActive" class="size-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
                  Disponible para venta
                </label>
              </div>

              <label class="space-y-2 md:col-span-2">
                <span class="text-xs font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Descripción operativa</span>
                <textarea
                  rows="5"
                  on-input="updateTextField:description"
                  data-bind="value:view.current.description"
                  class="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/10"></textarea>
              </label>
            </div>

            <div class="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
              <div 
                class="rounded-3xl border p-4 dark:border-slate-800"
                data-bind="fn:syncRestockUI"
                >
                <p class="text-xs font-black uppercase tracking-[0.24em]">Resumen dinámico</p>
                <div class="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <p class="text-[11px] uppercase tracking-[0.2em] opacity-70">Valor estimado</p>
                    <p class="mt-1 text-lg font-black" data-bind="text:view.inventoryValueLabel"></p>
                  </div>
                  <div>
                    <p class="text-[11px] uppercase tracking-[0.2em] opacity-70">Cobertura</p>
                    <p class="mt-1 text-lg font-black" data-bind="text:view.restockLabel"></p>
                  </div>
                  <div>
                    <p class="text-[11px] uppercase tracking-[0.2em] opacity-70">Disponibilidad</p>
                    <p class="mt-1 text-lg font-black" data-bind="text:view.availabilityLabel"></p>
                  </div>
                </div>
              </div>

              <div class="flex flex-wrap gap-3 xl:justify-end">
                <button on-click="runAction:save" class="inline-flex min-w-28 items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-700 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400">Grabar</button>
                <button on-click="runAction:duplicate" class="inline-flex min-w-28 items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-800 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-cyan-500/40 dark:hover:text-cyan-300">Duplicar</button>
                <button on-click="runAction:delete" class="inline-flex min-w-28 items-center justify-center rounded-2xl bg-rose-600 px-5 py-3 text-sm font-black text-white transition hover:bg-rose-500 dark:bg-rose-500 dark:hover:bg-rose-400">Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;

    return buildAndInterpolate(template, {...this, warehouseItems });
  }
}