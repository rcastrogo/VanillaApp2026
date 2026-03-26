
const formatNumber = (value, decimals = 0) => {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value ?? 0);
};

const formatCurrency = value => {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(value ?? 0);
};

/**
 * Returns meaningful initials ignoring common connector words.
 */
const formatProveedor = (name) => {
  if (!name || typeof name !== "string") return "";
  const ignored = ["de", "del", "la", "las", "los", "y", "the", "and"];
  return name
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word && !ignored.includes(word))
    .map(word => word[0])
    .join("")
    .toUpperCase();
};

const renderReportHeader = (ctx) => {
  return `
    <div class="mb-12 text-center">

      <div class="text-left bg-blue-950 text-white px-4 py-2 rounded-md mt-6 mb-3 flex gap-1">
        <i data-icon="info" class="inline-flex"></i>
        <p class="text-sm flex-1">
           Informe cargado desde un fichero js.
        </p>
        <p class="text-sm">
          jamones-001.report.js
        </p>
      </div>

      <h1 class="text-5xl font-extrabold tracking-tight
                 text-gray-800 dark:text-gray-100">
        🐖 Listado de Jamones
      </h1>
      <div class="js-message mt-3 text-sm text-gray-500 dark:text-gray-400">
        Informe agrupado por proveedor, tipo y temporada
      </div>
      <div class="w-24 h-1 mx-auto mt-4 rounded-full
                  bg-gray-300 dark:bg-gray-700"></div>
      <div class="flex gap-2 w-full items-center justify-center mt-2">
        <button class="js-button app-button">Debug</button>
        <button class="app-button px-3 py-2" on-click="showNextReport">
          <i data-icon="settings" class="inline-block size-5"></i> 
        </button>        
        <div data-component="app-theme-toggle"></div>
        <div data-component="app-language-selector"></div>
      </div>   
    </div>
    ${ctx.isGroupedReport ? '' : rowsHeader}
  `;
};

const rowsHeader = `
  <div class="grid grid-cols-8 mt-3 px-4 py-3 text-xs font-bold
              uppercase tracking-wide
              bg-gray-500 dark:bg-gray-700
              text-white dark:text-gray-200">
    <div class="text-left col-span-3">Descripción</div>
    <div class="text-center">Proveedor</div>
    <div class="text-center">Año</div>
    <div class="text-right">Unidades</div>
    <div class="text-right">Kgs</div>
    <div class="text-right">Importe</div>
  </div>
`;

const renderGroup = (ctx) => {
  const index = ~~ctx.name.replace('G', '')
  const fontSize = 4 - index;
  return `
    <div class="py-1 text-${fontSize}xl
                font-bold text-gray-800 dark:text-gray-200 border-b-2">
      ${ctx.current}
    </div>
    ${ctx.isLastGroup ? rowsHeader : ''}
  `;
};

const renderDetailRow = (ctx) => {
  return `
    <div class="grid grid-cols-8 px-4 py-2
                border-b border-gray-200 dark:border-gray-700
                hover:bg-gray-50 dark:hover:bg-gray-800
                transition-colors duration-150">

      <div class="col-span-3 text-gray-800 dark:text-gray-200">
         ${ctx.groupRecordCount || ''} ${ctx.recordCount} ${ctx.data.descripcion}
      </div>
      <div class="text-center text-gray-700 dark:text-gray-300">
        <span class="font-medium">${formatProveedor(ctx.data.proveedor)}</span>
        <span class="text-xs">(${ctx.data.tipo})</span>
      </div>
      <div class="text-center text-gray-700 dark:text-gray-300">
        ${ctx.data.temporada}
      </div>
      <div class="text-right font-mono text-gray-700 dark:text-gray-300">
        ${formatNumber(ctx.data.unidades)}
      </div>

      <div class="text-right font-mono text-gray-700 dark:text-gray-300">
        ${formatNumber(ctx.data.kgs, 2)}
      </div>

      <div class="text-right font-mono font-semibold
                  text-gray-900 dark:text-gray-100">
        ${formatCurrency(ctx.data.importe)}
      </div>
    </div>
  `;
};


const renderFooterGroupAny = ctx => {

  const index = ~~ctx.name.replace('G', '')
  const margins = [10, 0, 0];
  return `
    <div class="grid grid-cols-8 mt-2 mb-${margins[index - 1]} px-4 font-semibold">
      <div class="">
        <span class="inline-flex size-5 bg-red-600 text-white text-xs rounded-full items-center justify-center">
          ${ctx.data.recordCount}
        </span>
      </div>

      <div class="col-span-4 text-right">
        Total ${ctx.current}
      </div>

      <div class="text-right font-mono">
        ${formatNumber(ctx.data.summary.unidades.sum)}
      </div>

      <div class="text-right font-mono">
        ${formatNumber(ctx.data.summary.kgs.sum, 2)}
      </div>

      <div class="text-right font-mono">
        ${formatCurrency(ctx.data.summary.importe.sum)}
      </div>
    </div>

    <!-- DEBUG PANEL -->
    <details class="mx-4 mt-2 mb-4
                     bg-black/5 dark:bg-white/5 
                     backdrop-blur p-4
                     js-details hidden">

      <summary class="cursor-pointer font-semibold 
                      text-gray-700 dark:text-gray-300">
        Debug resumen (${ctx.key})
      </summary>

      <div class="mt-3 grid gap-3 text-xs font-mono">

        <div>
          <pre class="overflow-auto">${JSON.stringify(ctx.data.summary, null, 2)}</pre>
        </div>

      </div>
    </details>
  `;
};

