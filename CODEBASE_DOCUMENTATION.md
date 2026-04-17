# VanillaApp2026 - Codebase Architecture & Conventions

## Executive Summary

**VanillaApp2026** is a lightweight, declarative micro-framework built with vanilla TypeScript that emphasizes:
- **Reactive State Management** via Proxy-based components
- **Decoupled Communication** using a PubSub messaging system
- **Declarative HTML Directives** for event handling and templating
- **Zero External Framework Dependencies** (no React, Vue, Angular)
- **CSS-First Design** optimized for Tailwind CSS

---

## 1. Build & Test Commands

### Package.json Scripts
```bash
npm run dev      # Start development server (Vite, port 5173)
npm run build    # TypeScript compilation + Vite production build
npm run preview  # Preview production build locally
```

### Build Configuration
- **Build Tool:** Vite 7.3.1 with ES2022 target
- **TypeScript:** v5.9.3 with strict mode and ESNext modules
- **Code Splitting:** Manual chunks for vendors (maptiler, lucide, jquery, maplibre-gl)
- **Chunk Size Limit:** 1500KB (warning threshold)

### TypeScript Compiler Options Highlights
```json
{
  "target": "ES2022",
  "module": "ESNext",
  "moduleResolution": "bundler",
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "paths": { "@/*": ["src/*"] }  // Path alias for imports
}
```

---

## 2. Technology Stack

### Core Dependencies
- **Framework:** Vanilla JavaScript (no external UI framework)
- **Build:** Vite 7.3.1
- **Language:** TypeScript 5.9.3
- **Styling:** Tailwind CSS 4.1.18 + PostCSS 8.5.6
- **Icons:** Lucide 0.577.0 (SVG icon library)
- **Maps:** @maptiler/sdk 3.11.1
- **Utilities:** tslib 2.3.0

### Development Dependencies
- **Linting:** ESLint 9.39.1 + typescript-eslint 8.47.0
- **Formatting:** Prettier 5.5.4 (via eslint-plugin-prettier)
- **Testing:** jsdom 27.1.0
- **Import Management:** eslint-plugin-import 2.32.0

---

## 3. Architecture & Key Patterns

### 3.1 Component System (BaseComponent)

All UI components inherit from the `BaseComponent` class, which provides:

#### Lifecycle Methods
```typescript
init?(value?: ComponentInitValue): void;     // Initialize component
render(changedProp?: string): HTMLElement;   // Return DOM element
mounted?(): void;                            // Called after mounting
destroy?(): void;                            // Cleanup on destruction
```

#### Reactive State
- **Model:** Proxy-based reactive state
- **Trigger:** State changes automatically invoke `update()` and re-render
- **API:** `setState(stateObject)` or direct `this.state.property = value`

#### Parent/Props/Children
- **Props:** Parsed from HTML attributes on component tags
- **Children:** DOM nodes passed to component parsed as `slotted content`
- **Parent:** Reference to parent HTMLElement

#### Factory Functions Alternative
Components can also be **factory functions** returning a Component interface:
```typescript
const MyComponent: ComponentFactory = () => ({
  text: 'Hello',
  render(): HTMLElement { /* ... */ }
});
```

#### Built-in Features
- **Auto-bound Methods:** All methods automatically bound to `this` in constructor
- **Cleanup Subscription Management:** `addCleanup()` for automatic garbage collection
- **Pub/Sub Integration:** `publish()` and `subscribe()` methods with instance scoping
- **Instance Retrieval:** Static method `BaseComponent.getInstance(selector)` to get component by DOM selector
- **Element Caching:** `this.element` stores rendered DOM element

### 3.2 Declarative Template System

#### Template Syntax
```html
<!-- Interpolation -->
<div>{state.name | uppercase}</div>

<!-- Conditional rendering -->
@if(state.isActive)
  <div>Active</div>
@else
  <div>Inactive</div>
@endif

<!-- Looping -->
@each(item in items)
  <div>{item.name}</div>
@endeach

<!-- Event handling -->
<button on-click="handleClick">Click Me</button>
<button on-click="publish:TOPIC_NAME:global:arg1,arg2">Publish</button>

<!-- Navigation -->
<div route-to="/about">Go to About</div>

<!-- Component rendering -->
<div data-component="app-logo"></div>

<!-- Icon rendering -->
<i data-icon="check"></i>

<!-- Translation -->
<span data-t="ui.welcome"></span>
```

#### Pipes & Filters
Data transformations inline in templates:
```
{value | uppercase | translate | iif:trueValue:falseValue}
```

