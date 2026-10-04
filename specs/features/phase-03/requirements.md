# Phase 3 Technical Specification: Requirements & Architecture
## Frontend Architecture, State Management & Routing Engine

**Project**: Sylo (Project & Task Management App)  
**Phase**: Phase 3  
**Status**: Approved Specification  
**Version**: 1.0  
**PRD Traceability**: FR-06, FR-07, FR-34, FR-35, FR-36, FR-38, FR-39, Stitch Project `17067369580908098964`  

---

## 1. Architectural Overview & Component Topology

Phase 3 establishes the Single-Page Application (SPA) client architecture using **React 18** and **Vite**, configured with **Tailwind CSS** containing the Google Stitch design tokens, **React Router v6** declarative routing, **Axios** with authenticated interceptors, and a decoupled **Context API** state architecture.

```mermaid
flowchart TD
    subgraph Browser["Client Browser Runtime"]
        Entry["index.html (Inter & Material Symbols)"] --> Main["src/main.jsx"]
        Main --> App["src/App.jsx"]
        
        subgraph Providers["Context Provider Cascade"]
            ToastProv["ToastProvider (UI Alerts)"]
            AuthProv["AuthProvider (JWT & User Identity)"]
            ProjProv["ProjectProvider (Projects, Tasks & Metrics)"]
            ToastProv --> AuthProv
            AuthProv --> ProjProv
        end
        
        App --> Providers
        
        subgraph Router["React Router v6 Routing Engine"]
            PublicRoutes["Public Routes (/login, /register, /splash, /verify-email)"]
            AuthGuard["<ProtectedRoute /> Navigation Guard"]
            AppLayout["<AppLayout /> (Sidebar + Header + Content)"]
            ProtectedPages["Protected Pages (/dashboard, /projects, /kanban, /settings)"]
            
            ProjProv --> Router
            Router --> PublicRoutes
            Router --> AuthGuard
            AuthGuard --> AppLayout
            AppLayout --> ProtectedPages
        end
        
        subgraph ServiceLayer["API Service & Interceptor Layer"]
            AxiosClient["api.js (Axios Instance)"]
            ReqInterceptor["Request Interceptor (Injects Bearer Token)"]
            ResInterceptor["Response Interceptor (Handles 401 Logout)"]
            AxiosClient --> ReqInterceptor
            AxiosClient --> ResInterceptor
        end
        
        AuthProv -.-> AxiosClient
        ProjProv -.-> AxiosClient
    end

    subgraph BackendAPI["Express.js Server (/api)"]
        APIServer["REST API (:5000)"]
    end

    AxiosClient <== "JSON HTTP Requests" ==> APIServer
```

---

## 2. Directory Structure & File Hierarchy

