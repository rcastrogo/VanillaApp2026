import { APP_CONFIG } from "@/app.config";
import type { ComponentInitValue } from "@/components/component.model";
import { buildAndInterpolate } from "@/core/dom";
import { buildAndInterpolateDSL } from "@/core/template-compiler";

export function loadGithubComponent() {
  console.log('Github component loaded');
}

function ToastComponent() {
  return {
    element: null as HTMLElement | null,
    type: 'success', // 'success', 'error', 'warning', 'info'
    message: 'Mensaje por defecto',
    duration: 3000,
    position: 'top-right', // 'top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center'
    closable: true,
    closeToast: function () {
      this.element?.remove();
    },
    init: function (ctx: ComponentInitValue) {
      const props = ctx.parent?.dataset || {};
      this.type = props.type || this.type;
      this.message = props.message || this.message;
      this.duration = parseInt(props.duration ?? '0') || this.duration;
      this.position = props.position || this.position;
      this.closable = props.closable !== 'false';

      if (this.duration > 0) {
        setTimeout(() => this.closeToast(), this.duration);
      }
    },
    render: function () {
      const { type, message, position, closable } = this;
      const positionClasses = getPositionClasses(position);
      const typeClasses = getTypeClasses(type);
      const icon = getTypeIcon(type);

      const template = `
        <div class="toast-enter fixed ${positionClasses} z-50 max-w-sm mx-4 mb-4">
          <div class="flex items-center p-4 rounded-lg shadow-lg backdrop-blur-sm ${typeClasses}">
            <i data-icon="${icon}" class="size-5 mr-3 shrink-0"></i>
            <div class="flex-1 text-sm font-medium">${message}</div>
            @if(${closable})
              <button on-click="closeToast" class="ml-3 p-1 hover:bg-black/10 rounded">
                <i data-icon="x" class="size-4"></i>
              </button>
            @endif
          </div>
        </div>
      `;
      return buildAndInterpolate(template, this);
    }
  };

  function getPositionClasses(position: string) {
    const positions = {
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'top-center': 'top-4 left-1/2 transform -translate-x-1/2'
    } as Record<string, string>;
    return positions[position] || positions['top-right'];
  }

  function getTypeClasses(type: string) {
    const types = {
      'success': 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800',
      'error': 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800',
      'warning': 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800',
      'info': 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800'
    } as Record<string, string>;
    return types[type] || types['info'];
  }

  function getTypeIcon(type: string) {
    const icons = {
      'success': 'success',
      'error': 'error',
      'warning': 'warning',
      'info': 'info'
    } as Record<string, string>;
    return icons[type] || icons['info'];
  }
}

export function BadgeComponent() {
  return {
    Element: null as HTMLElement | null,
    variant: 'primary', // 'primary', 'secondary', 'success', 'warning', 'error', 'outline'
    size: 'md', // 'sm', 'md', 'lg'
    removable: false,
    text: 'Badge',

    init: function(ctx: ComponentInitValue) {
      const props = ctx.parent?.dataset || {};
      this.variant = props.variant || this.variant;
      this.size = props.size || this.size;
      this.removable = props.removable === 'true';
      this.text = props.text || ctx.parent?.textContent?.trim() || this.text;
    },

    render: function() {
      const { variant, size, removable, text } = this;
      const variantClasses = getVariantClasses(variant);
      const sizeClasses = getSizeClasses(size);

      const template = `
        <span class="inline-flex items-center gap-1 font-medium rounded-full ${variantClasses} ${sizeClasses}">
          <span>${text}</span>
          @if(${removable})
            <button onclick="this.closest('span').remove()" class="hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5">
              <i data-icon="x" class="size-3"></i>
            </button>
          @endif
        </span>
      `;
      return buildAndInterpolate(template, this);
    }
  };

  function getVariantClasses(variant: string) {
    const variants = {
      'primary': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'secondary': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      'success': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'warning': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'error': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      'outline': 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
    } as Record<string, string>;
    return variants[variant] || variants['primary'];
  }

  function getSizeClasses(size: string) {
    const sizes = {
      'sm': 'px-2 py-0.5 text-xs',
      'md': 'px-2.5 py-1 text-sm',
      'lg': 'px-3 py-1.5 text-base'
    } as Record<string, string>;
    return sizes[size] || sizes['md'];
  }
}

