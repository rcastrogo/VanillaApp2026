
import type { ComponentContext, ComponentInitValue } from "./component.model";

import { $, build, buildAndInterpolate } from "@/core/dom";
import { useState } from "@/core/state.utils";
import { BaseComponent } from "@/core/types";


interface TabData { id: string; title: string; icon: string; alt?: string }

export interface TabEventDetail {
  id: string;
  title: string;
  index: number;
}

type TabVariant = 
  'underline' | 'pills' | 
  'segmented' | 'boxed' | 'lifted' | 
  'soft' | 'outline';

interface VariantClasses {
  base: string[];
  active: string[];
  inactive: string[];
}

const VARIANT_STYLES: Record<TabVariant, VariantClasses> = {
  underline: {
    base: ['border-b-2', 'hover:text-indigo-500', 'dark:hover:text-indigo-400'],
    active: ['border-indigo-500', 'text-indigo-600', 'dark:border-indigo-400', 'dark:text-indigo-400'],
    inactive: ['border-transparent', 'text-slate-400', 'dark:text-slate-500'],
  },
  pills: {
    base: ['rounded-full', 'border', 'border-transparent', 'mb-1', 'mr-2'],
    active: ['bg-indigo-500', 'text-white', 'dark:bg-indigo-600'],
    inactive: ['bg-transparent', 'text-slate-500', 'hover:bg-slate-100', 'dark:text-slate-400', 'dark:hover:bg-slate-800'],
  },
  segmented: {
    base: ['border', 'first:rounded-l-md', 'last:rounded-r-md', 'mb-1', '-ml-px', 'dark:border-slate-700'],
    active: ['bg-blue-500', 'text-white', 'z-10', 'dark:bg-blue-600'],
    inactive: ['bg-white', 'text-slate-600', 'hover:bg-slate-100', 'dark:bg-slate-800', 'dark:text-slate-400', 'dark:hover:bg-slate-700'],
  },
  boxed: {
    base: ['px-4', 'py-2', 'text-sm', 'font-medium', 'border', 'border-b-0', 'rounded-t-md', 'transition-colors'],
    active: ['bg-white', 'text-indigo-600', 'border-slate-300', 'dark:bg-slate-900', 'dark:text-indigo-400', 'dark:border-slate-700'],
    inactive: ['bg-slate-50', 'text-slate-500', 'border-transparent', 'hover:text-slate-700', 'hover:bg-slate-100', 'dark:bg-slate-800/50', 'dark:text-slate-400', 'dark:hover:text-slate-300', 'dark:hover:bg-slate-800'],
  },
  lifted: {
    base: ['px-4', 'py-2', 'text-sm', 'font-medium', 'rounded-t-lg', 'border-b-2', 'transition-all'],
    active: ['bg-white', 'text-indigo-700', 'border-indigo-500', 'shadow-sm', 'dark:bg-slate-900', 'dark:text-indigo-400', 'dark:border-indigo-400'],
    inactive: ['bg-transparent', 'text-slate-400', 'border-transparent', 'hover:text-slate-600', 'dark:text-slate-500', 'dark:hover:text-slate-300'],
  },
  soft: {
    base: ['rounded-lg', 'mr-1', 'mb-1'],
    active: ['bg-indigo-100', 'text-indigo-700', 'dark:bg-indigo-900/50', 'dark:text-indigo-300'],
    inactive: ['text-slate-500', 'hover:bg-slate-100', 'hover:text-slate-700', 'dark:text-slate-400', 'dark:hover:bg-slate-800', 'dark:hover:text-slate-300'],
  },
  outline: {
    base: ['rounded-md', 'border', 'mb-1', 'mr-1'],
    active: ['border-indigo-500', 'text-indigo-600', 'bg-indigo-50', 'dark:border-indigo-400', 'dark:text-indigo-400', 'dark:bg-indigo-900/30'],
    inactive: ['border-slate-200', 'text-slate-500', 'hover:border-slate-400', 'hover:text-slate-700', 'dark:border-slate-700', 'dark:text-slate-400', 'dark:hover:border-slate-500', 'dark:hover:text-slate-300'],
  }
};

