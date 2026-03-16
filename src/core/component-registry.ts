import type { ComponentProvider } from "./services/router.service";

let COMPONENT_REGISTRY:  Record<string, ComponentProvider> = {};

export function setupComponents(components: Record<string, ComponentProvider>) {
  COMPONENT_REGISTRY = components;
}

export function getComponent(name: string) {
  return COMPONENT_REGISTRY[name];
}