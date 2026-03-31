import { APP_CONFIG } from "../../app.config";
import { $ } from "../../core/dom";
import { pubSub } from "../../core/services/pubsub.service";
import { buildAndInterpolateDSL } from "../../core/template-compiler";
import { BaseComponent } from "../../core/types";
import { getCharacters, type Character } from "../../services/the-simpsons.service";
import type { ComponentContext } from "../component.model";


export class TheSimpsonsComponent extends BaseComponent {

  term = '';

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  async loadMore() {
    this.state.isLoading = true;
    // pubSub.publish(MESSAGES.HttpClient.Loading)
    const result = await getCharacters(this.state.currentPage);
    pubSub.publish(APP_CONFIG.messages.HttpClient.Loaded)
    if (typeof result === 'string') {
      console.error("Error al cargar personajes");
      this.state.isLoading = false;
      return;
    }
    this.setState({ 
      characters: [...this.state.characters, ...result.data],
      currentPage: this.state.currentPage + 1,
      isLoading: false
    })
    setTimeout(() => {
      this.showHideCharacters();
    }, 0);
  }

  filter(tagets: Character[]): number[] { 
    const searchTerm = this.term.toLowerCase();
    if (!searchTerm) {
      return tagets.map((c: Character) => c.id);
    }
    return tagets
      .filter((c: Character) => {
        return c.name.toLowerCase().includes(searchTerm) ||
              c.gender.toLowerCase().includes(searchTerm) ||
              c.status.toLowerCase().includes(searchTerm) ||
              c.occupation.toLowerCase().includes(searchTerm);
      })
      .map((c: Character)=> c.id);
  }

  showHideCharacters(){
    const t = APP_CONFIG.i18n.t;
    const matchedIds = this.filter(this.state.characters);
    const matchSet = new Set(matchedIds.map(id => String(id)));
    $('[id^="character-"]', this.element)
      .all()
      .forEach(element => {
        const domId = element.id.split('-')[1];
        const isVisible = matchSet.has(domId);
        element.classList.toggle('hidden', !isVisible);
      });
    this.publish('MSG_FILTERED', matchedIds.length);
    const text = matchedIds.length != this.state.characters.length ? t('simpsons.totalFilteredResults', { count: matchedIds.length }) :'';
    $('[data-slot="001"]').one()!.textContent = text;
  }

  handleKeyup(el: HTMLInputElement, _e: KeyboardEvent) {
    this.term = el.value.trim();
    this.showHideCharacters();
  }

  translate(key: string, mode: string) {
    return APP_CONFIG.i18n.t(`simpsons.${mode}.${key.toLowerCase()}`, this);
  }

  async init() {
    this.setState({
      characters: [],
      currentPage: 1,
      isLoading: true
    });
    this.addCleanup(
      APP_CONFIG.i18n.changed(() => this.invalidate())
    );
    await this.loadMore();
  }

  render() {
    const template = `
      <div class="p-6 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors duration-500">
        
        <header class="mb-8 space-y-4">
          <div class="flex justify-between items-center">
            <div data-component="app-language-selector"></div>
            
            @if(state.isLoading)
              <div class="flex items-center gap-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                <div class="animate-spin size-4 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
                <span class="text-[10px] font-bold text-yellow-700 dark:text-yellow-400 uppercase tracking-widest">
                  {t:simpsons.loading}
                </span>
              </div>
            @endif
          </div>

          <div class="flex flex-col justify-between gap-6">        
            <div class="flex-1">
              <h1 class="text-4xl font-black text-slate-900 dark:text-yellow-400 uppercase italic leading-none">
                {t:simpsons.title}
              </h1>
              <p class="text-slate-500 dark:text-slate-400 mt-1">{t:simpsons.subtitle}</p>
              <div class="mt-2 font-medium text-slate-400 uppercase tracking-tighter">
                {t:simpsons.totalResults} <span on-publish="MSG_FILTERED:local:html"></span> filtrados.
              </div>
              <div class="mt-2 font-medium text-slate-400 uppercase tracking-tighter">
                <span on-publish="MSG_FILTERED:local:html"></span> filtrados.
              </div>
              <div data-slot="001" class="mt-2 font-medium text-slate-400 uppercase tracking-tighter">
              </div>
            </div>
            <div class="flex items-center gap-3 w-full md:w-auto">
              <div class="relative flex-1 md:w-40">
                <i data-icon="search" class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400"></i>
                <input 
                  type="text"
                  value="{term}"
                  on-keyup="handleKeyup"
                  placeholder="{t:simpsons.searchPlaceholder}"
                  class="w-full pl-4 pr-4 py-2 bg-white dark:bg-slate-900 
                    border border-slate-200 dark:border-slate-800 rounded-xl 
                    text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:text-slate-200 
                    transition-all"
                />
              </div>
              <button on-click="loadMore" 
                class="whitespace-nowrap px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold rounded-xl shadow-md transition-transform active:scale-95 text-sm uppercase">
                {t:simpsons.loadMore}
              </button>
            </div>

          </div>
        </header>

        <div 
          data-eachg="person in state.characters"
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 w-full">
          @each(person in state.characters)
            <div id="character-{person.id}">
              <div class="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300">
                
                <div class="aspect-4/3 overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img 
                    src="https://cdn.thesimpsonsapi.com/200{person.portrait_path}" 
                    alt="{person.name}" 
                    class="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500" 
                    />
                </div>

                <div class="p-4">
                  <div class="flex justify-between items-start mb-2">
                    <h3 class="font-bold text-lg text-slate-800 dark:text-slate-100 leading-tight">
                      {person.name}
                    </h3>
                    <span class="text-xs font-bold px-2 py-1 rounded-md 
                      @if(person.status === 'Alive') bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 @endif
                      @if(person.status !== 'Alive') bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 @endif">
                      { person.status | translate:status }
                    </span>
                  </div>
                  
                  <p class="text-sm text-slate-500 dark:text-slate-400 mb-4 h-10 overflow-hidden line-clamp-2">
                    <i data-icon="briefcase" class="inline size-3 mr-1"></i> {person.occupation}
                  </p>

                  <div class="flex gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 mt-auto">
                    <span class="text-[10px] uppercase tracking-wider font-bold text-slate-400 italic">
                      {person.gender | translate:gender} | {person.age} {t:simpsons.years}
                    </span>
                  </div>
                </div>
              </div>                       
            </div>
          @endeach
        </div>
      </div>
    `;

    return buildAndInterpolateDSL(template, this);
  }
}
