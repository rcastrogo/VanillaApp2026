import type { ComponentContext } from "./component.model";
import { APP_CONFIG } from "../app.config";
import { buildAndInterpolate } from "../core/dom";
import { BaseComponent } from "../core/types";
import type { Language } from "../i18n";

export class LanguageSelector extends BaseComponent {

  public availableLangs = ['es', 'en'];

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  get current() {
    return {
      lang : APP_CONFIG.i18n.currentLng,
      label : `language.${APP_CONFIG.i18n.currentLng}`
    }
  }

  toggleMenu() {    
    this.state.isMenuOpen = !this.state.isMenuOpen;
  }

  changeLanguage(_el: HTMLElement, _e: Event, newLang: Language) {
    APP_CONFIG.i18n.setLang(newLang);
    this.state.isMenuOpen = false;
  }

  translate(lang: string){
    return APP_CONFIG.i18n.t(`language.${lang}`, {});
  }


  init(): void {
    this.addCleanup(
      APP_CONFIG.i18n.changed(() => this.invalidate())
    );
    super.setState({
      isMenuOpen: false,
    });  
  }

  render() {
    const template = `
      <div class="relative inline-block text-left">
        <button 
          on-click="toggleMenu"
          class="app-button flex items-center gap-2 px-3 py-2 rounded-md  
             transition-colors">
          <span class="size-4 hidden lg:block">
            <i data-icon="globe" class="size-5"></i>
          </span>     
          <span class="text-sm block lg:hidden uppercase">{ current.lang }</span>
          <span class="text-sm hidden lg:block">{ current.label | t }</span>          
          <span class="size-4 opacity-50">
            @if(state.isMenuOpen)<i data-icon="chevron-up" class="size-5"></i>@endif
            @if(!state.isMenuOpen)<i data-icon="chevron-down" class="size-5"></i>@endif
          </span>
        </button>
        @if(state.isMenuOpen)
          <div class="absolute right-0 z-50 mt-2 min-w-30 
            overflow-hidden rounded-md border bg-popover p-1 
            shadow-lg animate-in fade-in zoom-in-95">
            <div 
              data-each="lang in availableLangs" 
              class="pt-1"
              >
              <button 
                on-click="changeLanguage:{lang}:@lang"
                class="relative flex w-full cursor-pointer select-none 
                  items-center justify-center rounded-sm px-2 py-1.5 mb-1 text-sm 
                  border-none outline-none focus:ring-2 transition-colors hover:bg-accent 
                  @if(current.lang === lang) bg-accent text-accent-foreground @endif
                "
              >
                <span class="text-sm block lg:hidden uppercase">{ lang }</span>
                <span class="text-sm hidden lg:block">
                  {lang | translate}
                </span>
              </button>
            </div>
          </div>
        @endif
      </div>
    `;
    return buildAndInterpolate(template, this);
  }
}

// class="relative flex items-center gap-3 px-4 py-2 rounded-full border transition-all duration-300
// {
//   state.isDarkMode | 
//     iif: bg-slate-800 border-slate-700 text-yellow-200 
//        : bg-white border-slate-200 text-slate-600 hover:bg-slate-50
// }">
   
// @if(state.isDarkMode)
//   <i data-icon="sun" class="size-5"></i>
//   <span class="hidden text-sm font-bold">Modo Claro</span>
// @endif

// @if(!state.isDarkMode)
//   <i data-icon="moon" class="size-5 text-indigo-500"></i>
//   <span class="hidden text-sm font-bold text-slate-700">Modo Oscuro</span>
// @endif