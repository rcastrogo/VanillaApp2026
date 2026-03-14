import { buildAndInterpolate } from "../../core/dom";
import { BaseComponent, type ComponentContext } from "../../core/types";

export class UserListComponent extends BaseComponent {

  constructor(ctx: ComponentContext) {
    super(ctx);
    Object.assign(this.state, {     
      users: [
        { id: 1, name: 'Alice Freeman', role: 'Admin', initial: 'A' },
        { id: 2, name: 'Bob Vance', role: 'User', initial: 'B' },
        { id: 3, name: 'Charlie Day', role: 'Editor', initial: 'C' },
        { id: 4, name: 'Diana Prince', role: 'Admin', initial: 'D' }
      ],
      searchQuery: ''
    });
  }

  addUser() {
    const names = ['Luis Thompson', 'Marta Sánchez', 'Kevin Flynn', 'Sarah Connor'];
    const roles = ['User', 'Editor', 'Admin'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomRole = roles[Math.floor(Math.random() * roles.length)];
    
    const newUser = {
      id: Date.now(),
      name: randomName,
      role: randomRole,
      initial: randomName.charAt(0)
    };
    // REGLA NIVEL 1: Usamos spread para que el Proxy detecte el cambio de referencia
    this.state.users = [...this.state.users, newUser];
  }

  deleteUser(_el: HTMLElement, _ev: Event, id: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.state.users = this.state.users.filter((u: any) => u.id !== Number(id));
  }

  onSearch(el: HTMLInputElement) {
    this.state.searchQuery = el.value.toLowerCase();
  }

  filteredUsers = [];

  render() {
    console.log('list-control')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.filteredUsers = this.state.users.filter((u: any) => 
      this.state.searchQuery.length ? u.name.toLowerCase().includes(this.state.searchQuery) : true
    );

    const template = `
      <div class="max-w-2xl mx-auto my-8 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        
        <div class="bg-slate-900 p-6">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-bold text-white tracking-tight">Gestión de Equipo</h3>
            <button on-click="addUser" 
              class="bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2">
              <i data-icon="plus" class="size-8"></i> Añadir
            </button>
          </div>
          
          <div class="relative">
            <i data-icon="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 size-5"></i>
            <input type="text" 
              id="txt-search-user"
              on-input="onSearch" 
              placeholder="Buscar por nombre..." 
              value="{state.searchQuery}"
              class="w-full bg-slate-800 border-none rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        <div class="p-2 min-h-75">
          <ul data-each="user in filteredUsers" class="space-y-1">
            <li class="group flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
              <div class="flex items-center gap-4">
                <div class="h-12 w-12 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black">
                  {user.initial}
                </div>
                <div>
                  <p class="text-sm font-bold text-slate-800">{user.name}</p>
                  <p class="text-xs text-slate-400 font-medium tracking-wide uppercase">{user.role}</p>
                </div>
              </div>

              <button on-click="deleteUser:@user.id" 
                class="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all">
                <i data-icon="trash" class="size-6"></i>
              </button>
            </li>
          </ul>
          
          ${this.filteredUsers.length === 0 ? `
            <div class="py-20 text-center text-slate-400">
               <i data-icon="user-minus" class="size-12 mx-auto mb-4 opacity-20"></i>
               <p>No se encontraron usuarios</p>
            </div>
          ` : ''}
        </div>
      </div>
    `;
    return buildAndInterpolate(template, this);
  }

}