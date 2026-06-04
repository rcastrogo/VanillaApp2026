
import type { ComponentContext, ComponentInitValue } from '@/components/component.model';
import { defineColumns, mountTable } from '@/components/table/table-factory';
import { ColumnValueResolver } from '@/components/table/table-resolver';
import type { TableComponent } from '@/components/table/table.component';
import { dateRangeGrouping, numericRangeGrouping, textInitialGrouping, valueGrouping, type Column } from '@/components/table/table.model';
import { $, buildAndInterpolate } from '@/core/dom';
import { hydrateComponents } from '@/core/hydrate';
import { notificationService } from '@/core/services/notification.service';
import { storage } from '@/core/storageUtil';
import { BaseComponent, type Identifiable } from '@/core/types';
import { accentNumericComparer, toDate } from '@/core/utils';
import masterTablesService, { type Categoria } from '@/services/master-tables.service';
import usuariosService, { type Distribuidor, type Usuario } from '@/services/usuarios.service';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default class TableImperativePage extends BaseComponent {

  // Track mounted table instances so we can call setData after load
  private usuariosTable?: TableComponent<Usuario & Identifiable>;
  private distribuidoresTable?: TableComponent<Distribuidor & Identifiable>;
  private categoriasTable?: TableComponent<Categoria & Identifiable>;
  private hydrateTable?: TableComponent<Distribuidor & Identifiable>;

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  init(ctx: ComponentInitValue): void {
    super.init(ctx);
    this.setState({ 
      mode: storage.readValue('apiMode') as 'mock' | 'api' || 'api'
    });
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  render(changedProp?: string): HTMLElement {
    if (changedProp && this.element) {
      this.updateBindings();
      return this.element;
    }
    return buildAndInterpolate(this.buildTemplate(), this);
  }

  mounted(): void {
    void this.buildTables();
  }

  setMock() {
    storage.writeValue('apiMode', 'mock');
    this.setState({ mode: 'mock' });
    this.reloadAll();
  }

  setApi() {
    storage.writeValue('apiMode', 'api');
    this.setState({ mode: 'api' });
    this.reloadAll();
  }

  reloadAll() {
  
    this.distribuidoresTable?.showSkeletonRows();
    this.usuariosTable?.showSkeletonRows();
    this.categoriasTable?.showSkeletonRows();
    this.hydrateTable?.showSkeletonRows();

    if(this.distribuidoresTable){  
      this.loadDistribuidoresData();
    } else {
      this.buildDistribuidoresTable();
    }
    this.loadUsuariosData();
    this.loadCategoriasData();
    this.loadHydrateData();
  }

  modeClass(div: HTMLElement, params?: unknown[]){
    const mode = params ? String(params[0]) : '';
    div.classList.toggle('bg-gray-400', this.state.mode === mode);
    div.classList.toggle('text-white', this.state.mode === mode);
  }

  // ─── Table construction ──────────────────────────────────────────────────────

  private async buildTables(): Promise<void> {
    await Promise.all([
      this.buildUsuariosTable(),
      this.buildDistribuidoresTable(),
      this.buildCategoriasTable(),
      this.buildHydrateTable(),
    ]);
  }

  private buildUsuariosTable(): Promise<void> {
    const container = $<HTMLElement>('#usuarios-table-container', this.element ?? undefined).one();
    if (!container) return Promise.resolve();

    const columns = defineColumns<Usuario & Identifiable>([
      {
        key: 'id',
        title: 'ID',
        type: 'number',
        className: 'w-16 text-center',
        options: { shouldShowFilterButton: false, canBeRemoved: false },
      },
      { key: 'nif',         title: 'NIF',         type: 'string', className: 'min-w-32' },
      { key: 'nombre',      title: 'Nombre',       type: 'string', className: 'min-w-48' },
      { key: 'descripcion', title: 'Descripción',  type: 'string', className: 'min-w-48' },
      {
        key: 'fechaDeAlta',
        title: 'Fecha de Alta',
        type: 'date',
        className: 'min-w-36',
        accessor: (row) => row.fechaDeAlta ?? '-',
        grouping: dateRangeGrouping(),
      },
      {
        key: 'year',
        title: 'Año',
        accessor: (row) => {
          return toDate(row.fechaDeAlta)?.getFullYear() || '';
        },
        sorter: (a, b) => {
          const va = toDate(a.fechaDeAlta)?.getTime() ?? 0;
          const vb = toDate(b.fechaDeAlta)?.getTime() ?? 0;
          return va - vb;
        },
        grouping: valueGrouping(),
      },
    ]);

    this.usuariosTable = mountTable<Usuario & Identifiable>({
      target: container,
      key: 'imperative-usuarios',
      columns,
      onRefresh: () => { 
        void this.loadUsuariosData();
        this.usuariosTable?.showSkeletonRows();
      },
    });

    return this.loadUsuariosData();
  }

  private async loadUsuariosData(): Promise<void> {
    usuariosService.setMode(this.state.mode);
    const result = await usuariosService.getAll();
    if (typeof result === 'string') {
      notificationService.error(`Error cargando usuarios: ${result}`);
      return;
    }
    this.usuariosTable?.setData(result.data as (Usuario & Identifiable)[]);
  }

  // paisResolver = new ColumnValueResolver<Distribuidor>([], 'id', 'descripcion');
  // categoriaResolver = new ColumnValueResolver<Distribuidor>([], 'id', 'descripcion');
  // tipoDocResolver = new ColumnValueResolver<Distribuidor>([], 'id', 'descripcion');
  // tipoTransaccionResolver = new ColumnValueResolver<Distribuidor>([], 'id', 'descripcion');
  // monedaResolver = new ColumnValueResolver<Distribuidor>([], 'id', 'descripcion');

  private async buildDistribuidoresTable(): Promise<void> {
    const container = $<HTMLElement>('#distribuidores-table-container', this.element ?? undefined).one();
    if (!container) return Promise.resolve();

    // ================================================================================
    // Load master tables in parallel to populate resolvers before rendering the table
    // ================================================================================
    masterTablesService.setMode(this.state.mode);
    const [
      paises,
      categorias,
      tiposDeDocumento,
      tiposDeTransaccion,
      monedas,
    ] = await Promise.all([
      masterTablesService.paises.getAll(),
      masterTablesService.categorias.getAll(),
      masterTablesService.tiposDeDocumento.getAll(),
      masterTablesService.tiposDeTransaccion.getAll(),
      masterTablesService.monedas.getAll(),
    ]);

    if (typeof paises === 'string' || 
        typeof categorias === 'string' || 
        typeof tiposDeDocumento === 'string' || 
        typeof tiposDeTransaccion === 'string' || 
        typeof monedas === 'string') {
      notificationService.error(`Error cargando las tablas de códigos`);
      return;
    }

    const columns = defineColumns<Distribuidor & Identifiable>([
      {
        key: 'id',
        title: 'ID',
        type: 'number',
        className: 'w-16 text-center',
        options: { shouldShowFilterButton: false, canBeRemoved: false }, 
      },
      { key: 'nif',      title: 'NIF',      type: 'string', className: 'min-w-32' },
      { key: 'nombre',   title: 'Nombre',   type: 'string', className: 'min-w-48' },
      { key: 'email',    title: 'Email',    type: 'string', className: 'min-w-48',
        accessor: (row) => row.email ?? '-' },
      { key: 'ciudad',   title: 'Ciudad',   type: 'string', className: 'min-w-32',
        accessor: (row) => row.ciudad ?? '-' },
      { key: 'telefono', title: 'Teléfono', type: 'string', className: 'min-w-32',
        accessor: (row) => row.telefono ?? '-' },
      {
        key: 'activo',
        title: 'Activo',
        type: 'number',
        className: 'text-center',
        cellRender: (row, _col) => {
          const isActive = Boolean(row.activo);
          const cls = isActive
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
          return `<span class="inline-flex rounded-full px-2 py-1 text-xs font-semibold ${cls}">${isActive ? 'Sí' : 'No'}</span>`;
        },
        options: { shouldShowValueList: true, shouldShowTextBox: false },
      },
      {
        key: 'paisId',
        title: 'País',
        resolver: new ColumnValueResolver<Distribuidor>(paises.data.response, 'id', 'descripcion'),
        grouping: valueGrouping(),
      },
      {
        key: 'categoriaProductoId',
        title: 'Categoría',
        resolver: new ColumnValueResolver<Distribuidor>(categorias.data.response, 'id', 'descripcion'),
        grouping: valueGrouping(),
      },
      {
        key: 'tipoDocumentoId',
        title: 'Tipo Documento',
        resolver: new ColumnValueResolver<Distribuidor>(tiposDeDocumento.data.response, 'id', 'descripcion'),
        grouping: valueGrouping(),
      },
      {
        key: 'tipoTransaccionId',
        title: 'Tipo Transacción',
        resolver: new ColumnValueResolver<Distribuidor>(tiposDeTransaccion.data.response, 'id', 'descripcion'),
        grouping: valueGrouping(),
      },
      {
        key: 'monedaId',
        title: 'Moneda',
        resolver: new ColumnValueResolver<Distribuidor>(monedas.data.response, 'id', 'descripcion'),
        grouping: valueGrouping(),
      },
      {
        key: 'fechaAlta',
        title: 'Fecha de Alta',
        type: 'date',
        className: 'min-w-36',
        accessor: (row) => row.fechaAlta ?? '-',
      },
    ]);

    this.distribuidoresTable = mountTable<Distribuidor & Identifiable>({
      target: container,
      key: 'imperative-distribuidores',
      columns,
      onRefresh: () => { 
        void this.loadDistribuidoresData();
        this.distribuidoresTable?.showSkeletonRows();
      },
    });

    return this.loadDistribuidoresData();
  }

  private async loadDistribuidoresData(): Promise<void> {
    usuariosService.setMode(this.state.mode);
    const distribuidores = await usuariosService.distribuidores.getAll();
    if (typeof distribuidores === 'string') {
      notificationService.error(`Error cargando los datos de los distribuidores`);
      return;
    }
    this.distribuidoresTable?.setData(distribuidores.data as (Distribuidor & Identifiable)[]);
  }

  private buildCategoriasTable(): Promise<void> {
    const container = $<HTMLElement>('#categorias-table-container', this.element ?? undefined).one();
    if (!container) return Promise.resolve();

    const columns = defineColumns<Categoria & Identifiable>([
      {
        key: 'id',
        title: 'ID',
        type: 'number',
        className: 'w-16 text-center',
        options: { shouldShowFilterButton: false, canBeRemoved: false },
        grouping: numericRangeGrouping(),
      },
      { key: 'codigo',      title: 'Código',       type: 'string', className: 'min-w-24',
        accessor: (row) => row.codigo ?? '-',
        grouping: textInitialGrouping() },
      { key: 'descripcion', title: 'Descripción',  type: 'string', className: 'min-w-64',
        accessor: (row) => row.descripcion ?? '-' },
      { key: 'orden',       title: 'Orden',        type: 'number', className: 'w-20 text-center' },
    ]);

    this.categoriasTable = mountTable<Categoria & Identifiable>({
      target: container,
      key: 'imperative-categorias',
      options: { 
        resizeColumns: 'true',
        hideStatusbar: 'true',
        hideMenuSelection: 'true',
      },
      columns,
      onRefresh: () => { 
        void this.loadCategoriasData(); 
        this.categoriasTable?.showSkeletonRows();},
    });

    return this.loadCategoriasData();
  }

  private async loadCategoriasData(): Promise<void> {
    masterTablesService.setMode(this.state.mode);
    const result = await masterTablesService.categorias.getAll();
    if (typeof result === 'string') {
      notificationService.error(`Error cargando categorías: ${result}`);
      return;
    }
    // masterTablesService wraps data in ApiResponse: result.data.response
    const rows = result.data?.response;
    if (Array.isArray(rows)) {
      this.categoriasTable?.setData(rows as (Categoria & Identifiable)[]);
    }
  }

  // ─── Hydrate-based table (api-test.page style) ──────────────────────────────

  private async buildHydrateTable(): Promise<void> {
    const container = $<HTMLElement>('#hydrate-table-container', this.element ?? undefined).one();
    if (!container) return;

    await hydrateComponents(container, {});

    const instance = BaseComponent.getInstance<TableComponent<Distribuidor & Identifiable>>('[app-table]', container);
    if (!instance) return;

    this.hydrateTable = instance;

    const columns = this.buildDistribuidorColumns();
    instance.setColumns(columns);
    instance.onRefresh = () => { 
      void this.loadHydrateData(); 
      instance.showSkeletonRows();
    };
    instance.onRowClick = (_sender: TableComponent<Distribuidor & Identifiable> ,id: string | number) => {
      notificationService.success(`Clicked row: ${id}`);
    };

    await this.loadHydrateData();
  }

  private async loadHydrateData(): Promise<void> {
    const result = await usuariosService.distribuidores.getAll();
    if (typeof result === 'string') {
      notificationService.error(`Error cargando datos: ${result}`);
      return;
    }
    this.hydrateTable?.setData(result.data as (Distribuidor & Identifiable)[]);
  }

  private buildDistribuidorColumns(): Column<Distribuidor & Identifiable>[] {
    return (Object.keys({ id: 0, nif: '', nombre: '', email: '', ciudad: '', telefono: '', activo: 0 }) as string[])
      .map(key => ({
        key,
        title: key.charAt(0).toUpperCase() + key.slice(1),
        className: 'text-left min-w-24',
        options: { canBeRemoved: key !== 'id' },
        sorter: (a: Distribuidor & Identifiable, b: Distribuidor & Identifiable) => {
          const va = (a as unknown as Record<string, unknown>)[key];
          const vb = (b as unknown as Record<string, unknown>)[key];
          if (va == null && vb == null) return 0;
          if (va == null) return -1;
          if (vb == null) return 1;
          if (typeof va === 'number' && typeof vb === 'number') return va - vb;
          return accentNumericComparer(String(va), String(vb));
        },
      }));
  }

  // ─── Template ────────────────────────────────────────────────────────────────

  private buildTemplate(): string {
    return `
      <div class="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6 md:p-10">

        <header class="mb-10">
          <div class="flex items-center gap-3 mb-2">
            <button
              route-to="table"
              class="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition">
              <i data-icon="arrow-left" class="size-4"></i>
              Volver al ejemplo básico
            </button>
          </div>
          <h1 class="text-4xl font-black text-slate-800 dark:text-white mb-2">
            🏭 Imperative Table API — Demo
          </h1>
          <p class="text-slate-500 dark:text-slate-400 max-w-3xl">
            Este ejemplo demuestra la API imperativa y dinámica del componente de tabla.
            Las tablas se crean y montan programáticamente usando
            <code class="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-sm">mountTable()</code> y
            <code class="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-sm">defineColumns()</code>
            desde <code class="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-sm">table-factory.ts</code>,
            y los datos se cargan desde los servicios reales de la aplicación.
          </p>
        </header>

        <!-- How it works banner -->
        <div class="mb-8 p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 text-sm text-blue-800 dark:text-blue-300">
          <strong>¿Cómo funciona?</strong>
          <code class="block mt-1 text-xs bg-blue-100 dark:bg-blue-900/40 rounded p-2 whitespace-pre-wrap">
const columns = defineColumns&lt;Usuario&gt;([
  { key: 'id',     title: 'ID',     type: 'number' },
  { key: 'nombre', title: 'Nombre', type: 'string' },
]);
const table = mountTable&lt;Usuario&gt;({ target: containerEl, key: 'my-table', columns });
const result = await usuariosService.getAll();
if (typeof result !== 'string') table.setData(result.data);
          </code>
        </div>

        <section class="mb-10">
          <button 
            on-click="setMock"
            data-bind="fn:modeClass:mock:@state.mode:$mode"
            class="app-button text-slate-500">
            Mock mode
          </button>

          <button 
            on-click="setApi"
            data-bind="fn:modeClass:api:@state.mode:$mode"
            class="app-button text-slate-500">
            Api mode
          </button>
        </section>


        <!-- Usuarios table -->
        <section class="mb-10">
          <h2 class="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-1">
            👤 Usuarios
          </h2>
          <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Cargado desde <code>usuariosService.getAll()</code>.
            Columnas generadas con tipos <code>number</code>, <code>string</code> y <code>date</code>.
          </p>
          <div id="usuarios-table-container"></div>
        </section>

        <!-- Distribuidores table -->
        <section class="mb-10">
          <h2 class="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-1">
            🏢 Distribuidores
          </h2>
          <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Cargado desde <code>usuariosService.distribuidores.getAll()</code>.
            Incluye columna booleana con <code>cellRender</code> personalizado.
          </p>
          <div id="distribuidores-table-container"></div>
        </section>

        <!-- Categorías (MasterTables) table -->
        <section class="mb-10">
          <h2 class="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-1">
            🗂️ Categorías <span class="text-sm font-normal text-slate-400">(MasterTables)</span>
          </h2>
          <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Cargado desde <code>masterTablesService.categorias.getAll()</code>.
            Respuesta envuelta en <code>ApiResponse&lt;T[]&gt;</code>.
          </p>
          <div id="categorias-table-container"></div>
        </section>

        <!-- Hydrate-based table (api-test.page style) -->
        <section class="mb-10">
          <h2 class="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-1">
            🔌 Hydrate + getInstance <span class="text-sm font-normal text-slate-400">(estilo api-test.page)</span>
          </h2>
          <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">
            El componente tabla se declara en el HTML con atributos <code>data-*</code> para configurar la UI.
            Luego se hidrata con <code>hydrateComponents()</code> y se obtiene la instancia con
            <code>BaseComponent.getInstance()</code> para inyectar columnas y datos.
          </p>
          <div class="mb-4 p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-sm text-amber-800 dark:text-amber-300">
            <strong>Patrón:</strong>
            <code class="block mt-1 text-xs bg-amber-100 dark:bg-amber-900/40 rounded p-2 whitespace-pre-wrap">// 1. Declarar en el template con atributos de UI
&lt;div data-component="app-table"
     data-hide-crud-buttons="true"
     data-hide-pagination="true"
     data-page-size="none"&gt;&lt;/div&gt;

// 2. Hidratar e inyectar datos
await hydrateComponents(container, {});
const table = BaseComponent.getInstance('[app-table]', container);
table.setColumns(columns);
table.setData(data);
table.onRowClick = (id) => notify(id);</code>
          </div>
          <div id="hydrate-table-container">
            <div
              data-component="app-table"
              data-resize-columns="true"
              data-hide-crud-buttons="true"
              data-hide-pagination="true"
              data-hide-config-button="true"
              data-hide-menu-pagination="true"
              data-hide-row-selection="true"
              data-page-size="none"
            ></div>
          </div>
        </section>

        <!-- Feature summary -->
        <div class="mt-10 grid gap-6 md:grid-cols-2">
          <section class="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
            <h3 class="text-lg font-bold text-slate-700 dark:text-slate-200 mb-3">
              ✅ Lo que hace la API imperativa
            </h3>
            <ul class="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>✅ Crea host sintético para simular la hidratación declarativa</li>
              <li>✅ Genera sorters automáticos por tipo de dato (string, number, boolean, date)</li>
              <li>✅ Monta el componente tabla sin placeholder en el HTML</li>
              <li>✅ Preserva persistencia de paginación y columnas visibles (localStorage)</li>
              <li>✅ Soporta callbacks (onRefresh, onCreate, onDelete, onEdit, onAction)</li>
              <li>✅ Compatible con carga de datos asíncrona posterior al montaje</li>
            </ul>
          </section>
          <section class="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
            <h3 class="text-lg font-bold text-slate-700 dark:text-slate-200 mb-3">
              📦 API pública de <code>table-factory.ts</code>
            </h3>
            <ul class="space-y-2 text-sm text-slate-600 dark:text-slate-400 font-mono">
              <li><code>defineColumns(schemas)</code> — genera Column&lt;T&gt;[] con sorters tipados</li>
              <li><code>createTableHost(key)</code> — crea host sintético para init()</li>
              <li><code>mountTable(config)</code> — monta tabla imperativa completa</li>
            </ul>
          </section>
        </div>

        <!-- Declarative data-* attributes reference -->
        <div class="mt-8 bg-white dark:bg-slate-800 rounded-xl shadow p-6">
          <h3 class="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4">
            🏷️ Atributos declarativos <code>data-*</code>
          </h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Estos atributos se aplican en el elemento <code>&lt;div data-component="app-table" ...&gt;</code>
            para configurar la UI sin necesidad de código imperativo.
          </p>
          <div class="overflow-x-auto">
            <table class="w-full text-sm border-collapse">
              <thead class="bg-slate-100 dark:bg-slate-900">
                <tr>
                  <th class="px-3 py-2 text-left font-semibold border-b">Atributo</th>
                  <th class="px-3 py-2 text-left font-semibold border-b">Valores</th>
                  <th class="px-3 py-2 text-left font-semibold border-b">Descripción</th>
                </tr>
              </thead>
              <tbody class="text-slate-600 dark:text-slate-400">
                <tr class="border-b dark:border-slate-700">
                  <td class="px-3 py-2 font-mono text-xs">data-key</td>
                  <td class="px-3 py-2 text-xs">string</td>
                  <td class="px-3 py-2">Clave única para persistir page-size y columnas visibles en localStorage</td>
                </tr>
                <tr class="border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <td class="px-3 py-2 font-mono text-xs">data-page-size</td>
                  <td class="px-3 py-2 text-xs">"none"</td>
                  <td class="px-3 py-2">Desactiva la paginación mostrando todos los registros</td>
                </tr>
                <tr class="border-b dark:border-slate-700">
                  <td class="px-3 py-2 font-mono text-xs">data-hide-row-selection</td>
                  <td class="px-3 py-2 text-xs">"true"</td>
                  <td class="px-3 py-2">Oculta la columna de checkboxes para selección de filas</td>
                </tr>
                <tr class="border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <td class="px-3 py-2 font-mono text-xs">data-hide-toolbar</td>
                  <td class="px-3 py-2 text-xs">"true"</td>
                  <td class="px-3 py-2">Oculta toda la barra de herramientas superior</td>
                </tr>
                <tr class="border-b dark:border-slate-700">
                  <td class="px-3 py-2 font-mono text-xs">data-hide-statusbar</td>
                  <td class="px-3 py-2 text-xs">"true"</td>
                  <td class="px-3 py-2">Oculta el indicador de estado (total, seleccionados, página)</td>
                </tr>
                <tr class="border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <td class="px-3 py-2 font-mono text-xs">data-hide-buttons</td>
                  <td class="px-3 py-2 text-xs">"true"</td>
                  <td class="px-3 py-2">Oculta todos los botones de la toolbar (CRUD + custom + paginación)</td>
                </tr>
                <tr class="border-b dark:border-slate-700">
                  <td class="px-3 py-2 font-mono text-xs">data-hide-crud-buttons</td>
                  <td class="px-3 py-2 text-xs">"true"</td>
                  <td class="px-3 py-2">Oculta solo los botones CRUD (refresh, crear, editar, eliminar)</td>
                </tr>
                <tr class="border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <td class="px-3 py-2 font-mono text-xs">data-hide-pagination</td>
                  <td class="px-3 py-2 text-xs">"true"</td>
                  <td class="px-3 py-2">Oculta los controles de paginación en la toolbar</td>
                </tr>
                <tr class="border-b dark:border-slate-700">
                  <td class="px-3 py-2 font-mono text-xs">data-hide-menu-button</td>
                  <td class="px-3 py-2 text-xs">"true"</td>
                  <td class="px-3 py-2">Oculta el botón de menú contextual (≡)</td>
                </tr>
                <tr class="border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <td class="px-3 py-2 font-mono text-xs">data-hide-config-button</td>
                  <td class="px-3 py-2 text-xs">"true"</td>
                  <td class="px-3 py-2">Oculta el botón de configuración (⚙)</td>
                </tr>
                <tr class="border-b dark:border-slate-700">
                  <td class="px-3 py-2 font-mono text-xs">data-hide-menu-selection</td>
                  <td class="px-3 py-2 text-xs">"true"</td>
                  <td class="px-3 py-2">Oculta la sección "Selección" en el menú contextual</td>
                </tr>
                <tr class="border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <td class="px-3 py-2 font-mono text-xs">data-hide-menu-columns</td>
                  <td class="px-3 py-2 text-xs">"true"</td>
                  <td class="px-3 py-2">Oculta la sección "Columnas" en el menú contextual</td>
                </tr>
                <tr class="border-b dark:border-slate-700">
                  <td class="px-3 py-2 font-mono text-xs">data-hide-menu-pagination</td>
                  <td class="px-3 py-2 text-xs">"true"</td>
                  <td class="px-3 py-2">Oculta la sección "Paginación" en el menú contextual</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Two approaches comparison -->
        <div class="mt-8 grid gap-6 md:grid-cols-2">
          <section class="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
            <h3 class="text-lg font-bold text-slate-700 dark:text-slate-200 mb-3">
              🏗️ Enfoque 1: <code>mountTable()</code>
            </h3>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-3">
              Crea el componente completamente desde código. No requiere HTML previo.
            </p>
            <code class="block text-xs bg-slate-100 dark:bg-slate-900/60 rounded p-3 whitespace-pre-wrap text-slate-700 dark:text-slate-300">const table = mountTable({
  target: containerEl,
  key: 'my-table',
  columns,
  onRefresh: () => load(),
});
table.setData(rows);</code>
          </section>
          <section class="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
            <h3 class="text-lg font-bold text-slate-700 dark:text-slate-200 mb-3">
              🔌 Enfoque 2: <code>hydrateComponents()</code>
            </h3>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-3">
              La tabla se declara en el HTML con <code>data-*</code>. Se hidrata y se obtiene la instancia.
            </p>
            <code class="block text-xs bg-slate-100 dark:bg-slate-900/60 rounded p-3 whitespace-pre-wrap text-slate-700 dark:text-slate-300">await hydrateComponents(container, {});
const table = BaseComponent
  .getInstance('[app-table]', container);
table.setColumns(columns);
table.setData(rows);</code>
          </section>
        </div>

      </div>
    `;
  }

}

