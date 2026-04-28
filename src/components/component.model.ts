
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComponentContext = any; 

export type ComponentConstructor = new (ctx: ComponentContext) => Component;
export type ComponentFactory = (ctx: ComponentContext) => Component;
export type ComponentCreator = ComponentConstructor | ComponentFactory;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ComponentInitValue { parent?: HTMLElement, data?: any}

export interface Component {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; 
  init?(value?: ComponentInitValue): void;
  render(changedProp?: string): HTMLElement | null;
  mounted?(): void;
  destroy?(): void;
}

export interface PublishContext {
  event: Event, 
  target: HTMLElement, 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any[] 
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BindingResolver = (el: HTMLElement, value: any) => void;
export interface ComponentBinding {
  element: HTMLElement;
  type: string;
  prop: string | null;
  path: string;
}

export interface AutocompleteItem {
  id: string | number;
  label: string;
  raw?: unknown;
}

export interface ComboItem {
  id: string | number;
  label: string;
}

