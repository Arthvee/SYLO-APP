# Phase 3 Technical Specification: Validation & Verification Criteria
## Frontend Architecture, State Management & Routing Engine

**Project**: Sylo (Project & Task Management App)  
**Phase**: Phase 3  
**Status**: Approved Specification  
**Version**: 1.0  
**PRD Traceability**: FR-06, FR-07, FR-34, FR-38, FR-39, Stitch Project `17067369580908098964`  

---

## 1. Overview & Verification Strategy

Phase 3 transitions Sylo into a unified client-server architecture. The validation protocol enforces that:
1. **Compilation & Bundle Integrity**: Vite and Tailwind compile cleanly without missing assets or unresolved imports.
2. **Deterministic Route Protection**: Unauthenticated traffic is strictly intercepted before protected views render, while redirect destinations are preserved.
3. **HTTP Interceptor Reliability**: JWT Bearer tokens are attached transparently to all outgoing API requests, and HTTP 401 responses automatically purge credentials.
4. **State Persistence & Multi-Context Reactivity**: `AuthContext`, `ProjectContext`, and `ToastContext` operate harmoniously across storage updates, network actions, and state transitions.
5. **Stitch Design Token Fidelity**: Color hex values, typography scales, container surfaces, and responsive breakpoints match the Google Stitch reference.

---

## 2. Test Verification Matrix

| Verification ID | Category | Target Component / Service | Verification Method & Expected Outcome |
| :--- | :--- | :--- | :--- |
| **VAL-F01** | Build Pipeline | Vite & PostCSS Build | `npm run build` exits with code 0; produces clean `/dist` bundle without styling or syntax errors. |
| **VAL-F02** | Route Guard | `<ProtectedRoute>` | Navigating to `/dashboard` while unauthenticated immediately redirects to `/login?redirect=%2Fdashboard`. |
| **VAL-F03** | Redirect Return | `<ProtectedRoute>` | Logging in from `/login?redirect=%2Fprojects` automatically redirects the user back to `/projects`. |
| **VAL-F04** | Guest Guard | `<AuthLayout>` / Auth Pages | Authenticated users attempting to visit `/login` or `/register` are automatically redirected to `/dashboard`. |
| **VAL-F05** | JWT Injection | `services/api.js` Request Interceptor | Every API call made via `api.js` includes `Authorization: Bearer <token>` matching `localStorage.getItem('sylo_token')`. |
| **VAL-F06** | 401 Interception | `services/api.js` Response Interceptor | Simulating an expired token or 401 response purges `sylo_token`, sets `isAuthenticated: false`, and redirects to `/login`. |
| **VAL-F07** | State Persistence | `AuthContext` | Refreshing the browser while logged in retains the authenticated session and user profile without logging the user out. |
| **VAL-F08** | Metric Reactivity | `ProjectContext` | Mutating task status from `In Progress` to `Completed` updates `activeProject.metrics.progress` immediately without page reload. |
| **VAL-F09** | Toast Queue | `ToastContext` & `<Toast />` | Calling `showToast('Task created', 'success')` renders a floating banner that auto-dismisses after 4 seconds. |
| **VAL-F10** | Responsive Shell | `<AppLayout />` | Desktop displays fixed `w-64` sidebar and sticky header; mobile viewports ($< 768\text{px}$) collapse sidebar into slide-over drawer. |
| **VAL-F11** | Stitch Styling | Tailwind Token Injection | Inspecting buttons, badges, and surfaces confirms exact Stitch colors (`#003ec7`, `#0052ff`, `#f8f9ff`, `#0b1c30`). |

---

## 3. Step-by-Step Manual & Functional Validation Protocols

### Protocol 1: Route Protection & Redirect Memory (VAL-F02, VAL-F03)
1. Clear browser `localStorage` completely via DevTools (`localStorage.clear()`).
2. Type `http://localhost:5173/dashboard` into browser address bar and press Enter.
3. **Expected Result**: Page immediately redirects to `http://localhost:5173/login?redirect=%2Fdashboard`. The dashboard content is never briefly rendered (no content flash).
4. Enter valid login credentials on the login form and submit.
5. **Expected Result**: User is authenticated and immediately navigated back to `http://localhost:5173/dashboard`.

