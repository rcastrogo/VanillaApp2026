import type { MenuItem } from '@/components/menu-trigger.component';
import { buildAndInterpolate } from '@/core/dom';
import { notificationService } from '@/core/services/notification.service';
import { BaseComponent } from '@/core/types';

export default class MenuShowcasePage extends BaseComponent {

  /* ━━━━ 1. Basic menu (flat items) ━━━━━━━━━━━━━━━━━━━━━━━━━ */
  basicItems: MenuItem[] = [
    { id: 'edit',   label: 'Editar',   icon: 'edit',   action: () => this.notify('Editar') },
    { id: 'copy',   label: 'Copiar',   icon: 'copy',   action: () => this.notify('Copiar') },
    { id: 'delete', label: 'Eliminar', icon: 'trash',  separator: true, action: () => this.notify('Eliminar') },
  ];

  /* ━━━━ 2. Menu with disabled items ━━━━━━━━━━━━━━━━━━━━━━━━ */
  disabledItems: MenuItem[] = [
    { id: 'open',      label: 'Abrir',      icon: 'folder',   action: () => this.notify('Abrir') },
    { id: 'save',      label: 'Guardar',    icon: 'download',  action: () => this.notify('Guardar') },
    { id: 'save-as',   label: 'Guardar como…', icon: 'file',  disabled: true },
    { id: 'export',    label: 'Exportar',   icon: 'upload',   disabled: true },
    { id: 'close',     label: 'Cerrar',     icon: 'x',        separator: true, action: () => this.notify('Cerrar') },
  ];

  /* ━━━━ 3. Menu with sub-menus ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  submenuItems: MenuItem[] = [
    { id: 'file',   label: 'Archivo', icon: 'file', children: [
      { id: 'new',    label: 'Nuevo',       icon: 'plus',     action: () => this.notify('Archivo → Nuevo') },
      { id: 'open',   label: 'Abrir',       icon: 'folder',   action: () => this.notify('Archivo → Abrir') },
      { id: 'recent', label: 'Recientes',   icon: 'timer',    children: [
        { id: 'r1', label: 'proyecto-alpha.ts', icon: 'code', action: () => this.notify('Recientes → alpha') },
        { id: 'r2', label: 'config.json',       icon: 'settings', action: () => this.notify('Recientes → config') },
        { id: 'r3', label: 'README.md',         icon: 'book-open', action: () => this.notify('Recientes → README') },
      ]},
      { id: 'save',   label: 'Guardar',     icon: 'download', separator: true, action: () => this.notify('Archivo → Guardar') },
    ]},
    { id: 'edit-grp', label: 'Editar', icon: 'edit', children: [
      { id: 'cut',   label: 'Cortar',  icon: 'clipboard', action: () => this.notify('Editar → Cortar') },
      { id: 'copy',  label: 'Copiar',  icon: 'copy',      action: () => this.notify('Editar → Copiar') },
      { id: 'paste', label: 'Pegar',   icon: 'clipboard', action: () => this.notify('Editar → Pegar') },
    ]},
    { id: 'view', label: 'Ver', icon: 'eye', children: [
      { id: 'zoom-in',  label: 'Acercar',  icon: 'plus',  action: () => this.notify('Ver → Acercar') },
      { id: 'zoom-out', label: 'Alejar',   icon: 'minus', action: () => this.notify('Ver → Alejar') },
    ]},
    { id: 'settings', label: 'Configuración', icon: 'settings', separator: true, action: () => this.notify('Configuración') },
  ];

  /* ━━━━ 4. Menu with popover content ━━━━━━━━━━━━━━━━━━━━━━━ */
  popoverItems: MenuItem[] = [
    { id: 'profile',  label: 'Mi Perfil', icon: 'user', popover: `
      <div class="p-4 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 shadow-2xl w-64">
        <div class="flex items-center gap-3 mb-3">
          <div class="size-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm">JD</div>
          <div>
            <p class="font-bold text-slate-900 dark:text-white">Juan Díaz</p>
            <p class="text-xs text-slate-500 dark:text-slate-400">juan@example.com</p>
          </div>
        </div>
        <div class="text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-2 space-y-1">
          <p>Rol: <span class="font-medium text-slate-700 dark:text-slate-200">Administrador</span></p>
          <p>Último acceso: <span class="font-medium text-slate-700 dark:text-slate-200">Hoy, 10:32</span></p>
        </div>
      </div>
    ` },
    { id: 'notif',    label: 'Notificaciones', icon: 'mail', popover: () => this.buildNotificationPopover() },
    { id: 'settings', label: 'Configuración',  icon: 'settings', separator: true, action: () => this.notify('Configuración') },
    { id: 'logout',   label: 'Cerrar sesión',  icon: 'power',    action: () => this.notify('Cerrando sesión…') },
  ];

