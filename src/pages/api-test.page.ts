import type { ComponentFactory } from '@/components/component.model';
import { buildAndInterpolate } from '@/core/dom';
import masterTablesService from '@/services/master-tables.service';
import usuariosService from '@/services/usuarios.service';
import type { Usuario } from '@/services/usuarios.service';

const ApiTestPage: ComponentFactory = () => {

  const context = {
    results: '' as string,

    log(section: string, data: unknown) {
      const timestamp = new Date().toLocaleTimeString();
      const json = JSON.stringify(data, null, 2);
      context.results += `<div class="mb-4"><span class="text-xs text-slate-400">[${timestamp}]</span> <strong class="text-indigo-600 dark:text-indigo-400">${section}</strong><pre class="mt-1 p-2 rounded bg-slate-100 dark:bg-slate-800 text-xs overflow-auto">${json}</pre></div>`;
      context.updateOutput();
    },

    logError(section: string, err: unknown) {
      const timestamp = new Date().toLocaleTimeString();
      context.results += `<div class="mb-4"><span class="text-xs text-slate-400">[${timestamp}]</span> <strong class="text-red-600">${section} — ERROR</strong><pre class="mt-1 p-2 rounded bg-red-50 dark:bg-red-900/20 text-xs text-red-700 dark:text-red-300">${err}</pre></div>`;
      context.updateOutput();
    },

    updateOutput() {
      const el = context.element?.querySelector('[data-ref="output"]');
      if (el) el.innerHTML = context.results;
    },

    clearResults() {
      context.results = '';
      context.updateOutput();
    },

    // -------- MasterTables --------
    async testDepartamentosGetAll() {
      try { context.log('Departamentos.getAll', await masterTablesService.departamentos.getAll()); }
      catch (e) { context.logError('Departamentos.getAll', e); }
    },
    async testDepartamentosGetById() {
      try { context.log('Departamentos.getById(1)', await masterTablesService.departamentos.getById(1)); }
      catch (e) { context.logError('Departamentos.getById(1)', e); }
    },
    async testCategoriasGetAll() {
      try { context.log('Categorias.getAll', await masterTablesService.categorias.getAll()); }
      catch (e) { context.logError('Categorias.getAll', e); }
    },
    async testCategoriasGetById() {
      try { context.log('Categorias.getById(1)', await masterTablesService.categorias.getById(1)); }
      catch (e) { context.logError('Categorias.getById(1)', e); }
    },
    async testEstadosPedidosGetAll() {
      try { context.log('EstadosPedidos.getAll', await masterTablesService.estadosPedidos.getAll()); }
      catch (e) { context.logError('EstadosPedidos.getAll', e); }
    },
    async testEstadosPedidosGetById() {
      try { context.log('EstadosPedidos.getById(1)', await masterTablesService.estadosPedidos.getById(1)); }
      catch (e) { context.logError('EstadosPedidos.getById(1)', e); }
    },
    async testMonedasGetAll() {
      try { context.log('Monedas.getAll', await masterTablesService.monedas.getAll()); }
      catch (e) { context.logError('Monedas.getAll', e); }
    },
    async testMonedasGetById() {
      try { context.log('Monedas.getById(1)', await masterTablesService.monedas.getById(1)); }
      catch (e) { context.logError('Monedas.getById(1)', e); }
    },
    async testPaisesGetAll() {
      try { context.log('Paises.getAll', await masterTablesService.paises.getAll()); }
      catch (e) { context.logError('Paises.getAll', e); }
    },
    async testPaisesGetById() {
      try { context.log('Paises.getById(1)', await masterTablesService.paises.getById(1)); }
      catch (e) { context.logError('Paises.getById(1)', e); }
    },
    async testRolesUsuarioGetAll() {
      try { context.log('RolesUsuario.getAll', await masterTablesService.rolesUsuario.getAll()); }
      catch (e) { context.logError('RolesUsuario.getAll', e); }
    },
    async testRolesUsuarioGetById() {
      try { context.log('RolesUsuario.getById(1)', await masterTablesService.rolesUsuario.getById(1)); }
      catch (e) { context.logError('RolesUsuario.getById(1)', e); }
    },
    async testTiposDeDocumentoGetAll() {
      try { context.log('TiposDeDocumento.getAll', await masterTablesService.tiposDeDocumento.getAll()); }
      catch (e) { context.logError('TiposDeDocumento.getAll', e); }
    },
    async testTiposDeDocumentoGetById() {
      try { context.log('TiposDeDocumento.getById(1)', await masterTablesService.tiposDeDocumento.getById(1)); }
      catch (e) { context.logError('TiposDeDocumento.getById(1)', e); }
    },
    async testTiposDeTransaccionGetAll() {
      try { context.log('TiposDeTransaccion.getAll', await masterTablesService.tiposDeTransaccion.getAll()); }
      catch (e) { context.logError('TiposDeTransaccion.getAll', e); }
    },
    async testTiposDeTransaccionGetById() {
      try { context.log('TiposDeTransaccion.getById(1)', await masterTablesService.tiposDeTransaccion.getById(1)); }
      catch (e) { context.logError('TiposDeTransaccion.getById(1)', e); }
    },
    async testSerializers() {
      try { context.log('Serializers', await masterTablesService.serializers()); }
      catch (e) { context.logError('Serializers', e); }
    },

    // -------- Usuarios --------
    async testUsuariosGetAll() {
      try { context.log('Usuarios.getAll', await usuariosService.getAll()); }
      catch (e) { context.logError('Usuarios.getAll', e); }
    },
    async testUsuariosGetById() {
      try { context.log('Usuarios.getById(1)', await usuariosService.getById(1)); }
      catch (e) { context.logError('Usuarios.getById(1)', e); }
    },
    async testUsuariosCreate() {
      const newUser: Usuario = { id: 0, nif: '12345678A', nombre: 'Test User', descripcion: 'Created from test page', fechaDeAlta: new Date().toISOString() };
      try { context.log('Usuarios.create', await usuariosService.create(newUser)); }
      catch (e) { context.logError('Usuarios.create', e); }
    },
    async testUsuariosUpdate() {
      const updated: Usuario = { id: 1, nif: '12345678A', nombre: 'Updated User', descripcion: 'Updated from test page', fechaDeAlta: null };
      try { context.log('Usuarios.update(1)', await usuariosService.update(1, updated)); }
      catch (e) { context.logError('Usuarios.update(1)', e); }
    },
    async testUsuariosDelete() {
      try { context.log('Usuarios.remove(999)', await usuariosService.remove(999)); }
      catch (e) { context.logError('Usuarios.remove(999)', e); }
    },
    async testUsuariosGetTable() {
      try { context.log('Usuarios.getTable("departamentos")', await usuariosService.getTable('departamentos')); }
      catch (e) { context.logError('Usuarios.getTable("departamentos")', e); }
    },
    async testDistribuidoresGetAll() {
      try { context.log('Distribuidores.getAll', await usuariosService.distribuidores.getAll()); }
      catch (e) { context.logError('Distribuidores.getAll', e); }
    },
    async testDistribuidoresSearch() {
      try { context.log('Distribuidores.search("Mega")', await usuariosService.distribuidores.search('Mega')); }
      catch (e) { context.logError('Distribuidores.search("Mega")', e); }
    },
    async testDistribuidoresGetById() {
      try { context.log('Distribuidores.getById(1)', await usuariosService.distribuidores.getById(1)); }
      catch (e) { context.logError('Distribuidores.getById(1)', e); }
    },
    async testDistribuidoresGetRoles() {
      try { context.log('Distribuidores.getRoles(1)', await usuariosService.distribuidores.getRoles(1)); }
      catch (e) { context.logError('Distribuidores.getRoles(1)', e); }
    },

    // -------- Run All --------
    async runAllMasterTables() {
      context.clearResults();
      await context.testDepartamentosGetAll();
      await context.testDepartamentosGetById();
      await context.testCategoriasGetAll();
      await context.testCategoriasGetById();
      await context.testEstadosPedidosGetAll();
      await context.testEstadosPedidosGetById();
      await context.testMonedasGetAll();
      await context.testMonedasGetById();
      await context.testPaisesGetAll();
      await context.testPaisesGetById();
      await context.testRolesUsuarioGetAll();
      await context.testRolesUsuarioGetById();
      await context.testTiposDeDocumentoGetAll();
      await context.testTiposDeDocumentoGetById();
      await context.testTiposDeTransaccionGetAll();
      await context.testTiposDeTransaccionGetById();
      await context.testSerializers();
    },

    async runAllUsuarios() {
      context.clearResults();
      await context.testUsuariosGetAll();
      await context.testUsuariosGetById();
      await context.testUsuariosCreate();
      await context.testUsuariosUpdate();
      await context.testUsuariosDelete();
      await context.testUsuariosGetTable();
      await context.testDistribuidoresGetAll();
      await context.testDistribuidoresSearch();
      await context.testDistribuidoresGetById();
      await context.testDistribuidoresGetRoles();
    },

    async runAll() {
      context.clearResults();
      await context.runAllMasterTables();
      await context.runAllUsuarios();
    },

    element: null as HTMLElement | null,

    render() {
      const btn = 'px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer';
      const btnPrimary = `${btn} !bg-indigo-600 !text-white !border-indigo-600 hover:!bg-indigo-700`;
      const btnSuccess = `${btn} !bg-emerald-600 !text-white !border-emerald-600 hover:!bg-emerald-700`;

      const template = `
        <div class="flex h-[calc(100vh)] overflow-hidden">

          <!-- Sidebar -->
          <aside class="w-80 min-w-80 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 overflow-y-auto p-3 space-y-2">
            <div class="flex items-center justify-between mb-3 px-1">
              <h1 class="text-lg font-black text-slate-900 dark:text-slate-100">API Tester</h1>
              <div class="flex gap-1">
                <button on-click="runAll" class="${btnPrimary}">All</button>
                <button on-click="clearResults" class="${btn}">Clear</button>
              </div>
            </div>

            <!-- MasterDataTables group -->
            <div data-component="app-collapsible" data-title="Departamentos" data-expanded="false">
              <div class="flex flex-wrap gap-1.5">
                <button on-click="testDepartamentosGetAll" class="${btn}">getAll</button>
                <button on-click="testDepartamentosGetById" class="${btn}">getById(1)</button>
              </div>
            </div>

            <div data-component="app-collapsible" data-title="Categorias" data-expanded="false">
              <div class="flex flex-wrap gap-1.5">
                <button on-click="testCategoriasGetAll" class="${btn}">getAll</button>
                <button on-click="testCategoriasGetById" class="${btn}">getById(1)</button>
              </div>
            </div>

            <div data-component="app-collapsible" data-title="EstadosPedidos" data-expanded="false">
              <div class="flex flex-wrap gap-1.5">
                <button on-click="testEstadosPedidosGetAll" class="${btn}">getAll</button>
                <button on-click="testEstadosPedidosGetById" class="${btn}">getById(1)</button>
              </div>
            </div>

            <div data-component="app-collapsible" data-title="Monedas" data-expanded="false">
              <div class="flex flex-wrap gap-1.5">
                <button on-click="testMonedasGetAll" class="${btn}">getAll</button>
                <button on-click="testMonedasGetById" class="${btn}">getById(1)</button>
              </div>
            </div>

            <div data-component="app-collapsible" data-title="Paises" data-expanded="false">
              <div class="flex flex-wrap gap-1.5">
                <button on-click="testPaisesGetAll" class="${btn}">getAll</button>
                <button on-click="testPaisesGetById" class="${btn}">getById(1)</button>
              </div>
            </div>

            <div data-component="app-collapsible" data-title="RolesUsuario" data-expanded="false">
              <div class="flex flex-wrap gap-1.5">
                <button on-click="testRolesUsuarioGetAll" class="${btn}">getAll</button>
                <button on-click="testRolesUsuarioGetById" class="${btn}">getById(1)</button>
              </div>
            </div>

            <div data-component="app-collapsible" data-title="TiposDeDocumento" data-expanded="false">
              <div class="flex flex-wrap gap-1.5">
                <button on-click="testTiposDeDocumentoGetAll" class="${btn}">getAll</button>
                <button on-click="testTiposDeDocumentoGetById" class="${btn}">getById(1)</button>
              </div>
            </div>

            <div data-component="app-collapsible" data-title="TiposDeTransaccion" data-expanded="false">
              <div class="flex flex-wrap gap-1.5">
                <button on-click="testTiposDeTransaccionGetAll" class="${btn}">getAll</button>
                <button on-click="testTiposDeTransaccionGetById" class="${btn}">getById(1)</button>
              </div>
            </div>

            <div data-component="app-collapsible" data-title="Serializers" data-expanded="false">
              <div class="flex flex-wrap gap-1.5">
                <button on-click="testSerializers" class="${btn}">get</button>
              </div>
            </div>

            <div class="pt-2">
              <button on-click="runAllMasterTables" class="${btnPrimary} w-full">Run All MasterTables</button>
            </div>

            <!-- Separator -->
            <hr class="border-slate-200 dark:border-slate-700 my-2" />

            <!-- Usuarios group -->
            <div data-component="app-collapsible" data-title="Usuarios CRUD" data-expanded="false">
              <div class="flex flex-wrap gap-1.5">
                <button on-click="testUsuariosGetAll" class="${btn}">getAll</button>
                <button on-click="testUsuariosGetById" class="${btn}">getById(1)</button>
                <button on-click="testUsuariosCreate" class="${btn}">create</button>
                <button on-click="testUsuariosUpdate" class="${btn}">update(1)</button>
                <button on-click="testUsuariosDelete" class="${btn}">remove(999)</button>
                <button on-click="testUsuariosGetTable" class="${btn}">getTable("departamentos")</button>
              </div>
            </div>

            <div data-component="app-collapsible" data-title="Distribuidores" data-expanded="false">
              <div class="flex flex-wrap gap-1.5">
                <button on-click="testDistribuidoresGetAll" class="${btn}">getAll</button>
                <button on-click="testDistribuidoresSearch" class="${btn}">search("Mega")</button>
                <button on-click="testDistribuidoresGetById" class="${btn}">getById(1)</button>
                <button on-click="testDistribuidoresGetRoles" class="${btn}">getRoles(1)</button>
              </div>
            </div>

            <div class="pt-2">
              <button on-click="runAllUsuarios" class="${btnSuccess} w-full">Run All Usuarios</button>
            </div>
          </aside>

          <!-- Main content: Results -->
          <main class="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-950">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100">Results</h2>
              <button on-click="clearResults" class="${btn} text-slate-500">Clear output</button>
            </div>
            <div data-ref="output" class="space-y-2"></div>
          </main>

        </div>
      `;

      return buildAndInterpolate(template, context);
    }
  };

  return context;
};

export default ApiTestPage;
