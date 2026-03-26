
import type {
  DetailRenderContext,
  GroupFooterRenderContext,
  GroupHeaderRenderContext,
  HeaderRenderContext,
  ReportDefinition,
  TotalRenderContext
} from "../core/report-engine/types";
import type { SecureEndPoint } from "../services/endpoint.service";

const PageHeader1 = (ctx: HeaderRenderContext<SecureEndPoint>) => {
  return `
      <div class="mb-6 border-b pb-4">
        <div class="bg-blue-950 text-white px-4 py-2 rounded-md mt-6 mb-3 flex gap-1">
          <i data-icon="info" class="inline-flex"></i>
          <p class="text-sm flex-1">
            Informe cargado desde un fichero ts (registered lazy load)
          </p>
          <p class="text-sm">
            sample-001.report.ts
          </p>
        </div>
        <h1 class="text-4xl font-bold text-gray-600">
            Listado de Endpoints Seguros (${ctx.id} ${ctx.dataSet.length} elementos)
        </h1>
        <p class="text-sm text-gray-500 mt-1">
          XXXXXXXx
        </p>
      </div>
  `;
};

const PageTotal1 = (ctx: TotalRenderContext<SecureEndPoint>) => {
  return `
    <div class="bg-gray-100 rounded-lg p-4 mb-6 shadow-sm border">
      <div class="flex justify-between items-center">
        <span class="text-lg font-semibold text-gray-700">
          Total de registros
        </span>
        <span class="text-2xl font-bold text-indigo-600">
          ${ctx.recordCount} ${ctx.id} 
        </span>
      </div>
    </div>
  `;
};

const PageDetail1 = (ctx: DetailRenderContext<SecureEndPoint>) => {
  return `
    <div key=${ctx.id} 
        class="bg-white border rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition">  
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-lg font-semibold text-gray-800">
            ${ctx.data?.name}
          </h2>
          <p class="text-sm text-gray-500 break-all">
            ${ctx.data?.url}
          </p>
        </div>
        <div class="text-right">
          <span class="text-xs px-2 py-1 rounded-full 
                      ${ctx.data?.favorite
    ? 'bg-yellow-100 text-yellow-700'
    : 'bg-gray-200 text-gray-600'}">
            ${ctx.data?.favorite ? '★ Favorito' : 'Normal'}
          </span>
        </div>
      </div>
      <div class="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-600">
        <div><span class="font-medium">ID:</span> ${ctx.data?.id}</div>
        <div><span class="font-medium">Entorno:</span> ${ctx.data?.env}</div>
        <div><span class="font-medium">Login:</span> ${ctx.data?.login}</div>
        <div><span class="font-medium">Password:</span> ••••••••</div>
      </div>
    </div>
  `;
};

const PageG1 = (ctx: GroupHeaderRenderContext<SecureEndPoint>) => {
  return `
      <div key=${ctx.id} 
          class="bg-green-700 text-white px-4 py-2 rounded-md mt-6 mb-3 shadow">
        <h3 class="text-lg font-semibold">
          ${ctx.key}: ${ctx.current}
        </h3>
      </div>
    `;
};

  const PageFooterG1 = (ctx: GroupFooterRenderContext<SecureEndPoint>) => {
    return `
        <div key=${ctx.id} 
            class="bg-indigo-50 border border-indigo-200 text-indigo-700 
                    px-4 py-2 rounded-md mb-6">
          <span class="font-medium">
            Total en ${ctx.key}:
          </span>
          ${ctx.data.recordCount} registros
        </div>
      `;
  };

  export const reportDefinition: ReportDefinition<SecureEndPoint> = {
    sections: [
      { id: "H1", type: "header", valueProvider: PageHeader1 },
      { id: "G1", type: 'group', key: "env", valueProvider: PageG1, footerValueProvider: PageFooterG1 },
      { id: "D1", type: 'detail', valueProvider: PageDetail1 },
      { id: "T1", type: "total", valueProvider: PageTotal1 },
    ],
    summary: {},
    orderBy: "env,name desc"
  };
