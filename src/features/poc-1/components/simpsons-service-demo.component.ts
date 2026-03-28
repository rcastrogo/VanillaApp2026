import type { ComponentContext } from '@/components/component.model';
import { buildAndInterpolate } from '@/core/dom';
import { BaseComponent } from '@/core/types';
import { getCharacters, type Character } from '@/services/the-simpsons.service';

const SIMPSONS_CDN = 'https://cdn.thesimpsonsapi.com/200';

export class SimpsonsServiceDemoComponent extends BaseComponent {

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  init() {
    this.setState({
      characters: [] as Character[],
      page: 1,
      status: 'idle',
      error: '',
    });
  }

  async load() {
    this.state.status = 'loading';
    this.state.error = '';
    const result = await getCharacters(this.state.page);
    if (typeof result === 'string') {
      this.state.status = 'error';
      this.state.error = result;
      return;
    }
    this.setState({
      characters: [...this.state.characters, ...result.data],
      page: this.state.page + 1,
      status: 'done',
    });
  }

  render() {
    const characters: Character[] = this.state.characters ?? [];
    const cards = characters
      .slice(0, 12)
      .map(c => `
        <div class="bg-slate-50 dark:bg-slate-700 rounded-lg p-3 flex gap-3 items-center border border-slate-200 dark:border-slate-600">
          <img
            src="${SIMPSONS_CDN}${c.portrait_path}"
            alt="${c.name}"
            class="w-12 h-12 rounded-full object-contain bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600"
          />
          <div class="min-w-0">
            <p class="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">${c.name}</p>
            <p class="text-xs text-slate-500 dark:text-slate-400 truncate">${c.occupation}</p>
            <span class="inline-block mt-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold
              ${c.status === 'Alive' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}">
              ${c.status} · ${c.age}y
            </span>
          </div>
        </div>
      `)
      .join('');

    const template = `
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
        <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <i data-icon="tv" class="size-5 text-yellow-500"></i>
          SimpsonsServiceDemoComponent
        </h2>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Usa <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">the-simpsons.service.ts</code>
          → <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">getCharacters(page)</code>.
          Página actual: <strong class="text-yellow-600 dark:text-yellow-400">{state.page}</strong>
          · Total cargados: <strong class="text-yellow-600 dark:text-yellow-400">{state.characters.length}</strong>
        </p>

        <div class="flex items-center gap-4">
          <button on-click="load"
            class="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-slate-900 text-sm font-bold rounded-lg transition-colors shadow">
            <i data-icon="download" class="inline size-4 mr-1"></i>
            Cargar página {state.page}
          </button>
          <span class="text-sm text-slate-500 dark:text-slate-400">{state.status}</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
          ${cards || `<p class="col-span-3 text-center text-sm text-slate-400 py-6">Pulsa "Cargar" para ver personajes</p>`}
          ${characters.length > 12 ? `<p class="col-span-3 text-center text-xs text-slate-400">... y ${characters.length - 12} más</p>` : ''}
        </div>

        <p class="text-red-500 text-sm min-h-[1.25rem]">{state.error}</p>
      </div>
    `;
    return buildAndInterpolate(template, this);
  }
}
