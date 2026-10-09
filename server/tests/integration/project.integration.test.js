process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_integration_jwt_secret_98765';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CLIENT_URL = 'http://localhost:5173';

const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// State stores for in-memory DB simulation
let mockUsers = [];
let mockProjects = [];
let mockTasks = [];

// Helper to create valid JWT tokens for tests
const createTestToken = (user) => {
  return jwt.sign(
    { id: user._id.toString(), username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

// Mock User Model
jest.mock('../../models/User', () => {
  const MockUser = function (data) {
    Object.assign(this, data);
  };

  MockUser.findById = jest.fn().mockImplementation((id) => {
    const user = mockUsers.find((u) => u._id.toString() === id.toString());
    return Promise.resolve(user || null);
  });

  MockUser.findOne = jest.fn().mockImplementation((query) => {
    const user = mockUsers.find((u) => {
      if (query.username && u.username !== query.username.toLowerCase()) return false;
      if (query.email && u.email !== query.email.toLowerCase()) return false;
      return true;
    });
    return Promise.resolve(user || null);
  });

  return MockUser;
});

// Mock Project Model
jest.mock('../../models/Project', () => {
  const mongoose = require('mongoose');
  const MockProject = function (data) {
    this._id = data._id || new mongoose.Types.ObjectId();
    this.title = data.title;
    this.description = data.description || '';
    this.owner = data.owner;
    this.collaborators = data.collaborators ? [...data.collaborators] : [];
    this.deadline = data.deadline || null;
    this.progress = data.progress || 0;
    this.createdAt = new Date();
    this.updatedAt = new Date();

    Object.defineProperty(this, 'isOverdue', {
      get: function () {
        if (!this.deadline) return false;
        return new Date(this.deadline) < new Date();
      },
    });

    this.save = jest.fn().mockImplementation(async () => {
      this.updatedAt = new Date();
      const idx = mockProjects.findIndex((p) => p._id.toString() === this._id.toString());
      if (idx >= 0) {
        mockProjects[idx] = this;
      } else {
        mockProjects.push(this);
      }
      return this;
    });
  };

  MockProject.create = jest.fn().mockImplementation(async (data) => {
    const proj = new MockProject(data);
    await proj.save();
    return proj;
  });

  MockProject.findById = jest.fn().mockImplementation((id) => {
    const proj = mockProjects.find((p) => p._id.toString() === id.toString());
    if (!proj) {
      const p = Promise.resolve(null);
      p.populate = () => p;
      return p;
    }

    const p = Promise.resolve(proj);
    p.populate = (field) => {
      if (field === 'owner') {
        const oId = (proj.owner._id || proj.owner).toString();
        proj.owner = mockUsers.find((u) => u._id.toString() === oId) || proj.owner;
      }
      if (field === 'collaborators') {
        proj.collaborators = proj.collaborators.map((c) => {
          const cId = (c._id || c).toString();
          return mockUsers.find((u) => u._id.toString() === cId) || c;
        });
      }
      return p;
    };
    return p;
  });

  MockProject.find = jest.fn().mockImplementation((query = {}) => {
    let list = mockProjects.filter((p) => {
      if (query.$or) {
        return query.$or.some((clause) => {
          if (clause.owner && (p.owner._id || p.owner).toString() === clause.owner.toString()) return true;
          if (
            clause.collaborators &&
            p.collaborators.some((c) => (c._id || c).toString() === clause.collaborators.toString())
          ) {
            return true;
          }
          return false;
        });
      }
      return true;
    });

    const p = Promise.resolve(list);
    p.populate = (field) => {
      list.forEach((proj) => {
        if (field === 'owner') {
          const oId = (proj.owner._id || proj.owner).toString();
          proj.owner = mockUsers.find((u) => u._id.toString() === oId) || proj.owner;
        }
        if (field === 'collaborators') {
          proj.collaborators = proj.collaborators.map((c) => {
            const cId = (c._id || c).toString();
            return mockUsers.find((u) => u._id.toString() === cId) || c;
          });
        }
      });
      return p;
    };
    p.sort = () => p;
    return p;
  });

  MockProject.findByIdAndUpdate = jest.fn().mockImplementation((id, update) => {
    const proj = mockProjects.find((p) => p._id.toString() === id.toString());
    if (proj) {
      if (update.progress !== undefined) proj.progress = update.progress;
    }
    return Promise.resolve(proj || null);
  });

  MockProject.deleteOne = jest.fn().mockImplementation(async (query) => {
    mockProjects = mockProjects.filter((p) => p._id.toString() !== query._id.toString());
    return { deletedCount: 1 };
  });

  return MockProject;
});

// Mock Task Model
jest.mock('../../models/Task', () => {
  const mongoose = require('mongoose');
  const MockTask = function (data) {
    this._id = data._id || new mongoose.Types.ObjectId();
    this.project = data.project;
    this.title = data.title;
    this.description = data.description || '';
    this.status = data.status || 'To Do';
    this.assignees = data.assignees ? [...data.assignees] : [];
    this.deadline = data.deadline || null;
    this.overdueEmailSentAt = data.overdueEmailSentAt || null;
    this.createdAt = new Date();
    this.updatedAt = new Date();

    Object.defineProperty(this, 'isOverdue', {
      get: function () {
        if (!this.deadline || this.status === 'Completed') return false;
        return new Date(this.deadline) < new Date();
      },
    });

    this.save = jest.fn().mockImplementation(async () => {
      this.updatedAt = new Date();
      const idx = mockTasks.findIndex((t) => t._id.toString() === this._id.toString());
      if (idx >= 0) {
        mockTasks[idx] = this;
      } else {
        mockTasks.push(this);
      }
      return this;
    });
  };

  MockTask.create = jest.fn().mockImplementation(async (data) => {
    const task = new MockTask(data);
    await task.save();
    return task;
  });

  MockTask.find = jest.fn().mockImplementation((query = {}) => {
    let list = mockTasks.filter((t) => {
      if (query.project) {
        const qProj = (query.project._id || query.project).toString();
        const tProj = (t.project._id || t.project).toString();
        if (tProj !== qProj) return false;
      }
      if (query.status && t.status !== query.status) return false;
      if (query.assignees) {
        const targetA = query.assignees.toString();
        const hasA = t.assignees.some((a) => (a._id || a).toString() === targetA);
        if (!hasA) return false;
      }
      return true;
    });

    const p = Promise.resolve(list);
    p.populate = (field) => {
      list.forEach((t) => {
        if (field === 'assignees') {
          t.assignees = t.assignees.map((a) => {
            const aId = (a._id || a).toString();
            return mockUsers.find((u) => u._id.toString() === aId) || a;
          });
        }
      });
      return p;
    };
    p.sort = () => p;
    return p;
  });

  MockTask.findById = jest.fn().mockImplementation((id) => {
    const task = mockTasks.find((t) => t._id.toString() === id.toString());
    if (!task) {
      const p = Promise.resolve(null);
      p.populate = () => p;
      return p;
    }

    const p = Promise.resolve(task);
    p.populate = (field) => {
      if (field === 'assignees') {
        task.assignees = task.assignees.map((a) => {
          const aId = (a._id || a).toString();
          return mockUsers.find((u) => u._id.toString() === aId) || a;
        });
      }
      return p;
    };
    return p;
  });

  MockTask.deleteOne = jest.fn().mockImplementation(async (query) => {
    mockTasks = mockTasks.filter((t) => t._id.toString() !== query._id.toString());
    return { deletedCount: 1 };
  });

  MockTask.deleteMany = jest.fn().mockImplementation(async (query) => {
    mockTasks = mockTasks.filter((t) => {
      const tProj = (t.project._id || t.project).toString();
      const qProj = (query.project._id || query.project).toString();
      return tProj !== qProj;
    });
    return { deletedCount: 1 };
  });

  MockTask.updateMany = jest.fn().mockImplementation(async (query, update) => {
    if (update.$pull && update.$pull.assignees) {
      const pulledId = update.$pull.assignees.toString();
      mockTasks.forEach((t) => {
        const tProj = (t.project._id || t.project).toString();
        const qProj = (query.project._id || query.project).toString();
        if (query.project && tProj === qProj) {
          t.assignees = t.assignees.filter((a) => {
            const aId = (a._id || a).toString();
            return aId !== pulledId;
          });
        }
      });
    }
    return { modifiedCount: 1 };
  });

  return MockTask;
});

const app = require('../../app');

describe('Phase 2 Project & Task Engine Integration Tests (TG-6: AC-03 to AC-13)', () => {
  let adminUser;
  let adminToken;
  let collabUser;
  let collabToken;
  let outsiderUser;
  let outsiderToken;

  beforeEach(() => {
    mockUsers = [];
    mockProjects = [];
    mockTasks = [];

    adminUser = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Alex Vance',
      username: 'alex_admin',
      email: 'alex@sylo.io',
      isVerified: true,
    };
    adminToken = createTestToken(adminUser);

    collabUser = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Sarah Connor',
      username: 'sarah_collab',
      email: 'sarah@sylo.io',
      isVerified: true,
    };
    collabToken = createTestToken(collabUser);

    outsiderUser = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Bob Outsider',
      username: 'bob_outsider',
      email: 'bob@sylo.io',
      isVerified: true,
    };
    outsiderToken = createTestToken(outsiderUser);

    mockUsers.push(adminUser, collabUser, outsiderUser);
  });

  describe('AC-03: Project Creation & Admin Designation', () => {
    it('should create a project with owner designated as Admin, progress 0%, and status "Active"', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Sylo Platform Redesign',
          description: 'Full stack overhaul',
          deadline: '2026-12-31T00:00:00.000Z',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Sylo Platform Redesign');
      expect(res.body.data.owner.id.toString()).toBe(adminUser._id.toString());
      expect(res.body.data.progress).toBe(0);
      expect(res.body.data.status).toBe('Active');
    });
  });

  describe('AC-04: Adding Collaborators by Username', () => {
    it('should allow Admin to add a registered collaborator by username', async () => {
      // Setup project
      const createRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Collab Test Project' });

      const projectId = createRes.body.data.id;

      // Add sarah_collab
      const addRes = await request(app)
        .post(`/api/projects/${projectId}/collaborators`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ username: 'sarah_collab' });

      expect(addRes.status).toBe(200);
      expect(addRes.body.success).toBe(true);
      expect(addRes.body.data.collaborator.username).toBe('sarah_collab');

      // Verify project details show collaborator
      const getRes = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.project.collaborators.length).toBe(1);
      expect(getRes.body.data.project.collaborators[0].username).toBe('sarah_collab');
    });

    it('should return 404 if adding a non-existent username', async () => {
      const createRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Collab 404 Test' });

      const res = await request(app)
        .post(`/api/projects/${createRes.body.data.id}/collaborators`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ username: 'ghost_user' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 if user is already a collaborator', async () => {
      const createRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Collab Duplicate Test' });

      const projectId = createRes.body.data.id;

      await request(app)
        .post(`/api/projects/${projectId}/collaborators`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ username: 'sarah_collab' });

      const dupRes = await request(app)
        .post(`/api/projects/${projectId}/collaborators`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ username: 'sarah_collab' });

      expect(dupRes.status).toBe(400);
      expect(dupRes.body.message).toContain('already a collaborator');
    });
  });

  describe('AC-05 & AC-06: Task Creation, Assignee Validation & RBAC Boundaries', () => {
    let projectId;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Sprint Board' });
      projectId = createRes.body.data.id;

      await request(app)
        .post(`/api/projects/${projectId}/collaborators`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ username: 'sarah_collab' });
    });

    it('should allow Admin to create a task assigned to collaborator', async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Implement Dark Mode',
          description: 'Use Tailwind CSS variables',
          assignees: [collabUser._id.toString()],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.task.title).toBe('Implement Dark Mode');
      expect(res.body.data.task.status).toBe('To Do');
      expect(res.body.data.task.assignees.length).toBe(1);
    });

    it('should reject task creation with non-member assignee with 400 Bad Request (FR-24, BR-06)', async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Unauthorized Assignment',
          assignees: [outsiderUser._id.toString()], // Outsider is not a member!
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('not a member');
    });

    it('should allow Collaborator to view tasks (200) but block them from creating tasks (403)', async () => {
      // Sarah can read tasks
      const getRes = await request(app)
        .get(`/api/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${collabToken}`);
      expect(getRes.status).toBe(200);

      // Sarah CANNOT create tasks
      const postRes = await request(app)
        .post(`/api/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${collabToken}`)
        .send({ title: 'Rogue Task' });
      expect(postRes.status).toBe(403);
    });

    it('should block Collaborator from updating project details (403)', async () => {
      const res = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${collabToken}`)
        .send({ title: 'Hijacked Title' });

      expect(res.status).toBe(403);
    });

    it('should block Collaborator from deleting the project (403)', async () => {
      const res = await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${collabToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('AC-07 & AC-08: Task Status Mutations & Dynamic Progress Math', () => {
    let projectId;
    let task1Id;
    let task2Id;

    beforeEach(async () => {
      const projRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Progress Calculation Test Project' });
      projectId = projRes.body.data.id;

      await request(app)
        .post(`/api/projects/${projectId}/collaborators`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ username: 'sarah_collab' });

      const t1 = await request(app)
        .post(`/api/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Task 1', assignees: [collabUser._id.toString()] });
      task1Id = t1.body.data.task.id;

      const t2 = await request(app)
        .post(`/api/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Task 2', assignees: [adminUser._id.toString(), collabUser._id.toString()] });
      task2Id = t2.body.data.task.id;
    });

    it('should permit assigned collaborator to update status to "In Progress"', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${task1Id}/status`)
        .set('Authorization', `Bearer ${collabToken}`)
        .send({ status: 'In Progress' });

      expect(res.status).toBe(200);
      expect(res.body.data.task.status).toBe('In Progress');
      expect(res.body.data.projectMetrics.progress).toBe(0);
      expect(res.body.data.projectMetrics.status).toBe('Active');
    });

    it('should automatically recalculate progress to 50% when 1 of 2 tasks is Completed', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${task1Id}/status`)
        .set('Authorization', `Bearer ${collabToken}`)
        .send({ status: 'Completed' });

      expect(res.status).toBe(200);
      expect(res.body.data.projectMetrics.progress).toBe(50);
      expect(res.body.data.projectMetrics.status).toBe('Active');
    });

    it('should calculate 100% and "Completed" status when all tasks are Completed', async () => {
      await request(app)
        .patch(`/api/tasks/${task1Id}/status`)
        .set('Authorization', `Bearer ${collabToken}`)
        .send({ status: 'Completed' });

      const res = await request(app)
        .patch(`/api/tasks/${task2Id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'Completed' });

      expect(res.status).toBe(200);
      expect(res.body.data.projectMetrics.progress).toBe(100);
      expect(res.body.data.projectMetrics.status).toBe('Completed');
    });

    it('should reject unassigned user attempting status update with 403 Forbidden (AC-13, BR-10)', async () => {
      // Create Task 3 assigned ONLY to Admin
      const t3 = await request(app)
        .post(`/api/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Admin Solo Task', assignees: [adminUser._id.toString()] });

      const res = await request(app)
        .patch(`/api/tasks/${t3.body.data.task.id}/status`)
        .set('Authorization', `Bearer ${collabToken}`) // Sarah is not assigned!
        .send({ status: 'Completed' });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('tasks assigned to you');
    });
  });

  describe('AC-10 & AC-11: Cascade Unassignments & Membership Isolation', () => {
    let projectId;
    let taskId;

    beforeEach(async () => {
      const projRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Cascade Unassignment Suite' });
      projectId = projRes.body.data.id;

      await request(app)
        .post(`/api/projects/${projectId}/collaborators`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ username: 'sarah_collab' });

      const taskRes = await request(app)
        .post(`/api/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Shared Task',
          assignees: [adminUser._id.toString(), collabUser._id.toString()],
        });
      taskId = taskRes.body.data.task.id;
    });

    it('AC-11: removing a user from a task leaves them in the project collaborators list', async () => {
      // Admin updates task to remove Sarah
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assignees: [adminUser._id.toString()] });

      expect(res.status).toBe(200);
      expect(res.body.data.task.assignees.length).toBe(1);

      // Verify Sarah is still a project collaborator
      const projRes = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${collabToken}`);

      expect(projRes.status).toBe(200);
      expect(projRes.body.data.project.collaborators.some((c) => c.username === 'sarah_collab')).toBe(true);
    });

    it('AC-10: removing a collaborator purges them from all project tasks (BR-07)', async () => {
      // Remove Sarah from the project
      const delRes = await request(app)
        .delete(`/api/projects/${projectId}/collaborators/${collabUser._id.toString()}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(delRes.status).toBe(200);

      // Task should now have only Admin as assignee
      const taskRes = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(taskRes.status).toBe(200);
      expect(taskRes.body.data.task.assignees.some((a) => (a.id || a._id).toString() === collabUser._id.toString())).toBe(false);

      // Sarah can no longer view project (403)
      const accessRes = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${collabToken}`);

      expect(accessRes.status).toBe(403);

      // SEC-01: Sarah can no longer view the task either (403 Forbidden)
      const taskAccessRes = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${collabToken}`);

      expect(taskAccessRes.status).toBe(403);
      expect(taskAccessRes.body.message).toContain('not a member');

      // SEC-01: Outsider cannot view the task (403 Forbidden)
      const outsiderAccessRes = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${outsiderToken}`);

      expect(outsiderAccessRes.status).toBe(403);
    });
  });

  describe('AC-12: Collaborator Leaving Project & Owner Guard', () => {
    let projectId;

    beforeEach(async () => {
      const projRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Leave Project Suite' });
      projectId = projRes.body.data.id;

      await request(app)
        .post(`/api/projects/${projectId}/collaborators`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ username: 'sarah_collab' });
    });

    it('should allow Collaborator to leave project and preserve project for Admin', async () => {
      const leaveRes = await request(app)
        .post(`/api/projects/${projectId}/leave`)
        .set('Authorization', `Bearer ${collabToken}`);

      expect(leaveRes.status).toBe(200);
      expect(leaveRes.body.message).toContain('You have left the project');

      // Admin still has project
      const adminProjRes = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(adminProjRes.status).toBe(200);
      expect(adminProjRes.body.data.project.collaborators.length).toBe(0);
    });

    it('should block Project Owner from leaving their own project (400 Bad Request)', async () => {
      const leaveRes = await request(app)
        .post(`/api/projects/${projectId}/leave`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(leaveRes.status).toBe(400);
      expect(leaveRes.body.message).toContain('owner cannot leave');
    });
  });

  describe('AC-13: Security & Negative Boundary Checks', () => {
    it('should reject outsider attempting to view project details with 403 Forbidden', async () => {
      const projRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Secret Project' });

      const res = await request(app)
        .get(`/api/projects/${projRes.body.data.id}`)
        .set('Authorization', `Bearer ${outsiderToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('not a member');
    });

    it('should reject invalid status strings on PATCH /tasks/:id/status with 400 Bad Request', async () => {
      const projRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Validation Proj' });

      const taskRes = await request(app)
        .post(`/api/projects/${projRes.body.data.id}/tasks`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Task Val', assignees: [adminUser._id.toString()] });

      const res = await request(app)
        .patch(`/api/tasks/${taskRes.body.data.task.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'Archived' }); // Invalid enum

      expect(res.status).toBe(400);
      expect(res.body.errors.some((e) => e.field === 'status')).toBe(true);
    });
  });
});
