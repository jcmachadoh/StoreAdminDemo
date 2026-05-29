# AGENTS.md — AdminApp (Ecosistema POS)

React Native 0.85.3 app bootstrapped from `@react-native-community/cli`. Clean Architecture (Spanish naming).

## Dev commands

```sh
npm start                 # Metro dev server
npm run android           # Build & run Android
npm run ios               # Build & run iOS
npm run lint              # ESLint (no --fix in script; add manually)
npx tsc --noEmit          # Type-check (no npm script defined)
npm test                  # Jest (uses @react-native/jest-preset)
npx prettier --check .    # Formatter check (no npm script defined)
npx prettier --write .    # Formatter fix
```

## Critical architecture facts

- **No backend server.** The data store is `github.com/jcmachadoh/GitStore` — JSON files on the `main` branch, read/written via GitHub REST API v3 with SHA-based optimistic concurrency. Authentication via GitHub PAT.
- **Offline-first.** All mutations write to MMKV (encrypted local storage) immediately; background sync pushes to GitHub.
- **No DI container.** Use cases instantiate adapters directly with `new` (e.g. `new GitHubApiAdapter(token)`).
- **No theme / design tokens.** `src/presentation/theme/` is empty. All styles are inline `StyleSheet.create()` with hardcoded colors (`#0366d6`, `#28a745`, `#d9534f`).
- **Cloudinary image upload** — adapter exists but placeholder creds (`TU_CLOUD_NAME`) are not yet configured.

## Conventions

- **Spanish naming** — entities, use cases, screens, variables. English keywords/comments.
- **`.prettierrc.js`:** `singleQuote: true`, `arrowParens: 'avoid'`, `trailingComma: 'all'`
- **Navigation:** single `@react-navigation/native-stack` stack navigator, 14 routes, conditional auth flow.
- **State:** Zustand stores in `src/presentation/store/` — `useAuthStore`, `useCartStore`, `useInventarioStore`, `useUIStore`
- **Testing:** single snapshot test in `__tests__/App.test.tsx`. No test for anything else yet.

## Package manager

**Yarn** (`yarn.lock`). No `npm` lockfile.

## Gotchas

- No CI/CD, no workflows, no pre-commit hooks.
- Hardcoded values for GitHub repo owner/name, Cloudinary creds (placeholder), no `.env` files.
- Role system: `propietario`, `jefe_sucursal`, `empleado`, `gestor_inventario` — users can hold multiple roles, switched via tab bar.
- App entry: `index.js` → `App.tsx` → `AppNavigation.tsx`
