/**
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

let template;

function html (statics) {
  if (!template) template = document.createElement('template');
  template.innerHTML = statics.join('');
  const frag = document.createDocumentFragment();
  let child = (template.content || template).firstElementChild;
  while (child) {
    const next = child.nextElementSibling;
    frag.appendChild(child);
    child = next;
  }
  return () => frag.cloneNode(true);
}

const TEMPLATE = html`
  <aside><slot name="header"></slot><slot></slot></aside>
  <div><slot name="backdrop"></slot></div>
  <style>
    :host {
      touch-action: none;
      overflow: visible;
      --width: 200px;
      --max-width: 100;
      --background: #eee;
      --backdrop: rgba(0, 0, 0, 0.5);
    }

    :host > div {
      position: fixed;
      left: 0;
      top: 0;
      width: 100vw;
      height: 100vh;
      opacity: var(--percent, 0);
      background: var(--backdrop);
      transition: opacity 300ms ease;
      pointer-events: none;
      z-index: 999;
    }

    :host > aside {
      position: fixed;
      left: calc(-1 * var(--width, 200px));
      top: 0;
      width: var(--width, 200px);
      max-width: calc(1vw * var(--max-width, 100));
      height: 100vh;
      background: var(--background, #fff);
      transition: transform 200ms cubic-bezier(0, 0, 0.5, 1);
      z-index: 1000;
      transform: translateX(var(--tf-x, 0));
    }

    :host([align='right']) > aside {
      left: auto;
      right: 0;
    }
    :host([align='bottom']) > aside {
      bottom: 0;
      top: auto;
    }
    :host([align*='to']) > aside {
      height: var(--width, 200px);
      max-height: calc(1vh * var(--max-width, 100));
      max-width: none;
      width: 100vw;
    }

    :host([open]) > aside {
      transform: translateX(var(--tf-x, var(--width, 200px)));
    }
    :host([open]) > div {
      pointer-events: auto;
      opacity: 1;
    }
  </style>
`;

class AppDrawer extends HTMLElement {
  constructor () {
    super();
    this.animating = false;

    const shadow = this.attachShadow({ mode: 'open' });
    shadow.appendChild(TEMPLATE());

    const drawer = shadow.firstChild;

    const done = () => {
      this.animating = false;
      const evt = new Event('toggle');
      // @todo: worth just going with .detail here?
      evt.open = evt.detail = this.open;
      this.dispatchEvent(evt);
    };

    drawer.addEventListener('transitionend', e => {
      if (e.target === drawer) done();
    });

    this.addEventListener('click', e => {
      // ignore clicks generated from swipe dismissal
      if (lastDragEnd && Date.now() - lastDragEnd < 50) return;
      let child = e.target;
      let autoclose = this.autoclose;
      while (child && child !== this) {
        if (child.hasAttribute('autoclose')) {
          autoclose = child.getAttribute('autoclose') !== 'false';
        }
        child = child.parentNode;
      }
      if (autoclose) {
        this._closeTimer = setTimeout(this.close.bind(this));
      }
    });

    const coords = e => ({ id: e.pointerId, x: e.pageX, y: e.pageY });
    let events = [];
    let down;
    let start;
    let prev;
    let startX;
    let startUserSelect;
    let startTouchAction;
    let preventClick;
    let lastDragEnd;
    const preventDefault = e => {
      e.preventDefault();
      e.stopPropagation();
    };
    this.addEventListener('dragstart', preventDefault);
    addEventListener('pointerdown', e => {
      if (e.button) return;
      down = coords(e);
      start = null;
    });
    addEventListener('pointermove', e => {
      if (!down) return;
      const cur = coords(e);
      if (cur.id !== down.id) return;
      if (!start) {
        const delta = cur.x - down.x;
        if (Math.abs(delta) < 5) return;
        if (Math.abs(cur.y - down.y) >= 6) return cancel();
        if (this.open) preventClick = true;
        if (this.open && delta > 0) return;
        if (!this.open && delta < 0) return;
        start = cur;
        // @todo: Y
        const transform = getComputedStyle(drawer).transform;
        const tf = transform.match(/([^,]+),([^,]+)\)/);
        startX = (tf && parseFloat(tf[1])) || 0;
        drawer.style.transition = 'none';
        backdrop.style.transition = 'none';
        if (drawer.setPointerCapture) {
          drawer.setPointerCapture(e.pointerId);
        }
        startUserSelect = document.body.style.userSelect;
        startTouchAction = document.body.style.touchAction;
        document.body.style.userSelect = document.body.style.touchAction = 'none';
      }
      if (events.push(cur) > 5) events.shift(events);
      let x = startX + cur.x - start.x;
      x = Math.max(0, Math.min(x, this.width || 200));

      drawer.style.setProperty('--tf-x', x + 'px');
      this.style.setProperty('--percent', x / (this.width || 200));

      prev = cur;
      preventDefault(e);
    });
    addEventListener('pointerup', e => {
      if (!down) return;
      if (start) {
        drawer.style.setProperty('--tf-x', '');
        this.style.setProperty('--percent', '');
        drawer.style.transition = backdrop.style.transition = '';
        document.body.style.userSelect = startUserSelect;
        document.body.style.touchAction = startTouchAction;
      }
      if (start || preventClick) {
        lastDragEnd = Date.now();
      }
      if (prev && events.length > 4) {
        const delta = prev.x - events[0].x;
        this.open = delta > 0;

        // if there isn't going to be an animation to done state, trigger it now:
        let x = startX + prev.x - start.x;
        if (x <= 0 || x >= (this.width || 200)) done();

        preventDefault(e);
      }
      cancel();
    });

    const cancel = () => {
      events.length = 0;
      down = prev = start = startX = startUserSelect = startTouchAction = preventClick = null;
    };

    const backdrop = drawer.nextSibling;
    backdrop.addEventListener('click', this.close.bind(this));
  }

  connectedCallback () {}

  get open () {
    return this.hasAttribute('open');
  }
  set open (value) {
    this.animating = true;
    clearTimeout(this._closeTimer);
    if (value) this.setAttribute('open', '');
    else this.removeAttribute('open');
  }

  close () {
    this.open = false;
  }

  toggle (forceState) {
    if (typeof forceState !== 'boolean') {
      forceState = !this.isOpen;
    }
    this.open = forceState;
  }

  get autoclose () {
    return this.hasAttribute('autoclose');
  }
  set autoclose (value) {
    if (value) this.setAttribute('autoclose', '');
    else this.removeAttribute('autoclose');
  }
}

customElements.define('app-drawer', AppDrawer);