#### Hydration Pipeline
When `buildAndInterpolate()` processes templates, it executes this order:
1. **Directives** - Process `@if`, `@each`, `data-t` translations
2. **Icons** - Replace `data-icon` attributes with Lucide SVGs
3. **Components** - Instantiate `data-component` references
4. **Event Listeners** - Bind `on-*`, `route-to`, `on-publish` handlers

---

### 3.3 Routing System

#### Router Configuration (`app.routes.ts`)
```typescript
const routeBuilder = new RouteBuilder();
routeBuilder
  .root(homePage)                    // Default route
  .add('about', AboutPage)           // Simple route
  .add('admin', AdminPage, AdminLayout) // With layout
  .addKeepAlive('dashboard', DashboardPage) // Keep alive
  .notFound(() => import('./404.page')); // 404 handler
```

#### Route Definition
```typescript
interface Route {
  name: string;                      // Route name (title)
  path: RegExp;                      // URL pattern matcher
  componentProvider: ComponentProvider; // Component factory
  layout?: ComponentConstructor | null; // Optional layout wrapper
  keepAlive?: boolean;               // Cache component state
  params?: string[];                 // Extracted path params
  queryValues?: Record<string, string>; // Query string values
}
```

#### Navigation
```typescript
// Programmatic navigation
router.navigateTo('/about');

// HTML declarative navigation
<button route-to="/about">Go</button>

// PubSub navigation
pubSub.publish(APP_CONFIG.messages.router.navigate, '/about');
```

#### Features
- **Layout Switching:** Different layouts per route
- **View Caching:** `keepAlive` flag preserves component state
- **Route Transitions:** Animated entry/exit (300-350ms)
- **Query Parameters:** Stored in `route.queryValues`
- **History API:** Full browser back/forward support

---

### 3.4 State Management

#### Component Local State (Reactive)
```typescript
// In BaseComponent subclasses
protected state = new Proxy({}, {
  set: (target, prop, value) => {
    target[prop] = value;
    if (!this.isInitializing) this.update(prop);  // Auto re-render
    return true;
  }
});

// Usage
this.setState({ count: 0, isOpen: false });
this.state.count = this.state.count + 1; // Auto-update UI
```

#### Global State Hook (`useState`)
```typescript
import { useState } from '@/core/state.utils';

const { store: appState, put: updateState, on: onChange } = 
  useState({ theme: 'light', language: 'en' });

// Update
updateState('theme', 'dark');

// Subscribe to changes
const unsubscribe = onChange('theme', (newTheme) => {
  console.log('Theme changed to:', newTheme);
});
```

#### Benefits
- No external state library (Redux, Zustand, etc.)
- Proxy-based reactivity (zero boilerplate)
- Automatic cleanup tracking
- Instance-scoped subscriptions

---

### 3.5 Pub/Sub Messaging System

#### Global Message Pattern
```typescript
// Subscribe (global scope)
pubSub.subscribe(APP_CONFIG.messages.router.loaded, () => {
  console.log('Route loaded');
});

// Publish (broadcasts to all subscribers)
pubSub.publish(APP_CONFIG.messages.router.loaded);
```

#### Instance-Scoped Messages
```typescript
// In BaseComponent
this.subscribe(TOPIC, (data) => {
  console.log('Received:', data);
});

this.publish(TOPIC, { message: 'Hello' });
// Auto-cleanup on component destroy
```

#### Built-in Topics (`app.messages.ts`)
```
router.viewChanged
router.loading / router.loaded / router.error
router.navigate

auth.login / auth.logout

httpClient.loading / httpClient.loaded

app.themeChanged
app.message
app.showNotification / app.closeNotification
app.dialogClosed
```

---

### 3.6 Component Registry

#### Auto-Registration
```typescript
// Scans components/**/*.component.ts at build time
const componentFiles = import.meta.glob('./components/**/*.component.ts');
// Results in app-[filename] tags automatically available
```

#### Manual Registration
```typescript
import { ComponentRegistry } from './app.components';

ComponentRegistry.registerComponent('app-custom', CustomComponent);
ComponentRegistry.registerComponents(
  ['app-widget-1', Widget1],
  ['app-widget-2', Widget2]
);
```

#### Usage in Templates
```html
<div data-component="app-combo-box"></div>
<div data-component="app-dashboard"></div>
```

---

### 3.7 Report Engine

#### Purpose
Generates formatted data reports with grouping, aggregation, and custom rendering.

