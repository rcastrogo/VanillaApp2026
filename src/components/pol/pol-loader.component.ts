
import type { ComponentInitValue } from "../component.model";

import { buildAndInterpolate } from "@/core/dom";

export function PolLoaderComponent(){

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