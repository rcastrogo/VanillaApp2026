
import { APP_CONFIG } from '@/app.config';
import { buildAndInterpolate } from '@/core/dom';
import { router } from '@/core/services/router.service';
import { BaseComponent } from '@/core/types';

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
  { id: 'hydration',   label: 'Hydration',    icon: 'zap',        color: 'bg-yellow-400 text-slate-900' },
  { id: 'template',    label: 'Template/DSL', icon: 'code',       color: 'bg-blue-600 text-white' },
  { id: 'pubsub',      label: 'PubSub',       icon: 'radio',      color: 'bg-pink-600 text-white' }, 
  { id: 'translation', label: 'i18n',         icon: 'globe',      color: 'bg-green-600 text-white' },
  { id: 'reports',     label: 'Reports',      icon: 'bar-chart',  color: 'bg-orange-500 text-white' },
  { id: 'storage',     label: 'Storage',      icon: 'database',   color: 'bg-teal-600 text-white' },
  { id: 'endpoint',    label: 'Endpoint Svc', icon: 'server',     color: 'bg-violet-600 text-white' },
  { id: 'simpsons',    label: 'Simpsons Svc', icon: 'tv',         color: 'bg-yellow-400 text-slate-900' },
  { id: 'props',       label: 'Props',        icon: 'share-2',    color: 'bg-indigo-600 text-white' },
];

export default class POC1Page extends BaseComponent {

  init() {
    this.registerDemoComponents();
    this.setState({ activeTab: 'simpsons' as Tab });
  }

  goHome() {
    router.navigateTo('landing');
  }

  selectTab(_el: HTMLElement, _ev: Event, tabId: Tab) {
    if(this.state.activeTab === tabId) return;
    this.state.activeTab = tabId;
  }

  private registerDemoComponents(){
    APP_CONFIG.registerComponents(
      ['hydration-demo', () => import('../components/hydration-demo.component')],
      ['template-demo', () => import('../components/template-demo.component')],
      ['pubsub-demo', () => import('../components/pubsub-demo.component')], 
      ['translation-demo', () => import('../components/translation-demo.component')],
      ['reports-demo', () => import('../components/dom-reports-demo.component')],
      ['storage-demo', () => import('../components/storage-demo.component')],
      ['endpoint-demo', () => import('../components/endpoint-service-demo.component')],
      ['simpsons-demo', () => import('../components/simpsons-service-demo.component')],
      ['props-demo', () => import('../components/props-passing-demo.component')],
      ['props-child-component', () => import('../components/props-passing-child.component')]
    );
  }

  render() {

    const template = `
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
          <div data-each="tab in TABS" class="flex flex-wrap gap-2">
            <button 
              on-click="selectTab:@tab.id"
              class="
                flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium 
                transition-colors border border-slate-200 dark:border-slate-700
                @if(state.activeTab === tab.id)
                  {tab.id | resolveColor}
                @endif
                @if(state.activeTab !== tab.id)
                   bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700
                @endif"
              >
              <i data-icon="{tab.icon}" class="size-4"></i>
              <span class="hidden sm:inline">{tab.label}</span>
            </button>
          </div>
        </div>
        <div class="max-w-6xl mx-auto">
          <div id="demo-container" class="mt-6">
            <div 
              data-component="{state.activeTab}-demo" 
              class="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            </div>
          </div>
        </div>
      </div>
    `;
    return buildAndInterpolate(
      template, 
      {
        ...this, 
        TABS: TABS, 
        resolveColor: (tabId: string) => {
          return TABS.find(t => t.id === tabId)?.color || '';
        }
      }
    );
  }
}
