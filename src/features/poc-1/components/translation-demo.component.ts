import { APP_CONFIG } from '@/app.config';
import type { ComponentContext } from '@/components/component.model';
import { $ } from '@/core/dom';
import { buildAndInterpolate } from '@/core/dom';
import { BaseComponent } from '@/core/types';
import type { Language } from '@/i18n';

export class TranslationDemoComponent extends BaseComponent {

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  init() {
    this.setState({
      name: 'Mundo',
      count: 3,
      currentLang: APP_CONFIG.i18n.currentLng,
    });

    this.addCleanup(
      APP_CONFIG.i18n.changed((lang) => {
        this.state.currentLang = lang;
        this.refreshTranslations();
      })
    );
  }

  setLang(lang: Language) {
    APP_CONFIG.i18n.setLang(lang);
  }

  setLangEs() {
    this.setLang('es');
  }

  setLangEn() {
    this.setLang('en');
  }

  refreshTranslations() {
    if (!this.element) return;
    $('[data-i18n-key]', this.element).all().forEach(el => {
      const key = el.getAttribute('data-i18n-key')!;
      const countAttr = el.getAttribute('data-i18n-count');
      const nameAttr = el.getAttribute('data-i18n-name');
      const ctx: Record<string, unknown> = {};
      if (countAttr) ctx.count = Number(countAttr);
      if (nameAttr) ctx.name = nameAttr;
      el.textContent = APP_CONFIG.i18n.t(key, ctx);
    });
  }

  render() {
    const t = APP_CONFIG.i18n.t.bind(APP_CONFIG.i18n);
    const template = `
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
        <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <i data-icon="globe" class="size-5 text-green-500"></i>
          TranslationDemoComponent
        </h2>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Sistema i18n con
          <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">APP_CONFIG.i18n.t(key, ctx)</code>
          e interpolación de variables. Idioma activo:
          <strong class="text-green-600 dark:text-green-400">{state.currentLang}</strong>
        </p>

        <div class="flex gap-2">
          <button on-click="setLangEs"
            class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-lg transition-colors">
            🇪🇸 Español
          </button>
          <button on-click="setLangEn"
            class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors">
            🇺🇸 English
          </button>
        </div>

        <div class="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-slate-500 dark:text-slate-400">welcome</span>
            <span data-i18n-key="welcome" data-i18n-name="${this.state.name}"
                  class="font-medium text-slate-800 dark:text-slate-100">
              ${t('welcome', { name: this.state.name })}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500 dark:text-slate-400">items</span>
            <span data-i18n-key="items" data-i18n-count="${this.state.count}"
                  class="font-medium text-slate-800 dark:text-slate-100">
              ${t('items', { count: this.state.count })}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500 dark:text-slate-400">dashboard</span>
            <span data-i18n-key="dashboard"
                  class="font-medium text-slate-800 dark:text-slate-100">
              ${t('dashboard', {})}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500 dark:text-slate-400">ui.actions.increment</span>
            <span data-i18n-key="ui.actions.increment"
                  class="font-medium text-slate-800 dark:text-slate-100">
              ${t('ui.actions.increment', {})}
            </span>
          </div>
        </div>
      </div>
    `;
    return buildAndInterpolate(template, this);
  }
}
