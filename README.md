# App Drawer

This document is an explainer for a potential browser-provided "App Drawer" component, implemented as a [built-in module](https://github.com/tc39/proposal-javascript-standard-library/).  App Drawer is delivered as a Custom Element, making it framework-agnostic and easy to integrate into existing applications.  It supports the gestures users expect from experience with native mobile platforms, ensures a consistent UX for opening and dismissal, and solves accessibility issues common to web-based drawer implementations. It ships unstyled, and is easily customized via attributes and CSS Custom Properties.

## Sample code

```html
<app-drawer id="drawer">
  <header><h1>App</h1></header>
  <nav>
    <a href="/">Home</a>
    ...
  </nav>
</app-drawer>

<script type="module">
  import '@std/app-drawer';
  drawer.addEventListener('close', () => {
    console.log('closed');
  });
  drawer.open();
</script>

<!-- Future:  <script type="module" src="import:@std/app-drawer"></script> -->
```

## Motivation

The concept of an "app drawer" is pervasive on the web. Also referred to as "off-canvas navigation" or modal sidebars, these represent an important component of many User Interfaces and often contain an web app's primary navigation.

There are a multitude of drawer implementations in userland, many of which suffer from usability or performance issues. The inconsistency and unreliability of important UX characteristics like gestures & keyboard support has fractured web users' expectations of the metaphor, demonstrating the need for a browser-provided solution.

(link to existing drawer impls?)

We want to win back the trust of web users by bringing consistency, reliability and performance to drawer UI's.

---

## API

### Slots

By default, any elements placed into `<app-drawer>` are rendered within the sliding drawer panel. Children can also be placed into other areas using [Named Slots](https://developers.google.com/web/fundamentals/web-components/shadowdom#slots):

```html
<app-drawer>
  <div slot="backdrop">Placed into the backdrop (grayed out) area</div>

  <div slot="header">Placed first in the drawer area</div>
  
  <div>Any other children are placed into the drawer (after the header)</div>
</app-drawer>
```

### CSS Custom Properties

Styling can be adjusted using the following CSS Custom Properties:

- `--width`: the drawer's default width _(default: `200px`)_
- `--max-width`: maximum drawer width as a percentage of the viewport _(default: `100`)_
- `--background`: background color for the sliding drawer panel _(default: `#eee`)_
- `--backdrop`: background for the backdrop/shim behind the drawer _(default: `rgba(0, 0, 0, 0.5)`)_

Additionally, the drawer exposes some of its state as CSS Custom Properties, which can be used to reactively style the drawer or any element within it:

- `--percent`: the current percent visibility/openness of the drawer during a drag gesture
- `--tf-x`: the current CSS transform (`translateX(xx)`) applied to the drawer during a drag gesture

### `AppDrawer`

Custom Element constructor, inheriting from HTMLElement.

To create an App Drawer instance programmatically:

```js
const appDrawer = document.createElement('app-drawer');
```

#### `.toggle(forceState)`

Opens or closes the drawer based on its current state.

If `forceState` is a Boolean value, the drawer will be opened or closed regardless of its current state.

#### `.open()`

Open the drawer if it is currently closed.

> **Note:** If invoked during a drawer gesture, overrides the end state of the gesture.

#### `.close()`

Close the drawer if it is currently open.

> **Note:** If invoked during a drawer gesture, overrides the end state of the gesture.

#### event: `toggle(e)`

Fired when the drawer finishes opening or closing. The event includes a `.open` property with a Boolean indicating the drawer's new state.

```js
drawer.addEventListener('toggle', e => {
  console.log('Drawer is now ', e.open ? 'open' : 'closed');
})
```

---

## Open issues and questions

Please see [the issue tracker](https://github.com/developit/app-drawer/issues) for open issues on the API surface detailed above.

## Impact

This feature would be medium-effort, medium-reward.

- Applications would no longer need to build and ship custom drawer implementations
- Developers would not need to implement gesture support or platform-specific differences
- Users of assistive technologies would benefit from a well-known and DOM-controllable interaction model

## Comparison to existing solutions

There are a number of standalone drawer implementations available on npm that offer comparable functionality:

- `rc-drawer`, 11kB and downloaded [~90k times per week](https://www.npmjs.com/package/rc-drawer)
- `@material/drawer`, 7.8kB and downloaded [~30k times per week](https://www.npmjs.com/package/@material/drawer)
- `react-burger-menu`, 5.2kB and downloaded [~25k times per week](https://www.npmjs.com/package/react-burger-menu)
- `@iamadamjowett/angular-click-outside`, 0.5kB and downloaded [~15k times per week](https://www.npmjs.com/package/@iamadamjowett/angular-click-outside)
- `react-sidebar`, 2.4kB and downloaded [~12k times per week](https://www.npmjs.com/package/react-sidebar)

(All of the above statistics are as of 2019-02-06.)
