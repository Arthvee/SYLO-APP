# Phase 2 Technical Specification: Validation & Verification Criteria
## Core REST API, Business Logic & Project-Task Engine

**Project**: Sylo (Project & Task Management App)  
**Phase**: Phase 2  
**Status**: Approved Specification  
**Version**: 1.0  
**PRD Traceability**: AC-03 through AC-15, BR-01 through BR-15, Section 12.1 (Final End-to-End Test)  

---

## 1. Overview & Verification Strategy

Phase 2 constitutes the operational core of Sylo. The validation protocol enforces that:
1. **Mathematical Accuracy**: Progress calculation strictly adheres to the formula, guarantees zero-division safety, and updates the project status dynamically.
2. **Ironclad RBAC Boundaries**: The Express middleware strictly rejects unauthorized Collaborator and non-member requests with HTTP 403, fulfilling the Shared-Interface Principle (FR-35, FR-36, BR-15).
3. **Data Integrity & Relational Cascades**: Member removal atomically purges task assignments without orphaned references.
4. **Automated Cron Scheduling**: Overdue sweeps accurately identify delinquent tasks and dispatch reminder emails without redundant spam.

---

## 2. Acceptance Criteria Verification Matrix (AC-03 to AC-13)

| ID | PRD Acceptance Criterion | Target Route | Expected Outcome & Verification Check |
| :--- | :--- | :--- | :--- |
| **AC-03** | A logged-in user can create a project and automatically become its Admin. | `POST /api/projects` | Project created with `owner === req.user._id`; progress is `0%`; status is `'Active'`. |
| **AC-04** | Admin can add a registered collaborator by username. | `POST /api/projects/:id/collaborators` | Registered username added to `collaborators` array; returns 200 with collaborator details; non-existent username returns 404. |
| **AC-05** | Admin can create a task and assign one or multiple members, including themselves. | `POST /api/projects/:projectId/tasks` | Task created with `status: 'To Do'`; all assignees validated as project members; returns 201. |
| **AC-06** | Collaborator can see all project tasks but cannot perform Admin-only actions. | `GET /api/projects/:projectId/tasks` | Collaborator receives task list (200), but `PUT /api/projects/:id` or `POST .../tasks` returns 403 Forbidden. |
| **AC-07** | Assigned collaborator can update their task status and the change is visible. | `PATCH /api/tasks/:id/status` | Assigned collaborator changes status to `'In Progress'` or `'Completed'`; returns 200. |
| **AC-08** | Project progress changes automatically when tasks are completed; project status follows thresholds. | `PATCH /api/tasks/:id/status` | 0 tasks = 0% (`Active`); 1/2 tasks = 50% (`Active`); 3/4 tasks = 75% (`Almost Done`); 4/4 tasks = 100% (`Completed`). |
| **AC-09** | Past-deadline incomplete work is marked Overdue and reminder email is sent. | Cron Sweep / `isOverdue` | Virtual evaluates to `true`; cron job dispatches overdue alert and updates `overdueEmailSentAt`. |
| **AC-10** | Removing collaborator removes them from that project's task assignments. | `DELETE /api/projects/:id/collaborators/:userId` | User ID stripped from `task.assignees` across all project tasks; other assignees and tasks preserved. |
| **AC-11** | Removing a user from a single task leaves the user as a project member. | `PUT /api/tasks/:id` | User removed from `task.assignees`; user remains in `project.collaborators`. |
| **AC-12** | Collaborator can leave a project without deleting the shared project. | `POST /api/projects/:id/leave` | Collaborator removed from project and unassigned from tasks; project remains intact for remaining members. |
| **AC-13** | Unauthorized backend actions are rejected even if someone manually calls the API. | Direct REST Calls | All unauthorized endpoints return HTTP 403 with standard error envelope. |

---

## 3. Mathematical & Progress Calculation Test Specifications

### 3.1 Progress Calculation Test Suite (`tests/unit/progressCalculation.test.js`)

```javascript
describe('Project Progress & Derived Status Logic (FR-32, FR-33, BR-12, BR-13)', () => {
  it('PROG-01: should return 0% progress and "Active" status for zero total tasks (zero-division guard)', () => {
    const totalTasks = 0;
    const completedTasks = 0;
    const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    const status = progress === 100 ? 'Completed' : progress >= 75 ? 'Almost Done' : 'Active';

    expect(progress).toBe(0);
    expect(status).toBe('Active');
    expect(Number.isNaN(progress)).toBe(false);
  });

  it('PROG-02: should calculate 50% and "Active" status for 5 of 10 completed tasks', () => {
    const totalTasks = 10;
    const completedTasks = 5;
    const progress = Math.round((completedTasks / totalTasks) * 100);
    const status = progress === 100 ? 'Completed' : progress >= 75 ? 'Almost Done' : 'Active';

    expect(progress).toBe(50);
    expect(status).toBe('Active');
  });

  it('PROG-03: should calculate 75% and "Almost Done" status for 15 of 20 completed tasks', () => {
    const totalTasks = 20;
    const completedTasks = 15;
    const progress = Math.round((completedTasks / totalTasks) * 100);
    const status = progress === 100 ? 'Completed' : progress >= 75 ? 'Almost Done' : 'Active';

    expect(progress).toBe(75);
    expect(status).toBe('Almost Done');
  });

  it('PROG-04: should calculate 100% and "Completed" status when all tasks are complete', () => {
    const totalTasks = 8;
    const completedTasks = 8;
    const progress = Math.round((completedTasks / totalTasks) * 100);
    const status = progress === 100 ? 'Completed' : progress >= 75 ? 'Almost Done' : 'Active';

    expect(progress).toBe(100);
    expect(status).toBe('Completed');
  });
});
```