```
client/
├── index.html                    # Root HTML with Google Fonts & Material Symbols
├── package.json                  # Dependencies (React 18, React Router v6, Axios, Tailwind)
├── postcss.config.js             # PostCSS plugins (Tailwind, Autoprefixer)
├── tailwind.config.js            # Exhaustive Google Stitch design token map
├── vite.config.js                # Vite bundler config with path aliases & API proxy
└── src/
    ├── assets/                   # Static images, SVG badges, logos
    ├── components/
    │   ├── common/               # Universal UI primitives
    │   │   ├── Button.jsx        # Primary, Secondary, Danger, Ghost variants
    │   │   ├── Input.jsx         # Text, password, email with validation state
    │   │   ├── Badge.jsx         # Status pills (Active, Almost Done, Completed, Overdue)
    │   │   ├── Avatar.jsx        # User initials avatar bubble
    │   │   ├── ProgressBar.jsx   # Continuous progress percentage bar
    │   │   ├── Toast.jsx         # Floating alert banner
    │   │   └── Modal.jsx         # Accessible dialog backdrop & container
    │   └── layout/
    │       ├── AppLayout.jsx     # Authenticated shell (Sidebar + Header + Outlet)
    │       ├── AuthLayout.jsx    # Centered card layout for login/register
    │       ├── Header.jsx        # Top application bar with search & user menu
    │       ├── Sidebar.jsx       # Fixed desktop & mobile drawer navigation
    │       └── ProtectedRoute.jsx# Authentication session route guard
    ├── context/
    │   ├── AuthContext.jsx       # Global user credentials & token lifecycle
    │   ├── ProjectContext.jsx    # Projects, active project, tasks & live metrics
    │   └── ToastContext.jsx      # Queue-based toast notification dispatcher
    ├── hooks/
    │   ├── useAuth.js            # Consumer hook for AuthContext
    │   ├── useProject.js         # Consumer hook for ProjectContext
    │   └── useToast.js           # Consumer hook for ToastContext
    ├── pages/
    │   ├── SplashPage.jsx        # Landing / Welcome value proposition
    │   ├── LoginPage.jsx         # User login form
    │   ├── RegisterPage.jsx      # Registration form
    │   ├── VerifyEmailPage.jsx   # Email verification token handler
    │   ├── ForgotPasswordPage.jsx# Password recovery initiation
    │   ├── ResetPasswordPage.jsx # Password reset token submission
    │   ├── DashboardPage.jsx     # High-level workspace overview & metrics
    │   ├── ProjectsPage.jsx      # Projects collection & filter grid
    │   ├── ProjectDetailsPage.jsx# Project tasks table & header
    │   ├── KanbanPage.jsx        # 3-column drag-and-drop / click-transition board
    │   ├── TeamMembersPage.jsx   # Collaborators table & invite modal
    │   ├── SettingsPage.jsx      # Profile details & theme preferences
    │   └── NotFoundPage.jsx      # 404 Route fallback
    ├── services/
    │   ├── api.js                # Configured Axios instance with interceptors
    │   ├── authService.js        # Auth REST endpoints wrapper
    │   ├── projectService.js     # Project REST endpoints wrapper
    │   └── taskService.js        # Task REST endpoints wrapper
    ├── utils/
    │   └── formatters.js         # Date formatting, initials extraction, progress helpers
    ├── App.jsx                   # Route definition & context composition
    ├── index.css                 # Tailwind directives & typography layers
    └── main.jsx                  # React DOM root entrypoint
```

---

## 3. Google Stitch Design System to Tailwind Configuration

### 3.1 Design System Tokens
Extracted from Stitch Project `17067369580908098964`:
* **Core Brand**: Primary `#003ec7`, Container `#0052ff`, Light variant `#dfe3ff`
* **Surfaces**: Canvas `#f8f9ff`, Low `#eff4ff`, Container `#e5eeff`, High `#dce9ff`, White `#ffffff`
* **Inks**: High-contrast text `#0b1c30`, Secondary `#434656`, Muted outline `#737688`
* **Alert & Error**: Error `#ba1a1a`, Container `#ffdad6`, Dark label `#93000a`
* **Status Badges**:
  * `Active`: Blue badge (`bg-primary-fixed text-on-primary-fixed`)
  * `Almost Done`: Amber/Teal accent (`bg-tertiary-fixed text-on-tertiary-fixed`)
  * `Completed`: Emerald/Dark Teal (`bg-[#e6f4ea] text-[#137333]`)
  * `Overdue`: Red badge (`bg-error-container text-on-error-container`)

