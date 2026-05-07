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
const BASE_ENDPOINT = HOST + '/api/';
const ASHX_ENDPOINT = HOST + '/ashx/users';

const UsuariosService = () => {

  function getAll() {
    return RQ.create<Usuario[]>()
      .useBase(BASE_ENDPOINT)
      .useLog('Fetching all usuarios')
      .getFrom('Usuarios')
      .invoke();
  }

  function getById(id: number) {
    return RQ.create<Usuario>()
      .useBase(BASE_ENDPOINT)
      .useLog(`Fetching usuario with id ${id}`)
      .getFrom(`Usuarios/${id}`)
      .invoke();
  }

  function create(usuario: Usuario) {
    return RQ.create<Usuario>()
      .useBase(BASE_ENDPOINT)
      .useLog('Creating usuario')
      .usePayload(usuario)
      .postTo('Usuarios')
      .invoke();
  }

  function update(id: number, usuario: Usuario) {
    return RQ.create<Usuario>()
      .useBase(BASE_ENDPOINT)
      .useLog(`Updating usuario with id ${id}`)
      .usePayload(usuario)
      .putTo(`Usuarios/${id}`)
      .invoke();
  }

  function remove(id: number) {
    return RQ.create<void>()
      .useBase(BASE_ENDPOINT)
      .useLog(`Deleting usuario with id ${id}`)
      .deleteFrom(`Usuarios/${id}`)
      .invoke();
  }

  function getTable(tablename: string) {
    return RQ.create<unknown>()
      .useBase(BASE_ENDPOINT)
      .useLog(`Fetching table ${tablename}`)
      .getFrom(`Usuarios/tables/${tablename}`)
      .invoke();
  }

  function getDistribuidores() {
    return RQ.create<Distribuidor[]>()
      .useBase(BASE_ENDPOINT)
      .useLog('Fetching all distribuidores')
      .getFrom('Usuarios/distribuidores')
      .invoke();
  }

  function searchDistribuidores(term: string) {
    return RQ.create<Distribuidor[]>()
      .useBase(BASE_ENDPOINT)
      .useLog(`Searching distribuidores by term: ${term}`)
      .getFrom(`Usuarios/distribuidores/by/${term}`)
      .invoke();
  }

  function getDistribuidorById(id: number) {
    return RQ.create<Distribuidor>()
      .useBase(BASE_ENDPOINT)
      .useLog(`Fetching distribuidor with id ${id}`)
      .getFrom(`Usuarios/distribuidores/${id}`)
      .invoke();
  }

  function getRolesByDistribuidor(id: number) {
    return RQ.create<unknown>()
      .useBase(BASE_ENDPOINT)
      .useLog(`Fetching roles for distribuidor ${id}`)
      .getFrom(`Usuarios/roles/distribuidor/${id}`)
      .invoke();
  }

  // -------- ASHX Handler (legacy) --------

  function ashxGetItems(q?: string) {
    const query = q ? `&q=${encodeURIComponent(q)}` : '';
    return RQ.create<Usuario[]>()
      .useBase(ASHX_ENDPOINT)
      .useLog('ASHX getItems' + (q ? ` (q=${q})` : ''))
      .getFrom(`?action=getItems${query}`)
      .invoke();
  }

  function ashxGetItemById(id: number) {
    return RQ.create<Usuario>()
      .useBase(ASHX_ENDPOINT)
      .useLog(`ASHX getItemById (id=${id})`)
      .getFrom(`?action=getItemById&id=${id}`)
      .invoke();
  }

  function ashxDelete(id: number) {
    return RQ.create<string>()
      .useBase(ASHX_ENDPOINT)
      .useLog(`ASHX delete (id=${id})`)
      .getFrom(`?action=delete&id=${id}`)
      .invoke();
  }

  function ashxDeleteItems(ids: number[]) {
    return RQ.create<string>()
      .useBase(ASHX_ENDPOINT)
      .useLog(`ASHX deleteItems (ids=${ids.join(',')})`)
      .getFrom(`?action=deleteItems&ids=${ids.join(',')}`)
      .invoke();
  }

  function ashxChangeNames(ids: number[]) {
    return RQ.create<Usuario[]>()
      .useBase(ASHX_ENDPOINT)
      .useLog(`ASHX changeNames (ids=${ids.join(',')})`)
      .getFrom(`?action=changeNames&ids=${ids.join(',')}`)
      .invoke();
  }

  function ashxNew(usuario: Partial<Usuario>) {
    return RQ.create<Usuario>()
      .useBase(ASHX_ENDPOINT)
      .useLog('ASHX new user')
      .usePayload(usuario)
      .postTo('?action=new')
      .invoke();
  }

  function ashxSave(usuario: Usuario) {
    return RQ.create<Usuario>()
      .useBase(ASHX_ENDPOINT)
      .useLog(`ASHX save user (id=${usuario.id})`)
      .usePayload(usuario)
      .putTo(`?action=save&id=${usuario.id}`)
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
    ashx: {
      getItems: ashxGetItems,
      getItemById: ashxGetItemById,
      delete: ashxDelete,
      deleteItems: ashxDeleteItems,
      changeNames: ashxChangeNames,
      new: ashxNew,
      save: ashxSave,
    },
  };
};

const usuariosService = UsuariosService();

export default usuariosService;
