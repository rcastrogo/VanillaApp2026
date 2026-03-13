
import './styles.css';
import { $, build } from './core/dom';
import { initObserver } from './core/dom-observer';
import template from './main.template.html?raw';

document.addEventListener('DOMContentLoaded', () => {
  initObserver();
  const root = $('#app').one();
  if(root){
    root.appendChild(build('div', template, false, { }));
  }

  document.body.style.visibility = 'visible';  
})
