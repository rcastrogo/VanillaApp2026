
import type { ComponentFactory } from '@/components/component.model';
import { $, buildAndInterpolate } from '@/core/dom';
import type { Identifiable } from '@/core/types';
import { where } from '@/core/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface User extends Record<string, unknown> {
  id: number;
  name: string;
  age: number;
  role: string;
  active: boolean;
  email: string;
  salary: number;
}

interface Product extends Record<string, unknown> {
  id: number;
  name: string;
  inStock: boolean;
  price: number;
}

interface SessionRecord extends Record<string, unknown> {
  id: number;
  label: string;
  expiresAt: number;
  isExpired(): boolean;
}

// ─── Static datasets ──────────────────────────────────────────────────────────

const USERS: User[] = [
  { id: 1,  name: 'Alice García',  age: 32, role: 'admin',  active: true,  email: 'alice@gmail.com',   salary: 75_000  },
  { id: 2,  name: 'Bob Martínez',  age: 17, role: 'viewer', active: true,  email: 'bob@hotmail.com',   salary: 0       },
  { id: 3,  name: 'Carol López',   age: 25, role: 'editor', active: false, email: 'carol@gmail.com',   salary: 45_000  },
  { id: 4,  name: 'David Torres',  age: 15, role: 'viewer', active: true,  email: 'david@company.com', salary: 0       },
  { id: 5,  name: 'Eva Sánchez',   age: 28, role: 'admin',  active: false, email: 'eva@gmail.com',     salary: 92_000  },
  { id: 6,  name: 'Frank Ruiz',    age: 41, role: 'admin',  active: true,  email: 'frank@outlook.com', salary: 110_000 },
  { id: 7,  name: 'Gina Pérez',    age: 22, role: 'editor', active: true,  email: 'gina@gmail.com',    salary: 38_000  },
  { id: 8,  name: 'Hugo Jiménez',  age: 35, role: 'viewer', active: false, email: 'hugo@company.com',  salary: 55_000  },
  { id: 9,  name: 'Iris Castro',   age: 29, role: 'admin',  active: true,  email: 'iris@gmail.com',    salary: 67_000  },
  { id: 10, name: 'Juan Morales',  age: 16, role: 'viewer', active: false, email: 'juan@hotmail.com',  salary: 0       },
];

const PRODUCTS: Product[] = [
  { id: 1, name: 'Laptop Pro 15"',    inStock: true,  price: 899  },
  { id: 2, name: 'Laptop Air 13"',    inStock: true,  price: 749  },
  { id: 3, name: 'Laptop Gaming X1',  inStock: false, price: 1299 },
  { id: 4, name: 'Monitor 27" 4K',    inStock: true,  price: 450  },
  { id: 5, name: 'Teclado Mecánico',  inStock: true,  price: 120  },
  { id: 6, name: 'Laptop Slim 14"',   inStock: true,  price: 620  },
  { id: 7, name: 'Ratón Inalámbrico', inStock: false, price: 45   },
  { id: 8, name: 'Laptop Budget 11"', inStock: true,  price: 399  },
];

const NOW = Date.now();
const SESSIONS: SessionRecord[] = [
  { id: 1, label: 'Session Alice', expiresAt: NOW - 3_600_000, isExpired() { return Date.now() > this.expiresAt; } },
  { id: 2, label: 'Session Bob',   expiresAt: NOW + 7_200_000, isExpired() { return Date.now() > this.expiresAt; } },
  { id: 3, label: 'Session Carol', expiresAt: NOW - 1_800_000, isExpired() { return Date.now() > this.expiresAt; } },
  { id: 4, label: 'Session David', expiresAt: NOW + 3_600_000, isExpired() { return Date.now() > this.expiresAt; } },
  { id: 5, label: 'Session Frank', expiresAt: NOW - 900_000,   isExpired() { return Date.now() > this.expiresAt; } },
];

// ─── Case definitions ─────────────────────────────────────────────────────────

interface CaseDef {
  id: number;
  label: string;
  description: string;
  code: string;
  dataset: string;
  execute: () => Identifiable[];
}