export function SkeletonComponent() {
  return {
    type: 'text', // 'text', 'avatar', 'card', 'custom'
    lines: 3,
    avatar: false,
    animated: true,
    init: function(ctx: ComponentInitValue) {
      const props = ctx.parent?.dataset || {};
      this.type = props.type || this.type;
      this.lines = parseInt(props.lines ?? '0') || this.lines;
      this.avatar = props.avatar === 'true';
      this.animated = props.animated !== 'false';
    },
    render: function() {
      const { type, animated } = this;
      const animationClass = animated ? 'animate-pulse' : '';

      switch (type) {
        case 'avatar':
          return this.renderAvatar(animationClass);
        case 'card':
          return this.renderCard(animationClass);
        case 'text':
          return this.renderText(animationClass);
        default:
          return this.renderCustom(animationClass);
      }
    },
    renderText: function(animationClass: string) {
      const { lines, avatar } = this;
      const linesArray = Array.from({ length: lines }, (_, i) => i);

      const template = `
        <div class="${animationClass}">
          @if(${avatar})
            <div class="flex items-start gap-3 mb-4">
              <div class="size-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div class="flex-1">
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
              </div>
            </div>
          @endif
          
          @each(line in ${JSON.stringify(linesArray)})
            <div 
              class="
                h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3 
                @if(line === 0)w-full@endif 
                @if(line === 1)w-4/5@endif 
                @if(line === 2)w-3/5@endif
                @if(line > 2)w-1/6@endif
                ">
              </div>
          @endeach
        </div>
      `;
      return buildAndInterpolateDSL(template, this);
    },

    renderCard: function(animationClass: string) {
      const template = `
        <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${animationClass}">
          <div class="h-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5 mb-2"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/5"></div>
        </div>
      `;
      return buildAndInterpolate(template, this);
    },

    renderAvatar: function(animationClass: string) {
      const template = `
        <div class="flex items-center gap-3 ${animationClass}">
          <div class="size-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div class="flex-1">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          </div>
        </div>
      `;
      return buildAndInterpolate(template, this);
    },

    renderCustom: function(animationClass: string) {
      const template = `
        <div class="space-y-3 ${animationClass}">
          <slot name="skeleton">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </slot>
        </div>
      `;
      return buildAndInterpolate(template, this);
    }
  };
}

function ModalComponent() {
  return {
    element: null as HTMLElement | null,
    children: [] as Node[],
    title: 'Modal',
    size: 'md', // 'sm', 'md', 'lg', 'xl', 'full'
    closable: true,
    backdrop: true, // Click en backdrop para cerrar
    showHeader: true,
    showFooter: false,

    init: function(ctx: ComponentInitValue) {
      const props = ctx.parent?.dataset || {};
      this.title = props.title || this.title;
      this.size = props.size || this.size;
      this.closable = props.closable !== 'false';
      this.backdrop = props.backdrop !== 'false';
      this.showHeader = props.showHeader !== 'false';
      this.showFooter = props.showFooter === 'true';
      this.children = ctx.parent ? Array.from(ctx.parent.children) : [];
      document.body.classList.add('overflow-hidden');
    },

    closeModal: function() {
      document.body.classList.remove('overflow-hidden');
      this.element?.remove();
    },

    render: function() {
      const { title, size } = this;
      const sizeClasses = getSizeClasses(size);

      const template = `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
               @if(backdrop) on-click="closeModal"@endif
            >
          </div>
          
          <!-- Modal -->
          <div class="modal relative bg-white dark:bg-gray-900 rounded-lg shadow-xl ${sizeClasses} max-h-[90vh] flex flex-col">
            
            @if(showHeader)
              <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${title}</h3>
                @if({closable})
                  <button on-click="closeModal" 
                          class="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                    <i data-icon="x" class="size-5"></i>
                  </button>
                @endif
              </div>
            @endif

            <!-- Content Slot -->
            <div class="flex-1 overflow-auto p-6">
              <slot name="content">
                <div 
                  data-each="child in children" 
                  class="">
                </div>              
              </slot>
            </div>

            @if(showFooter)
              <div class="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <slot name="footer">
                  <button on-click="closeModal" class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                    Cancelar
                  </button>
                  <button on-click="closeModal" class="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded">
                    Aceptar
                  </button>
                </slot>
              </div>
            @endif

          </div>
        </div>
      `;
      return buildAndInterpolate(template, this);
    }
  };

  function getSizeClasses(size: string) {
    const sizes = {
      'sm': 'w-full max-w-md',
      'md': 'w-full max-w-lg',
      'lg': 'w-full max-w-2xl',
      'xl': 'w-full max-w-4xl',
      'full': 'w-full max-w-7xl'
    } as Record<string, string>;
    return sizes[size] || sizes['md'];
  }
}

