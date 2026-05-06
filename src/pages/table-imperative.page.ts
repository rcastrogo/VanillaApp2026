
import type { ComponentContext, ComponentInitValue } from '@/components/component.model';
import { defineColumns, mountTable } from '@/components/table/table-factory';
import type { TableComponent } from '@/components/table/table.component';
import { $, buildAndInterpolate } from '@/core/dom';
import { notificationService } from '@/core/services/notification.service';
import { BaseComponent, type Identifiable } from '@/core/types';
import masterTablesService, { type Categoria } from '@/services/master-tables.service';
import usuariosService, { type Distribuidor, type Usuario } from '@/services/usuarios.service';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default class TableImperativePage extends BaseComponent {

  // Track mounted table instances so we can call setData after load
  private usuariosTable?: TableComponent<Usuario & Identifiable>;
  private distribuidoresTable?: TableComponent<Distribuidor & Identifiable>;
  private categoriasTable?: TableComponent<Categoria & Identifiable>;

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  init(ctx: ComponentInitValue): void {
    super.init(ctx);
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

  // ─── Table construction ──────────────────────────────────────────────────────

  private async buildTables(): Promise<void> {
    await Promise.all([
      this.buildUsuariosTable(),
      this.buildDistribuidoresTable(),
      this.buildCategoriasTable(),
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
      },
    ]);

    this.usuariosTable = mountTable<Usuario & Identifiable>({
      target: container,
      key: 'imperative-usuarios',
      columns,
      onRefresh: () => { void this.loadUsuariosData(); },
    });

    return this.loadUsuariosData();
  }

  private async loadUsuariosData(): Promise<void> {
    const result = await usuariosService.getAll();
    if (typeof result === 'string') {
      notificationService.error(`Error cargando usuarios: ${result}`);
      return;
    }
    this.usuariosTable?.setData(result.data as (Usuario & Identifiable)[]);
  }

  private buildDistribuidoresTable(): Promise<void> {
    const container = $<HTMLElement>('#distribuidores-table-container', this.element ?? undefined).one();
    if (!container) return Promise.resolve();

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
        cellRender: (row) => {
          const isActive = Boolean(row.activo);
          const cls = isActive
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
          return `<span class="inline-flex rounded-full px-2 py-1 text-xs font-semibold ${cls}">${isActive ? 'Sí' : 'No'}</span>`;
        },
        options: { shouldShowValueList: true, shouldShowTextBox: false },
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
      onRefresh: () => { void this.loadDistribuidoresData(); },
    });

    return this.loadDistribuidoresData();
  }

  private async loadDistribuidoresData(): Promise<void> {
    const result = await usuariosService.distribuidores.getAll();
    if (typeof result === 'string') {
      notificationService.error(`Error cargando distribuidores: ${result}`);
      return;
    }
    this.distribuidoresTable?.setData(result.data as (Distribuidor & Identifiable)[]);
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
      },
      { key: 'codigo',      title: 'Código',       type: 'string', className: 'min-w-24',
        accessor: (row) => row.codigo ?? '-' },
      { key: 'descripcion', title: 'Descripción',  type: 'string', className: 'min-w-64',
        accessor: (row) => row.descripcion ?? '-' },
      { key: 'orden',       title: 'Orden',        type: 'number', className: 'w-20 text-center' },
    ]);

    this.categoriasTable = mountTable<Categoria & Identifiable>({
      target: container,
      key: 'imperative-categorias',
      columns,
      onRefresh: () => { void this.loadCategoriasData(); },
    });

    return this.loadCategoriasData();
  }

  private async loadCategoriasData(): Promise<void> {
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

      </div>
    `;
  }

}

