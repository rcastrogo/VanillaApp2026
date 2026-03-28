import type { ComponentContext } from '@/components/component.model';
import { buildAndInterpolate } from '@/core/dom';
import ReportEngine from '@/core/report-engine/engine';
import { DefaultMediator, type DefaultMediatorValue } from '@/core/report-engine/mediator';
import { BaseComponent } from '@/core/types';
import { getAllAsync, type SecureEndPoint } from '@/services/endpoint.service';
import { reportDefinition as poc1ReportDef } from '../reports/poc1-demo.report';

export class DomReportsDemoComponent extends BaseComponent {

  private mediator = new DefaultMediator((value: DefaultMediatorValue) => {
    if (!this.element) return;
    const slot = this.element.querySelector('#poc1-report-slot');
    if (slot) {
      slot.innerHTML = value.html;
    }
  });

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  init() {
    this.setState({
      status: 'idle',
      recordCount: 0,
    });
  }

  async loadReport() {
    this.state.status = 'loading';
    const result = await getAllAsync();
    if (typeof result === 'string') {
      this.state.status = 'error';
      return;
    }
    const data = result.data as SecureEndPoint[];
    const engine = new ReportEngine<SecureEndPoint>();
    this.mediator.clear();
    engine.generateReport(poc1ReportDef, data, this.mediator);
    this.state.status = 'done';
    this.state.recordCount = data.length;
  }

  render() {
    const template = `
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
        <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <i data-icon="bar-chart" class="size-5 text-orange-500"></i>
          DomReportsDemoComponent
        </h2>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Demuestra el motor de informes
          <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">ReportEngine</code>
          con mediador y secciones header / group / detail / total.
        </p>

        <div class="flex items-center gap-4">
          <button on-click="loadReport"
            class="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors">
            <i data-icon="play" class="inline size-4 mr-1"></i> Generar informe
          </button>
          <span class="text-sm text-slate-500 dark:text-slate-400">
            {state.status}
            {state.recordCount > 0 ? ' — ' + state.recordCount + ' registros' : ''}
          </span>
        </div>

        <div id="poc1-report-slot"
          class="mt-2 max-h-96 overflow-y-auto border border-slate-200 dark:border-slate-600 rounded-lg p-4 text-sm bg-slate-50 dark:bg-slate-700">
          <p class="text-slate-400 dark:text-slate-500 text-xs italic">
            Pulsa "Generar informe" para ver los resultados aquí.
          </p>
        </div>
      </div>
    `;
    return buildAndInterpolate(template, this);
  }
}
