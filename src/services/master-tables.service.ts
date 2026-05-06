import { RQ } from "@/core/services/http-client.service";

export type ApiResult = 'Ok' | 'Error';

export interface ServerAction {
  type: string | null;
  payload: unknown;
}

export interface ApiResponse<T> {
  result: ApiResult;
  response: T;
  actions: ServerAction[] | null;
}

export interface Departamento {
  id: number;
  codigo: string | null;
  descripcion: string | null;
}

export interface Categoria {
  id: number;
  codigo: string | null;
  descripcion: string | null;
  orden: number;
}

export interface EstadoPedido {
  id: number;
  codigo: string | null;
  descripcion: string | null;
}

export interface Moneda {
  id: number;
  codigo: string | null;
  descripcion: string | null;
  simbolo: string | null;
}

export interface Pais {
  id: number;
  codigo: string | null;
  descripcion: string | null;
  prefijoTelefonico: string | null;
}

export interface RolUsuario {
  id: number;
  codigo: string | null;
  descripcion: string | null;
  nivelPermiso: number;
}

export interface TipoDeDocumento {
  id: number;
  codigo: string | null;
  descripcion: string | null;
  activo: boolean;
}

export interface TipoDeTransaccion {
  id: number;
  codigo: string | null;
  descripcion: string | null;
  naturaleza: string | null;
}

const HOST = import.meta.env.VITE_BACK_END || '';
const BASE_ENDPOINT = HOST + '/api/MasterDataTables/';

const MasterTablesService = () => {

  function getAll<T>(entity: string) {
    return RQ.create<ApiResponse<T[]>>()
      .useBase(BASE_ENDPOINT)
      .useLog(`Fetching all ${entity}`)
      .getFrom(entity)
      .invoke();
  }

  function getById<T>(entity: string, id: number) {
    return RQ.create<ApiResponse<T>>()
      .useBase(BASE_ENDPOINT)
      .useLog(`Fetching ${entity} with id ${id}`)
      .getFrom(`${entity}/${id}`)
      .invoke();
  }

  function getSerializers() {
    return RQ.create<ApiResponse<string>>()
      .useBase(BASE_ENDPOINT)
      .useLog('Fetching serializers')
      .getFrom('serializers')
      .invoke();
  }

  return {
    departamentos: {
      getAll: () => getAll<Departamento>('Departamentos'),
      getById: (id: number) => getById<Departamento>('Departamentos', id),
    },
    categorias: {
      getAll: () => getAll<Categoria>('Categorias'),
      getById: (id: number) => getById<Categoria>('Categorias', id),
    },
    estadosPedidos: {
      getAll: () => getAll<EstadoPedido>('EstadosPedidos'),
      getById: (id: number) => getById<EstadoPedido>('EstadosPedidos', id),
    },
    monedas: {
      getAll: () => getAll<Moneda>('Monedas'),
      getById: (id: number) => getById<Moneda>('Monedas', id),
    },
    paises: {
      getAll: () => getAll<Pais>('Paises'),
      getById: (id: number) => getById<Pais>('Paises', id),
    },
    rolesUsuario: {
      getAll: () => getAll<RolUsuario>('RolesUsuario'),
      getById: (id: number) => getById<RolUsuario>('RolesUsuario', id),
    },
    tiposDeDocumento: {
      getAll: () => getAll<TipoDeDocumento>('TiposDeDocumento'),
      getById: (id: number) => getById<TipoDeDocumento>('TiposDeDocumento', id),
    },
    tiposDeTransaccion: {
      getAll: () => getAll<TipoDeTransaccion>('TiposDeTransaccion'),
      getById: (id: number) => getById<TipoDeTransaccion>('TiposDeTransaccion', id),
    },
    serializers: getSerializers,
  };
};

const masterTablesService = MasterTablesService();

export default masterTablesService;
