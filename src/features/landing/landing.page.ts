import type { ComponentContext } from '../../components/component.model';
import { $, buildAndInterpolate } from '../../core/dom';
import { pubSub } from '../../core/services/pubsub.service';
import { useState } from '../../core/state.utils';
import { BaseComponent } from '../../core/types';

import { APP_CONFIG } from '@/app.config';
import { router } from '@/core/services/router.service';

/**
 * Landing Page — Banco de pruebas de componentes y funcionalidades
 * del mini-framework reactivo.
 *
 * Organizada en secciones con grid/flex para mostrar distintos ejemplos:
 *  1. Componentes reutilizables (counter, collapsible, theme-toggle, language-selector)
 *  2. Lista con data-each y búsqueda reactiva
 *  3. Estado reactivo con BaseComponent.state
 *  4. Hook useState con suscripción fina a propiedades
 *  5. Sistema PubSub (publicar / suscribir)
 *  6. Interpolación de plantillas
 *  7. Navegación con route-to y publish:NAVIGATE
 */
export default class LandingPage extends BaseComponent {

  // ── useState hook demo ────────────────────────────────────────────────────
  private _clock = useState({ time: '--:--:--' });
  private _clockInterval: ReturnType<typeof setInterval> | null = null;

  // ── PubSub demo ───────────────────────────────────────────────────────────
  private pubSubLog: string[] = [];

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  init() {

    // State reactivo de la página
    this.setState({
      counter: 0,
      message: '',
      interpolationName: 'Mundo',
      pubSubMessages: [] as string[],
    });

    // Reloj con useState hook
    this._clockInterval = setInterval(() => {
      this._clock.put('time', new Date().toTimeString().slice(0, 8));
    }, 1_000);
    this.addCleanup(() => {
      if (this._clockInterval) clearInterval(this._clockInterval);
    });

    // Actualizar slot del reloj cuando cambia 'time'
    this._clock.on('time', (value) => {
      const slot = this.element?.querySelector('#clock-slot');
      if (slot) slot.textContent = value;
    });

    // Suscribirse a COUNT_UPDATED para el log de PubSub
    this.addCleanup(
      [
        APP_CONFIG.i18n.changed(() => this.updateTranslations()),
        pubSub.subscribe<{ id: number; val: number }>('COUNT_UPDATED', (payload) => {
          this.pubSubLog = [
            `[COUNT_UPDATED] contador #${payload?.id} → ${payload?.val}`,
            ...this.pubSubLog.slice(0, 4),
          ];
          this.state.pubSubMessages = [...this.pubSubLog];
        })
      ]
  );
  }

  // ── Acciones de la página ─────────────────────────────────────────────────

  updateTranslations() {
    if (!this.element) return;
    $('[data-i18n-key]', this.element).all().forEach(el => {
      const key = el.getAttribute('data-i18n-key')!;
      el.textContent = APP_CONFIG.i18n.t(key, {});
    });
  }

  incrementCounter() {
    this.state.counter++;
  }

  resetCounter() {
    this.state.counter = 0;
  }

  sendPubSubMessage() {
    const msg = `[Página → PubSub] mensaje enviado a las ${new Date().toLocaleTimeString()}`;
    pubSub.publish(APP_CONFIG.messages.app.message, msg);
    this.pubSubLog = [msg, ...this.pubSubLog.slice(0, 4)];
    this.state.pubSubMessages = [...this.pubSubLog];
  }

  navigateTo(_el: HTMLInputElement, _e: Event, route: string) {
    router.navigateTo(route);
  }

  onNameInput(el: HTMLInputElement) {
    this.state.interpolationName = el.value || 'Mundo';
  }

  // ── Render ────────────────────────────────────────────────────────────────

