import { TreeViewerComponent } from "@/components/tree/tree-viewer.component";
import type { 
  TreeNode, 
  TreeViewerLeafNode 
} from "@/components/tree/tree.model";
import { buildAndInterpolate } from "@/core/dom";
import { executeDSL } from "@/core/template-compiler";
import { BaseComponent } from "@/core/types";

// ---------------------------------------------------------------------------
// Sample data types
// ---------------------------------------------------------------------------

interface Employee {
  id: number;
  name: string;
  role: string;
}

// ---------------------------------------------------------------------------
// Tree builder helper
// ---------------------------------------------------------------------------

let nextId = 1;

function node(
  name: string,
  depth: number,
  children?: TreeNode<Employee>[],
  rows?: Employee[]
): TreeNode<Employee> {
  return {
    treeId: String(nextId++),
    name,
    checked: false,
    expanded: depth === 0,
    depth,
    children,
    rows,
  };
}

function leaf(name: string, depth: number, rows: Employee[]): TreeNode<Employee> {
  return node(name, depth, undefined, rows);
}

// ---------------------------------------------------------------------------
// Sample 3-level tree
// ---------------------------------------------------------------------------

function buildSampleTree(): TreeNode<Employee> {
  return node("Acme Corporation", 0, [
    node("Engineering", 1, [
      leaf("Frontend", 2, [
        { id: 1, name: "Alice Martin", role: "Senior Developer" },
        { id: 2, name: "Bob Chen", role: "Junior Developer" },
        { id: 3, name: "Clara García", role: "Tech Lead" },
      ]),
      leaf("Backend", 2, [
        { id: 4, name: "David López", role: "Senior Developer" },
        { id: 5, name: "Eva Müller", role: "DevOps Engineer" },
      ]),
      node("QA", 2, [
        leaf("Automation", 3, [
          { id: 6, name: "Frank Zhou", role: "QA Engineer" },
          { id: 7, name: "Grace Kim", role: "QA Lead" },
        ]),
        leaf("Manual Testing", 3, [
          { id: 8, name: "Hiro Tanaka", role: "Tester" },
        ]),
      ]),
    ],
    // Empleados directos de Engineering (rows + children en el mismo nodo)
    [
      { id: 20, name: "Sara Connor", role: "VP Engineering" },
      { id: 21, name: "James Kirk", role: "Engineering Manager" },
    ]),
    node("Design", 1, [
      leaf("UX", 2, [
        { id: 9, name: "Irene Rossi", role: "UX Designer" },
        { id: 10, name: "Jack O'Brien", role: "UX Researcher" },
      ]),
      leaf("UI", 2, [
        { id: 11, name: "Karen Svensson", role: "UI Designer" },
      ]),
    ],
    // Director de Design a nivel del nodo
    [
      { id: 22, name: "Tomás Rivera", role: "Design Director" },
    ]),
    node("Operations", 1, [
      node("Finance", 2, [
        leaf("Accounting", 3, [
          { id: 12, name: "Luis Fernández", role: "Accountant" },
          { id: 13, name: "María Torres", role: "Financial Analyst" },
        ]),
        leaf("Payroll", 3, [
          { id: 14, name: "Nina Petrov", role: "Payroll Specialist" },
        ]),
      ]),
      leaf("HR", 2, [
        { id: 15, name: "Oliver Schmidt", role: "HR Manager" },
        { id: 16, name: "Paula Duarte", role: "Recruiter" },
      ]),
    ]),
    node(
      "Por hacer", 
      1, 
      []
    ),  
  ],
  // CEO a nivel raíz
  [
    { id: 23, name: "Elena Voss", role: "CEO" },
  ]);
}


export default class TreeViewerPage extends BaseComponent {

  private treeComponent!: TreeViewerComponent;

  init() {
    this.setState({ selectedNode: '' });
  }

