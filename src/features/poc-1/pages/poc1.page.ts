
import { loadGithubComponent } from '../components/github';

import { APP_CONFIG } from '@/app.config';
import type { ComponentInitValue } from '@/components/component.model';
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
  | 'props'
  | 'bars';

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
  { id: 'bars',        label: 'ProgressBar',  icon: 'share-2',    color: 'bg-indigo-600 text-white' },
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

  renderProgressBarDemo() {
    const template = `   
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
        <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <i data-icon="bar-chart" class="size-5 text-orange-500"></i>
          Github Progress Bar Component Demo
        </h2>
    
        <div data-component="app-progress-bar" class="mt-2 h-1" 
          data-interval-speed="150"
          data-increment="5"
          data-percentage-position="left"
          data-change-color="false"
          data-show-percentage="false">
        </div>

        <div data-component="app-progress-bar" class="mt-2 h-8" 
          data-percentage-position="center"
          data-show-percentage="true">
        </div>
        <div data-component="app-progress-bar" class="mt-2 h-5" 
          data-percentage-position="left"
          data-show-percentage="true">
        </div>
        <div data-component="app-progress-bar" class="mt-2 h-2"
          data-interval-speed="350"
          data-increment="1"
          data-progress-background="bg-gray-500 dark:bg-gray-700">
        </div>
        <div data-component="app-progress-bar" class="mt-2 h-5" 
          data-percentage-position="right"
          data-show-percentage="true"
          data-progress-background="bg-red-500 dark:bg-red-700">
        </div>
        <div data-component="app-progress-bar" class="mt-2 h-5" 
          data-increment="1"
          data-percentage-position="right"
          data-show-percentage="true"
          data-change-color="true">
        </div>
        <div data-component="app-toast-entry"></div>
        <div data-component="app-toast-entry" data-type="error" data-duration="4000"></div>
        <div data-component="app-toast-entry" data-type="warning" data-duration="5000"></div>
        <div data-component="app-toast-entry" data-type="info" data-duration="6000"></div>
        <div data-component="app-badge" data-variant="secondary"></div>
        <div data-component="app-badge" data-variant="error" data-text="Error 5"></div>
        <div data-component="app-badge" data-variant="outline">
          Texto personalizado
        </div>
        <div data-component="app-badge" data-variant="success" data-size="lg" data-removable="true" data-text="Removable"></div></div>
        <div data-component="app-skeleton" class="mt-4" data-animated="true" data-avatar="true" data-lines="3"></div>
        <div data-component="app-skeleton" class="mt-4" data-animated="false" data-avatar="false" data-lines="5"></div>
        <div data-component="app-badge" data-variant="outline">
          Texto personalizado
        </div>
        <div data-component="app-skeleton" class="mt-4" data-animated="true" data-avatar="false" data-lines="8"></div>
        <div data-component="app-skeleton" class="mt-4" data-animated="false" data-avatar="true"  data-lines="4"></div>
        <div 
          data-component="app-modal" 
          class="mt-4" 
          data-title="Demo Modal" 
          data-size="xl" 
          data-closable="true"
          data-backdrop="true"
          data-show-header="true"
          data-show-footer="true"
        >
          <p class="">
            Este es un modal de demostración para mostrar las capacidades del sistema de componentes. 
            Puede contener cualquier contenido HTML, como texto, imágenes o incluso otros componentes.  
          </p>
        </div>
        <div
          data-component="app-tabs"
          data-active="0"
          data-variant="default"
          data-full-width="true"
          data-tabs='[
            { "label": "Overview", "title": "Overview", "content": "Contenido del overview" },
            { "label": "Users", "title": "Usuarios", "content": "Listado de usuarios" },
            { "label": "Settings", "title": "Configuración", "content": "Opciones de configuración" }
          ]'
        ></div>
      </div>
      `;
      loadGithubComponent();
      return template
  }


  render() {

    const template = `
      <div class="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4">
        <div class="h-40 w-full relative">
          esta sección simula una carga inicial de datos o recursos necesarios para la demostración, mostrando el componente de loader global que reacciona a los eventos de carga del sistema.
          <div data-component="app-loader-small"></div>
        </div>  
        <div class="max-w-6xl mx-auto">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h1 class="text-2xl font-black text-slate-900 dark:text-white">
                POC-1 <span class="text-indigo-500">BaseComponent</span> Features
              <div class="inline-flex"
                data-component="app-loader-small" 
                data-mode="inline" 
                data-message="Cargando recursos...">
              </div> 
              
              <div class="inline-flex"
                data-component="app-loader-small" 
                data-mode="inline" 
                data-message="Espere..."
                data-size="size-10">
              </div> 

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
            ${this.state.activeTab === 'bars' ? this.renderProgressBarDemo() : ''}
            @if(state.activeTab !== 'bars')
              <div 
                data-component="{state.activeTab}-demo" 
                class="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              </div>
            @endif
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


function LoaderComponent(){

  return {
    size: 'size-6',
    message : 'Cargando',
    mode: 'overlay', // 'inline' o 'overlay'
    init : function(ctx: ComponentInitValue){
      const props = ctx.parent?.dataset || {};
      this.message = props.message || '';
      this.mode = props.mode === 'inline' ? 'inline' : 'overlay';
      this.size = props.size || this.size;
    },
    render: function() {
      const size = this.size;
      const message = this.message;  
      const useOverlay = this.mode === 'overlay';
      return useOverlay ? renderOverlay(message, size) : renderInline(message, size);
    }
  }

  function renderInline(message: string, size: string) {
    const template = `
      <div class="flex font-medium items-center justify-center @if(message.length)gap-2@endif">
        <div class="{size} animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
        <div class="text-sm text-gray-500">{message}</div>
      </div>
    `;
    return buildAndInterpolate(template, { message, size});
  }

  function renderOverlay(message: string, size: string) {
    const template = `
        <div class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/40  dark:bg-gray-700/20  backdrop-blur-xs">
          <div class="{size} animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <div class="mt-1 font-medium text-foreground tracking-wide">{message}</div>
        </div>
    `;
    return buildAndInterpolate(template, { message, size });
  }

};

// Registro explícito fuera de la clase
Promise.resolve().then(() => {
  APP_CONFIG.registerComponent('app-loader-small', LoaderComponent);
});