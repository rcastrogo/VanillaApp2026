const PageHeader1 = (ctx) => {
  return `
    <div class="mb-6 border-b pb-4">

      <div class="bg-blue-950 text-white px-4 py-2 rounded-md mt-6 mb-3 flex gap-1">
        <i data-icon="info" class="inline-flex"></i>
        <p class="text-sm flex-1">
           Informe cargado desde un fichero js.
        </p>
        <p class="text-sm">
          secure-endpoints-002.report.js
        </p>
      </div>

      <h1 class="text-4xl font-bold text-gray-600">
        Report 002 (${ctx.id} ${ctx.dataSet.length} elementos)
      </h1>
      <p class="js-message-002 not-[]:text-sm text-gray-500 mt-1">
        Reporte general cargado dinámicamente!!!
      </p>
    </div>
  `;
};

const PageDetail1 = (ctx) => {
  return `
    <div 
      key="${ctx.id}"
      class="bg-white border rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition">
        <div>
          <h2 class="text-lg font-semibold text-gray-800">
            ${ctx.data?.name}
          </h2>
          <p class="text-sm text-gray-500 break-all">
            ${ctx.data?.url}
          </p>
        </div>
    </div>
  `;
};

const reportDefinition = {
  sections: [
    { id: "H1", type: "header", valueProvider: PageHeader1 },
    { id: "D1", type: 'detail', valueProvider: PageDetail1 },
    { id: "D2", type: 'detail', valueProvider: (ctx) => ctx.isLastRow ? '' : '<div class="bg-gray-500 mx-20 h-2 mb-2"></div>' },
  ],
  summary: '{ }',
  orderBy: "name,env",
  mounted: (refs) => {
    // refs?.dialog.showError('Mounted');
    refs?.notifications.info('Mounted secure-endpoints-002.report.js');
    document.querySelector('.js-message-002').textContent = 'mounted';
  },
};