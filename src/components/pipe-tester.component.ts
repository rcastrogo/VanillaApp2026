import type { ComponentInitValue } from './component.model';

import { buildAndInterpolate } from '@/core/dom';
import { getValue } from '@/core/template';
import { BaseComponent } from '@/core/types';

interface PipeExample {
  id: number;
  title: string;
  expression: string;
  category: 'ui' | 'text' | 'numbers' | 'data' | 'debug';
}

const EXAMPLE_CONTEXT = {
  id: 123,
  isActive: true,
  isLoading: false,
  isError: true,
  status: '1',
  statusOff: '0',
  name: 'Ana Maria',
  role: 'ADMIN',
  city: 'Madrid',
  count: 42,
  amount: 1234.56,
  numericText: '0042',
  badNumber: 'abc',
  emptyText: '',
  nullText: null,
  htmlInput: `<img src=x onerror=alert('xss')><b>Safe?</b>`,
  phrase: 'hola-mundo-desde-vanilla',
  longText: 'Este es un texto largo para probar truncate en distintos escenarios de interfaz de usuario.',
  clock: '10:20:30',
  apiUrl: 'https://api.example.com:443/v1/users:active',
  list: ['alpha', 'beta', 'gamma'],
  numbers: [3, 7, 21],
  user: {
    firstName: 'Ana',
    lastName: 'Maria',
    bio: 'Frontend developer enfocada en accesibilidad y performance.',
  },
  settings: {
    darkMode: true,
    language: 'es',
    density: 'compact',
  },
  language: {
    es: 'Espa\u00f1ol',
    en: 'English',
  },
  lang: 'es',
  i18nKeyLoadCounter: 'ui.actions.loadCounter',
  i18nKeyInterpolate: 'ui.actions.interpolate',
};

const DEFAULT_CONTEXT = JSON.stringify(EXAMPLE_CONTEXT, null, 2);
const DEFAULT_EXPRESSION = 'name | upper';

const PIPE_EXAMPLES: PipeExample[] = [
  { id: 1, title: 'if: clase cuando true', expression: `isActive | if : 'bg-green-500'`, category: 'ui' },
  { id: 2, title: 'if: vacio cuando false', expression: `isLoading | if : 'bg-green-500'`, category: 'ui' },
  { id: 3, title: 'show: visible', expression: 'isActive | show', category: 'ui' },
  { id: 4, title: 'show: oculto', expression: 'isLoading | show', category: 'ui' },
  { id: 5, title: 'hide: oculto cuando true', expression: 'isError | hide', category: 'ui' },
  { id: 6, title: 'hide: visible cuando false', expression: 'isLoading | hide', category: 'ui' },
  { id: 7, title: 'iif: estado activo', expression: `status | iif : 'Activo' : 'Inactivo'`, category: 'ui' },
  { id: 8, title: 'iif: estado apagado', expression: `statusOff | iif : 'Encendido' : 'Apagado'`, category: 'ui' },

  { id: 9, title: 'upper', expression: 'name | upper', category: 'text' },
  { id: 10, title: 'lower', expression: 'role | lower', category: 'text' },
  { id: 11, title: 'replace simple', expression: `phrase | replace : '-' : ' '`, category: 'text' },
  { id: 12, title: 'replace con colon', expression: `clock | replace : ':' : '-'`, category: 'text' },
  { id: 13, title: 'truncate default', expression: 'longText | truncate : 30', category: 'text' },
  { id: 14, title: 'truncate sufijo custom', expression: `longText | truncate : 45 : '... [ver mas]'`, category: 'text' },
  { id: 15, title: 'undefined fallback', expression: 'missing.path | undefined', category: 'text' },
  { id: 16, title: 'default por vacio', expression: `emptyText | default : 'Texto por defecto'`, category: 'text' },
  { id: 17, title: 'default por null', expression: `nullText | default : 'Sin contenido'`, category: 'text' },
  { id: 18, title: 'safeHTML', expression: 'htmlInput | safeHTML', category: 'text' },
  { id: 19, title: 'cadena upper + truncate', expression: `user.bio | upper | truncate : 36 : '...'`, category: 'text' },
  { id: 20, title: 'path interpolado', expression: 'language.{lang}', category: 'text' },

  { id: 21, title: 'toString numero', expression: 'amount | toString', category: 'numbers' },
  { id: 22, title: 'toNumber valido', expression: 'numericText | toNumber', category: 'numbers' },
  { id: 23, title: 'toNumber invalido', expression: 'badNumber | toNumber', category: 'numbers' },
  { id: 24, title: 'equal true', expression: `role | equal : 'ADMIN'`, category: 'numbers' },
  { id: 25, title: 'equal false', expression: `city | equal : 'Barcelona'`, category: 'numbers' },
  { id: 26, title: 'not true -> false', expression: 'isActive | not', category: 'numbers' },
  { id: 27, title: 'not vacio -> true', expression: 'emptyText | not', category: 'numbers' },

  { id: 28, title: 'join lista con coma', expression: `list | join : ', '`, category: 'data' },
  { id: 29, title: 'join numeros con barra', expression: `numbers | join : ' | '`, category: 'data' },
  { id: 30, title: 'includes string true', expression: `phrase | includes : 'mundo'`, category: 'data' },
  { id: 31, title: 'includes array true', expression: `list | includes : 'beta'`, category: 'data' },
  { id: 32, title: 'length string', expression: 'phrase | length', category: 'data' },
  { id: 33, title: 'length array', expression: 'list | length', category: 'data' },
  { id: 34, title: 'length object', expression: 'settings | length', category: 'data' },

  { id: 35, title: 'traduccion key dinamica', expression: 'i18nKeyLoadCounter | t', category: 'debug' },
  { id: 36, title: 'traduccion literal', expression: `i18nKeyInterpolate | t : @phrase : Literal 333`, category: 'debug' },
  { id: 37, title: 'debug (ver consola)', expression: 'user | debug', category: 'debug' },
  { id: 38, title: 'replace URL con colon quoted', expression: `apiUrl | replace : 'https://': 'http://'`, category: 'debug' },
];

