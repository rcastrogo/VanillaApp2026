import type { ComponentContext } from '@/components/component.model';
import { pubSub } from '@/core/services/pubsub.service';
import { buildAndInterpolateDSL } from '@/core/template-compiler';
import { BaseComponent } from '@/core/types';

const POC1_TOPIC = 'POC1_DEMO_MSG';

export class PubSubDemoComponent extends BaseComponent {

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  init() {
    this.setState({
      log: [] as string[],
    });

    this.subscribe(POC1_TOPIC, (payload: { text: string }) => {
      const entry = `[${new Date().toLocaleTimeString()}] ${payload?.text ?? JSON.stringify(payload)}`;
      this.state.log = [entry, ...this.state.log].slice(0, 6);
    });
  }

  message = '';
  handleInput(el: HTMLInputElement) {
    this.message = el.value;
  }

  sendGlobal() {
    const text = this.message || '(mensaje vacío)';
    pubSub.publish(POC1_TOPIC, { text: `Global → ${text}` });
    this.message = '';
    this.invalidate();
  }

  sendLocal() {
    const text = this.message || '(mensaje vacío)';
    this.publish(POC1_TOPIC, { text: `Local → ${text}` });
    this.message = '';
    this.invalidate();
  }

  clearLog() {
    this.state.log = [];
  }

  render() {
    const template = `
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
        <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <i data-icon="radio" class="size-5 text-pink-500"></i>
          PubSubDemoComponent
        </h2>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Comunicación entre componentes vía
          <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">pubSub.publish</code> /
          <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">subscribe</code>.
          El scope <em>local</em> limita la suscripción a esta instancia.
        </p>

        <div class="flex gap-2">
          <input
            type="text"
            value="{message}"
            on-change="handleInput"
            placeholder="Escribe un mensaje..."
            class="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm
                   bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200
                   focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
          <button on-click="sendGlobal"
            class="px-3 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold rounded-lg transition-colors">
            Global
          </button>
          <button on-click="sendLocal"
            class="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors">
            Local
          </button>
        </div>

        <div class="space-y-1 min-h-[6rem]">
          <div class="flex justify-between items-center">
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Log</p>
            <button on-click="clearLog"
              class="text-xs text-slate-400 hover:text-red-500 transition-colors">
              Limpiar
            </button>
          </div>
          <div class="space-y-1 font-mono text-xs text-slate-600 dark:text-slate-300">
            @each(entry in state.log)
              <div class="truncate py-0.5 border-b border-slate-100 dark:border-slate-700">{entry}</div>
            @endeach
            @if(state.log.length === 0)
              <p class="text-slate-400 dark:text-slate-500 italic">Sin mensajes aún...</p>
            @endif
          </div>
        </div>
      </div>
    `;
    return buildAndInterpolateDSL(template, this) as HTMLElement;
  }
}
