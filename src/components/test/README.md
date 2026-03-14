# 🚀 VanillaReactive v2026

Un **Micro-Framework declarativo** y ultraligero construido con Vanilla JavaScript y TypeScript. Diseñado para ofrecer reactividad de alto rendimiento, comunicación desacoplada mediante PubSub y un sistema de bindings directamente en el HTML sin necesidad de librerías externas.

## ✨ Características Principales

- **⚡ Reactividad basada en Proxies:** Estado del componente sincronizado automáticamente con la UI.
- **🔗 PubSub Engine:** Sistema de mensajería global y local para comunicación entre componentes sin "prop-drilling".
- **🛠 Declarative Directives:** Atributos personalizados como `on-click="publish:..."` y `on-publish="..."` para manejar eventos y datos sin escribir JS adicional.
- **🧪 Pipes & Filters:** Transformación de datos en tiempo real dentro de los templates (`{ data | uppercase | translate }`).
- **🎨 CSS-First:** Optimizado para trabajar con Tailwind CSS mediante bindings dinámicos de clases y estilos.

---

## 🛠 Arquitectura del Motor

El framework permite que el HTML sea "inteligente" mediante dos pilares fundamentales:

### 1. El Sistema de Publicación (Eventos)
Permite disparar acciones globales o locales con paso de parámetros y contexto del evento original (`event`, `target`, `args`).

```html
<button on-click="publish:THEME_CHANGED:global:dark">
  Modo Oscuro
</button>