  /* ━━━━ 5. Mixed: sub-menus + popovers + actions ━━━━━━━━━━━ */
  mixedItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard',   icon: 'layers',   action: () => this.notify('Dashboard') },
    { id: 'reports',   label: 'Informes',    icon: 'bar-chart', children: [
      { id: 'sales',  label: 'Ventas',       icon: 'star',     action: () => this.notify('Informes → Ventas') },
      { id: 'users',  label: 'Usuarios',     icon: 'users',    action: () => this.notify('Informes → Usuarios') },
      { id: 'detail', label: 'Detalle',      icon: 'eye',      popover: `
        <div class="w-80">
          <p class="font-bold text-sm mb-2 text-slate-900 dark:text-white">Vista previa</p>
          <div class="h-30 w-full flex-row items-center justify-center">
            Gráfico de detalle
            <input type="range" class="w-full mt-2" />
            <input type="radio"  /> Opción A
            <input type="radio" checked /> Opción B
            <input type="text" value="Filtro" class="w-full mt-2" />
          </div>
        </div>
      ` },
    ]},
    { id: 'security', label: 'Seguridad',   icon: 'lock',     children: [
      { id: 'pwd',   label: 'Cambiar contraseña', icon: 'edit', action: () => this.notify('Seguridad → Contraseña') },
      { id: '2fa',   label: 'Activar 2FA',        icon: 'check', action: () => this.notify('Seguridad → 2FA') },
    ]},
    { id: 'fav',     label: 'Favoritos',    icon: 'heart',    separator: true, popover: `
      <div class="p-4 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 shadow-2xl w-56">
        <p class="font-bold text-sm mb-2 text-slate-900 dark:text-white">Favoritos</p>
        <ul class="text-sm space-y-1 text-slate-600 dark:text-slate-300">
          <li>⭐ Proyecto Alpha</li>
          <li>⭐ Dashboard principal</li>
          <li>⭐ Informe Q1-2026</li>
        </ul>
      </div>
    ` },
    { id: 'logout',  label: 'Salir',        icon: 'power',    separator: true, action: () => this.notify('Salir') },
  ];

  /* ━━━━ 6. Popover standalone samples ━━━━━━━━━━━━━━━━━━━━━━ */

  clickInside = (): boolean => false;

  /* ━━━━ Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

  private notify(msg: string): void {
    notificationService.show(`<b>${msg}</b>`, 2_000);
  }

  private buildNotificationPopover(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'p-4 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 shadow-2xl w-72';
    el.innerHTML = `
      <p class="font-bold text-sm mb-3 text-slate-900 dark:text-white">Notificaciones recientes</p>
      <ul class="space-y-2 text-sm">
        <li class="flex gap-2 items-start">
          <span class="size-2 mt-1.5 rounded-full bg-indigo-500 shrink-0"></span>
          <span class="text-slate-700 dark:text-slate-300">Nuevo comentario en <b>Proyecto Alpha</b></span>
        </li>
        <li class="flex gap-2 items-start">
          <span class="size-2 mt-1.5 rounded-full bg-green-500 shrink-0"></span>
          <span class="text-slate-700 dark:text-slate-300">Deploy completado: <b>v2.4.1</b></span>
        </li>
        <li class="flex gap-2 items-start">
          <span class="size-2 mt-1.5 rounded-full bg-amber-500 shrink-0"></span>
          <span class="text-slate-700 dark:text-slate-300">Alerta de rendimiento en <b>API Gateway</b></span>
        </li>
      </ul>
      <button class="w-full mt-3 text-center text-xs text-indigo-500 hover:text-indigo-600 font-medium">
        Ver todas →
      </button>
    `;
    return el;
  }

  /* ━━━━ Render ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

  render(): HTMLElement {
    const template = `
      <div class="min-h-screen p-6">
        <div class="max-w-6xl mx-auto">

          <!-- Header -->
          <div class="mb-8">
            <h1 class="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Menu &amp; Popover Showcase
            </h1>
            <p class="text-slate-500 dark:text-slate-400 mt-1">
              Distintas variantes del componente <code class="text-indigo-500">app-menu-trigger</code> y <code class="text-indigo-500">app-popover-trigger</code>.
            </p>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-3 gap-6">

          <!-- 1. Basic ─────────────────────────────────────── -->
          <section class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-6">
            <h2 class="text-xl font-bold mb-1 text-slate-800 dark:text-white">1 · Menú básico</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Acciones planas sin sub-menus ni popovers.
            </p>
            <div data-component="app-menu-trigger" data-items="basicItems">
              <button data-menu-trigger class="app-button btn-primary">
                <i data-icon="menu" class="inline-flex size-4 mr-1"></i>
                Menú básico
              </button>
            </div>
          </section>

          <!-- 2. Disabled items ─────────────────────────────── -->
          <section class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-6">
            <h2 class="text-xl font-bold mb-1 text-slate-800 dark:text-white">2 · Ítems deshabilitados</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Algunos ítems están <code>disabled</code> y no se pueden activar.
            </p>
            <div data-component="app-menu-trigger" data-items="disabledItems">
              <button data-menu-trigger class="app-button btn-secondary">
                <i data-icon="file" class="inline-flex size-4 mr-1"></i>
                Archivo
              </button>
            </div>
          </section>

          <!-- 3. Sub-menus ──────────────────────────────────── -->
          <section class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-6">
            <h2 class="text-xl font-bold mb-1 text-slate-800 dark:text-white">3 · Sub-menús anidados</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Los ítems con <code>children</code> abren un sub-menú lateral. Se soporta anidamiento múltiple (Archivo → Recientes → …).
            </p>
            <div data-component="app-menu-trigger" data-items="submenuItems">
              <button data-menu-trigger class="app-button btn-primary">
                <i data-icon="layers" class="inline-flex size-4 mr-1"></i>
                Menú con sub-menús
              </button>
            </div>
          </section>

          <!-- 4. Popovers ───────────────────────────────────── -->
          <section class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-6">
            <h2 class="text-xl font-bold mb-1 text-slate-800 dark:text-white">4 · Ítems con popover</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Los ítems con <code>popover</code> abren un panel de contenido personalizado en lugar de ejecutar una acción.
              Se admite HTML estático o una función que devuelve un <code>HTMLElement</code>.
            </p>
            <div data-component="app-menu-trigger" data-items="popoverItems">
              <button data-menu-trigger class="app-button btn-secondary">
                <i data-icon="user" class="inline-flex size-4 mr-1"></i>
                Mi cuenta
              </button>
            </div>
          </section>

          <!-- 5. Mixed ──────────────────────────────────────── -->
          <section class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-6">
            <h2 class="text-xl font-bold mb-1 text-slate-800 dark:text-white">5 · Menú mixto</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Combina acciones directas, sub-menús y popovers en un solo menú.
            </p>
            <div data-component="app-menu-trigger" data-items="mixedItems">
              <button data-menu-trigger class="app-button btn-primary">
                <i data-icon="settings" class="inline-flex size-4 mr-1"></i>
                Panel de control
              </button>
            </div>
          </section>

          <!-- 6. Popover standalone ─────────────────────────── -->
          <section class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-6">
            <h2 class="text-xl font-bold mb-1 text-slate-800 dark:text-white">6 · Popover standalone (click &amp; hover)</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Componente <code>app-popover-trigger</code> independiente con modo click (por defecto) y hover.
            </p>
            <div class="flex flex-wrap gap-4">

              <!-- Click popover -->
              <div data-component="app-popover-trigger" data-placement="bottom-end">
                <button data-popover-trigger class="app-button btn-primary">
                  <i data-icon="info" class="inline-flex size-4 mr-1"></i>
                  Popover click
                </button>
                <div data-popover-content>
                  <div class="w-64">
                    <p class="font-bold text-sm text-slate-900 dark:text-white mb-2">Detalle</p>
                    <p class="text-sm text-slate-600 dark:text-slate-400">
                      Este popover se abre al hacer click y se cierra al hacer click fuera o pulsar Escape.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Hover popover -->
              <div data-component="app-popover-trigger" data-mode="hover">
                <button data-popover-trigger class="app-button btn-secondary">
                  <i data-icon="eye" class="inline-flex size-4 mr-1"></i>
                  Popover hover
                </button>
                <div data-popover-content>
                  <div class="w-64">
                    <p class="font-bold text-sm text-slate-900 dark:text-white mb-2">Vista previa</p>
                    <p class="text-sm text-slate-600 dark:text-slate-400">
                      Este popover se muestra al pasar el ratón por encima y se oculta al salir.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Hover popover with rich content -->
              <div data-component="app-popover-trigger" data-mode="hover">
                <div data-popover-trigger
                     class="flex items-center gap-2 cursor-pointer rounded-full px-4 py-2 text-sm
                            bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600
                            text-slate-700 dark:text-slate-200">
                  <i data-icon="star" class="inline-flex size-4"></i>
                  <span>Hover para más info</span>
                </div>
                <div data-popover-content>
                  <div class="w-72">
                    <div class="flex items-center gap-3 mb-3">
                      <div class="size-10 bg-amber-500 rounded-full flex items-center justify-center text-white">
                        <i data-icon="star" class="inline-flex size-5"></i>
                      </div>
                      <div>
                        <p class="font-bold text-slate-900 dark:text-white">Contenido destacado</p>
                        <p class="text-xs text-slate-500">Actualizado hoy</p>
                      </div>
                    </div>
                    <p class="text-sm text-slate-600 dark:text-slate-400">
                      Los popovers en modo hover permiten mostrar información contextual sin necesidad de hacer click.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </section>

          </div><!-- /grid -->
        </div>
      </div>
    `;
    return buildAndInterpolate(template, this);
  }
}
