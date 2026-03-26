
import type {
  ComponentInstruction,
  DetailRenderContext,
  GroupFooterRenderContext,
  GroupHeaderRenderContext,
  HeaderRenderContext,
  ReportDefinition,
  TotalRenderContext
} from "../core/report-engine/types";

import type { ComponentInitValue } from "@/components/component.model";
import { buildAndInterpolate } from "@/core/dom";
import { BaseComponent, type Identifiable } from "@/core/types";

export interface DatoJamon extends Identifiable {
  temporada: string;
  proveedor: string;
  tipo: string;
  denominacion: string;
  unidades: number;
  kgs: number;
  importe: number;
}

const PageDetailComponent = (ctx: unknown) => {
  const target = new SectionComponent();
  target.init?.({ data: ctx });
  return {
    kind: "component" as const,
    component: target,
    context: ctx
  } as ComponentInstruction<DatoJamon>
}

type JamonRenderContext =
  | HeaderRenderContext<DatoJamon>
  | DetailRenderContext<DatoJamon>
  | GroupHeaderRenderContext<DatoJamon>
  | GroupFooterRenderContext<DatoJamon>
  | TotalRenderContext<DatoJamon>;

class SectionComponent extends BaseComponent {

 private actx!: JamonRenderContext;

  init(ctx: ComponentInitValue) {
    console.log(ctx);
    this.ctx = ctx;
    this.actx = ctx.data as JamonRenderContext;
  }

  render() {
    const ctx = this.actx;

    let html = '';

    if (ctx.kind === 'HeaderRenderContext') {
      html = this.renderHeader(ctx);
    } else if (ctx.kind === 'DetailRenderContext') {
      html = this.renderDetail(ctx);

    } else if (ctx.kind === 'GroupHeaderRenderContext') {
      html = this.renderGroupHeader(ctx);

    } else if (ctx.kind === 'GroupFooterRenderContext') {
      html = this.renderGroupFooter(ctx);

    } else if (ctx.kind === 'TotalRenderContext') {
      html = this.renderTotal(ctx);

    } else {
      html = `<div class="text-red-500">Unknown context: </div>`;
    }

    return buildAndInterpolate(html, ctx);
  }

  // ----------------------------
  // HEADER
  // ----------------------------
  private renderHeader(_: HeaderRenderContext<DatoJamon>) {
    return `
      <div class="grid grid-cols-7 bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-t-lg">
        <div><i data-icon="info" class="inline-flex"></i> Temporada</div>
        <div>Proveedor</div>
        <div>Tipo</div>
        <div>Denominación</div>
        <div class="text-right">Unidades</div>
        <div class="text-right">Kgs</div>
        <div class="text-right">Importe</div>
      </div>
    `;
  }

  // ----------------------------
  // DETAIL ROW
  // ----------------------------
  private renderDetail(ctx: DetailRenderContext<DatoJamon>) {
    const d = ctx.data!;

    return `
      <div class="grid grid-cols-7 px-4 py-2 text-sm border-b ${
        ctx.isLastRow ? "border-gray-300" : "border-gray-100"
      } hover:bg-gray-50 transition-colors">
        
        <div>${d.temporada}</div>
        <div>${d.proveedor}</div>
        <div>${d.tipo}</div>
        <div>${d.denominacion}</div>

        <div class="text-right tabular-nums">${d.unidades}</div>
        <div class="text-right tabular-nums">${d.kgs}</div>
        <div class="text-right tabular-nums font-medium">
          ${d.importe.toFixed(2)} €
        </div>
      </div>
    `;
  }

  // ----------------------------
  // GROUP HEADER
  // ----------------------------
  private renderGroupHeader(ctx: GroupHeaderRenderContext<DatoJamon>) {
    return `
      <div class="bg-blue-50 text-blue-800 px-4 py-2 mt-4 rounded-md font-semibold text-sm border border-blue-100">
        ${ctx.name}: <span class="font-bold">${ctx.current}</span>
      </div>
    `;
  }

  // ----------------------------
  // GROUP FOOTER (SUBTOTAL)
  // ----------------------------
  private renderGroupFooter(ctx: GroupFooterRenderContext<DatoJamon>) {
    console.log(ctx);
    const totalImporte = ctx.data?.summary.importe.sum ?? 0;
    const totalKgs = ctx.data?.summary.kgs.sum ?? 0;

    return `
      <div class="grid grid-cols-7 px-4 py-2 bg-gray-50 text-sm font-medium border-t border-gray-200">
        <div data-component="app-counter" data-value="${totalKgs.toFixed(0)}" class="col-span-3"></div>
        <div class="col-span-2 text-right pr-2">Subtotal</div>
        <div class="text-right tabular-nums">${totalKgs}</div>
        <div class="text-right tabular-nums text-blue-700">
          ${totalImporte.toFixed(2)} €
        </div>
      </div>
    `;
  }

  // ----------------------------
  // TOTAL GENERAL
  // ----------------------------
  private renderTotal(ctx: TotalRenderContext<DatoJamon>) {
    const total = ctx.grandTotal as Partial<DatoJamon> | undefined;

    return `
      <div class="grid grid-cols-7 px-4 py-3 bg-gray-900 text-white font-semibold rounded-b-lg mt-2 shadow">
        <div class="col-span-4">TOTAL GENERAL</div>
        <div class="text-right tabular-nums">
          ${total?.unidades ?? 0}
        </div>
        <div class="text-right tabular-nums">
          ${total}
        </div>
        <div class="text-right tabular-nums text-green-400">
          ${total} €
        </div>
      </div>
    `;
  }

}

const PageHeader0 = () => {
  return `
    <div class="bg-blue-950 text-white px-4 py-2 rounded-md mt-6 mb-3 flex gap-1">
      <i data-icon="info" class="inline-flex"></i>
      <p class="text-sm flex-1">
        Informe con componentes
      </p>
      <p class="text-sm">
        sample-002.report.ts
      </p>
    </div>
  `
}

export const reportDefinition002: ReportDefinition<DatoJamon> = {
  sections: [
    { id: "H0", type: "header", valueProvider: PageHeader0 },
    { id: "H1", type: "header", valueProvider: PageDetailComponent },
    {
      id: "G1",
      type: 'group',
      key: "temporada",
      valueProvider: PageDetailComponent,
      footerValueProvider: PageDetailComponent
    },
    {
      id: "G2",
      type: 'group',
      key: "proveedor",
      valueProvider: PageDetailComponent,
      footerValueProvider: PageDetailComponent
    },
    { id: "D1", type: 'detail', valueProvider: PageDetailComponent },
    { id: "T1", type: "total", valueProvider: PageDetailComponent },
  ],
  summary: {
    unidades: ['sum', 'max', 'min', 'median', 'avg', 'values', 'distinct'],
    kgs: ['sum', 'max', 'min', 'median', 'avg'],
    importe: ['sum', 'max', 'min', 'median', 'avg']
  },
  orderBy: "temporada,proveedor,tipo,denominacion,unidades",
};
