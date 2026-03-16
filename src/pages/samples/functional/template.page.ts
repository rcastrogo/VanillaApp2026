import type { ComponentContext, ComponentFactory } from '../../../components/component.model';
import { buildAndInterpolate } from '../../../core/dom';

const TemplatePage: ComponentFactory = (_ctx: ComponentContext) => {

  const context = {
    title: "Mi Lista de Tareas",
    showTitle: true,
    tasks: [
      { id: 1, text: "Configurar el Router", done: true },
      { id: 2, text: "Arreglar el Icono de Usuario", done: false },
      { id: 3, text: "Implementar el renderTemplate", done: false }
    ],
    users: [
      { id: 1, name: "Lucas", role: 'admin', balance: 500, active: true, lastLogin: '2023-10-01',
        ids : [1,2,4,25,6]
      },
      { id: 2, name: "Marta", role: 'user', balance: 0, active: false, lastLogin: null,
        ids : [1,25,6,8,100] 
      },
      { id: 3, name: "Eva", role: 'editor', balance: -20, active: true, lastLogin: '2023-11-15',
        ids : [1,25,6]
      }
    ],
    format: (val: string) => val.toUpperCase()
  };

  const template = `
    <div class="p-4 rounded bg-gray-500">
      @if(showTitle)
        <h1 class="text-xl font-bold">{title | upper} {jj | undefined}</h1>
      @endif
      <ul data-each="item of tasks" class="mt-4">
        <li class="flex items-center gap-2 p-2 shadow-sm 
          @if(item.done) bg-red-500 @endif">
          <input type="checkbox" @if(item.done) checked @endif>   
          @if(item.done)<span class="line-through">{item.text | upper}</span>@endif
          @if(!item.done)<span class="font-medium">{item.text}</span>@endif
        </li>
      </ul>
    </div>
    <div class="p-6 bg-slate-800 text-white rounded-xl">
      @if(showTitle)
        <h1 class="text-3xl font-extrabold mb-4">{title | upper}</h1>
      @endif
      <div class="space-y-4">
        <ul data-each="user of users" class="list-none p-0">
          <li>
            {user.name | upper} - {user.name | lower} <br/>
            {user.active} - Acivo: {user.active | if: SIIIIIII } <br/>
            {user.active} - show: {user.active | show} <br/>
            {user.active} - hide: {user.active | hide} <br/>
            {user.active} - {user.active | iif: trueClass AAA : falseClass BBBB}
            <ul data-each="id of user.ids" class="list-none p-0">
              <li class="pl-3">
                @if(id>=4)
                  {#.user.name | upper} - {id} es mayor que 3
                @endif             
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  `;

  return {
    render : () => {
      return buildAndInterpolate(template, context, false);
    }
  };

};

export default TemplatePage;