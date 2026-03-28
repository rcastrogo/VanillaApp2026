import type {
  DetailRenderContext,
  GroupFooterRenderContext,
  GroupHeaderRenderContext,
  HeaderRenderContext,
  ReportDefinition,
  TotalRenderContext,
} from '@/core/report-engine/types';
import type { SecureEndPoint } from '@/services/endpoint.service';

const Header = (ctx: HeaderRenderContext<SecureEndPoint>) => `
  <div class="mb-4 border-b pb-3">
    <h1 class="text-2xl font-bold text-slate-700 dark:text-slate-200">
      POC-1 · Informe de Endpoints (${ctx.dataSet.length} registros)
    </h1>
    <p class="text-xs text-slate-400 mt-1">Generado por ReportEngine — poc1-demo.report.ts</p>
  </div>
`;

const GroupHeader = (ctx: GroupHeaderRenderContext<SecureEndPoint>) => `
  <div class="bg-violet-700 text-white px-3 py-1 rounded mt-4 mb-2 text-sm font-bold">
    ${ctx.key}: ${ctx.current}
  </div>
`;

const GroupFooter = (ctx: GroupFooterRenderContext<SecureEndPoint>) => `
  <div class="text-right text-xs text-violet-600 dark:text-violet-400 italic mb-2">
    Subtotal ${ctx.key} "${ctx.current}": ${ctx.data.recordCount} registros
  </div>
`;

const Detail = (ctx: DetailRenderContext<SecureEndPoint>) => `
  <div class="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-700 text-sm">
    <span class="font-medium text-slate-800 dark:text-slate-100 w-40 truncate">${ctx.data?.name}</span>
    <span class="text-xs text-slate-400 flex-1 mx-2 truncate">${ctx.data?.url}</span>
    <span class="text-xs px-2 py-0.5 rounded-full
      ${ctx.data?.favorite ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'}">
      ${ctx.data?.favorite ? '★' : '○'}
    </span>
  </div>
`;

const Total = (ctx: TotalRenderContext<SecureEndPoint>) => `
  <div class="mt-4 pt-3 border-t border-slate-200 dark:border-slate-600 text-right text-sm font-semibold text-slate-700 dark:text-slate-200">
    Total general: ${ctx.recordCount} endpoints
  </div>
`;

export const reportDefinition: ReportDefinition<SecureEndPoint> = {
  sections: [
    { id: 'H1', type: 'header', valueProvider: Header },
    { id: 'G1', type: 'group', key: 'env', valueProvider: GroupHeader, footerValueProvider: GroupFooter },
    { id: 'D1', type: 'detail', valueProvider: Detail },
    { id: 'T1', type: 'total', valueProvider: Total },
  ],
  summary: {},
  orderBy: 'env,name',
};