#### Stages
1. **Header Section** - Report title/metadata
2. **Group Headers** - Group-level headers
3. **Detail Rows** - Individual record rendering
4. **Group Footers** - Group summaries
5. **Total Section** - Grand totals

#### Example Report Definition
```typescript
const reportDef: ReportDefinition<SalesRecord> = {
  parseData: (report, data) => {
    // Pre-process data
    return data;
  },
  groups: [
    {
      key: 'department',
      valueProvider: (ctx) => {
        // Render group header
      },
      footerValueProvider: (ctx) => {
        // Render group footer with summaries
      }
    }
  ],
  details: [
    {
      valueProvider: (ctx) => {
        // Render each detail row
      }
    }
  ],
  totals: [
    {
      valueProvider: (ctx) => {
        // Render grand totals
      }
    }
  ]
};
```

---

### 3.8 Internationalization (i18n)

#### i18n Service
```typescript
// Get current language
const currentLang = i18nService.currentLng; // 'en' | 'es'

// Switch language
i18nService.setLang('es');

// Get translation
const text = i18nService.t('ui.welcome');

// With interpolation
const greeting = i18nService.t('ui.hello', { name: 'John' });

// Listen for language changes
i18nService.changed((newLang) => {
  console.log('Language changed to:', newLang);
});
```

#### Translation Files
- **Location:** `src/i18n/`
- **Files:** `en.ts`, `es.ts`
- **Storage:** Language preference stored in `localStorage.language`
- **Default:** Spanish ('es')

#### Translation Structure
```typescript
// i18n/en.ts
export default {
  ui: {
    welcome: 'Welcome to VanillaApp',
    hello: 'Hello, {name}!'
  },
  actions: {
    save: 'Save',
    delete: 'Delete'
  }
};
```

---

### 3.9 HTTP Client Service

#### Builder Pattern
```typescript
import { createApiRequest } from '@/core/services/http-client.service';

const response = await createApiRequest<User>()
  .useLog('Fetch user profile')
  .getFrom('api/users/123')
  .invoke();

const created = await createApiRequest<User>()
  .useLog('Create user')
  .usePayload({ name: 'John', email: 'john@example.com' })
  .postTo('api/users')
  .useTransform((data) => ({ ...data, id: Number(data.id) }))
  .invoke();
```

#### Features
- Type-safe responses
- Request/response logging
- Payload serialization
- Response transformation
- Access token support
- Base URL configuration

---

## 4. Project-Specific Conventions

### 4.1 File Naming

| Pattern | Purpose | Example |
|---------|---------|---------|
| `[name].component.ts` | Reusable UI component | `logo.component.ts` → `<app-logo>` |
| `[name].page.ts` | Routable page/view | `home.page.ts` → route component |
| `[name].service.ts` | Singleton service | `auth.service.ts` |
| `[name].report.ts` | Report definition | `sales.report.ts` |
| `[name].layout.ts` | Layout wrapper | `admin.layout.ts` |
| `.template.html` | External HTML template | `header.template.html` |

### 4.2 Component Registration Naming
- **Convention:** `app-[filename]`
- **File:** `logo.component.ts`
- **Tag:** `<app-logo>`
- **Manual:** Use `registerComponent('app-custom', CustomClass)`

### 4.3 CSS Classes
- **Framework:** Tailwind CSS v4 (utility-first)
- **Custom:** Component-scoped classes when needed
- **Pattern:** BEM-like naming for custom styles
- **Binding:** Dynamic classes via `data-*` attributes or conditional rendering

### 4.4 Message/Topic Naming
- **Namespace:** `feature-action` (e.g., `router-viewChanged`)
- **Scope:** Global topics in `app.messages.ts`
- **Instance-scoped:** Within component via `subscribe()`

---

## 5. Folder Structure Overview

