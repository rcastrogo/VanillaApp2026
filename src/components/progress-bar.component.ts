
import type { ComponentInitValue } from "./component.model";

import { APP_CONFIG } from "@/app.config";
import { buildAndInterpolate } from "@/core/dom";
import { BaseComponent } from "@/core/types";


export class ProgressBarComponent extends BaseComponent {

  progress = 0;
  intervalId = 0;

  init(ctx: ComponentInitValue) {
    super.init(ctx);
    this.initTimer();
  }

  initTimer() {
    const timeout = parseInt(this.props.intervalSpeed || '100');
    const increment = parseInt(this.props.increment || '5');
    this.intervalId = setInterval(() => {
      if (this.progress >= 100) 
        this.progress = 0;
      else 
        this.progress = Math.min(100, this.progress + increment);
      this.invalidate();
    }, timeout);
    this.addCleanup(() => clearInterval(this.intervalId))
  }

  resolveProgressClasses() {
    if(this.props.changeColor !== 'true' || this.props.progressBackground) {
      return  this.props.progressBackground ?? 'bg-blue-700 dark:bg-blue-800';
    } 
    if (this.progress < 50) return 'bg-green-500 dark:bg-green-500';
    if (this.progress < 80) return 'bg-yellow-500 dark:bg-yellow-500';
    return 'bg-red-500 dark:bg-red-500';
  }

  render() {
    const showPercentage = this.props.showPercentage === 'true';
    const position = this.props.percentagePosition || 'center';
    const percentageClasses = 'text-[10px] font-light text-gray-700 dark:text-gray-300 whitespace-nowrap';
    const progressClasses = this.resolveProgressClasses();

    const template = `
      <div class="h-1 w-full flex text-center  ${position === 'center' ? 'flex-col': 'items-center'}">     
        @if(${showPercentage && position === 'left'})
          <span class="w-10 font-bold ${percentageClasses}">
            {progress}%
          </span>
        @endif
        <div class="flex-1 relative h-full">
          <div class="h-full w-full rounded-full border">
            <div 
              class="h-full rounded-full transition-all duration-100 ease-out 
              ${progressClasses}" 
              style="width: {progress}%;"
            >
            </div>      
          </div>
          @if(${showPercentage && position === 'center'})
            <div class="text-center absolute inset-0 flex items-center justify-center">
              <span class="font-bold ${this.progress < 50 ? '' : 'text-white'} ${percentageClasses}">
                {progress}%
              </span>
            </div>
          @endif          
        </div>
        @if(${showPercentage && position === 'right'})
          <span class="w-10 font-bold ${percentageClasses}">
            {progress}%
          </span>
        @endif
      </div>
    `;
    return buildAndInterpolate(template, this);
  }

}

export class RedProgressBarComponent extends BaseComponent {

  init(ctx: ComponentInitValue) {
    super.init(ctx);
  }

  render(): HTMLElement {
    const message = this.props.message || 'Loading...';
    const template = `        
      <div class="flex flex-col items-center gap-2 justify-center m-1">
        ${message}
        <div class="h-1 w-full overflow-hidden rounded-full bg-red-900 mb-1">
          <div
            class="h-full w-full origin-left animate-[progress_2.5s_infinite_linear] bg-gray-400">
          </div>
        </div>
      </div>
    `;
    return buildAndInterpolate(template, this);
  }

}

Promise.resolve().then(() => {
  APP_CONFIG.registerComponent('app-red-progress-bar', RedProgressBarComponent);
});