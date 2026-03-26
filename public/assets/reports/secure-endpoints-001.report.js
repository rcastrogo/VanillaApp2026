const PageHeader1 = (ctx) => {
  return `
    <div class="mb-6 border-b pb-4">

      <div class="bg-blue-950 text-white px-4 py-2 rounded-md mt-6 mb-3 flex gap-1">
        <i data-icon="info" class="inline-flex"></i>
        <p class="text-sm flex-1">
          Informe cargado desde un fichero js extermo.
        </p>
        <p class="text-sm">
          secure-endpoints-001.report.js
        </p>
      </div>

      <h1 class="text-4xl font-bold text-gray-600">
        Listado de Endpoints Seguros (${ctx.id} ${ctx.dataSet.length} elementos)
      </h1>
      <p class="text-sm text-gray-500 mt-1">
        Reporte general cargado dinámicamente!!!
      </p>
      <p class="js-message-001">
      </p>
    </div>
  `;
};

const PageTotal1 = (ctx) => {
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

const PageDetail1 = (ctx) => {
  return `
    <div 
      key=${ctx.id} 
      class="bg-white border rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition"
      >  
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
                      ${ctx.data?.favorite ? 'bg-yellow-100 text-yellow-700'
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

const PageG1 = (ctx) => {
  return `
    <div id="${ctx.id}_${ctx.current}"
        class="bg-red-800 text-white px-4 py-2 rounded-md mt-6 mb-3 shadow">
      <h3 class="text-lg font-semibold">
        Entorno: ${ctx.current}
      </h3>
    </div>
  `;
};

const PageFooterG1 = (ctx) => {
  return `
    <div key=${ctx.id} 
        class="bg-indigo-50 border border-indigo-200 text-indigo-700 
                px-4 py-2 rounded-md mb-6">
      <span class="font-medium">
        Total entorno ${ctx.current}:
      </span>
      ${ctx.data.recordCount} registros
    </div>
  `;
};

const reportDefinition = {
  sections: [
    { id: "H1", type: "header", valueProvider: PageHeader1 },
    {
      id: "G1",
      type: 'group',
      key: "env",
      valueProvider: PageG1,
      footerValueProvider: PageFooterG1
    },
    { id: "D1", type: 'detail', valueProvider: PageDetail1 },
    { id: "D2", type: 'detail', valueProvider: () => '<div class="bg-gray-500 mx-20 h-2 mb-2"></div>' }, 
    { id: "T1", type: "total", valueProvider: PageTotal1 },
  ],
  summary: '{ }',
  orderBy: "env,name",
  // parseData?: ((rd: ReportDefinition<T>, data: T[]) => T[]) | undefined;
  // onInitSummaryObject?: ((summary: any) => any) | undefined;
  iteratefn: row => void 0,
  onStartfn: ctx => void 0,
  // onRowfn?: ((BS: any) => void) | undefined;
  // onGroupChangefn?: ((BS: any) => void) | undefined;
  mounted: (refs) => {
    // refs?.dialog.showError('Mounted');
    // refs?.notifications?.info('Mounted secure-endpoints-001.report.js');
    // document.querySelector('.js-message-001').textContent = 'mounted';
  },
};