const renderGrandTotal = ctx => {
  return `
    <div class="mt-12 p-8 rounded-3xl
                bg-linear-to-r
                from-gray-800 to-gray-700
                dark:from-gray-900 dark:to-gray-800
                text-white shadow-2xl">

      <div class="text-3xl font-bold mb-6">
        Total General
      </div>

      <div class="grid grid-cols-3 gap-8 text-center">

        <div>
          <div class="text-sm opacity-60">Unidades</div>
          <div class="text-3xl font-mono font-bold">
            ${formatNumber(ctx.grandTotal?.unidades.sum)}
          </div>
        </div>

        <div>
          <div class="text-sm opacity-60">Kgs</div>
          <div class="text-3xl font-mono font-bold">
            ${formatNumber(ctx.grandTotal?.kgs.sum, 2)}
          </div>
        </div>

        <div>
          <div class="text-sm opacity-60">Importe</div>
          <div class="text-3xl font-mono font-bold">
            ${formatCurrency(ctx.grandTotal?.importe.sum)}
          </div>
        </div>

      </div>

      <div>
        ${renderBars(ctx)}
      </div>   

      <div class="mt-6 text-xs opacity-50">
        ${ctx.recordCount} registros procesados
      </div>



    </div>

    <details class="mx-4 mt-2 mb-4
                  bg-black/5 dark:bg-white/5 
                  backdrop-blur p-4  
                  js-details hidden">
      <summary class="cursor-pointer font-semibold
                    text-gray-700 dark:text-gray-300">
        Debug resumen grandTotal
      </summary>

      <div class="mt-3 grid gap-3 font-mono text-xs">

        <div>
          <pre class="overflow-auto">${JSON.stringify(ctx.grandTotal, null, 2)}</pre>
        </div>

      </div>
    </details>
  `;
};

const colors = [
  "bg-blue-500 dark:bg-blue-800",
  "bg-green-500 dark:bg-green-800",
  "bg-purple-500 dark:bg-purple-800",
  "bg-orange-500 dark:bg-orange-800",
];

const renderBars = ctx => {
  if(!ctx.G1) return '';
  const total = ctx.grandTotal?.importe.sum || 1;
  const bars = Object
    .values(ctx.G1)
    .sort( (a, b) => b.summary?.importe?.sum - a.summary?.importe?.sum)
    .map((item, index) => {
    const value = item.summary?.importe?.sum;
    const percent = (value / total) * 100;
    return `
      <div class="flex flex-col items-center flex-1">           
        <div class="h-40 w-full flex items-end border">              
          <div 
            class="w-full ${colors[index % colors.length]} transition-[height] duration-700 ease-out rounded-t-md"
            style="height:${percent}%"
          >        
          </div>
        </div>
        <span class="text-xs mt-2 text-gray-600 dark:text-gray-300 truncate text-center w-full">
          ${item.key}
        </span>
        <span class="text-xs mt-2 text-gray-600 dark:text-gray-300 truncate text-center w-full">
          ${formatCurrency(item.summary?.importe?.sum)}
        </span>
      </div>
    `;
  })
  .join('');
  return `
    <div class="mt-8">
      <div class="flex items-end gap-4 w-full">
        ${bars}
      </div>
    </div>
  `;
};

const reportDefinition = {
  sections: [
    { id: "H1", type: "header", valueProvider: renderReportHeader },
    { id: "D1", type: "detail", valueProvider: renderDetailRow },
    { id: "G1", type: "group", key: "proveedor", valueProvider: renderGroup, footerValueProvider: renderFooterGroupAny },
    { id: "G2", type: "group", key: "tipo", valueProvider: renderGroup, footerValueProvider: renderFooterGroupAny },
    { id: "G3", type: "group", key: "temporada", valueProvider: renderGroup, footerValueProvider: renderFooterGroupAny },
    { id: "GT", type: "total", valueProvider: renderGrandTotal },
  ],
  summary: {
    unidades: ['sum', 'max', 'min', 'median', 'avg', 'values', 'distinct'],
    kgs: ['sum', 'max', 'min', 'median', 'avg'],
    importe: ['sum', 'max', 'min', 'median', 'avg']
  },
  orderBy: "proveedor,tipo,temporada,denominacion,unidades",
  mounted: (refs) => {
    document.querySelector('button.js-button').onclick = () => {
      Array.from(document.querySelectorAll('details.js-details'))
        .forEach(element => {
          element.classList.remove('hidden');
        });;
    }
    const defaultMessage = 'Informe agrupado por proveedor, tipo y temporada';
    document
      .querySelector('.js-message')
      .textContent = refs?.message ?? defaultMessage;
  },
  parseData: (rd, data) => data,
};