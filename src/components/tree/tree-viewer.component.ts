import type { ComponentInitValue } from "../component.model";
import type { LeafRenderer, NodeRenderer, TreeNode, TreeViewerLeafNode } from "./tree.model";

import { $, build, buildAndInterpolate } from "@/core/dom";
import { BaseComponent } from "@/core/types";

export class TreeViewerComponent extends BaseComponent {

  private plusIconName = 'plus';
  private minusIconName = 'minus';
  private showCheckbox = false;
  private showIcons = false;

  private root!: TreeNode<unknown>;
  private nodeRenderer?: NodeRenderer;
  private leafRenderer?: LeafRenderer;

  private nodeMap = new Map<string, {
    container: HTMLElement;
    iconPlus: HTMLElement | null;
    iconMinus: HTMLElement | null;
    checkbox: HTMLInputElement | null;
    node: TreeNode<unknown>;
  }>();

  public click?: (el: HTMLElement, ev: Event, node: TreeNode<unknown>) => void;
  public nodeToggle?: (node: TreeNode<unknown>) => void;
  public nodeSelect?: (node: TreeNode<unknown>, checked: boolean) => void;

  constructor(ctx: ComponentInitValue) {
    super(ctx);
    this.root = {
      treeId: 'root',
      name: 'Root',
      checked: false,
      expanded: true,
      depth: 0,
      children: [
        {
          treeId: 'child-1',
          name: 'Child 1',
          checked: false,
          depth: 1,
          rows: [],
        }
      ]
    }
  }

  init(ctx: ComponentInitValue) {
    super.init(ctx);
    this.plusIconName = this.props.plusIconName ?? this.plusIconName;
    this.minusIconName = this.props.minusIconName ?? this.minusIconName;
    this.showCheckbox = this.props.showCheckbox === 'true';
    this.showIcons = this.props.showIcons === 'true';  
  }

  render(changedProp?: string): HTMLElement | null {
    if (changedProp && this.element) return this.element;
    if (!this.root) return null;

    const template = `
      <div class="flex flex-col w-full">
        <slot name="root"></slot>
      </div>
    `;
    const slottedNodes = {
      root: [this.buildNodeElement(this.root)]
    };
    return buildAndInterpolate(template, { slottedNodes });
  }

  destroy() {
    this.nodeMap.clear();
    super.destroy();
  }

  private buildNodeElement(node: TreeNode<unknown>): HTMLElement {

    const isOpen = node.expanded ?? false;
    const hasChildren = (node.children?.length ?? 0) > 0;
    const hasRows = (node.rows?.length ?? 0) > 0;
    const isExpandable = hasChildren || hasRows;

    const rowNodes: Node[] = [];
    const containerNodes: Node[] = [];
    // =====================================================================
    // custom node renderer (if provided) 
    // =====================================================================
    if (this.nodeRenderer) {
      const options = { 
        innerHTML: this.nodeRenderer(node, isOpen, isExpandable) 
      }
      rowNodes.push(
        build('div', options, true)
      );
    } 
    // =====================================================================
    // default node renderer
    // =====================================================================
    else 
       rowNodes.push(this.defaultNodeRenderer(node, isOpen, isExpandable));
    // =====================================================================
    // render children recursively
    // =====================================================================
    if (hasChildren)
      for (const child of node.children!) {
        child.parent = node;
        containerNodes.push(this.buildNodeElement(child));
      }      
    // =====================================================================
    //  render leaf content
    // =====================================================================
    if (hasRows){
      const leafContainer = this.buildLeafContent(node);
      leafContainer.classList.add('ml-3');
      leafContainer.onclick = (ev) => {
        this.handleNodeClick(leafContainer, ev, node.treeId, true);
      }
      containerNodes.push(leafContainer);      
    } 
    // =====================================================================
    // Build wrapper with slots
    // =====================================================================
    const wrapperTemplate = `
      <div class="flex flex-col w-full">
        <div 
          data-tree-row
          data-node-id="{node.treeId}"
          class="cursor-pointer"
          on-click="handleNodeClick:@node.treeId">
          <slot name="row"></slot>
        </div>
        <div 
          data-tree-container
          data-node-id="{node.treeId}"
          class="
            flex flex-col ml-2.5 overflow-hidden 
            {isOpen | iif : '' : 'hidden'}"
          >
          <slot name="container"></slot>
        </div>
      </div>
    `;
    const wrapper = buildAndInterpolate(
      wrapperTemplate, 
      { 
        ...this, 
        node, 
        isOpen,
        slottedNodes : {
          row: rowNodes,
          container: containerNodes 
        }
      }
    );
    // ================================================================================
    // Store references for O(1) toggle
    // ================================================================================
    const iconPlus = $('[data-tree-icon-plus]', wrapper).one();
    const iconMinus = $('[data-tree-icon-minus]', wrapper).one();
    const checkbox = $<HTMLInputElement>('input[type="checkbox"]', wrapper).one()!;
    const container = $('[data-tree-container]', wrapper).one()!;
    this.nodeMap.set(node.treeId, { container, iconPlus, iconMinus, checkbox, node });

    return wrapper;
  }

