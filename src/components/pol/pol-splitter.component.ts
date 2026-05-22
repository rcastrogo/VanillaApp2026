
import type { ComponentInitValue } from '../component.model';

import { $, buildAndInterpolate } from '@/core/dom';
import { storage } from '@/core/storageUtil';

type SplitterMode = 'horizontal' | 'vertical';

interface SplitterState {
  mode: SplitterMode;
  size: string; // width or height of left panel
}
export interface SplitterOptions {
  key?: string;
  mode?: 'horizontal' | 'vertical';
  height?: string;
  leftHtml?: string;
  rightHtml?: string;
  className?: string;
}

const MIN_SIZE_PX = 80;
const BASE_BAR_CLASSES = 'shrink-0 select-none transition-colors hover:bg-blue-400 dark:hover:bg-blue-400';
const H_CLASSES = BASE_BAR_CLASSES + ' w-1.5 h-full cursor-col-resize border-l border-r border-slate-200 dark:border-slate-700';
const V_CLASSES = BASE_BAR_CLASSES + ' h-1.5 w-full cursor-row-resize border-t border-b border-slate-200 dark:border-slate-700';

export function PolSplitterComponent() {

  let root!: HTMLElement;
  let leftPanel!: HTMLElement;

  let storageKey = '';
  let mode: SplitterMode = 'horizontal';
  let leftContent: Element | null = null;
  let rightContent: Element | null = null;
  let minSize = MIN_SIZE_PX;

  let startX = 0;
  let startY = 0;
  let startWidth = 0;
  let startHeight = 0;

  return {

    init(ctx: ComponentInitValue) {
      const props = ctx.parent?.dataset || {};
      storageKey = props.key || '';
      mode = (props.mode === 'vertical' ? 'vertical' : 'horizontal') as SplitterMode;
      minSize = Number(props.minSize) || MIN_SIZE_PX;
      if (ctx.parent) {
        leftContent = $('[data-slot-left]', ctx.parent).one();
        rightContent = $('[data-slot-right]', ctx.parent).one();
      }
    },

    destroy() {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    },

    render() {
      const isVertical = mode === 'vertical';
      const barClass = isVertical ? V_CLASSES : H_CLASSES;
      const template = `
        <div class="flex w-full overflow-hidden ${isVertical ? 'flex-col' : 'flex-row'}">
          <div data-splitter-left class="overflow-auto ${isVertical ? 'w-full' : 'w-2/5'}">
            <slot name="left"></slot>
          </div>
          <div 
            data-splitter-bar
            on-dblclick="onDblClick"
            on-mousedown="onMouseDown"
            class="${barClass}">
          </div>
          <div data-splitter-right class="flex-1 overflow-auto">
            <slot name="right"></slot>
          </div>
        </div>
      `;
 
      root = buildAndInterpolate(
        template, 
        {   
          onDblClick, 
          onMouseDown,
          slottedNodes : {
            right: [rightContent],
            left: [leftContent]
          }
        }
      );      
      return root;
    },
    mounted() {
      leftPanel = $<HTMLElement>('[data-splitter-left]', root).one()!;
      if (storageKey) restoreState()    
    },
  };

  function clamp(value: number, containerSize: number): number {
    const max = containerSize - minSize;
    return Math.max(minSize, Math.min(value, max));
  }

  function saveState() {
    if (!storageKey) return;
    const size = mode === 'vertical' ? leftPanel.style.height : leftPanel.style.width;
    const state: SplitterState = { mode, size };
    storage.writeValue(getStorageKey(), state);
  }

  function restoreState() {
    const saved = storage.readValue<SplitterState>(getStorageKey());
    if (!saved) return;

    const bar = $<HTMLElement>('[data-splitter-bar]', root).one()!;

    // Restore mode if different
    if (saved.mode !== mode) {
      mode = saved.mode;
      if (mode === 'vertical') {
        root.classList.replace('flex-row', 'flex-col');
        leftPanel.style.width = '100%';
        bar.className = V_CLASSES;
      } else {
        root.classList.replace('flex-col', 'flex-row');
        leftPanel.style.height = '';
        bar.className = H_CLASSES;
      }
    }

    // Restore size
    if (saved.size) {
      if (mode === 'vertical') {
        leftPanel.style.height = saved.size;
      } else {
        leftPanel.style.width = saved.size;
      }
    }
  }

  function onDblClick(bar: HTMLElement) {
    mode = mode === 'horizontal' ? 'vertical' : 'horizontal';
    if (mode === 'vertical') {
      root.classList.replace('flex-row', 'flex-col');
      leftPanel.style.width = '100%';
      leftPanel.style.height = '40%';
      bar.className = V_CLASSES;
    } else {
      root.classList.replace('flex-col', 'flex-row');
      leftPanel.style.height = '';
      leftPanel.style.width = '40%';
      bar.className = H_CLASSES;
    }
    saveState();
  }

  function onMouseMove(e: MouseEvent) {
    e.preventDefault();
    if (mode === 'vertical') {
      const containerHeight = root.clientHeight;
      const newHeight = clamp(startHeight + (e.pageY - startY), containerHeight);
      leftPanel.style.height = `${newHeight}px`;
    } else {
      const containerWidth = root.clientWidth;
      const newWidth = clamp(startWidth + (e.pageX - startX), containerWidth);
      leftPanel.style.width = `${newWidth}px`;
    }
  }

  function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    root.classList.remove('select-none');
    saveState();
  }

  function onMouseDown(_el: HTMLElement, e: MouseEvent) {
    startWidth = leftPanel.offsetWidth;
    startHeight = leftPanel.offsetHeight;
    startX = e.pageX;
    startY = e.pageY;
    root.classList.add('select-none');
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  function getStorageKey() {
    return `splitter-${storageKey}`;
  }

}

export function createSplitter(options: SplitterOptions = {}): HTMLElement {
  const {
    key = '',
    mode = 'horizontal',
    height = 'h-64',
    leftHtml = '<div class="p-2 text-sm text-slate-500">Panel izquierdo</div>',
    rightHtml = '<div class="p-2 text-sm text-slate-500">Panel derecho</div>',
    className = '',
  } = options;

  const template = `
    <div 
      data-component="app-pol-splitter" 
      data-key="${key}"
      data-mode="${mode}"
      class="border rounded-lg overflow-hidden ${height} ${className}"
    >
      <div data-slot-left class="h-full p-2">${leftHtml}</div>
      <div data-slot-right class="h-full p-2">${rightHtml}</div>
    </div>
  `;
  return buildAndInterpolate(template, {});
}