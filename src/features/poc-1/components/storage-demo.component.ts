import type { ComponentContext } from '@/components/component.model';
import { buildAndInterpolate } from '@/core/dom';
import { storage } from '@/core/storageUtil';
import { BaseComponent } from '@/core/types';

const STORAGE_KEY = 'poc1-demo';
const STORAGE_KEY_TEST = 'poc1-demo-test';

interface StoredData {
  text: string;
  savedAt: string;
  visits: number;
}

export class StorageDemoComponent extends BaseComponent {

  constructor(ctx: ComponentContext) {
    super(ctx);
    storage.writeValue(STORAGE_KEY_TEST, new Date().toLocaleTimeString());
  }

  init() {
    const saved = storage.readValue<StoredData>(STORAGE_KEY);
    const visits = (saved?.visits ?? 0) + 1;
    storage.writeValue(STORAGE_KEY, { ...saved, visits, savedAt: saved?.savedAt ?? '' });
    this.setState({
      inputText: saved?.text ?? '',
      savedText: saved?.text ?? '',
      savedAt: saved?.savedAt ?? '—',
      visits,
      allKeys: this.readAllKeys(),
    });
  }

  handleInput(el: HTMLInputElement) {
    this.state.inputText = el.value;
  }

  save() {
    const data: StoredData = {
      text: this.state.inputText,
      savedAt: new Date().toLocaleTimeString(),
      visits: this.state.visits,
    };
    storage.writeValue(STORAGE_KEY, data);
    this.state.savedText = data.text;
    this.state.savedAt = data.savedAt;
    this.state.allKeys = this.readAllKeys();
    console.log(this.state.allKeys);
  }

  remove() {
    storage.removeValue(STORAGE_KEY);
    this.setState({
      inputText: '',
      savedText: '',
      savedAt: '—',
      allKeys: this.readAllKeys(),
    });
  }


  private readAllKeys(): string[] {
    return Object.keys(storage.readAll());
  }

  render() {
    const allKeysHtml = (this.state.allKeys as string[])
      .map(k => `<span class="px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-xs rounded">${k}</span>`)
      .join(' ');

    const template = `
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
        <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <i data-icon="database" class="size-5 text-teal-500"></i>
          StorageDemoComponent
        </h2>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Utilidades de
          <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">storage</code>:
          <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">writeValue</code>,
          <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">readValue</code>,
          <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">removeValue</code>,
          <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">clearAppData</code>.
          Visitas a esta demo: <strong class="text-teal-600 dark:text-teal-400">{state.visits}</strong>
        </p>

        <div class="flex gap-2">
          <input
            type="text"
            value="{state.inputText}"
            on-keyup="handleInput"
            placeholder="Escribe algo para guardar..."
            class="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm
                   bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200
                   focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
          <button on-click="save"
            class="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors">
            Guardar
          </button>
          <button on-click="remove"
            class="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors">
            Borrar
          </button>
        </div>

        <div class="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-slate-500 dark:text-slate-400">Guardado</span>
            <span class="font-medium text-slate-800 dark:text-slate-100">{state.savedText}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500 dark:text-slate-400">Hora</span>
            <span class="font-medium text-slate-800 dark:text-slate-100">{state.savedAt}</span>
          </div>
          <div class="flex justify-between items-start">
            <span class="text-slate-500 dark:text-slate-400">Claves en namespace</span>
            <div class="flex flex-wrap gap-1 justify-end max-w-xs">
              ${allKeysHtml || '<span class="text-xs text-slate-400">ninguna</span>'}
            </div>
          </div>
        </div>
      </div>
    `;
    return buildAndInterpolate(template, this);
  }
}
