import type { BaseComponent } from "../core/types";


export interface Component {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; 
  init?(): void;
  render(): HTMLElement;
  mounted?(): void;
  destroy?(): void;
}

export type ComponentCreator = 
  // eslint-disable-next-line @typescript-eslint/prefer-function-type, @typescript-eslint/no-explicit-any
  | { new (ctx: any): BaseComponent } 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | ((ctx: any) => BaseComponent);


export interface PublishContext {
  event: Event, 
  target: HTMLElement, 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any[] 
}