
import type { ComponentFactory } from "../components/component.model";
import { buildAndInterpolate } from "../core/dom";

import { notificationService } from "@/core/services/notification.service";

const homePage: ComponentFactory = () => {
  return {
    innerHTML: `
      Este es un ejemplo de cómo evitar xss <img src="x" onerror="alert('XSS')">
    `,
    render: function () {
      notificationService.show('¡Bienvenido a <b>VanillaApp2026!</b>', 2_000);
      const template = `
        <div class="min-h-[50vh] mb-12 text-center">
          <span class="text-5xl font-black tracking-tighter text-slate-800 dark:text-white">
            VanillaApp<span class="text-indigo-500">2026</span>
          </span>
          <div>
            <h1 class="text-3xl font-black tracking-tight">DOM + Hydrate + Template Engine</h1>
            <p class="text-slate-600 dark:text-slate-400">Sistema de renderizado de VanillaApp2026</p>
             <p class="text-slate-600 dark:text-slate-400">
              {innerHTML | safeHTML}
             </p>
          </div>
        </div>
      `;
      return buildAndInterpolate(template, this);
    }
  };
};

export default homePage;