const VARIANTS: TabVariant[] = Object.keys(VARIANT_STYLES) as TabVariant[];

export class TabComponent extends BaseComponent {

  public tabchange?: (detail: TabEventDetail) => void;
  public tabclose?: (detail: TabEventDetail) => void;

  private slots: HTMLElement[] | null = null;
  private buttons: HTMLButtonElement[] = [];
  private tabNodes = new Map<string, HTMLElement>();

  private getTabDetail(tabId: string): TabEventDetail | null {
    const tabs: TabData[] = this.state.store.tabs || [];
    const index = tabs.findIndex(tab => tab.id === tabId);
    if (index < 0) return null;
    const tab = tabs[index];
    return {
      id: tab.id,
      title: tab.title || tab.alt || tab.id,
      index,
    };
  }

  raiseTabChange(tabId: string) { 
    const detail = this.getTabDetail(tabId);
    if (!detail) return;
    if (this.tabchange) this.tabchange(detail);
  }

  raiseTabClose(tabId: string) { 
    const detail = this.getTabDetail(tabId);
    if (!detail) return;
    if (this.tabclose) this.tabclose(detail);
  }

  private setActiveTab(tabId: string, emitEvent = true) {
    const nextTabId = tabId || '';
    const currentTabId = this.state.store.activeTabId || '';
    if (currentTabId === nextTabId) return;
    this.state.put('activeTabId', nextTabId);
    if (emitEvent && nextTabId) {
      this.raiseTabChange(nextTabId);
    }
  }


  constructor(ctx: ComponentContext) {
    super(ctx);
    this.setState(
       useState({
        tabs: [] as TabData[],
        activeTabId: '',
        variant: 'default'
      })
    );
  }

  public destroy(): void {
    console.log(`[Destroy] TabComponent`);
    return;
    // super.destroy();
  }

  init(ctx: ComponentInitValue) {
    super.init(ctx);
    const parsedTabs: TabData[] = [];
    const targets = (this.children || []).filter(child => child instanceof HTMLElement && child.dataset.id) as HTMLElement[];
    targets.forEach((child, index) => {
      const id = child.dataset.id || `tab-${index}`;
      parsedTabs.push({
        id,
        title: child.dataset.title || '',
        icon: child.dataset.iconName || '',
        alt: child.dataset.alt || ''
      });
      this.tabNodes.set(id, child);
    });
    this.addCleanup(
     this.state.on('activeTabId', (newId:string) => this.updateVisuals(newId))
    );
    this.state.put('tabs', parsedTabs);
    this.state.put('variant', this.props.variant || 'default');
    if (parsedTabs.length > 0) {
      this.state.put('activeTabId', this.props.selected ||  parsedTabs[0].id);
    }
  }

  selectTab(el: HTMLElement) {
    this.setActiveTab(el.dataset.targetId || '');
  }

  cycleVariant() {
    const current = this.state.store.variant as TabVariant;
    const idx = VARIANTS.indexOf(current);
    const next = VARIANTS[(idx + 1) % VARIANTS.length];
    this.state.put('variant', next);
    this.updateVisuals(this.state.store.activeTabId);
  }

  addTab(tab: TabData, content?: HTMLElement, activate = true) {
    const tabs: TabData[] = this.state.store.tabs;
    // Evitar agregar tabs con IDs duplicados
    if (tabs.some(t => t.id === tab.id)) return;
    if (content) this.tabNodes.set(tab.id, content);
    // ======================================================================
    // Crear slot para el contenido del tab
    // ======================================================================
    this.slots = this.slots || [];
    const slot = build<HTMLDivElement>(
      'div', 
      `<div id="tab-content-slot-${tab.id}" class="text-left text-slate-500 hidden"></div>`,
      true
    ) as HTMLDivElement;
    if (content) slot.appendChild(content);
    const slotsContainer = $('.tabs-container', this.element).one();
    slotsContainer?.appendChild(slot);
    this.slots = [...this.slots, slot];
    // ======================================================================
    // Crear botón del tab
    // ======================================================================
    const btn = buildAndInterpolate<HTMLButtonElement>(this.button_template, { ...this, tab }) as HTMLButtonElement;
    const buttonsContainer = $('.butons-container', this.element).one();
    buttonsContainer?.appendChild(btn);
    this.buttons.push(btn);
    this.state.put('tabs', [...tabs, tab]);
    if (activate) this.setActiveTab(tab.id);
  }

