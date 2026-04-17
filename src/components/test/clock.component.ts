import { build } from "@/core/dom";
import { useState } from "@/core/state.utils";
import { BaseComponent } from "@/core/types";

export class ClockComponent extends BaseComponent {

  private _state = useState({ seconds: 0, date: '' });

  init(): void {
    const { put : update } = this._state;
    const intervalId = setInterval(() => {
      update('date', new Date().toTimeString().split(' ')[0])
    }, 1_000);
    this.addCleanup(() => clearInterval(intervalId));
  }

  render(): HTMLElement {

    const { on } = this._state;

    const view = build('div', `
      <div class="rounded-lg p-1.5 border bg-background">
        <div class="flex items-center gap-3 mx-1">
          <i data-icon="timer" class="size-6 hidden lg:block"></i>
          <span class="font-mono text-slate-700 dark:text-slate-100" id="date-slot">
            --:--:--
          </span>
        </div>
      </div>
    `, true);

    on(
      'date', 
      value => {
        view.querySelector('#date-slot')!.textContent = value;
      });

    return view;
  }

}
