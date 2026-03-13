import type { ComponentElement } from "./types";

export const initObserver = () => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      mutation.removedNodes.forEach(node => {
        if (node instanceof HTMLElement) {
          const deepClean = (el: ComponentElement) => {
            if (el.__componentInstance && !el.__isUpdating) {
              el.__componentInstance.destroy();
            }
            Array.from(el.children).forEach(child => deepClean(child as HTMLElement));
          };
          deepClean(node);
        }
      });
    });
  });

  if (typeof document !== 'undefined') {
    observer.observe(document.body, { childList: true, subtree: true });
    console.log('DOM Observer active');
    return;
  }
  console.log('DOM Observer NOT active');
}