const CASES: CaseDef[] = [
  {
    id: 1,
    label: 'Predicado función',
    description: 'Filtra usuarios mayores de edad (age ≥ 18) usando una función predicado directa.',
    code: `where(users, (user) => user.age >= 18)`,
    dataset: 'usuarios',
    execute: () => where(USERS, (u) => u.age >= 18),
  },
  {
    id: 2,
    label: 'Valor exacto',
    description: 'Filtra usuarios cuyo role es exactamente "admin" mediante coincidencia estricta (Object.is).',
    code: `where(users, { role: "admin" })`,
    dataset: 'usuarios',
    execute: () => where(USERS, { role: 'admin' }),
  },
  {
    id: 3,
    label: 'Múltiples propiedades',
    description: 'Filtra administradores activos combinando varias condiciones: todas deben cumplirse.',
    code: `where(users, { role: "admin", active: true })`,
    dataset: 'usuarios',
    execute: () => where(USERS, { role: 'admin', active: true }),
  },
  {
    id: 4,
    label: 'Expresión regular',
    description: 'Filtra usuarios cuyo email termina en @gmail.com usando una RegExp como valor esperado.',
    code: `where(users, { email: /@gmail\\.com$/ })`,
    dataset: 'usuarios',
    execute: () => where(USERS, { email: /@gmail\.com$/ }),
  },
  {
    id: 5,
    label: 'Predicado por campo',
    description: 'Filtra usuarios con salario mayor a 50.000 usando una función evaluada campo a campo.',
    code: `where(users, {\n  salary: (val) => val > 50_000,\n})`,
    dataset: 'usuarios',
    execute: () => where(USERS, { salary: (v: unknown) => (v as number) > 50_000 }),
  },
  {
    id: 6,
    label: 'Propiedad computada',
    description: 'Filtra sesiones expiradas. Si isExpired es una función en el objeto, se invoca automáticamente y su resultado se compara con el valor esperado.',
    code: `where(sessions, { isExpired: true })`,
    dataset: 'sesiones',
    execute: () => where(SESSIONS, { isExpired: true }),
  },
  {
    id: 7,
    label: 'Combinación',
    description: 'Combina tres tipos de condición: RegExp en name, valor exacto en inStock y predicado en price.',
    code: `where(products, {\n  name: /^laptop/i,\n  inStock: true,\n  price: (val) => val < 1_000,\n})`,
    dataset: 'productos',
    execute: () => where(PRODUCTS, { name: /^laptop/i, inStock: true, price: (v: unknown) => (v as number) < 1_000 }),
  },
  {
    id: 8,
    label: 'Sin filtros',
    description: 'Un objeto de condición vacío devuelve todos los elementos del array sin modificar.',
    code: `where(users, {})`,
    dataset: 'usuarios',
    execute: () => where(USERS, {}),
  },
  {
    id: 9,
    label: 'Array vacío',
    description: 'Filtrar un array vacío devuelve un array vacío sin errores ni excepciones.',
    code: `where([], { role: "admin" })`,
    dataset: 'vacío',
    execute: () => where([] as User[], { role: 'admin' }),
  },
];

// ─── Render helpers ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatRow(item: any, dataset: string): string {
  if (dataset === 'usuarios') {
    const salary = item.salary > 0 ? ` · $${item.salary.toLocaleString('es')}` : '';
    const active = item.active ? 'activo' : 'inactivo';
    return `
      <div class="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
        <div class="min-w-0 flex-1">
          <span class="text-sm font-medium text-slate-800 dark:text-white">${item.name}</span>
          <span class="text-xs text-slate-400 dark:text-slate-500 ml-2">${item.email}</span>
        </div>
        <span class="shrink-0 ml-3 text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
          ${item.role} · ${item.age}a · ${active}${salary}
        </span>
      </div>`;
  }
  if (dataset === 'productos') {
    const stock = item.inStock ? 'En stock' : 'Sin stock';
    return `
      <div class="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
        <div class="min-w-0 flex-1">
          <span class="text-sm font-medium text-slate-800 dark:text-white">${item.name}</span>
          <span class="text-xs text-slate-400 dark:text-slate-500 ml-2">${stock}</span>
        </div>
        <span class="shrink-0 ml-3 text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
          €${item.price.toLocaleString('es')}
        </span>
      </div>`;
  }
  if (dataset === 'sesiones') {
    const expired = typeof item.isExpired === 'function' ? item.isExpired() : false;
    const time = new Date(item.expiresAt).toLocaleTimeString('es');
    return `
      <div class="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
        <div class="min-w-0 flex-1">
          <span class="text-sm font-medium text-slate-800 dark:text-white">${item.label}</span>
          <span class="text-xs text-slate-400 dark:text-slate-500 ml-2">${expired ? 'Expirada' : 'Activa'}</span>
        </div>
        <span class="shrink-0 ml-3 text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
          exp. ${time}
        </span>
      </div>`;
  }
  return '';
}

