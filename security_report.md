# Security Review: `feat/game-3-siege-destruction`

**Date:** 2026-06-15

No high-confidence security vulnerabilities were found in the changes on this branch.

## Analysis Summary

This PR adds a fully client-side browser game (Crush the Castle) with no server, no authentication surface, and no network endpoints accepting user input. Four potential findings were identified during initial analysis, but all were assessed below the reporting threshold after false-positive filtering:

| Finding | File | Confidence | Outcome |
|---|---|---|---|
| Debug object on `window._game` | `js/main.js:8` | 9/10 false positive | Client-side code has no meaningful security boundary; any user can already manipulate state via DevTools. Excluded under "lack of hardening" and "client-side JS is untrusted" precedents. |
| XSS via `localStorage` → `innerHTML` | `js/ui/menu.js:46-52` | 4/10 vulnerability | The `bestScore > 0` numeric coercion guard accidentally neutralizes string injection at this point. |
| No type validation on parsed save data | `js/save/saveManager.js:33-42` | 3/10 vulnerability | All downstream usages have implicit numeric guards (`\|\| 0`, arithmetic coercion). No active exploit path. |
| Untrusted level JSON → `classList.add` | `js/level/levelLoader.js` / `js/ui/hud.js:18` | 2/10 vulnerability | `classList.add` does not execute JS; invalid tokens throw `DOMException`. Not exploitable. |

## Result

**No actionable security findings.**

---

## Production Hardening Recommendations

### Preventing Source Code Copying

Client-side JS cannot be fully hidden — the browser must download and execute it. The following layers make it practically very hard to copy or understand.

#### 1. JS Minification + Obfuscation (recommended first step)

Install `vite-plugin-javascript-obfuscator`:

```bash
npm install --save-dev vite-plugin-javascript-obfuscator
```

```js
// vite.config.js
import obfuscator from 'vite-plugin-javascript-obfuscator';

export default {
  build: {
    sourcemap: false,
    minify: 'terser'
  },
  plugins: [
    obfuscator({
      options: {
        controlFlowFlattening: true,
        deadCodeInjection: true,
        stringEncryption: true,
        selfDefending: true,
      }
    })
  ]
}
```

#### 2. CSS Class Name Obfuscation via CSS Modules

Rename CSS files to `.module.css` and configure Vite to emit hashed class names:

```js
// vite.config.js
export default {
  css: {
    modules: {
      generateScopedName: '[hash:base64:5]'  // .level-btn → ._a3f9x
    }
  }
}
```

Import and use in JS:

```js
import styles from '../css/style.module.css';
btn.className = `${styles['level-btn']} ${styles.locked}`;
```

**Alternative (less refactor):** Use Tailwind CSS — utility classes like `flex items-center w-16 h-16` carry no semantic meaning, making it impossible to identify components from class names alone.

#### 3. Move Critical Logic Server-Side

For score integrity, validate on a server. Physics and rendering can stay client-side, but score submission should be verified server-side to prevent cheating.

#### 4. WebAssembly for Core Logic (advanced)

Compile physics/collision logic to WASM (via C/Rust). Browsers cannot easily inspect `.wasm` binaries and decompiling is significantly harder than reading JS.

### Protection Layer Comparison

| Stack | JS Readability | CSS Readability | Effort |
|---|---|---|---|
| Raw source | Fully readable | Fully readable | — |
| Vite minified only | Hard, recoverable with formatter | Readable | Low |
| Vite + Tailwind | JS traceable, classes meaningless | Obfuscated | Medium |
| Vite + Tailwind + obfuscator | Practically unreadable | Obfuscated | Medium |
| Above + WASM core logic | Near impossible | Obfuscated | High |

**Recommended for this project:** Vite + Tailwind + `vite-plugin-javascript-obfuscator` with `sourcemap: false`. Covers all three layers with minimal setup.