  handleNodeClick(_el: HTMLElement, ev: Event, treeId: string, isLeafClick?: boolean) {
    const entry = this.nodeMap.get(treeId);
    if (!entry) return;
    // ====================================================================
    // If click is on a leaf row, trigger click callback without toggling
    // ====================================================================
    if (isLeafClick) {
      const target = (ev.target as HTMLElement).closest('[data-tree-leaf-row]');
      if (!target) return;
      this.click?.(target as HTMLElement, ev, entry.node);
      return; 
    }
    const target = ev.target as HTMLElement;
    const { container, iconPlus, iconMinus, checkbox, node } = entry;
    // ====================================================================
    // Checkbox click → toggle selection, don't expand/collapse
    // ====================================================================
    if (target === checkbox || target.closest('input[type="checkbox"]')) {
      const checked = checkbox?.checked ?? false;
      this.setChecked(node, checked);
      this.updateAncestors(node);
      this.nodeSelect?.(node, checked);
      return;
    }
    // ====================================================================
    // Otherwise → expand/collapse
    // ====================================================================
    node.expanded = !(node.expanded ?? false);
    container.classList.toggle('hidden', !node.expanded);
    if (iconPlus) iconPlus.style.display = node.expanded ? 'none' : '';
    if (iconMinus) iconMinus.style.display = node.expanded ? '' : 'none';
    this.nodeToggle?.(node);
  }


  /** Check/uncheck a node and all its descendants */
  private setChecked(node: TreeNode<unknown>, checked: boolean) {
    node.checked = checked;
    node.indeterminate = false;
    this.syncCheckbox(node);

    for (const child of node.children ?? []) {
      this.setChecked(child, checked);
    }
  }

  /** Walk up from a node, recalculating checked/indeterminate for each ancestor */
  private updateAncestors(node: TreeNode<unknown>) {
    let current = node.parent;
    while (current) {
      const children = current.children ?? [];
      const allChecked = children.length > 0 && children.every(c => c.checked && !c.indeterminate);
      const noneChecked = children.every(c => !c.checked && !c.indeterminate);

      current.checked = allChecked;
      current.indeterminate = !allChecked && !noneChecked;
      this.syncCheckbox(current);

      current = current.parent;
    }
  }

  /** Sync a checkbox DOM element with the node's checked/indeterminate state */
  private syncCheckbox(node: TreeNode<unknown>) {
    const entry = this.nodeMap.get(node.treeId);
    if (!entry?.checkbox) return;
    entry.checkbox.checked = node.checked;
    entry.checkbox.indeterminate = node.indeterminate ?? false;
  }

  expandAll() {
    this.setAllExpanded(true);
  }

  collapseAll() {
    this.setAllExpanded(false);
  }

  private setAllExpanded(expanded: boolean) {
    for (const [, entry] of this.nodeMap) {
      entry.node.expanded = expanded;
      entry.container.classList.toggle('hidden', !expanded);
      if (entry.iconPlus) entry.iconPlus.style.display = expanded ? 'none' : '';
      if (entry.iconMinus) entry.iconMinus.style.display = expanded ? '' : 'none';
    }
  }

  private defaultNodeRenderer(node: TreeNode<unknown>, isOpen: boolean, hasChildren: boolean): HTMLElement {

    const template = `
      <div class="flex items-center gap-2 py-1.5 px-2 hover:bg-gray-50 dark:hover:bg-slate-800 
          rounded-lg transition-all group">
        @if(!hasChildren)
          <span class="size-3.5"></span>
        @endif
        @if(hasChildren)
          <span data-tree-icon-plus style="{isOpen | hide}">
            <i data-icon="{plus}" class="size-3.5"></i>
          </span>
          <span data-tree-icon-minus style="{isOpen | show}">
            <i data-icon="{minus}" class="size-3.5"></i>
          </span>
        @endif
        @if(showIcons)
          <i data-icon="folder" class="size-3.5"></i>
        @endif        
        @if(showCheckbox)
          <input type="checkbox" />
        @endif
        <span class="text-sm font-semibold">
          {node.name}
        </span>
        @if(count===0)
          <span class="ml-auto text-xs text-gray-400 text-center min-w-5 h-5">
            -
          </span>
        @endif
        @if(count)
          <span class="
            ml-auto inline-flex items-center justify-center min-w-5 h-5 text-[11px]
          text-white bg-gray-700 rounded-full px-1">
            {count}
          </span>
        @endif
      </div>
    `;
    return buildAndInterpolate(
      template, 
      {
        plus: this.plusIconName,
        minus: this.minusIconName,
        showCheckbox: this.showCheckbox ?? true,
        showIcons: this.showIcons ?? true,
        isOpen,
        node,
        hasChildren,
        count: this.countDescendantRows(node)
      }
    ) ?? document.createElement('div');
  }

  private buildLeafContent(node: TreeNode<unknown>): HTMLElement {
    const fragment = document.createElement('div');
    // =====================================================================
    // Custom leaf renderer (if provided)
    // =====================================================================
    if (this.leafRenderer) {
      const html = this.leafRenderer(node as TreeViewerLeafNode<unknown>);
      const el = build('div', { innerHTML: html });
      while (el.firstChild) fragment.appendChild(el.firstChild);
      return fragment;
    }
    // =====================================================================
    // Default leaf renderer: render rows with basic styling, showing 'name' 
    // or 'label' property
    // =====================================================================
    const rows = node.rows ?? [];
    rows.forEach((row, index) => {
      const data = row as Record<string, unknown>;
      const name = String(data.name ?? data.label ?? data.title ?? '');
      const template = `
        <div 
          data-tree-leaf-row
          data-row-id="${data.id ?? crypto.randomUUID()}"
          data-row-index="${index}"
          class="text-sm flex items-center gap-2 px-2 py-1.5 mr-8
            rounded ml-2 text-slate-600 
            hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
          >
          <i data-icon="text" class="size-3.5 text-slate-400"></i>
          <span class="font-medium">${name}</span>
        </div>
      `;
      const el = buildAndInterpolate(template, {});
      if (el) fragment.appendChild(el);
    });    
    return fragment;
  }

  private countDescendantRows(node?: TreeNode<unknown>): number {
    if (!node) return 0;
    let count = node.rows?.length ?? 0;
    if (node.children) {
      for (const child of node.children) {
        count += this.countDescendantRows(child);
      }
    }
    return count;
  }

}