  removeTab(tabId: string) {
    const tabs: TabData[] = this.state.store.tabs;
    const activeTabId = this.state.store.activeTabId;
    // Verificar si el tab existe
    const filtered = tabs.filter(t => t.id !== tabId);
    if (filtered.length === tabs.length) return;
    // ======================================================================
    // Eliminar slot
    // ======================================================================
    if(this.slots) {
      const id = `tab-content-slot-${tabId}`;
      const slot = this.slots.find(s => s.id === id);
      slot?.remove();
      this.slots = this.slots.filter(s => s.id !== id);
    }
    // ======================================================================
    // Eliminar botón
    // ======================================================================
    const btn = this.buttons.find(b => b.dataset.targetId === tabId);
    btn?.remove();
    this.buttons = this.buttons.filter(b => b.dataset.targetId !== tabId);
    // ======================================================================
    // Actualizar estado
    // ======================================================================
    this.raiseTabClose(tabId);
    this.tabNodes.delete(tabId);
    this.state.put('tabs', filtered);
    if (activeTabId === tabId && filtered.length > 0) {
      this.setActiveTab(filtered[0].id);
    } else if (activeTabId === tabId) {
      this.setActiveTab('', false);
    }
  }

  private updateVisuals(activeId: string) {
    if (!this.element) return;
    const variant = (this.state.store.variant || 'default') as TabVariant;
    const styles = VARIANT_STYLES[variant] ?? VARIANT_STYLES.underline;

    this.buttons.forEach(btn => {
      const isSelected = btn.dataset.targetId === activeId;
      btn.className = "flex jj-grow jj-justify-center items-center gap-2 px-3 py-2 text-sm font-semibold outline-none transition-all cursor-pointer";
      btn.classList.add(...styles.base);
      const toAdd = isSelected ? styles.active : styles.inactive;
      const toRemove = isSelected ? styles.inactive : styles.active;
      btn.classList.add(...toAdd);
      btn.classList.remove(...toRemove);
    });

    this.slots?.forEach(slot => {
      slot.classList.toggle('hidden', slot.id !== `tab-content-slot-${activeId}`);
    });
  }

  button_template = `
    <button
      title="{tab.title | iif : @tab.title : @tab.alt}"
      data-target-id="{tab.id}"
      on-click="selectTab:{tab.id}"
      role="tab"
      class=""
    >
      @if(tab.icon)
        <i data-icon="{tab.icon}" class="inline-flex"></i> 
        @if(tab.title)<span class="hidden md:inline truncate">{tab.title}</span>@endif
      @endif
      @if(!tab.icon)
        <span class="truncate">{tab.title}</span>
      @endif
    </button>
  `;

  render() {
    const template = `
      <div data-app-tab-component class="w-full flex flex-col overflow-hidden">
        <div class="flex flex-wrap pl-px border-b w-full" role="tablist">
          <div data-each="tab in state.store.tabs" class="contents butons-container jj-flex w-full">
            ${this.button_template}
          </div>
        </div>
        <div data-each="tab in state.store.tabs" class="contents tabs-container">
          <div id="tab-content-slot-{tab.id}" class="text-left text-slate-500 hidden"></div>
        </div>
      </div>
    `;
    return buildAndInterpolate(template, this);
  }

  mounted() {
    this.slots = $('[id^=tab-content-slot]', this.element).all();
    this.slots.forEach(slot => {
      const tab_id = slot.id.replace('tab-content-slot-', '');
      const content = this.tabNodes.get(tab_id);
      if (content) slot.appendChild(content);
    });
    this.buttons = $<HTMLButtonElement>('button[role="tab"]', this.element).all();
    this.updateVisuals(this.state.store.activeTabId);
  }
}
