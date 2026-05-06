import { RQ } from "@/core/services/http-client.service";

export interface Usuario {
  id: number;
  nif: string | null;
  nombre: string | null;
  descripcion: string | null;
  fechaDeAlta: string | null;
}

export interface Distribuidor {
  id: number;
  nif: string | null;
  nombre: string | null;
  email: string | null;
  direccion: string | null;
  ciudad: string | null;
  paisId: number;
  telefono: string | null;
  categoriaProductoId: number;
  tipoDocumentoId: number;
  tipoTransaccionId: number;
  monedaId: number;
  activo: number;
  fechaAlta: string | null;
}

const HOST = import.meta.env.VITE_BACK_END || '';
const BASE_ENDPOINT = HOST + '/api/Usuarios/';

const UsuariosService = () => {

  function getAll() {
    return RQ.create<Usuario[]>()
      .useBase(BASE_ENDPOINT)
      .useLog('Fetching all usuarios')
      .getFrom('')
      .invoke();
  }

  function getById(id: number) {
    return RQ.create<Usuario>()
      .useBase(BASE_ENDPOINT)
      .useLog(`Fetching usuario with id ${id}`)
      .getFrom(`${id}`)
      .invoke();
  }

  function create(usuario: Usuario) {
    return RQ.create<Usuario>()
      .useBase(BASE_ENDPOINT)
      .useLog('Creating usuario')
      .usePayload(usuario)
      .postTo('')
      .invoke();
  }

  function update(id: number, usuario: Usuario) {
    return RQ.create<Usuario>()
      .useBase(BASE_ENDPOINT)
      .useLog(`Updating usuario with id ${id}`)
      .usePayload(usuario)
      .putTo(`${id}`)
      .invoke();
  }

  function remove(id: number) {
    return RQ.create<void>()
      .useBase(BASE_ENDPOINT)
      .useLog(`Deleting usuario with id ${id}`)
      .deleteFrom(`${id}`)
      .invoke();
  }

  function getTable(tablename: string) {
    return RQ.create<unknown>()
      .useBase(BASE_ENDPOINT)
      .useLog(`Fetching table ${tablename}`)
      .getFrom(`tables/${tablename}`)
      .invoke();
  }

  function getDistribuidores() {
    return RQ.create<Distribuidor[]>()
      .useBase(BASE_ENDPOINT)
      .useLog('Fetching all distribuidores')
      .getFrom('distribuidores')
      .invoke();
  }

  function searchDistribuidores(term: string) {
    return RQ.create<Distribuidor[]>()
      .useBase(BASE_ENDPOINT)
      .useLog(`Searching distribuidores by term: ${term}`)
      .getFrom(`distribuidores/by/${term}`)
      .invoke();
  }

  function getDistribuidorById(id: number) {
    return RQ.create<Distribuidor>()
      .useBase(BASE_ENDPOINT)
      .useLog(`Fetching distribuidor with id ${id}`)
      .getFrom(`distribuidores/${id}`)
      .invoke();
  }

  function getRolesByDistribuidor(id: number) {
    return RQ.create<unknown>()
      .useBase(BASE_ENDPOINT)
      .useLog(`Fetching roles for distribuidor ${id}`)
      .getFrom(`roles/distribuidor/${id}`)
      .invoke();
  }

  return {
    getAll,
    getById,
    create,
    update,
    remove,
    getTable,
    distribuidores: {
      getAll: getDistribuidores,
      search: searchDistribuidores,
      getById: getDistribuidorById,
      getRoles: getRolesByDistribuidor,
    },
  };
};

const usuariosService = UsuariosService();

export default usuariosService;