---

## 4. RBAC & Security Boundary Negative Test Specifications

| Test Case | Scenario / Actor | Attempted Action & Endpoint | Expected HTTP Status & Defense |
| :--- | :--- | :--- | :--- |
| **SEC-P01** | Collaborator tries to update project details | `PUT /api/projects/:id` | **403 Forbidden**: Only Project Admin can update metadata (FR-12). |
| **SEC-P02** | Collaborator tries to delete project | `DELETE /api/projects/:id` | **403 Forbidden**: Project deletion is Admin-only (FR-13, BR-03). |
| **SEC-P03** | Collaborator tries to add a team member | `POST /api/projects/:id/collaborators` | **403 Forbidden**: Only Admin can add collaborators (FR-14). |
| **SEC-P04** | Collaborator tries to create a task | `POST /api/projects/:projectId/tasks` | **403 Forbidden**: Task creation is Admin-only (FR-19). |
| **SEC-P05** | Collaborator tries to delete a task | `DELETE /api/tasks/:id` | **403 Forbidden**: Task deletion is Admin-only (FR-21). |
| **SEC-P06** | Collaborator tries to assign tasks | `PUT /api/tasks/:id` | **403 Forbidden**: Only Admin can change assignees (FR-25). |
| **SEC-P07** | Collaborator updates unassigned task | `PATCH /api/tasks/:id/status` | **403 Forbidden**: Collaborators can only update tasks assigned to them (FR-27, BR-10). |
| **SEC-P08** | Non-member requests project details | `GET /api/projects/:id` | **403 Forbidden**: Caller is neither Owner nor Collaborator. |
| **SEC-P09** | Assign non-member to a task | `POST .../tasks` with non-member ID | **400 Bad Request**: Assignees must belong to the project (FR-24, BR-06). |
| **SEC-P10** | Invalid status enum submission | `PATCH .../status` with `status: "Archived"` | **400 Bad Request**: Status must be `To Do`, `In Progress`, or `Completed` (FR-26, BR-11). |

---

## 5. Overdue Background Scheduler Verification

### 5.1 Verification Logic (`tests/unit/cronService.test.js`)
* **Test Case CRON-01 (Identification of Overdue Incomplete Tasks)**:
  * Task A: `status: 'To Do'`, `deadline: yesterday` $\rightarrow$ Flagged for alert.
  * Task B: `status: 'Completed'`, `deadline: yesterday` $\rightarrow$ Skipped (complete).
  * Task C: `status: 'To Do'`, `deadline: tomorrow` $\rightarrow$ Skipped (not overdue).
  * Task D: `status: 'In Progress'`, `deadline: yesterday`, `overdueEmailSentAt: 2h ago` $\rightarrow$ Skipped (already notified within 24h).
* **Test Case CRON-02 (Recipient Resolution)**:
  * If Task A has 2 assignees, email sent to both assignees.
  * If Task A has 0 assignees, fallback email sent to project owner.
* **Test Case CRON-03 (Timestamp Updating)**:
  * Upon dispatch, `task.overdueEmailSentAt` is updated to current timestamp.

---

## 6. Canonical 10-Step End-to-End Journey Verification (PRD Section 12.1)

Follow this end-to-end integration test to simulate the complete multi-user capstone scenario:

```
[Step 1]  Create User A (alex_admin) and User B (sarah_collab); verify both accounts.
[Step 2]  Log in as User A; create Project P ("Sylo Web App"). Verify User A is Admin.
[Step 3]  User A adds User B as a collaborator by username "sarah_collab".
[Step 4]  User A creates Task 1 assigned to User B, and Task 2 assigned to both User A and User B.
[Step 5]  User A sets deadlines on both tasks.
[Step 6]  Log in as User B; open Project P; view all tasks. Update Task 1 status to 'Completed'.
[Step 7]  Confirm User B CANNOT delete project, update project title, assign tasks, or edit deadlines (HTTP 403).
[Step 8]  Log in as User A; confirm Task 1 is 'Completed' and project progress is 50% ('Active').
[Step 9]  User A removes User B from Task 2; confirm User B remains a project collaborator.
[Step 10] User A removes User B from Project P; confirm User B is purged from all project task assignments and loses access to Project P.
```

---

## 7. Phase 2 Exit Sign-Off Checklist (Team Lead Gate)

Before the team begins **Phase 3 (Frontend Architecture & Scaffolding)**, the Lead Systems Architect must review and check off every item:

- [ ] **Mongoose Models**: `Project` and `Task` schemas deployed with foreign references, indexes, and virtuals.
- [ ] **RBAC Authorization**: Middleware strictly enforces Admin vs. Collaborator boundaries with HTTP 403 rejections.
- [ ] **Cascade Cleanup**: Removing a collaborator or leaving a project atomically purges task assignments.
- [ ] **Cascade Deletion**: Deleting a project permanently cascades deletion to all child tasks.
- [ ] **Mathematical Accuracy**: Progress calculation formula passes all boundary cases (0%, 50%, 75%, 100%).
- [ ] **Overdue Condition**: Incomplete past-deadline items are correctly flagged without altering the workflow status.
- [ ] **Overdue Cron Alerts**: Daily daemon dispatches email alerts without redundant spam within 24 hours.
- [ ] **Automated Test Results**: All unit and integration test suites pass with 100% success rate (`npm test`).
- [ ] **Canonical 10-Step Journey**: Verified and passing end-to-end with multiple user sessions.
