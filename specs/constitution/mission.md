# Sylo — Spec-Driven Development (SDD) Constitution: Mission & Scope

**Project Name**: Sylo (Project & Task Management App)  
**Document Status**: Approved Baseline  
**Version**: 1.0  
**Stack**: MERN (MongoDB, Express.js, React, Node.js)  
**Source PRD**: `Project_Management_App_PRD_v1.0.pdf`  
**Design Reference**: Google Stitch Project `17067369580908098964`  

---

## 1. Executive Summary & Product Mission

**Sylo** is a modern, collaborative project and task management web application engineered for small teams, student groups, freelancers, and growing startups. In modern collaborative environments, fragmented communication tools, bloated enterprise project suites, and opaque task ownership lead to dropped deadlines, duplicate effort, and confusion over project status.

The mission of **Sylo MVP** is to provide an intuitive, high-clarity workspace where teams can organize projects, assign granular responsibilities, set deadlines, update progress seamlessly, and maintain complete visibility from kickoff to delivery.

### The MVP Guiding Principle
> **"Build the smallest complete product that lets a real user complete the core workflow from beginning to end."**  
> Every feature included in this MVP directly serves the unbroken user journey:  
> `Register → Verify Email → Login → Create Project → Add Collaborators → Create Tasks → Assign Tasks → Set Deadlines → Update Status → Track Progress → Complete Project`.

---

## 2. Target Users & Problem Space

### 2.1 Target Audience
* **Students & Academic Groups**: Coordinating capstone initiatives, group coursework, and club projects with tight academic deadlines.
* **Early-Stage Startups & Small Teams**: Executing agile sprints and core deliverables without the overhead of enterprise Jira/Asana configurations.
* **Freelancers & Contractors**: Collaborating with external partners, subcontractors, or clients on distinct project deliverables.
* **Small Businesses**: Managing internal campaigns, operational launches, and client engagements.

### 2.2 Core Problems Addressed
1. **Opaque Ownership**: Lack of clear single or multi-assignee accountability for distinct deliverables.
2. **Deadline Drift**: Hidden or unmonitored task deadlines that pass without proactive alerts.
3. **Manual Status Friction**: Outdated status spreadsheets where progress calculations require manual data entry instead of system-driven calculation.
4. **Tool Overcomplication**: Cluttered feature sets (complex enterprise permissions, paid tiers, time-tracking bloat) that impede simple task execution.

---

## 3. Product Goals

1. **Self-Service Project Organization**: Enable any authenticated user to create, configure, and govern projects and their associated team members.
2. **Explicit Responsibility Matrix**: Establish clear accountability by assigning tasks to one or more project members (including project owners).
3. **Transparent Progress Tracking**: Provide real-time task status updates and automatically calculated project-wide progress metrics.
4. **Time & Deadline Discipline**: Highlight due dates prominently and flag overdue items visibly across dashboards, project views, and automated email reminders.
5. **Lightweight User Experience**: Deliver clean, focused workflows inspired by the Stitch design system without enterprise-grade configuration debt.
6. **Robust End-to-End MERN Architecture**: Deliver a cohesive, secure full-stack implementation connecting frontend views, Express REST APIs, MongoDB models, JWT/bcrypt authentication, and Nodemailer email automation.

---

## 4. MVP Scope Boundaries

### 4.1 In-Scope Features (MVP Deliverables)
* **Authentication & Identity**: User registration, unique username allocation, email verification with time-limited tokens, welcome email delivery, secure JWT-based login, password recovery (forgot password email and reset flow), and protected client/server routes.
* **Project Governance**: Project creation (assigning creator as Admin/Owner), project details editing, project deletion (Admin-only), and multi-project dashboard listings.
* **Collaboration & Membership**: Adding collaborators by exact registered username, listing team members with project roles, removing collaborators (with automatic assignment cleanup), and voluntary collaborator departure ("Leave Project").
* **Task Management**: Creating tasks inside projects, markdown-capable task descriptions, editing task details, task deletion, and multi-user task assignment.
* **Workflow Status & Deadlines**: Strict three-state status machine (`To Do`, `In Progress`, `Completed`), project and task deadline management, overdue calculation, and automated overdue email triggers.
* **System-Derived Progress**: Real-time mathematical calculation of project completion percentage and status classification (`Active`, `Almost Done`, `Completed`).
* **Shared-Interface Architecture**: Role-conditioned views where Admins and Collaborators share the same clean screens while UI actions and backend endpoints enforce strict authorization rules.