### 3.2 Exact `client/tailwind.config.js`
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Primary Brand
        primary: "#003ec7",
        "primary-container": "#0052ff",
        "primary-fixed": "#dde1ff",
        "primary-fixed-dim": "#b7c4ff",
        "on-primary": "#ffffff",
        "on-primary-container": "#dfe3ff",
        "on-primary-fixed": "#001452",
        "on-primary-fixed-variant": "#0038b6",
        "inverse-primary": "#b7c4ff",

        // Secondary
        secondary: "#3755c3",
        "secondary-container": "#708cfd",
        "secondary-fixed": "#dde1ff",
        "secondary-fixed-dim": "#b8c4ff",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#00217a",

        // Tertiary (Success / Accent)
        tertiary: "#005851",
        "tertiary-container": "#007369",
        "tertiary-fixed": "#89f5e7",
        "tertiary-fixed-dim": "#6bd8cb",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#8bf7e9",

        // Surface & Canvas
        background: "#f8f9ff",
        surface: "#f8f9ff",
        "surface-bright": "#f8f9ff",
        "surface-dim": "#cbdbf5",
        "surface-tint": "#004ced",
        "surface-variant": "#d3e4fe",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#eff4ff",
        "surface-container": "#e5eeff",
        "surface-container-high": "#dce9ff",
        "surface-container-highest": "#d3e4fe",
        "inverse-surface": "#213145",
        "inverse-on-surface": "#eaf1ff",

        // Typography & Outlines
        "on-background": "#0b1c30",
        "on-surface": "#0b1c30",
        "on-surface-variant": "#434656",
        outline: "#737688",
        "outline-variant": "#c3c5d9",

        // Feedback / Alert
        error: "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",
      },
      borderRadius: {
        DEFAULT: "0.25rem", // 4px
        lg: "0.5rem",       // 8px
        xl: "0.75rem",      // 12px
        "2xl": "1rem",      // 16px (Card containers)
        full: "9999px",     // Circular pills / avatars
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        subtle: "0 1px 8px rgba(0,0,0,0.04)",
        card: "0 2px 4px rgba(0,0,0,0.05)",
        modal: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      },
    },
  },
  plugins: [],
};
```

### 3.3 Typography & Global Styles (`client/src/index.css`)
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-background text-on-surface font-sans antialiased min-h-screen selection:bg-primary-fixed selection:text-on-primary-fixed;
  }
}

.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  vertical-align: middle;
  line-height: 1;
}
```

---