  render(changedProp?: string): HTMLElement {

    if (changedProp && this.element) {
      this.updateBindings();
      return this.element;
    }

    const template = `
      <div class="min-h-screen p-6">
        <div class="max-w-3xl mx-auto">

          <div class="mb-6">
            <h1 class="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
              <i data-icon="folder" class="size-6 inline-block mr-2"></i>
              Tree Viewer
            </h1>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Componente de árbol recursivo con 3+ niveles de profundidad
            </p>
          </div>

          <div class="flex gap-2 mb-4">
            <button class="app-button btn-secondary text-xs" on-click="expandAll">
              <i data-icon="plus" class="size-3.5 mr-1"></i> Expandir todo
            </button>
            <button class="app-button btn-secondary text-xs" on-click="collapseAll">
              <i data-icon="minus" class="size-3.5 mr-1"></i> Colapsar todo
            </button>
          </div>

          <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
            <div 
              data-component="app-tree-viewer"
              data-show-checkbox="false"
              data-show-icons="false"
              (node-toggle) = "handleNodeToggle"
              (node-select) = "handleNodeSelect"
              (click) = "handleClick"
              (root) = "rootNode"
              (leaf-renderer) = "leafRenderer"
              (node-renderer) = "nodeRenderer___">
            </div>
          </div>

          <div class="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border text-sm text-slate-600 dark:text-slate-300"
               data-bind="show:state.selectedNode">
            <span class="font-semibold">Último evento:</span>
            <span data-bind="text:state.selectedNode"></span>
          </div>

        </div>
      </div>
    `;

    return buildAndInterpolate(template, this);
  }

  async mounted() {
    await this.whenChildrenReady();
    this.treeComponent = BaseComponent.getInstance("[app-tree-viewer]") as TreeViewerComponent;
  }

  destroy() {
    this.treeComponent?.destroy();
    super.destroy();
  }

  get rootNode(): TreeNode<Employee> {
    return buildSampleTree();
  }

  nodeRenderer(node: TreeNode<Employee>, isOpen: boolean, isExpandable?: boolean): string {
    const template = `
      <div class="flex items-center gap-2 px-2 py-1.5 rounded text-slate-800 dark:text-white">
        @if(!isExpandable)
          <span class="size-3.5"></span>
        @endif
        @if(isExpandable)
          <span data-tree-icon-plus style="{isOpen | hide}">
            <i data-icon="plus" class="size-3.5"></i>
          </span>
          <span data-tree-icon-minus style="{isOpen | show}">
            <i data-icon="minus" class="size-3.5"></i>
          </span>
        @endif
        <input type="checkbox" />
        <span class="font-medium">${node.name}</span>
        ${node.rows ? `<span class="text-xs text-slate-400">${node.rows.length} empleados</span>` : ''}
      </div>
    `;
    return executeDSL(
      template, { 
        isOpen, 
        isExpandable 
      }
    );
  }
  
  leafRenderer(leaf: TreeViewerLeafNode<Employee>){
    const rows = leaf.rows ?? [];
    return rows.map((r:Employee, i) => `
      <div 
        data-tree-leaf-row
        data-employee-id="${r.id}"
        data-row-index="${i}"
        class="
          text-sm flex items-center gap-2 px-2 py-1.5
          mr-8
          rounded
          ml-2 text-slate-600 
          hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
        >
        <i data-icon="user" class="size-3.5 text-slate-400"></i>
        <span class="font-medium">${r.name}</span>
        <span class="text-xs text-slate-400">${r.role}</span>
      </div>
    `).join('');
  }

  handleClick(el: HTMLElement, ev: Event, node: TreeNode<Employee>) {
    ev.stopPropagation();
    const index = Number(el.dataset.rowIndex) || 0;
    this.setState({ selectedNode: `Click: ${node.rows?.[index].name}` });
  }

  handleNodeToggle(node: TreeNode<Employee>) {
    this.setState({ selectedNode: `Toggle: ${node.name} (expanded=${node.expanded})` });
  };

  handleNodeSelect(node: TreeNode<Employee>, checked: boolean){
    this.setState({ selectedNode: `Select: ${node.name} (checked=${checked})` });
  };

  expandAll = () => this.treeComponent?.expandAll();
  collapseAll = () =>  this.treeComponent?.collapseAll();

}