### 4.2 Out-of-Scope (Strictly Deferred Beyond MVP)
As established in Section 11 of the PRD, the following capabilities are explicitly deferred to post-MVP iterations to preserve delivery focus:
* ❌ Real-time WebRTC/WebSocket team chat and instant messaging.
* ❌ Video or voice conferencing.
* ❌ General-purpose cloud file storage (e.g., S3/Google Drive arbitrary asset hosting).
* ❌ AI-powered task breakdown, auto-assignment, or generative project planning.
* ❌ Advanced business intelligence, timesheet tracking, and executive analytics reports.
* ❌ Payment gateways, subscription billing, and invoice generation (*Note: Stitch screen #25 contains exploratory billing layouts; these are reserved for v2.0*).
* ❌ Third-party calendar synchronization (Google Calendar, Outlook iCal).
* ❌ SMS notifications, web push notifications, and granular notification preferences.
* ❌ Multi-tier enterprise hierarchy (Organizations, Departments, Sub-teams).
* ❌ Native mobile apps (iOS / Android) — responsive web mobile layouts are supported instead.
* ❌ Real-time concurrent collaborative rich-text document editing.

> [!IMPORTANT]
> **Email is NOT out of scope.** Transactional email is a core requirement of the MVP, encompassing email verification, welcome confirmation, password reset links, and overdue reminders.

---

## 5. User Roles & Permissions Matrix

In Sylo, **roles are project-specific**. A user does not possess a permanent global role; a user may be the **Admin / Owner** of Project A and simultaneously a **Collaborator** in Project B.

### 5.1 Role Definitions
* **Admin / Project Owner**: The user who created the project. Holds full administrative sovereignty over the project's metadata, members, tasks, assignees, deadlines, and lifecycle.
* **Collaborator / Invitee**: A registered user added to the project by username. Can view all project tasks and information, update statuses on tasks assigned to them, and voluntarily leave the project.

### 5.2 Permissions Matrix

| Action / Capability | Admin / Owner | Collaborator | PRD & Technical Enforcement |
| :--- | :---: | :---: | :--- |
| **Create a Project** | ✅ Yes | ✅ Yes | Any verified authenticated user can create projects (FR-09). Creator becomes Admin (FR-10, BR-02). |
| **View Project & Tasks** | ✅ Yes | ✅ Yes | Accessible to all confirmed project members (FR-11, FR-20, BR-09). |
| **Update Project Metadata** | ✅ Yes | ❌ No | Title, description, deadlines; rejected with HTTP 403 for Collaborators (FR-12). |
| **Delete Project** | ✅ Yes | ❌ No | Shared destructive action; Admin-only (FR-13, BR-03). |
| **Add Collaborator (by Username)** | ✅ Yes | ❌ No | Admin adds existing registered username (FR-14, BR-16). |
| **Remove Collaborator** | ✅ Yes | ❌ No | Admin removes member; triggers automatic task unassignment (FR-15, FR-16, BR-07). |
| **Leave Project** | ❌ No* | ✅ Yes | Collaborator self-action; does not delete shared project (FR-18, BR-04). (*Owner must delete or transfer). |
| **Create Task** | ✅ Yes | ❌ No | Tasks are scoped to project; Admin-only creation (FR-19). |
| **Update Task Details / Delete Task** | ✅ Yes | ❌ No | Title, description, assignees, deadline; Admin-only (FR-21). |
| **Assign / Reassign Task Members** | ✅ Yes | ❌ No | Admin assigns one or more project members, including self (FR-22, FR-23, FR-25, BR-05, BR-06). |
| **Set / Modify Deadlines** | ✅ Yes | ❌ No | Project and task due dates are managed solely by Admin (FR-28, FR-29). |
| **Update Task Status** | ✅ Yes | ✅ Conditional | Collaborators can update status **only** if they are an assigned member of that specific task (FR-27, BR-10). |
| **View Overdue Status & Progress** | ✅ Yes | ✅ Yes | Calculated and displayed identically to both roles (FR-30, FR-32, FR-34). |

### 5.3 The Shared-Interface Principle (FR-35, FR-36, BR-15)
Admins and Collaborators interact with the same core screens (Dashboard, Project Overview, Kanban Board, Task Details). However:
1. **Dynamic UI Adaptation**: Action buttons (e.g., `Add Task`, `Invite Member`, `Edit Project`, `Delete Project`, assignment pickers) are visible only when the active session user matches the role requirements.
2. **Backend Non-Negotiable Authorization**: The frontend never acts as the security boundary. If a Collaborator attempts a direct `PATCH /api/projects/:id` or `POST /api/projects/:id/tasks` via curl, Postman, or script, the Express authorization middleware must return HTTP 403 Forbidden.

---

## 6. Comprehensive Functional Requirements (FR-01 to FR-39)

### 6.1 Authentication & Account Management
* **FR-01**: A new user shall be able to register using full name/company name, unique username, email, and password.
* **FR-02**: The username shall uniquely identify one account because collaborators are added by username.
* **FR-03**: After registration, the system shall send an email-verification message containing a secure verification token/link.
* **FR-04**: The user shall verify their registered email address before the account is treated as fully active.
* **FR-05**: After successful email verification, the system shall send a welcome/confirmation email.
* **FR-06**: A verified user shall be able to log in with valid credentials and receive an authentication session (JWT).
* **FR-07**: Only authenticated users shall access private project-management functionality and protected API endpoints.
* **FR-08**: A user shall be able to request a password-reset email and set a new password through a secure, time-limited reset process.

### 6.2 Project Management
* **FR-09**: Any authenticated user shall be able to create a new project.
* **FR-10**: The creator of a project shall automatically become that project's Admin/Owner.
* **FR-11**: Users shall be able to view all projects they own or projects in which they participate as collaborators.
* **FR-12**: Only the Project Admin shall update shared project information (title, description, deadlines).
* **FR-13**: Only the Project Admin shall permanently delete the shared project.

### 6.3 Collaboration & Membership
* **FR-14**: The Project Admin shall be able to add an already registered user to the project using that user's username.
* **FR-15**: The Project Admin shall be able to remove a collaborator from the project.
* **FR-16**: Removing a collaborator from the project shall automatically remove that user from all task assignments within the same project.
* **FR-17**: Removing a user from an individual task shall not remove the user from the project membership.
* **FR-18**: A Collaborator shall be able to leave a project without deleting the shared project for remaining members.

### 6.4 Task Management & Assignment
* **FR-19**: The Project Admin shall be able to create tasks inside the project.
* **FR-20**: All project members shall be able to view all tasks within projects they belong to.
* **FR-21**: The Project Admin shall be able to update task details and delete shared tasks.
* **FR-22**: The Project Admin shall be able to assign one task to one or more project members.
* **FR-23**: The Project Admin shall be able to assign themselves to a task.
* **FR-24**: Only users who belong to the project may be assigned to that project's tasks.
* **FR-25**: Collaborators shall not assign tasks to other users or alter task assignee lists.

### 6.5 Status, Deadlines, and Progress
* **FR-26**: Every task shall use one of the three MVP workflow statuses: `To Do`, `In Progress`, or `Completed`.
* **FR-27**: A Collaborator shall be able to update the workflow status of a task only when they are one of its designated assignees.
* **FR-28**: The Project Admin shall be able to set and modify project and task deadlines.
* **FR-29**: Collaborators shall be able to view project and task deadlines but shall not modify them.
* **FR-30**: An incomplete task or project whose deadline has passed shall be visibly marked and displayed as **Overdue**.
* **FR-31**: The system shall send an email reminder for an overdue task or project according to the agreed reminder schedule.
* **FR-32**: Project progress shall be calculated automatically as:  
  $$\text{Progress (\%)} = \left(\frac{\text{Completed Tasks}}{\text{Total Tasks}}\right) \times 100$$
* **FR-33**: Project status shall be derived dynamically from progress:
  * **Active**: 0% – 74%
  * **Almost Done**: 75% – 99%
  * **Completed**: 100%

### 6.6 Dashboard and Shared Interface
* **FR-34**: After login, a user's dashboard shall display all projects they own and all projects in which they are a collaborator.
* **FR-35**: Admins and Collaborators may access the same core project views, but available controls and actions shall adapt to the user's role and task assignment.
* **FR-36**: The frontend shall not rely on hidden buttons as the sole security measure; unauthorized backend API requests must be rejected with appropriate HTTP status codes (401/403).

### 6.7 Validation and User Feedback
* **FR-37**: The backend shall strictly validate required fields, email formats, username formats, IDs, dates, and request payloads before execution.
* **FR-38**: The application shall provide human-readable, understandable error messages instead of exposing raw stack traces or internal database errors.
* **FR-39**: The frontend shall provide visual loading states (skeletons, spinners, disabled states) while asynchronous API requests are processed.

---

## 7. Business Rules & Computational Logic

| Rule ID | Rule Statement | Validation & Logic Description |
| :--- | :--- | :--- |
| **BR-01** | Project-specific roles | A user's role is stored in relation to a specific project ID, not globally on the User record. |
| **BR-02** | Automatic ownership | On project creation, set `project.owner = req.user._id` and add owner to `project.collaborators` or maintain explicit owner reference. |
| **BR-03** | Destructive deletion | `DELETE /api/projects/:id` verifies `project.owner.equals(req.user._id)`. All associated tasks are cascaded or purged. |
| **BR-04** | Safe collaborator exit | Collaborator self-removal removes user ID from `project.collaborators` and from any task assignees in that project; project remains intact. |
| **BR-05** | Multi-assignee support | `task.assignees` is an array of User ObjectIds (`[ObjectId]`). |
| **BR-06** | Project membership barrier | When assigning users to a task, backend verifies every assignee ID exists in `project.collaborators` or is `project.owner`. |
| **BR-07** | Cascade unassignment | When an Admin removes a collaborator from a project, an atomic database operation pulls that user ID from all task `assignees` arrays in that project. |
| **BR-08** | Task unassignment isolation | Pulling a user ID from a task's `assignees` array leaves their `project.collaborators` membership untouched. |
| **BR-09** | Open member visibility | Any confirmed project collaborator has read access to all tasks and metadata in that project. |
| **BR-10** | Assignee status mutation | `PATCH /api/tasks/:id/status` verifies user is either the Project Admin OR is included in `task.assignees`. |
| **BR-11** | Strict status enum | Allowed task statuses are strictly restricted to `['To Do', 'In Progress', 'Completed']`. |
| **BR-12** | Automatic progress | Progress is a computed field. If `totalTasks === 0`, `progress = 0` (zero-division guard). |
| **BR-13** | Status derivation | `progress === 100` $\rightarrow$ `'Completed'`; `progress >= 75` $\rightarrow$ `'Almost Done'`; else $\rightarrow$ `'Active'`. |
| **BR-14** | Overdue as a condition | Overdue is a temporal flag (`status !== 'Completed' && deadline < new Date()`), never an overwrite of the workflow status. |
| **BR-15** | Unified UI, enforced API | Role checks occur in both React UI (conditional rendering) and Express controller middleware (auth guard). |
| **BR-16** | Unique usernames | Usernames are strictly unique, alphanumeric (lowercase-normalized), and indexed for quick collaborator lookups. |

---

## 8. Acceptance Criteria & End-to-End Verification

### 8.1 Acceptance Criteria (AC-01 to AC-15)
* **AC-01**: A new user can register, receive a verification email, verify the account via token, receive a welcome confirmation email, and log in.
* **AC-02**: A user can request a password reset, receive an email with a secure link, and reset their password successfully.
* **AC-03**: A logged-in user can create a project and automatically become its Admin/Owner.
* **AC-04**: The Admin can add an existing registered user as a collaborator using their exact username.
* **AC-05**: The Admin can create a task and assign one or multiple project members, including themselves.
* **AC-06**: A collaborator can view all tasks in the project but cannot trigger Admin-only modifications (title, delete, create tasks, modify deadlines).
* **AC-07**: An assigned collaborator can update their task's status (`To Do` $\rightarrow$ `In Progress` $\rightarrow$ `Completed`) and have it reflect across the team.
* **AC-08**: Project progress updates automatically upon task completion and moves through `Active` (0–74%), `Almost Done` (75–99%), and `Completed` (100%).
* **AC-09**: Incomplete tasks and projects past their deadline display the `Overdue` badge, and overdue email alerts are dispatched.
* **AC-10**: Removing a collaborator from a project strips them of all task assignments in that project without deleting tasks or other members.
* **AC-11**: Removing a user from an individual task preserves their project membership.
* **AC-12**: A collaborator can leave a project without causing project deletion or data loss for remaining members.
* **AC-13**: Unauthorized direct API calls return HTTP 401/403 with structured error messages.
* **AC-14**: The frontend renders real backend data with active loading skeletons/spinners and error toasts.
* **AC-15**: The REST API is documented via Swagger/OpenAPI and Postman collections, and core journeys pass integration tests.

### 8.2 Canonical End-to-End Test Journey
1. **User Registration & Verification**: Register User A (`owner_alex`) and User B (`collab_sarah`). Complete email verification for both via token.
2. **Project Creation**: Log in as User A; create project *"Sylo Web App"*; confirm User A is Admin.
3. **Collaborator Onboarding**: User A adds User B by username (`collab_sarah`). Confirm User B appears in Project Members.
4. **Task Delegation**: User A creates Task 1 and assigns User B; creates Task 2 and assigns both User A and User B; sets deadlines for both.
5. **Collaborator Execution**: Log in as User B; open *"Sylo Web App"*; confirm Tasks 1 and 2 are visible; verify Admin buttons are hidden.
6. **Status Transition**: User B transitions Task 1 from `To Do` to `In Progress` to `Completed`.
7. **Permission Boundary Audit**: Attempt direct API call as User B to update project title or delete task; confirm HTTP 403 Forbidden.
8. **Progress Verification**: Log in as User A; verify Task 1 is `Completed` and project progress is 50% (`Active`).
9. **Task Unassignment Isolation**: User A unassigns User B from Task 2; confirm User B remains a project collaborator.
10. **Collaborator Project Removal**: User A removes User B from the project; confirm User B loses access to the project and is purged from any remaining assignments.
11. **Overdue & Recovery Verification**: Trigger simulated overdue check on an expired task to verify email dispatch; execute forgot password flow.

---

## 9. Resolution of Open Implementation Decisions (PRD Section 13)

| Decision Item | PRD Context | Architectural Resolution for Sylo MVP |
| :--- | :--- | :--- |
| **1. Invitation Acceptance** | Immediate add vs. pending invite acceptance. | **Immediate Add by Username**: For the MVP, adding a valid registered username directly adds them to `project.collaborators` (matching FR-14, AC-04, and keeping the workflow frictionless). An in-app notification is posted to the collaborator's activity feed. |
| **2. Overdue Email Timing** | Frequency and schedule of overdue alerts. | **Daily Scheduled Cron**: An automated cron job executes daily at `08:00 UTC`. It queries incomplete tasks where `deadline < now` and `overdueNotificationSentAt < today - 24h` to prevent spam while guaranteeing prompt notifications. |
| **3. Password Policy** | Minimum length and complexity standards. | **Secure Baseline**: Minimum 8 characters, containing at least one uppercase letter, one lowercase letter, and one number. Validated via `express-validator` on backend and regex on frontend. |
| **4. Username Format** | Case handling, allowed characters, changes. | **Strict Alphanumeric Slug**: 3–20 characters, lowercase alphanumeric plus hyphens/underscores (`/^[a-z0-9_-]{3,20}$/`). Normalized to lowercase before database persistence. Immutable in MVP. |
| **5. Deletion Strategy** | Hard delete vs. soft delete. | **Hard Delete with Cascade**: For the MVP, deleting a project purges the project document and cascades deletion to all child tasks. Deleting a task permanently removes it. Avoids orphan document overhead in MongoDB. |
| **6. Email Provider & Transport** | SMTP transport configuration. | **Nodemailer with Ethereal / SMTP Provider**: Development environment uses `nodemailer` with Ethereal test accounts (instant preview URLs), with standard SMTP configuration (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) ready for SendGrid/Mailgun in production. |
| **7. UI Design System** | Layout and styling library choice. | **Tailwind CSS v3 + Stitch Token Mapping**: All Stitch tokens (colors, typography, spacing, elevations) are mapped directly into `tailwind.config.js` to faithfully reproduce the Sylo design system. |