  render(): HTMLElement {
    const messages: string[] = this.state.pubSubMessages ?? [];

    const template = `
      <div class="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 md:p-10">

        <!-- ── Cabecera ──────────────────────────────────────────── -->
        <header class="mb-10 text-center">
          <h1 class="text-4xl font-black text-slate-800 dark:text-white mb-2">
            🧩 Landing Page — Banco de Pruebas
          </h1>
          <p data-t="landingPage.header.description" class="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
          </p>
        </header>

        <!-- ── Grid principal ────────────────────────────────────── -->
        <div class="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">

          <!-- ╔═══════════════════════════════════════╗ -->
          <!-- ║  1 · Componentes reutilizables         ║ -->
          <!-- ╚═══════════════════════════════════════╝ -->
          <section class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <h2 class="text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <span class="text-2xl">🔢</span> Contadores (app-counter)
            </h2>
            <p class="text-sm text-slate-500 dark:text-slate-400">
              El componente <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded">app-counter</code>
              encapsula estado reactivo y re-renderiza solo su fragmento del DOM.
            </p>
            <div class="grid grid-cols-2 gap-3">
              <div data-component="app-counter" data-value="0"></div>
              <div data-component="app-counter" data-value="10"></div>
            </div>
            <p class="text-xs text-slate-400 dark:text-slate-500">
              Cada instancia es independiente; los clics se notifican vía PubSub (COUNT_UPDATED).
            </p>
          </section>

          <!-- ╔═══════════════════════════════════════╗ -->
          <!-- ║  2 · Collapsible + clock interno       ║ -->
          <!-- ╚═══════════════════════════════════════╝ -->
          <section class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <h2 class="text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <span class="text-2xl">📂</span> Collapsible (app-collapsible)
            </h2>
            <p class="text-sm text-slate-500 dark:text-slate-400">
              Componente con estado interno (expandido/contraído) y un reloj
              con <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded">useState</code>
              que sólo se monta cuando está abierto (<code>@if</code>).
            </p>
            <div
              data-component="app-collapsible"
              data-title="Expandir para ver el reloj interno"
              data-expanded="false"
            >
              <p class="text-slate-600 dark:text-slate-300">
                Este contenido (y el reloj de abajo) sólo existen en el DOM cuando el panel está abierto.
              </p>
            </div>
            <div
              data-component="app-collapsible"
              data-title="Segundo panel (expandido)"
              data-expanded="true"
            >
              <p class="text-slate-600 dark:text-slate-300">
                Múltiples instancias son completamente independientes.
              </p>
            </div>
          </section>

          <!-- ╔═══════════════════════════════════════╗ -->
          <!-- ║  3 · Theme toggle + Language selector  ║ -->
          <!-- ╚═══════════════════════════════════════╝ -->
          <section class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <h2 class="text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <span class="text-2xl">🎨</span> UI Global
            </h2>
            <p class="text-sm text-slate-500 dark:text-slate-400">
              <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded">app-theme-toggle</code> y
              <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded">app-language-selector</code>
              son componentes globales que publican eventos vía PubSub para que
              cualquier parte de la app pueda reaccionar.
            </p>
            <div class="flex flex-wrap items-center gap-4">
              <div data-component="app-theme-toggle"></div>
              <div data-component="app-language-selector"></div>
            </div>
            <p class="text-xs text-slate-400 dark:text-slate-500">
              Cambia el tema o el idioma y observa cómo todos los textos con
              <code>data-t</code> se actualizan sin recargar la página.
            </p>
          </section>

          <!-- ╔═══════════════════════════════════════╗ -->
          <!-- ║  4 · Lista reactiva con data-each      ║ -->
          <!-- ╚═══════════════════════════════════════╝ -->
          <section class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <h2 class="text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <span class="text-2xl">📋</span> Lista reactiva (app-user-list)
            </h2>
            <p class="text-sm text-slate-500 dark:text-slate-400">
              Demuestra <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded">data-each</code>,
              búsqueda reactiva y operaciones CRUD que disparan re-renders selectivos.
            </p>
            <div data-component="app-user-list"></div>
          </section>

          <!-- ╔═══════════════════════════════════════╗ -->
          <!-- ║  5 · Estado reactivo de BaseComponent  ║ -->
          <!-- ╚═══════════════════════════════════════╝ -->
          <section class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <h2 class="text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <span class="text-2xl">⚡</span> Estado reactivo (BaseComponent.state)
            </h2>
            <p class="text-sm text-slate-500 dark:text-slate-400">
              Cualquier asignación a <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded">this.state.*</code>
              en un <code>BaseComponent</code> provoca un re-render automático del componente.
            </p>

            <div class="text-center py-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600">
              <span class="text-5xl font-black text-indigo-600 dark:text-indigo-400">
                {state.counter}
              </span>
              <p class="text-xs text-slate-400 mt-1">valor del estado de esta página</p>
            </div>

            <div class="flex gap-3">
              <button
                on-click="incrementCounter"
                class="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                + Incrementar
              </button>
              <button
                on-click="resetCounter"
                class="flex-1 py-2 px-4 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-lg transition-colors text-sm"
              >
                ↺ Resetear
              </button>
            </div>
          </section>

          <!-- ╔═══════════════════════════════════════╗ -->
          <!-- ║  6 · useState hook + reloj              ║ -->
          <!-- ╚═══════════════════════════════════════╝ -->
          <section class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <h2 class="text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <span class="text-2xl">🕐</span> Hook useState
            </h2>
            <p class="text-sm text-slate-500 dark:text-slate-400">
              <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded">useState()</code>
              crea un proxy reactivo; <code>.on(prop, cb)</code> suscribe
              cambios de una sola propiedad sin re-renderizar el componente completo.
            </p>
            <div class="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600">
              <span class="text-2xl">🕰️</span>
              <span
                id="clock-slot"
                class="font-mono text-2xl font-bold text-slate-700 dark:text-slate-100"
              >--:--:--</span>
            </div>
            <p class="text-xs text-slate-400 dark:text-slate-500">
              Solo el nodo <code>#clock-slot</code> se actualiza cada segundo,
              sin re-renderizar nada más.
            </p>
          </section>

          <!-- ╔═══════════════════════════════════════╗ -->
          <!-- ║  7 · PubSub                             ║ -->
          <!-- ╚═══════════════════════════════════════╝ -->
          <section class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <h2 class="text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <span class="text-2xl">📡</span> Sistema PubSub
            </h2>
            <p class="text-sm text-slate-500 dark:text-slate-400">
              Comunicación desacoplada entre componentes. Pulsa los contadores de
              arriba o el botón de abajo y observa el log de mensajes recibidos.
            </p>
            <button
              on-click="sendPubSubMessage"
              class="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors text-sm"
            >
              📤 Publicar LANDING_MSG
            </button>
            <div class="space-y-1 min-h-16">
              ${messages.length === 0
                ? `<p class="text-xs text-slate-400 dark:text-slate-500 italic">Sin mensajes aún. Pulsa un contador o el botón de arriba.</p>`
                : messages.map(m => `
                    <div class="text-xs font-mono bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 rounded px-2 py-1 text-slate-600 dark:text-slate-300">
                      ${m}
                    </div>
                  `).join('')
              }
            </div>
          </section>

          <!-- ╔═══════════════════════════════════════╗ -->
          <!-- ║  8 · Interpolación de plantillas        ║ -->
          <!-- ╚═══════════════════════════════════════╝ -->
          <section class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <h2 class="text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <span class="text-2xl">✏️</span> Interpolación de plantillas
            </h2>
            <p class="text-sm text-slate-500 dark:text-slate-400">
              El motor de plantillas resuelve <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded">{state.*}</code>,
              <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded">{t:key}</code>,
              pipes (<code>| upper</code>, <code>| iif</code>) y más.
            </p>
            <label class="block text-sm font-medium text-slate-600 dark:text-slate-300">
              Escribe un nombre:
              <input
                on-input="onNameInput"
                value="{state.interpolationName}"
                class="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Escribe un nombre…"
              />
            </label>
            <div class="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-100 dark:border-indigo-800">
              <p class="text-sm text-indigo-700 dark:text-indigo-300">
                Hola, <strong>{state.interpolationName}</strong>! 👋
              </p>
              <p class="text-xs text-indigo-500 dark:text-indigo-400 mt-1">
                Nombre en mayúsculas:
                <code class="font-mono">{state.interpolationName | upper}</code>
              </p>
            </div>
          </section>

          <!-- ╔═══════════════════════════════════════╗ -->
          <!-- ║  9 · Navegación                         ║ -->
          <!-- ╚═══════════════════════════════════════╝ -->
          <section class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <h2 class="text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <span class="text-2xl">🗺️</span> Navegación
            </h2>
            <p class="text-sm text-slate-500 dark:text-slate-400">
              La app soporta tres formas de navegar: atributo
              <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded">route-to</code>,
              botón con <code>publish:NAVIGATE</code> y llamada directa al router.
            </p>
            <div class="flex flex-wrap gap-2">
              <a
                route-to="home"
                class="inline-block px-4 py-2 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 font-medium rounded-xl hover:bg-slate-900 dark:hover:bg-white transition-all text-sm cursor-pointer"
              >
                🏠 Inicio (route-to)
              </a>
              <button
                on-click="publish:router-navigate-to:global:dashboard"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all text-sm"
              >
                📊 Dashboard (PubSub)
              </button>
              <button
                route-to="test"
                class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-all text-sm"
              >
                🧪 Test / Reports
              </button>
              <button
                on-click="navigateTo:about"
                class="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-all text-sm"
              >
                ℹ️ About
              </button>
              <button
                route-to="poc-1"
                class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all text-sm"
              >
                🧩 POC-1 BaseComponent
              </button>
            </div>
          </section>

        </div><!-- /grid -->

        <!-- ── Footer informativo ──────────────────────────────── -->
        <footer class="mt-10 text-center text-xs text-slate-400 dark:text-slate-600">
          <div data-component="app-logo" class="inline-flex">
            Mini-framework reactivo · Landing Page de pruebas
          </div>
        </footer>

      </div>
    `;

    return buildAndInterpolate(template, this);
  }

}