```
src/
├── main.ts                              # Entry point
├── app.config.ts                        # Centralized config
├── app.components.ts                    # Component registry
├── app.routes.ts                        # Router configuration
├── app.messages.ts                      # PubSub topics
├── app.reports.ts                       # Report registry
├── app.icons.ts                         # Icon registry
│
├── components/                          # Reusable UI components
│   ├── component.model.ts               # Component interfaces
│   ├── [name].component.ts              # Individual components
│   ├── [name]/                          # Multi-file components
│   │   ├── [name].component.ts
│   │   └── [name].template.html
│   └── test/                            # Demo/test components
│
├── core/                                # Framework core
│   ├── types.ts                         # BaseComponent & types
│   ├── dom.ts                           # DOM utilities (build, $)
│   ├── dom-observer.ts                  # DOM observation
│   ├── hydrate.ts                       # DOM enhancement (directives, icons, components, events)
│   ├── template.ts                      # Template engine (interpolation, pipes)
│   ├── template-compiler.ts             # DSL compiler (@if, @each)
│   ├── state.utils.ts                   # useState hook
│   ├── icons.ts                         # Icon setup & management
│   ├── component-registry.ts            # Component registry system
│   ├── report-registry.ts               # Report registry system
│   │
│   ├── services/                        # Singleton services
│   │   ├── app-engine.service.ts        # Main app orchestrator
│   │   ├── router.service.ts            # Routing engine
│   │   ├── pubsub.service.ts            # Pub/Sub messaging
│   │   ├── http-client.service.ts       # API client
│   │   ├── loader.service.ts            # Dynamic imports
│   │   ├── dialog.service.ts            # Alert/Dialog service
│   │   ├── notification.service.ts      # Toast notifications
│   │   ├── key-value-db.service.ts      # Local storage wrapper
│   │   ├── report.service.ts            # Report execution
│   │   └── route-builder.ts             # Router fluent API
│   │
│   ├── report-engine/                   # Report generation
│   │   ├── engine.ts                    # Core engine
│   │   ├── mediator.ts                  # Output mediator
│   │   ├── types.ts                     # Report types
│   │   └── utils.ts                     # Report utilities
│   │
│   └── storage/                         # Storage utilities
│
├── pages/                               # Page/route components
│   ├── [name].page.ts                   # Individual pages
│   ├── layouts/                         # Layout components
│   │   ├── default.layout.ts
│   │   └── admin.layout.ts
│   ├── loaders/                         # Dynamic loaders
│   ├── samples/                         # Example implementations
│   │   ├── component-based/
│   │   └── functional/
│   └── templates/                       # Reusable page templates
│
├── features/                            # Feature modules
│   ├── landing/
│   │   ├── pages/
│   │   └── components/
│   └── poc-1/                           # Proof of concept
│       ├── pages/
│       ├── components/
│       └── reports/
│
├── reports/                             # Report definitions
│   ├── sample-001.report.ts
│   └── sample-002.report.ts
│
├── services/                            # App-specific services
│   ├── endpoint.service.ts              # API endpoints
│   └── the-simpsons.service.ts          # Domain services
│
├── i18n/                                # Internationalization
│   ├── index.ts                         # i18n service
│   ├── en.ts                            # English translations
│   └── es.ts                            # Spanish translations
│
├── styles.css                           # Global styles
└── app.css                              # App-specific styles
```

---

## 6. Key Entry Points

### 6.1 Bootstrap Process
1. **HTML:** `index.html` loads `/src/main.ts`
2. **Main:** `main.ts` triggers `appEngine.init()` on `DOMContentLoaded`
3. **AppEngine:** Initializes:
   - Icon system
   - Component registry
   - Report registry
   - Pubsub listeners
4. **Routing:** Initial splash-screen route shown, then syncs router

### 6.2 Main Files

**[index.html](index.html)**
- Root container: `<div id="app-container"></div>`
- Loads CSS and main.ts

**[src/main.ts](src/main.ts)**
```typescript
// Imports styles and appEngine
// Waits for DOMContentLoaded
// Calls appEngine.init()
// Shows splash-screen initially
```

**[src/core/services/app-engine.service.ts](src/core/services/app-engine.service.ts)**
- **LayoutManager:** Handles layout component lifecycle
- **ViewRenderer:** Renders route components with caching
- **TransitionManager:** Animates route transitions
- Main orchestrator for all route/layout changes

---

## 7. Unusual & Advanced Patterns

### 7.1 Component Instance Retrieval
```typescript
// Get component instance by DOM selector
const component = BaseComponent.getInstance('[app-combo-box]');

// Enables imperative control
component?.setDataSource([{ id: 1, label: 'Option 1' }]);

// Useful for complex interactions
const tabComponent = BaseComponent.getInstance('[app-tab-container]');
tabComponent?.addTab({ id: 'new-tab', title: 'New' }, content);
```

### 7.2 View Caching with keepAlive
```typescript
// In router configuration
routeBuilder.addKeepAlive('dashboard', DashboardPage);

// Component stays mounted across route changes
// State is preserved
// Useful for expensive computations or user state retention
```

### 7.3 Hybrid Component Model
```typescript
// Class-based (recommended for complex components)
export class MyComponent extends BaseComponent { /* ... */ }

// Factory function (functional style)
export const MyComponent = () => ({
  render() { /* ... */ }
});

// Both work interchangeably
```

