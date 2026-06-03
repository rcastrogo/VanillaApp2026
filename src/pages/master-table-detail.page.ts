
import { buildAndInterpolate } from '@/core/dom';
import { router } from '@/core/services/router.service';
import { storage } from '@/core/storageUtil';
import { BaseComponent } from '@/core/types';
import masterTablesService from '@/services/master-tables.service';

export default class MasterTableDetailPage extends BaseComponent {

  private entity = '';
  private entityId = 0;

  init() {
    const params = router.currentRoute?.params;
    if (params) {
      this.entity = params[1] || '';
      this.entityId = Number(params[2]) || 0;
    }
    this.setState({ 
      loading: true, 
      error: '', 
      item: null,
      mode: storage.readValue('apiMode') as 'mock' | 'api' || 'api'
    });
    this.loadData();
  }

  setMock() {
    storage.writeValue('apiMode', 'mock');
    this.setState({ mode: 'mock' }, false);
    this.loadData();
  }

  setApi() {
    storage.writeValue('apiMode', 'api');
    this.setState({ mode: 'api' }, false);
    this.loadData();
  }

  modeClass(div: HTMLElement, params?: unknown[]){
    const mode = params ? String(params[0]) : '';
    div.classList.toggle('bg-gray-400', this.state.mode === mode);
    div.classList.toggle('text-white', this.state.mode === mode);
  }

  render(changedProp?: string): HTMLElement {
    if (changedProp && this.element) {
      this.updateBindings();
      return this.element;
    }
    const template = `
      <div class="p-6 max-w-2xl mx-auto">
        <div class="mb-1 border-b pb-1">
            <div data-component="app-logo" class="mb-2 border-b pb-2"></div>
            <h1 class="text-2xl md:text-3xl font-black tracking-tight text-slate-800 dark:text-white">
                Routing <span class="text-indigo-500">Tester</span>
            </h1>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Página para probar rutas dinámicas con parámetros y renderizado de detalles de tablas maestras. Navega a rutas como <code>/tables/departamentos/1</code> para ver detalles de un departamento específico.
            </p>

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

        </div>

        <h1 class="text-2xl font-bold mb-2">
          Entidad: ${this.entity}
        </h1>
        <h1 class="text-2xl font-bold mb-2">
          Id: ${this.entityId}
        </h1>

        <div data-bind="show:state.loading" class="text-blue-600">Cargando...</div>
        <div data-bind="show:state.error;text:state.error" class="text-red-600 font-semibold"></div>

        <div data-bind="hide:state.loading">
          <div data-bind="hide:state.error">
            <table class="w-full border-collapse border border-gray-300 mt-4">
              <thead>
                <tr class="bg-gray-100 dark:bg-gray-800">
                  <th class="border border-gray-300 px-4 py-2 text-left">Campo</th>
                  <th class="border border-gray-300 px-4 py-2 text-left">Valor</th>
                </tr>
              </thead>
              <tbody data-bind="fn:renderRows"></tbody>
            </table>

          </div>
          <div class="mt-2 flex justify-center gap-1">
            <button on-click="previousRow" class="app-button">
              <i data-icon="chevron-left"></i> 
            </button>
            <button on-click="nextRow" class="app-button">
              <i data-icon="chevron-right"></i> 
            </button>
          </div>          
        </div>

        <div class="mt-8 border-t pt-4">
          <h2 class="text-lg font-semibold mb-2">Navegar a otra tabla</h2>
          <div class="max-w-sm"
               data-component="app-combo-box"
               data-items="availableTables"
               data-placeholder="Selecciona una entidad…"
               data-name="tableNav"
               data-list-class="max-h-60"
               data-bind-bak="value:entity"
               (value)="entity"
               (selected)="onTableSelected">
          </div>
        </div>

      </div>
    `;

    return buildAndInterpolate(template, this);
  }

  private async loadData() {
    try {
      const getAll = this.resolveGetAll();
      if (!getAll) {
        this.setState({ loading: false, error: `Entidad "${this.entity}" no encontrada en el servicio.` });
        return;
      }
      masterTablesService.setMode(this.state.mode);
      const result = await getAll();
      if (typeof result === 'string') {
        this.setState({ loading: false, error: result });
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const list: any[] = result?.success ? result.data?.response ?? result.data : [];
      const item = Array.isArray(list)
        ? list.find(it => Number(it.id) === this.entityId)
        : null;
      if (item) {
        this.setState({ loading: false, error: '', item });
      } else {
        this.setState({ loading: false, error: `No se encontró el registro con ID ${this.entityId}.` });
      }
    } catch (e) {
      this.setState({ loading: false, error: `Error al cargar datos: ${(e as Error).message}` });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private resolveGetAll(): (() => Promise<any>) | null {
    const key = this.entity.toLowerCase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map: Record<string, () => Promise<any>> = {
      departamentos: masterTablesService.departamentos.getAll,
      categorias: masterTablesService.categorias.getAll,
      estadospedidos: masterTablesService.estadosPedidos.getAll,
      monedas: masterTablesService.monedas.getAll,
      paises: masterTablesService.paises.getAll,
      rolesusuario: masterTablesService.rolesUsuario.getAll,
      tiposdedocumento: masterTablesService.tiposDeDocumento.getAll,
      tiposdetransaccion: masterTablesService.tiposDeTransaccion.getAll,
    };
    return map[key] || null;
  }

  availableTables = [
    { id: 'departamentos', label: 'Departamentos' },
    { id: 'categorias', label: 'Categorías' },
    { id: 'estadospedidos', label: 'Estados de Pedido' },
    { id: 'monedas', label: 'Monedas' },
    { id: 'paises', label: 'Países' },
    { id: 'rolesusuario', label: 'Roles de Usuario' },
    { id: 'tiposdedocumento', label: 'Tipos de Documento' },
    { id: 'tiposdetransaccion', label: 'Tipos de Transacción' },
  ];

  onTableSelected(_el: HTMLElement, _ev: Event, item: { id: string | number; label: string }) {
    router.navigateTo(`/tables/${item.id}/1`);
  }

  nextRow() {
    const currentId = this.entityId;
    const nextId = currentId + 1;
    router.navigateTo(`/tables/${this.entity}/${nextId}`);
  }

  previousRow() {
    const currentId = this.entityId;
    const previousId = currentId - 1;
    if(previousId > 0) router.navigateTo(`/tables/${this.entity}/${previousId}`);
  }

  renderRows(tbody: HTMLElement) {
    const item = this.state.item;
    if (!item) {
      tbody.innerHTML = '<tr><td colspan="2" class="px-4 py-2 text-gray-500">Sin datos</td></tr>';
      return;
    }
    const rows = Object.entries(item as Record<string, unknown>)
      .map(([key, value]) => `
        <tr>
          <td class="border border-gray-300 px-4 py-2 font-medium">${key}</td>
          <td class="border border-gray-300 px-4 py-2">${value ?? '<em class="text-gray-400">null</em>'}</td>
        </tr>
      `)
      .join('');
    tbody.innerHTML = rows;
  }

}