---

### Protocol 2: Axios JWT Injection & 401 Interception (VAL-F05, VAL-F06)
1. Log in with an active account; open browser DevTools Network tab.
2. Trigger any project listing call (`GET /api/projects`).
3. **Expected Result**: Inspect request headers; confirm `Authorization: Bearer eyJhbGci...` is present.
4. In DevTools Application storage, manually corrupt the stored token:
   `localStorage.setItem('sylo_token', 'corrupted_token_12345')`
5. Refresh the page or click a project.
6. **Expected Result**:
   * The backend responds with `401 Unauthorized`.
   * Axios response interceptor catches the 401.
   * `localStorage` tokens are purged.
   * Browser is redirected to `/login?expired=true`.
   * Toast or banner informs the user that their session has expired.

---

### Protocol 3: Global State Persistence across Page Refresh (VAL-F07)
1. Log in as an authenticated user (`alex_admin`).
2. Confirm username and initial avatar appear in top-right header.
3. Perform hard page refresh (`Ctrl + Shift + R` or `Cmd + Shift + R`).
4. **Expected Result**:
   * Brief subtle spinner displays while `checkAuth()` verifies token validity.
   * User remains logged in on the current route.
   * Username, avatar, and active workspace data remain populated.

---

### Protocol 4: Progress Metric Synchronization in State (VAL-F08)
1. Open Project P details containing 2 tasks (1 `To Do`, 1 `In Progress`). Initial progress is 0% (`Active`).
2. Transition the second task to `Completed`.
3. **Expected Result**:
   * `ProjectContext.updateTaskStatus()` executes `PATCH /api/tasks/:id/status`.
   * The API returns updated `projectMetrics: { progress: 50, status: 'Active' }`.
   * The progress bar in the project header immediately updates to 50% without requiring a manual page refresh.
   * The project item in the navigation sidebar or project collection list updates its progress pill to 50%.

---

### Protocol 5: Layout Responsiveness & Stitch Token Audit (VAL-F10, VAL-F11)
1. View application on desktop screen ($1440 \times 900\text{px}$):
   * Fixed sidebar is visible on the left (`width: 256px`).
   * Header is pinned to top with sticky backdrop blur.
   * Main content fills remaining screen width with `padding: 24px` / `32px`.
2. Resize viewport to mobile screen ($375 \times 812\text{px}$ iPhone):
   * Desktop sidebar is hidden (`display: none`).
   * Header shows menu hamburger icon (`menu`).
   * Clicking hamburger opens smooth slide-over navigation sheet.
   * Clicking outside sheet closes it.
3. Inspect computed CSS using DevTools Elements:
   * Background color is `#f8f9ff`.
   * Primary action buttons compute to background `#0052ff` with text `#ffffff`.
   * Card surfaces compute to `#ffffff` with border `#e5eeff`.
   * Primary font is `Inter`.

---

## 4. Phase 3 Exit Sign-Off Checklist (Team Lead Gate)

Before commencing **Phase 4 (UI Implementation & Stitch Sync)**, the Lead Systems Architect must verify each gate:

- [ ] **Vite Client Scaffolding**: `client/` project initialized, packages installed, builds cleanly with `npm run build`.
- [ ] **Stitch Design Tokens**: `tailwind.config.js` properly configured with colors, typography, radii, and shadows from Stitch Project `17067369580908098964`.
- [ ] **HTTP Interceptor Engine**: `services/api.js` injects `Authorization: Bearer <token>` and auto-purges on 401s.
- [ ] **Context Providers**: `ToastContext`, `AuthContext`, and `ProjectContext` deployed with consumer hooks (`useAuth`, `useProject`, `useToast`).
- [ ] **Declarative Routing**: React Router v6 configured with `<ProtectedRoute>` and public/protected layouts.
- [ ] **Responsive Shell**: `<AppLayout />` and `<AuthLayout />` rendered with sidebar, sticky header, and mobile drawer.
