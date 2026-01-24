# Project Recommendations and Review

This document outlines recommendations for the `bio-integrator-ai-fabian` project based on a recent code review.

## 1. Environment Variables
**Current State:** The project uses `process.env.API_KEY` and `process.env.GEMINI_API_KEY`, which are polyfilled in `vite.config.ts`.
**Recommendation:** Migrate to Vite's standard `import.meta.env` system.
- Rename `.env` variables to start with `VITE_` (e.g., `VITE_GEMINI_API_KEY`).
- Access them via `import.meta.env.VITE_GEMINI_API_KEY`.
- This avoids the need for manual `define` configurations in `vite.config.ts` and aligns with Vite best practices.

## 2. Bundle Optimization
**Current State:** Lazy loading and manual chunk splitting have been implemented to resolve chunk size warnings.
**Recommendation:** Continue to monitor bundle size.
- Ensure any new large dependencies (like visualization libraries or heavy SDKs) are added to `manualChunks` in `vite.config.ts`.
- Use `React.lazy` for any new route-based components or heavy modals.

## 3. Dependency Management
**Current State:** The `@google/genai` package was updated to `^1.38.0` to resolve installation issues.
**Recommendation:** Regularly check for updates, especially for rapidly evolving AI SDKs.
- Use `npm outdated` to identify outdated packages.
- Be cautious with peer dependencies, especially with React 19 (which is currently used) and libraries like `recharts` that might have strict peer requirements.

## 4. Code Structure
**Current State:** Components are well-structured but some hardcoded data exists in `App.tsx`.
**Recommendation:**
- Move constant data (like `DEMO_PATIENT_COMPLETE`) to a separate file (e.g., `data/demoData.ts`) to clean up `App.tsx`.
- Consider using a context or state management library if the application grows, to avoid prop drilling.

## 5. Error Handling
**Current State:** Basic error handling is present in API calls.
**Recommendation:**
- Implement a global error boundary to catch runtime errors in the UI.
- Enhance the `Suspense` fallback with a more polished loading state or skeleton UI.