export class PipeTesterComponent extends BaseComponent {

  init(ctx: ComponentInitValue): void {
    super.init(ctx);
    this.setState({
      contextText: DEFAULT_CONTEXT,
      expressionText: DEFAULT_EXPRESSION,
      result: '',
      raw: '',
      error: '',
      selectedExampleId: 1,
    });
  }

  mounted(): void {
    this.runTest();
  }

  private getContextTextarea(): HTMLTextAreaElement | null {
    return this.element?.querySelector('[data-ctx-input]') as HTMLTextAreaElement ?? null;
  }

  private getExpressionInput(): HTMLInputElement | null {
    return this.element?.querySelector('[data-expr-input]') as HTMLInputElement ?? null;
  }

  private setInputs(contextText: string, expressionText: string): void {
    const ctx = this.getContextTextarea();
    const expr = this.getExpressionInput();
    if (ctx) ctx.value = contextText;
    if (expr) expr.value = expressionText;
  }

  private formatResult(value: unknown): string {
    if (value === undefined) return '(undefined)';
    if (value === null) return '(null)';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  runTest(): void {
    const ctxRaw = this.getContextTextarea()?.value ?? '{}';
    const expr = this.getExpressionInput()?.value?.trim() ?? '';

    this.state.contextText = ctxRaw;
    this.state.expressionText = expr;

    let ctx: Record<string, unknown>;
    try {
      ctx = JSON.parse(ctxRaw);
    } catch {
      this.state.error = '❌ JSON inválido en el contexto';
      this.state.result = '';
      return;
    }

    try {
      const prop = expr.split('|')[0].trim();
      const raw = getValue(prop, ctx);
      const result = getValue(expr, ctx);
      this.state.result = this.formatResult(result);
      this.state.raw = `${prop}: ${this.formatResult(raw)}`;
      this.state.error = '';
    } catch (e) {
      this.state.error = `❌ Error al evaluar: ${String(e)}`;
      this.state.result = '';
    }
  }

  runExample(_el: HTMLElement, _e: Event, id: string | number): void {
    const numericId = Number(id);
    const example = PIPE_EXAMPLES.find(item => item.id === numericId);
    if (!example) return;
    this.state.selectedExampleId = example.id;
    this.state.contextText = DEFAULT_CONTEXT;
    this.state.expressionText = example.expression;
    this.setInputs(this.state.contextText, this.state.expressionText);
    this.runTest();
  }

  clearAll(): void {
    this.state.contextText = DEFAULT_CONTEXT;
    this.state.expressionText = DEFAULT_EXPRESSION;
    this.setInputs(this.state.contextText, this.state.expressionText);
    this.state.result = '';
    this.state.raw = '';
    this.state.error = '';
    this.state.selectedExampleId = 1;
    this.runTest();
  }

  render(changedProp?: string): HTMLElement {
    if (changedProp && this.element) {
      console.log('Propiedad cambiada:', changedProp);
      this.updateBindings();
      return this.element;
    }

    const template = `
      <div class="flex flex-col gap-3 w-full mx-auto">
        <div class="flex flex-col xl:flex-row gap-3 items-start">
          <div class="w-full xl:w-[62%] flex flex-col gap-4">

            <!-- Contexto JSON -->
            <div class="flex flex-col gap-2 flex-1 min-w-0">
              <div
                data-component="app-collapsible"
                data-title="Contexto (JSON)"
                data-expanded="true"
                class=""
              >
                <textarea
                  data-ctx-input
                  rows="10"
                  spellcheck="false"
                  on-input="runTest"
                  class="w-full rounded-lg border border-slate-300 dark:border-slate-600
                        bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100
                    font-mono p-3 min-h-65
                        focus:outline-none resize-none focus:ring-2 focus:ring-indigo-400"
                >{state.contextText}</textarea>                
              </div>
            </div>

            <!-- Expresión + resultado -->
            <div class="flex flex-col gap-3 flex-1 min-w-0 rounded-lg 
                bg-card
                border border-slate-200 dark:border-slate-700 p-3">
              <!-- Error -->
              <div
                class="rounded-lg border border-red-200 dark:border-red-800 px-3 py-2 text-sm
                      text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950"
                data-bind="show:state.error"
                style="display:none"
              >
                <span data-bind="text:state.error">{error}</span>
              </div>
              <div class="flex flex-col gap-2 ">
                <label class="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Expresión getValue()
                </label>
                <input
                  data-expr-input
                  type="text"
                  on-input="runTest"
                  spellcheck="false"
                  value="{state.expressionText}"
                  placeholder="ej: name | upper | t"
                  class="w-full rounded-lg border border-slate-300 dark:border-slate-600
                        bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100
                        font-mono text-sm px-3 py-2
                        focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <p class="text-xs text-slate-400 dark:text-slate-500">
                  Sintaxis: <code>propiedad | pipe : arg1 : 'arg con colons'</code>
                </p>
              </div>

              <div class="text-xs text-slate-500 dark:text-slate-400">
                Ejemplo activo: <span data-bind="text:state.selectedExampleId">1</span>
              </div>

              <!-- Resultado -->
              <div class="flex flex-col gap-1 mt-1">

                <label class="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Original (sin pipes)
                </label>
                <div
                  class="rounded-lg border border-slate-200 dark:border-slate-700
                        bg-slate-50 dark:bg-slate-900 px-3 py-2 font-mono text-sm
                        text-emerald-600 dark:text-emerald-400 break-all"
                  >
                  <span data-bind="text:state.raw"></span>
                </div>

                <label class="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Resultado
                </label>
                <div
                  class="rounded-lg border border-slate-200 dark:border-slate-700
                        bg-slate-50 dark:bg-slate-900 px-3 py-2 font-mono text-sm
                        text-emerald-600 dark:text-emerald-400 break-all"
                >
                  <span data-bind="text:state.result">{result}</span>
                </div>

                <!-- Acciones -->
                <div class="flex gap-2 justify-end mt-2">
                  <button on-click="clearAll" class="app-button">
                    <i data-icon="trash" class="size-5 inline-flex"></i> Limpiar
                  </button>
                  <button on-click="runTest" class="app-button">
                    <i data-icon="zap" class="size-5 inline-flex"></i> Ejecutar
                  </button>
                </div>

              </div>

            </div>
          </div>

          <div
            data-component="app-collapsible"
            data-title="Ejemplos de Pipes"
            data-expanded="true"
            class="w-full xl:w-[38%]"
          >
            <div class="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-3">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">Ejemplos de Pipes</h3>
                <span class="text-xs text-slate-500 dark:text-slate-400">${PIPE_EXAMPLES.length} casos</span>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Pulsa un caso para cargar contexto + expresión y ejecutar la prueba automáticamente.
              </p>
              <div class="max-h-130 overflow-auto pr-1 space-y-2" data-each="example in examples">
                <button
                  class="w-full text-left rounded-lg border border-slate-200 dark:border-slate-700
                        hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors p-2"
                  on-click="runExample:@example.id"
                >
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-xs font-semibold text-slate-700 dark:text-slate-200">#{example.id} {example.title}</span>
                    <span class="text-[10px] uppercase tracking-wide text-indigo-500">{example.category}</span>
                  </div>
                  <code class="block mt-1 text-[11px] text-slate-600 dark:text-slate-300 break-all">{example.expression}</code>
                </button>
              </div>
            </div>

          </div>

        </div>

        <!-- Referencia rápida de pipes -->
        <div
            data-component="app-collapsible"
            data-title="Referencia rápida de Pipes"
            data-expanded="false"
            class="w-full"
          >
          <div data-pipes-documentation class="p-2 grid grid-cols-1 lg:grid-cols-2 gap-2 text-xs font-mono text-slate-600 dark:text-slate-400">
            <div><code class="text-indigo-500">if</code> — CSS class si condición true: <code>active | if : 'bg-blue-500'</code></div>
            <div><code class="text-indigo-500">show</code> — display si true: <code>loading | show</code></div>
            <div><code class="text-indigo-500">hide</code> — display:none si true: <code>error | hide</code></div>
            <div><code class="text-indigo-500">iif</code> — ternario: <code>active | iif : 'Sí' : 'No'</code></div>
            <div><code class="text-indigo-500">toString</code> — convertir a texto: <code>amount | toString</code></div>
            <div><code class="text-indigo-500">toNumber</code> — convertir a número: <code>numericText | toNumber</code></div>
            <div><code class="text-indigo-500">equal</code> — comparar: <code>role | equal : 'ADMIN'</code></div>
            <div><code class="text-indigo-500">join</code> — unir arrays: <code>list | join : ', '</code></div>
            <div><code class="text-indigo-500">upper</code> — mayúsculas: <code>name | upper</code></div>
            <div><code class="text-indigo-500">lower</code> — minúsculas: <code>name | lower</code></div>
            <div><code class="text-indigo-500">undefined</code> — fallback: <code>desc | undefined</code></div>
            <div><code class="text-indigo-500">not</code> — negación booleana: <code>isActive | not</code></div>
            <div><code class="text-indigo-500">includes</code> — contiene valor: <code>list | includes : 'beta'</code></div>
            <div><code class="text-indigo-500">length</code> — longitud: <code>list | length</code></div>
            <div><code class="text-indigo-500">default</code> — fallback configurable: <code>value | default : 'N/A'</code></div>
            <div><code class="text-indigo-500">replace</code> — reemplazo: <code>clock | replace : ':' : '-'</code></div>
            <div><code class="text-indigo-500">truncate</code> — recortar texto: <code>bio | truncate : 30 : '...'</code></div>
            <div><code class="text-indigo-500">t</code> — traducción i18n: <code>'key' | t</code></div>
            <div><code class="text-indigo-500">debug</code> — log consola: <code>data | debug</code></div>
            <div><code class="text-indigo-500">safeHTML</code> — escapar HTML: <code>input | safeHTML</code></div>
            <div><code class="text-indigo-500">toJSON</code> — convertir a JSON: <code>input | toJSON</code></div>
          </div>
        </div>

      </div>
    `;

    return buildAndInterpolate(template, { ...this, examples: PIPE_EXAMPLES });
  }
}