### 7.4 Template Directives as Code
Unlike JSX or template syntax, directives are processed at **render time**:
```html
@if(state.expanded)
  <div>Content</div>
@else
  <span>Collapsed</span>
@endif
```

This allows the same template to be re-evaluated on each state change.

### 7.5 Inline Pipes & Filters
```
{data | iif:true_value:false_value}  <!-- Conditional -->
{data | uppercase}                    <!-- String transform -->
{data | translate}                    <!-- i18n lookups -->
```

### 7.6 Router Navigation via Attributes
```html
<!-- Declarative navigation (no JS needed) -->
<a route-to="/about">About</a>

<!-- Event-based publish -->
<button on-click="publish:AUTH_LOGIN:global:userEmail">Login</button>
```

---

## 8. ESLint & Code Quality

### ESLint Configuration (`eslint.config.js`)
- **Target:** TypeScript files with strict rules
- **Plugins:**
  - `@eslint/js` (base rules)
  - `typescript-eslint` (TS-specific)
  - `eslint-plugin-import` (module sorting)
- **Prettier Integration:** Code formatting via ESLint

### Rules Highlights
- No unused variables (except `_` prefix)
- Import ordering: builtin → external → internal
- Strict TypeScript typing
- No explicit `any` types (eslint-disable-comment option)

### Prettier Config
```json
{
  "printWidth": 100,
  "singleQuote": true,
  "overrides": [{ "files": "*.html", "options": {} }]
}
```

---

## 9. Performance Optimizations

### Code Splitting
```javascript
// vite.config.js chunk strategy
manualChunks(id) {
  if (id.includes('node_modules')) {
    if (id.includes('@maptiler')) return 'vendor-maptiler';
    if (id.includes('lucide')) return 'vendor-icons';
    if (id.includes('maplibre')) return 'vendor-maplibre-gl';
    return 'vendor'; // Default vendor chunk
  }
}
```

### Dynamic Imports
- Routes loaded on-demand: `() => import('./pages/about')`
- Components lazy-loaded: `() => import('./components/form')`
- Reports lazy-loaded: `() => import('./reports/sales')`

### Tree Shaking
- ES Modules for dead code elimination
- Unused exports removed in production

### Chunk Size Warning
- Threshold: 1500KB
- Monitors bundle health

---

## 10. Common Workflows

### 10.1 Creating a New Component
```typescript
// src/components/my-widget.component.ts
import { BaseComponent } from '@/core/types';
import { buildAndInterpolate } from '@/core/dom';

export class MyWidgetComponent extends BaseComponent {
  init() {
    super.init();
    this.setState({ count: 0 });
  }

  increment() {
    this.state.count++;
  }

  render() {
    return buildAndInterpolate(`
      <div class="p-4 border rounded">
        <p>Count: {state.count}</p>
        <button on-click="increment">+</button>
      </div>
    `, this);
  }
}
// Automatically registered as <app-my-widget>
```

### 10.2 Adding a New Route
```typescript
// In src/app.routes.ts
routeBuilder.add('my-page', () => import('./pages/my-page.page'));
// Navigate with router.navigateTo('/my-page')
```

### 10.3 Publishing App Events
```typescript
// In a component
this.publish(APP_CONFIG.messages.app.themeChanged, 'dark');

// Or globally
pubSub.publish(APP_CONFIG.messages.app.themeChanged, 'dark');

// Subscribe elsewhere
this.subscribe(APP_CONFIG.messages.app.themeChanged, (theme) => {
  console.log('Theme changed to:', theme);
});
```

### 10.4 Translating Content
```typescript
// In template
<h1 data-t="ui.welcome"></h1>
<p>{i18n.t('messages.greeting', { name: userName })}</p>

// In code
const text = APP_CONFIG.i18n.t('ui.welcome');
```

---

## Summary Table

| Aspect | Technology/Pattern |
|--------|-------------------|
| **Language** | TypeScript 5.9.3 |
| **Build Tool** | Vite 7.3.1 |
| **Component Model** | BaseComponent (Proxy-based reactivity) |
| **State Management** | Proxy + useState hook |
| **Messaging** | PubSub (instance-scoped + global) |
| **Routing** | Client-side (History API) |
| **Styling** | Tailwind CSS 4.1.18 |
| **Internationalization** | Custom i18n service (es/en) |
| **HTTP Client** | Fluent builder pattern |
| **Reports** | Custom report engine with mediator pattern |
| **Icons** | Lucide SVG library |
| **Code Quality** | ESLint + Prettier + TypeScript strict |
