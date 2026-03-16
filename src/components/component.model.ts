

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComponentContext = any; 

export type ComponentConstructor = new (ctx: ComponentContext) => Component;
export type ComponentFactory = (ctx: ComponentContext) => Component;
export type ComponentCreator = ComponentConstructor | ComponentFactory;

export interface Component {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; 
  init?(): void;
  render(): HTMLElement;
  mounted?(): void;
  destroy?(): void;
}

export interface PublishContext {
  event: Event, 
  target: HTMLElement, 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any[] 
}