// ─── Page (Functional Factory) ────────────────────────────────────────────────

const BTN_ACTIVE   = 'w-full text-left px-3 py-2 rounded-lg text-sm font-semibold bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 transition-colors';
const BTN_INACTIVE = 'w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors';

const whereTesterPage: ComponentFactory = () => {

  let root!: HTMLElement;

  function selectCase(id: number) {
    const c = CASES.find(x => x.id === id);
    if (!c) return;

    // Update buttons
    const buttons = $<HTMLButtonElement>('[data-case-btn]', root).all();
    buttons.forEach(btn => {
      const btnId = Number(btn.dataset.caseBtn);
      btn.className = btnId === id ? BTN_ACTIVE : BTN_INACTIVE;
    });

    // Execute filter
    const results = c.execute();

    // Update detail panel
    const detail = $<HTMLElement>('[data-detail]', root).one();
    if (detail) {
      detail.innerHTML = `
        <div class="flex items-start justify-between mb-2 gap-2">
          <h3 class="font-semibold text-slate-800 dark:text-white">${c.label}</h3>
          <span class="shrink-0 text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-mono">${c.dataset}</span>
        </div>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-3">${c.description}</p>
        <pre class="text-xs bg-slate-50 dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 rounded-lg p-3 font-mono overflow-auto border border-slate-200 dark:border-slate-700 leading-relaxed whitespace-pre-wrap">${c.code}</pre>
      `;
    }

    // Update results panel
    const resultsPanel = $<HTMLElement>('[data-results]', root).one();
    if (resultsPanel) {
      if (results.length === 0) {
        resultsPanel.innerHTML = `
          <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300">Resultados</h3>
            <span class="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">0 registros</span>
          </div>
          <div class="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-500">
            <p class="text-sm font-medium">Sin resultados</p>
            <p class="text-xs mt-1 opacity-70">El filtro no coincide con ningún elemento del array</p>
          </div>
        `;
      } else {
        const rows = results.map(item => formatRow(item, c.dataset)).join('');
        resultsPanel.innerHTML = `
          <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300">Resultados</h3>
            <span class="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">${results.length} registros</span>
          </div>
          <div class="divide-y divide-slate-100 dark:divide-slate-700 max-h-96 overflow-y-auto">
            ${rows}
          </div>
        `;
      }
    }
  }

  function handleCaseClick(_el: HTMLElement, _e: Event, idStr: string) {
    selectCase(Number(idStr));
  }

  // ── Build buttons HTML ──
  const buttonsHtml = CASES.map(c => `
    <button 
        data-case-btn="${c.id}" 
        class="${BTN_INACTIVE}" 
        on-click="handleCaseClick:${c.id}">
      <span class="inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 mr-2 font-mono shrink-0">${c.id}</span>
      ${c.label}
    </button>
  `).join('');

  const template = `
    <div class="min-h-screen p-4 md:p-6">
      <div class="max-w-6xl mx-auto">

        <div class="mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
          <h1 class="text-2xl md:text-3xl font-black tracking-tight text-slate-800 dark:text-white">
            Demostración de <code class="text-indigo-500 font-mono text-2xl">where()</code>
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            9 casos de uso de la función de filtrado genérico con datasets estáticos de usuarios, productos y sesiones.
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <!-- Left: Case list -->
          <div class="lg:col-span-1">
            <p class="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 px-1">Casos de uso</p>
            <div class="flex flex-col gap-0.5">
              ${buttonsHtml}
            </div>

            <div class="mt-6 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Datasets</p>
              <ul class="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <li><span class="font-mono text-indigo-600 dark:text-indigo-400">usuarios</span> — 10 registros (User)</li>
                <li><span class="font-mono text-indigo-600 dark:text-indigo-400">productos</span> — 8 registros (Product)</li>
                <li><span class="font-mono text-indigo-600 dark:text-indigo-400">sesiones</span> — 5 registros (SessionRecord)</li>
              </ul>
            </div>
          </div>

          <!-- Right: Detail + Results -->
          <div class="lg:col-span-2 flex flex-col gap-4">
            <div data-detail class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
              <p class="text-sm text-slate-400 dark:text-slate-500 italic">Selecciona un caso de la lista para ver el resultado.</p>
            </div>
            <div data-results class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            </div>
          </div>

        </div>
      </div>
    </div>
  `;

  return {
    handleCaseClick,
    render() {
      root = buildAndInterpolate(template, this);
      setTimeout(() => selectCase(1), 0);
      return root;
    },
  };
};

export default whereTesterPage;
