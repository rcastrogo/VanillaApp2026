import type { ComponentContext } from '@/components/component.model';
import { buildAndInterpolate } from '@/core/dom';
import { router } from '@/core/services/router.service';
import { BaseComponent } from '@/core/types';

import { DomReportsDemoComponent } from '../components/dom-reports-demo.component';
import { EndpointServiceDemoComponent } from '../components/endpoint-service-demo.component';
import { HydrationDemoComponent } from '../components/hydration-demo.component';
import { PropsPassingDemoComponent } from '../components/props-passing-demo.component';
import { PubSubDemoComponent } from '../components/pubsub-demo.component';
import { SimpsonsServiceDemoComponent } from '../components/simpsons-service-demo.component';
import { StorageDemoComponent } from '../components/storage-demo.component';
import { TemplateDemoComponent } from '../components/template-demo.component';
import { TranslationDemoComponent } from '../components/translation-demo.component';

type Tab =
  | 'hydration'
  | 'template'
  | 'pubsub'
  | 'translation'
  | 'reports'
  | 'storage'
  | 'endpoint'
  | 'simpsons'
  | 'props';

interface TabDef {
  id: Tab;
  label: string;
  icon: string;
  color: string;
}

const TABS: TabDef[] = [
  { id: 'hydration',   label: 'Hydration',   icon: 'zap',        color: 'yellow'  },
  { id: 'template',    label: 'Template/DSL', icon: 'code',       color: 'blue'    },
  { id: 'pubsub',      label: 'PubSub',       icon: 'radio',      color: 'pink'    },
  { id: 'translation', label: 'i18n',         icon: 'globe',      color: 'green'   },
  { id: 'reports',     label: 'Reports',      icon: 'bar-chart',  color: 'orange'  },
  { id: 'storage',     label: 'Storage',      icon: 'database',   color: 'teal'    },
  { id: 'endpoint',    label: 'Endpoint Svc', icon: 'server',     color: 'violet'  },
  { id: 'simpsons',    label: 'Simpsons Svc', icon: 'tv',         color: 'yellow'  },
  { id: 'props',       label: 'Props',        icon: 'share-2',    color: 'indigo'  },
];

const COLOR_ACTIVE: Record<string, string> = {
  yellow:  'bg-yellow-400 text-slate-900',
  blue:    'bg-blue-600 text-white',
  pink:    'bg-pink-600 text-white',
  green:   'bg-green-600 text-white',
  orange:  'bg-orange-500 text-white',
  teal:    'bg-teal-600 text-white',
  violet:  'bg-violet-600 text-white',
  indigo:  'bg-indigo-600 text-white',
};

export default class POC1Page extends BaseComponent {

  private demoInstance: BaseComponent | null = null;

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  init() {
    this.setState({ activeTab: 'hydration' as Tab });
  }

  goHome() {
    router.navigateTo('landing');
  }

  selectTab(_el: HTMLElement, _ev: Event, tabId: Tab) {
    if (this.demoInstance) {
      this.demoInstance.destroy();
      this.demoInstance = null;
    }
    this.state.activeTab = tabId;
  }

  private buildDemo(tab: Tab): BaseComponent {
    switch (tab) {
      case 'hydration':   return new HydrationDemoComponent({});
      case 'template':    return new TemplateDemoComponent({});
      case 'pubsub':      return new PubSubDemoComponent({});
      case 'translation': return new TranslationDemoComponent({});
      case 'reports':     return new DomReportsDemoComponent({});
      case 'storage':     return new StorageDemoComponent({});
      case 'endpoint':    return new EndpointServiceDemoComponent({});
      case 'simpsons':    return new SimpsonsServiceDemoComponent({});
      case 'props':       return new PropsPassingDemoComponent({});
    }
  }

  render() {
    const activeTab = (this.state.activeTab as Tab) ?? 'hydration';
    const activeTabDef = TABS.find(t => t.id === activeTab) ?? TABS[0];

    // Tab buttons
    const tabButtons = TABS.map(tab => {
      const isActive = tab.id === activeTab;
      const activeClass = isActive ? COLOR_ACTIVE[tab.color] : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700';
      return `
        <button on-click="selectTab:${tab.id}"
          class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeClass} border border-slate-200 dark:border-slate-700">
          <i data-icon="${tab.icon}" class="size-4"></i>
          <span class="hidden sm:inline">${tab.label}</span>
        </button>
      `;
    }).join('');

    // Build the demo component
    this.demoInstance = this.buildDemo(activeTab);
    this.demoInstance.init?.();
    const demoEl = this.demoInstance.render();
    this.demoInstance.element = demoEl as HTMLElement;

    const wrapper = document.createElement('div');
    wrapper.className = 'min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300';

    const headerHtml = `
      <div class="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4">
        <div class="max-w-6xl mx-auto">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h1 class="text-2xl font-black text-slate-900 dark:text-white">
                POC-1 <span class="text-indigo-500">BaseComponent</span> Features
              </h1>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Demostración completa de las características del sistema
              </p>
            </div>
            <button on-click="goHome"
              class="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              <i data-icon="arrow-left" class="size-4"></i>
              <span class="hidden sm:inline">Landing</span>
            </button>
          </div>
          <div class="flex flex-wrap gap-2">
            ${tabButtons}
          </div>
        </div>
      </div>
    `;

    const headerEl = buildAndInterpolate(headerHtml, this) as HTMLElement;
    wrapper.appendChild(headerEl);

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'max-w-6xl mx-auto px-4 py-6';

    const breadcrumb = document.createElement('p');
    breadcrumb.className = 'text-xs text-slate-400 dark:text-slate-500 mb-4 font-mono';
    breadcrumb.textContent = `src/features/poc-1/components/${activeTab}-demo.component.ts  ·  ${activeTabDef.label}`;
    contentWrapper.appendChild(breadcrumb);

    contentWrapper.appendChild(demoEl);
    wrapper.appendChild(contentWrapper);

    this.bind(wrapper);
    return wrapper;
  }
}