function TabsComponent() {
  
  return {
    element: null as HTMLElement | null,
    active: 0,
    tabs: [],
    variant: 'default', // default | pills | underline
    fullWidth: false,

    init: function(ctx: ComponentInitValue) {
      const props = ctx.parent?.dataset || {};

      this.active = Number(props.active || 0);
      this.variant = props.variant || 'default';
      this.fullWidth = props.fullWidth === 'true';

      try {
        this.tabs = props.tabs ? JSON.parse(props.tabs) : [];
      } catch {
        this.tabs = [];
      }

      if (!Array.isArray(this.tabs)) {
        this.tabs = [];
      }

      if (this.active < 0 || this.active >= this.tabs.length) {
        this.active = 0;
      }
    },

    resolveWrapperClasses: function() {
      return this.fullWidth ? 'w-full' : 'w-full';
    },

    resolveTabListClasses: function() {
      const base = 'flex gap-1 overflow-x-auto no-scrollbar overflow-y-hidden';

      const variants: Record<string, string> = {
        default: 'rounded-lg bg-gray-100 dark:bg-gray-800 p-1',
        pills: 'p-1',
        underline: 'border-b border-gray-200 dark:border-gray-700'
      };

      return `${base} ${variants[this.variant] || variants.default}`;
    },

    resolveTabButtonClasses: function(index: number) {
      const isActive = index === this.active;
      const full = this.fullWidth ? 'flex-1' : 'shrink-0';

      if (this.variant === 'pills') {
        return `
          ${full}
          px-4 py-2 rounded-full text-sm font-medium transition
          ${isActive
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}
        `;
      }

      if (this.variant === 'underline') {
        return `
          ${full}
          px-4 py-2 text-sm font-medium border-b-2 -mb-px transition whitespace-nowrap
          ${isActive
            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
            : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-indigo-500'}
        `;
      }

      return `
        ${full}
        px-4 py-2 rounded-md text-sm font-medium transition whitespace-nowrap
        ${isActive
          ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
          : 'text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-700/60'}
      `;
    },

    renderTabHeaders: function() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return this.tabs.map((tab: any, index: number) => `
        <button
          on-click="activateTab:${index}"
          type="button"
          class="${this.resolveTabButtonClasses(index)}"
          data-tab-index="${index}"
        >
          ${tab.label || `Tab ${index + 1}`}
        </button>
      `).join('');
    },

    renderActivePanel: function() {
      const currentTab = this.tabs[this.active] as { title?: string, content: string } | undefined;

      if (!currentTab) {
        return `
          <div class="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-6 text-sm text-gray-500 dark:text-gray-400 text-center">
            No tabs available
          </div>
        `;
      }

      return `
        <div class="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-5">
          <div class="mb-2 text-base font-semibold text-gray-900 dark:text-white">${currentTab.title}</div>
          <div class="text-sm text-gray-600 dark:text-gray-300">
            ${currentTab.content}
          </div>
        </div>
      `;
    },
    activateTab(_el: HTMLElement, _ev: Event, index: number) {
      if (index === this.active) return;
      this.active = index;
      this.element?.replaceWith(this.render());
    },
    render: function() {
      const template = `
        <div class="{wrapperClasses}">
          <div class="{tabListClasses}">
            {tabHeaders}
          </div>
          <div class="mt-4">
            {panel}
          </div>
        </div>
      `;

      return this.element = buildAndInterpolate(template, {
        wrapperClasses: this.resolveWrapperClasses(),
        tabListClasses: this.resolveTabListClasses(),
        tabHeaders: this.renderTabHeaders(),
        panel: this.renderActivePanel(),
        activateTab : this.activateTab.bind(this),
      });
    }
  };
}


// Registro explícito fuera de la clase
Promise.resolve().then(() => {
  APP_CONFIG.registerComponents(
    ['app-toast-entry', ToastComponent],
    ['app-badge', BadgeComponent],
    ['app-skeleton', SkeletonComponent],
    ['app-modal', ModalComponent],
    ['app-tabs', TabsComponent]
  )
});