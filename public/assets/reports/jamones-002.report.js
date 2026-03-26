/**
 * Escapes HTML special characters to prevent XSS.
 */
const escapeHtml = (value) => {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

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
    .map(word => escapeHtml(word[0]))
    .join("")
    .toUpperCase();
};

const renderReportHeader = (ctx) => {
  return `
    <table class="w-full border-collapse">
      <tbody>
        <tr>
          <td class="mb-12 text-5xl text-center font-extrabold tracking-tight
                      text-gray-800 dark:text-gray-100" colspan="6">

            <div class="text-left text-sm tracking-normal font-normal bg-blue-950 text-white px-4 py-2 rounded-md mt-6 mb-3 flex gap-1">
              <i data-icon="info" class="inline-flex"></i>
              <p class="text-sm flex-1">
                Informe (tipo tabla) cargado desde un fichero js.
              </p>
              <p class="text-sm">
                jamones-002.report.js
              </p>
            </div>

            🐖 Listado de Jamones
            <div class="js-message mt-3 text-sm text-gray-500 dark:text-gray-400">
              Informe agrupado por proveedor, tipo y temporada
            </div>
            <div class="w-24 h-1 mx-auto mt-4 rounded-full
                        bg-gray-300 dark:bg-gray-700"></div>
            <button class="js-button app-button mt-4">Debug</button>
          </td>
        </tr>
  `;
};

const rowsHeader = `
    <tr class="
        text-xs font-bold uppercase tracking-wide
        bg-gray-500 dark:bg-gray-700
        text-white dark:text-gray-200">
      <th class="text-left px-4 py-3">Descripción</th>
      <th class="text-center px-4 py-3">Proveedor</th>
      <th class="text-center px-4 py-3">Año</th>
      <th class="text-right px-4 py-3">Unidades</th>
      <th class="text-right px-4 py-3">Kgs</th>
      <th class="text-right px-4 py-3">Importe</th>
    </tr>
`;

const renderGroup = (ctx) => {
  const index = ~~ctx.name.replace('G', '');
  const fontSize = 4 - index;
  return `
    <tr>
      <td colspan="6"
          class="py-2 text-${fontSize}xl
                 font-bold text-gray-800 dark:text-gray-200
                 border-b-2">
        ${escapeHtml(ctx.current)}
      </td>
    </tr>
    ${ctx.isLastGroup ? rowsHeader : ''}
  `;
};

const renderDetailRow = (ctx) => {
  return `
    <tr class="
      border-b border-gray-200 dark:border-gray-700
      hover:bg-gray-50 dark:hover:bg-gray-800
      transition-colors duration-150">

      <td class="px-4 py-2 text-gray-800 dark:text-gray-200">
        ${ctx.groupRecordCount || ''} ${ctx.recordCount} ${escapeHtml(ctx.data.descripcion)}
      </td>

      <td class="px-4 py-2 text-center text-gray-700 dark:text-gray-300">
        <span class="font-medium">${formatProveedor(ctx.data.proveedor)}</span>
        <span class="text-xs">(${escapeHtml(ctx.data.tipo)})</span>
      </td>

      <td class="px-4 py-2 text-center text-gray-700 dark:text-gray-300">
        ${ctx.data.temporada}
      </td>

      <td class="px-4 py-2 text-right font-mono text-gray-700 dark:text-gray-300">
        ${formatNumber(ctx.data.unidades)}
      </td>

      <td class="px-4 py-2 text-right font-mono text-gray-700 dark:text-gray-300">
        ${formatNumber(ctx.data.kgs, 2)}
      </td>

      <td class="px-4 py-2 text-right font-mono font-semibold
                 text-gray-900 dark:text-gray-100">
        ${formatCurrency(ctx.data.importe)}
      </td>
    </tr>
  `;
};

const renderFooterGroupAny = ctx => {
  return `
    <tr class="font-semibold bg-gray-100 dark:bg-gray-800">
      <td class="px-4 py-2">
        <span class="inline-flex size-5 bg-red-600 text-white text-xs rounded-full items-center justify-center">
          ${ctx.data.recordCount}
        </span>
      </td>

      <td colspan="2" class="px-4 py-2 text-right">
        Total ${escapeHtml(ctx.current)}
      </td>

      <td class="px-4 py-2 text-right font-mono">
        ${formatNumber(ctx.data.summary.unidades.sum)}
      </td>

      <td class="px-4 py-2 text-right font-mono">
        ${formatNumber(ctx.data.summary.kgs.sum, 2)}
      </td>

      <td class="px-4 py-2 text-right font-mono">
        ${formatCurrency(ctx.data.summary.importe.sum)}
      </td>
    </tr>
    <tr>
      <td colspan="6">
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
      </td>
    </tr>
  `;
};

const renderGrandTotal = ctx => {
  return `
        <tr>
          <td colspan="6" class="mt-12 p-8 rounded-3xl
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
            <div class="mt-6 text-xs opacity-50">
              ${ctx.recordCount} registros procesados
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

          </td>
        </tr>
      </tbody>
    </table>
  `;
};

const reportDefinition = {
  sections: [
    { id: "H1", type: "header", valueProvider: renderReportHeader },
    { id: "D1", type: "detail", valueProvider: renderDetailRow },
    { id: "G1", type: "group", key: "temporada", valueProvider: renderGroup, footerValueProvider: renderFooterGroupAny },
    { id: "GT", type: "total", valueProvider: renderGrandTotal },
  ],

  summary: {
    unidades: ['sum', 'max', 'min', 'median', 'avg', 'values', 'distinct'],
    kgs: ['sum', 'max', 'min', 'median', 'avg'],
    importe: ['sum', 'max', 'min', 'median', 'avg']
  },
  orderBy: "temporada,unidades,tipo,proveedor",
  mounted: (refs) => {
    document.querySelector('button.js-button').onclick = () => {
      Array.from(document.querySelectorAll('details.js-details'))
        .forEach(element => {
          element.classList.remove('hidden');
        });
    }
    const defaultMessage = 'Informe agrupado por temporada';
    document
      .querySelector('.js-message')
      .textContent = refs?.message ?? defaultMessage;
  },
  parseData: (rd, data) => data,
};