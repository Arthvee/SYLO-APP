const mongoose = require('mongoose');
const Project = require('../../models/Project');
const Task = require('../../models/Task');
const {
  requireProjectMember,
  requireProjectAdmin,
  requireTaskAdmin,
  requireTaskAssigneeOrAdmin,
} = require('../../middleware/projectAuth');

describe('Project & Task Models and RBAC Middleware Unit Tests (TG-1 & TG-2)', () => {
  describe('Project Model Schema & Virtuals (TG-1)', () => {
    it('PM-01: should validate a properly formed Project instance', async () => {
      const project = new Project({
        title: 'Sylo Platform',
        description: 'Next-gen project tool',
        owner: new mongoose.Types.ObjectId(),
      });

      await expect(project.validate()).resolves.toBeUndefined();
      expect(project.title).toBe('Sylo Platform');
      expect(project.description).toBe('Next-gen project tool');
      expect(project.collaborators).toEqual([]);
    });

    it('PM-02: should reject empty title on Project', async () => {
      const project = new Project({
        title: '',
        owner: new mongoose.Types.ObjectId(),
      });

      await expect(project.validate()).rejects.toThrow();
    });

    it('PM-03: should calculate isOverdue correctly for Project', () => {
      const pastProject = new Project({
        title: 'Old Project',
        owner: new mongoose.Types.ObjectId(),
        deadline: new Date(Date.now() - 100000),
      });

      const futureProject = new Project({
        title: 'Future Project',
        owner: new mongoose.Types.ObjectId(),
        deadline: new Date(Date.now() + 1000000),
      });

      const noDeadlineProject = new Project({
        title: 'Open Project',
        owner: new mongoose.Types.ObjectId(),
      });

      expect(pastProject.isOverdue).toBe(true);
      expect(futureProject.isOverdue).toBe(false);
      expect(noDeadlineProject.isOverdue).toBe(false);
    });
  });

  describe('Task Model Schema & Virtuals (TG-1)', () => {
    it('TM-01: should validate a properly formed Task instance', async () => {
      const task = new Task({
        project: new mongoose.Types.ObjectId(),
        title: 'Design Auth Flow',
        status: 'To Do',
      });

      await expect(task.validate()).resolves.toBeUndefined();
      expect(task.status).toBe('To Do');
      expect(task.assignees).toEqual([]);
    });

    it('TM-02: should reject invalid status enum on Task (FR-26, BR-11)', async () => {
      const task = new Task({
        project: new mongoose.Types.ObjectId(),
        title: 'Design Auth Flow',
        status: 'Blocked', // Invalid status
      });

      await expect(task.validate()).rejects.toThrow(/not a valid task status/);
    });

    it('TM-03: should calculate isOverdue correctly for Task (BR-14)', () => {
      const overdueTask = new Task({
        project: new mongoose.Types.ObjectId(),
        title: 'Past Task',
        status: 'In Progress',
        deadline: new Date(Date.now() - 100000),
      });

      const completedPastTask = new Task({
        project: new mongoose.Types.ObjectId(),
        title: 'Done Task',
        status: 'Completed',
        deadline: new Date(Date.now() - 100000),
      });

      expect(overdueTask.isOverdue).toBe(true);
      expect(completedPastTask.isOverdue).toBe(false); // Completed tasks are never overdue
    });
  });

  describe('RBAC Middleware (projectAuth.js) (TG-2)', () => {
    let mockReq;
    let mockRes;
    let mockNext;
    let findProjectSpy;
    let findTaskSpy;
    const ownerId = new mongoose.Types.ObjectId().toString();
    const collaboratorId = new mongoose.Types.ObjectId().toString();
    const outsiderId = new mongoose.Types.ObjectId().toString();

    beforeEach(() => {
      jest.clearAllMocks();
      findProjectSpy = jest.spyOn(Project, 'findById');
      findTaskSpy = jest.spyOn(Task, 'findById');

      mockReq = {
        params: { id: 'proj_123' },
        user: { _id: ownerId },
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      mockNext = jest.fn();
    });

    afterEach(() => {
      findProjectSpy.mockRestore();
      findTaskSpy.mockRestore();
    });

    describe('requireProjectMember', () => {
      it('RBAC-01: should permit Project Owner and set isProjectAdmin: true', async () => {
        Project.findById.mockResolvedValue({
          _id: 'proj_123',
          owner: ownerId,
          collaborators: [collaboratorId],
        });

        await requireProjectMember(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockReq.isProjectAdmin).toBe(true);
      });

      it('RBAC-02: should permit Collaborator and set isProjectAdmin: false', async () => {
        mockReq.user._id = collaboratorId;
        Project.findById.mockResolvedValue({
          _id: 'proj_123',
          owner: ownerId,
          collaborators: [collaboratorId],
        });

        await requireProjectMember(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockReq.isProjectAdmin).toBe(false);
      });

      it('RBAC-03: should reject outsider with 403 Forbidden', async () => {
        mockReq.user._id = outsiderId;
        Project.findById.mockResolvedValue({
          _id: 'proj_123',
          owner: ownerId,
          collaborators: [collaboratorId],
        });

        await requireProjectMember(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: expect.stringContaining('not a member'),
          })
        );
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('requireProjectAdmin', () => {
      it('RBAC-04: should permit Project Owner', async () => {
        Project.findById.mockResolvedValue({
          _id: 'proj_123',
          owner: ownerId,
        });

        await requireProjectAdmin(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });

      it('RBAC-05: should reject Collaborator with 403 Forbidden (FR-12, FR-13)', async () => {
        mockReq.user._id = collaboratorId;
        Project.findById.mockResolvedValue({
          _id: 'proj_123',
          owner: ownerId,
        });

        await requireProjectAdmin(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: expect.stringContaining('Only the Project Admin'),
          })
        );
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('requireTaskAssigneeOrAdmin', () => {
      it('RBAC-06: should permit Project Owner even if not assigned to task', async () => {
        mockReq.params.id = 'task_123';
        Task.findById.mockResolvedValue({
          _id: 'task_123',
          project: 'proj_123',
          assignees: [collaboratorId],
        });
        Project.findById.mockResolvedValue({
          _id: 'proj_123',
          owner: ownerId,
        });

        await requireTaskAssigneeOrAdmin(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });

      it('RBAC-07: should permit assigned collaborator', async () => {
        mockReq.params.id = 'task_123';
        mockReq.user._id = collaboratorId;
        Task.findById.mockResolvedValue({
          _id: 'task_123',
          project: 'proj_123',
          assignees: [collaboratorId],
        });
        Project.findById.mockResolvedValue({
          _id: 'proj_123',
          owner: ownerId,
        });

        await requireTaskAssigneeOrAdmin(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });

      it('RBAC-08: should reject unassigned collaborator with 403 Forbidden (FR-27, BR-10)', async () => {
        mockReq.params.id = 'task_123';
        mockReq.user._id = outsiderId; // Not assigned
        Task.findById.mockResolvedValue({
          _id: 'task_123',
          project: 'proj_123',
          assignees: [collaboratorId],
        });
        Project.findById.mockResolvedValue({
          _id: 'proj_123',
          owner: ownerId,
        });

        await requireTaskAssigneeOrAdmin(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: expect.stringContaining('tasks assigned to you'),
          })
        );
        expect(mockNext).not.toHaveBeenCalled();
      });
    });
  });
});
