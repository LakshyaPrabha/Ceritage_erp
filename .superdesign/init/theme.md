# Theme

## Compact Token Summary

Framework/CSS:
- Vite + React + Tailwind CSS v4 via `@tailwindcss/vite`.
- No `tailwind.config.*` file is present.
- Global CSS file: `frontend/src/index.css`.
- Shared brand tokens: `frontend/src/theme.js`.

Brand:
- `blue`: `#3B55E6`
- `purple`: `#8B3BC8`
- `pink`: `#E63B8A`
- gradient: `linear-gradient(135deg,#3B55E6 0%,#8B3BC8 50%,#E63B8A 100%)`
- button gradient: `linear-gradient(135deg,#3B55E6,#8B3BC8)`

Dashboard dark theme:
- `bg`: `#0d0d18`
- `sidebar/topbar`: `#12122a`
- `card`: `#16162a`
- `card2`: `#1a1a32`
- `text`: `#f0eeff`
- `textSub`: `#8080b8`
- `border`: `rgba(139,59,200,0.22)`

Dashboard light theme:
- `bg`: `#f4f3ff`
- `sidebar/topbar/card`: `#ffffff`
- `card2`: `#f8f7ff`
- `text`: `#1a1530`
- `textSub`: `#6050a0`
- `border`: `rgba(139,59,200,0.15)`

Typography:
- Global and dashboard font stack: `'Segoe UI', -apple-system, BlinkMacSystemFont, Inter, ui-sans-serif, system-ui, sans-serif`
- Dashboard page headings: ~21px / 700
- Cards/tables: 11px-15px utility sizes via inline styles

Radii/shadows:
- Dashboard cards use `12px` radius.
- Buttons mostly use `7px-11px` radius.
- Modals use `16px` radius.
- Login card uses `20px` radius.

## Raw Source: `frontend/src/theme.js`

```js
export const BRAND = {
  blue:    "#3B55E6",
  purple:  "#8B3BC8",
  pink:    "#E63B8A",
  grad:    "linear-gradient(135deg,#3B55E6 0%,#8B3BC8 50%,#E63B8A 100%)",
  gradBtn: "linear-gradient(135deg,#3B55E6,#8B3BC8)",
};
```

## Raw Source: `frontend/src/index.css`

```css
@import "tailwindcss";

:root {
  font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Inter, ui-sans-serif, system-ui, sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body, #root {
  min-height: 100vh;
}

@media (prefers-color-scheme: dark) {
  html, body { background: #0d0d18; color: #f0eeff; }
}

@media (prefers-color-scheme: light) {
  html, body { background: #f4f3ff; color: #1a1530; }
}

a {
  color: inherit;
  text-decoration: none;
}

button, a {
  -webkit-tap-highlight-color: transparent;
}

::selection {
  background: #8B3BC8;
  color: #fff;
}

::-webkit-scrollbar { width: 5px; height: 5px; }

@media (prefers-color-scheme: dark) {
  ::-webkit-scrollbar-track { background: #0d0d18; }
  ::-webkit-scrollbar-thumb { background: #3B3B7A; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #8B3BC8; }
}

@media (prefers-color-scheme: light) {
  ::-webkit-scrollbar-track { background: #ece9ff; }
  ::-webkit-scrollbar-thumb { background: #c0b0e8; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #8B3BC8; }
}

input:focus, select:focus, textarea:focus {
  border-color: rgba(139, 59, 200, 0.6) !important;
  box-shadow: 0 0 0 3px rgba(59, 85, 230, 0.1) !important;
  outline: none;
}
```