## 4. Vite Configuration & Path Aliases (`client/vite.config.js`)

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
```

---

## 5. Axios Client Engine with Interceptors (`client/src/services/api.js`)

The Axios instance standardizes all client-server communication, guarantees token injection, extracts error envelopes, and handles session expiration.

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Injects active Bearer JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sylo_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Catches 401 Unauthorized and invalidates stale session
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    const isAuthRoute = originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/register');

    if (error.response?.status === 401 && !isAuthRoute) {
      // Invalidate stored credentials
      localStorage.removeItem('sylo_token');
      localStorage.removeItem('sylo_user');

      // Dispatch global custom event for AuthContext to sync cleanly
      window.dispatchEvent(new CustomEvent('sylo:session-expired'));

      // Redirect to login only if not already on an auth page
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/verify-email')) {
        window.location.href = `/login?expired=true&redirect=${encodeURIComponent(window.location.pathname)}`;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

---

## 6. Context API State Architecture

### 6.1 `AuthContext.jsx` (`client/src/context/AuthContext.jsx`)
Encapsulates user authentication lifecycle, token persistence, and email verification status.

#### State Model
```typescript
interface AuthState {
  user: { id: string; name: string; username: string; email: string; isVerified: boolean } | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { login: string; password: string }) => Promise<void>;
  register: (userData: { name: string; username: string; email: string; password: string }) => Promise<any>;
  logout: () => void;
  verifyEmail: (token: string) => Promise<any>;
}
```

#### Core Logic
* Initial load checks `localStorage.getItem('sylo_token')` and `localStorage.getItem('sylo_user')`.
* On valid token, performs background `/api/auth/me` verification to ensure account remains active and token is not revoked.
* Listens to the `sylo:session-expired` event to synchronously reset user state to `null`.
* On successful login, persists `sylo_token` and `sylo_user` and flips `isAuthenticated` to `true`.

### 6.2 `ProjectContext.jsx` (`client/src/context/ProjectContext.jsx`)
Encapsulates project listing, active project details, task management, and live progress metric updates.

#### State Model
```typescript
interface ProjectState {
  projects: Project[];
  activeProject: ProjectDetails | null;
  tasks: Task[];
  isLoadingProjects: boolean;
  isLoadingDetails: boolean;
  error: string | null;
  fetchProjects: (filters?: { search?: string; status?: string }) => Promise<void>;
  fetchProjectDetails: (projectId: string) => Promise<void>;
  createProject: (data: { title: string; description?: string; deadline?: string }) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  addCollaborator: (projectId: string, username: string) => Promise<void>;
  removeCollaborator: (projectId: string, userId: string) => Promise<void>;
  leaveProject: (projectId: string) => Promise<void>;
  createTask: (projectId: string, taskData: TaskPayload) => Promise<Task>;
  updateTask: (taskId: string, taskData: Partial<Task>) => Promise<Task>;
  deleteTask: (taskId: string) => Promise<void>;
  updateTaskStatus: (taskId: string, status: 'To Do' | 'In Progress' | 'Completed') => Promise<void>;
}
```

#### Core Reactivity Rules
* When `updateTaskStatus` completes, the returned `projectMetrics` immediately updates `activeProject.metrics` and the corresponding item in `projects`.
* When `deleteTask` completes, the returned `projectMetrics` immediately refreshes parent project progress.
* When `removeCollaborator` completes, local task state purges that user ID from all task `assignees` immediately without requiring a full reload.

### 6.3 `ToastContext.jsx` (`client/src/context/ToastContext.jsx`)
Lightweight global notification engine handling floating success, error, and info toasts.

#### State Model
```typescript
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}
```

* `showToast(message, type = 'success', duration = 4000)` creates an entry in `toasts`.
* Auto-dismisses via `setTimeout` after `duration` ms.
* Renders floating overlay in top-right viewport (`z-50`).

---

## 7. Declarative Routing Engine & Guards

### 7.1 Route Map Specification
| Route | Access | Layout | Page Component | PRD Screen |
| :--- | :--- | :--- | :--- | :--- |
| `/` | Public | None | `SplashPage.jsx` | Screen 01 / 08 |
| `/login` | Public (Guest only) | `AuthLayout` | `LoginPage.jsx` | Screen 09 |
| `/register` | Public (Guest only) | `AuthLayout` | `RegisterPage.jsx` | Screen 02 / 10 |
| `/verify-email/:token`| Public | `AuthLayout` | `VerifyEmailPage.jsx` | Screen 02 / 10 |
| `/forgot-password` | Public | `AuthLayout` | `ForgotPasswordPage.jsx` | Screen 03 / 11 |
| `/reset-password/:token`| Public | `AuthLayout` | `ResetPasswordPage.jsx` | Screen 03 / 11 |
| `/dashboard` | Protected (Member) | `AppLayout` | `DashboardPage.jsx` | Screen 04 / 12 |
| `/projects` | Protected (Member) | `AppLayout` | `ProjectsPage.jsx` | Screen 05 / 13 |
| `/projects/:id` | Protected (Member) | `AppLayout` | `ProjectDetailsPage.jsx` | Screen 06 / 14 |
| `/projects/:id/kanban`| Protected (Member) | `AppLayout` | `KanbanPage.jsx` | Screen 16 / 17 |
| `/projects/:id/members`| Protected (Member) | `AppLayout` | `TeamMembersPage.jsx` | Screen 21 |
| `/settings` | Protected (Member) | `AppLayout` | `SettingsPage.jsx` | Screen 07 / 15 |
| `*` | Public | None | `NotFoundPage.jsx` | N/A |

### 7.2 Navigation Guard (`client/src/components/layout/ProtectedRoute.jsx`)
```jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <span className="text-sm font-medium text-on-surface-variant">Loading workspace...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return children;
};

export default ProtectedRoute;
```

---

## 8. Base Application Shell (`AppLayout.jsx`)

Implements the **Shared-Interface Principle (FR-35, FR-36, BR-15)**:
* Fixed desktop sidebar (`w-64`, `border-r border-surface-container`)
* Sticky top navigation bar (`h-16`, `bg-surface-container-lowest/80 backdrop-blur`)
* Dynamic workspace content container (`flex-1 overflow-y-auto p-6 md:p-8`)
* Mobile bottom nav / slide-over drawer toggle for viewports `< 768px` (FR-39)
