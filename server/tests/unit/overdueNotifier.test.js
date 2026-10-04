const Task = require('../../models/Task');
const Project = require('../../models/Project');
const User = require('../../models/User');
const emailService = require('../../services/emailService');
const {
  runOverdueCheckNow,
  initOverdueNotifier,
  stopOverdueNotifier,
} = require('../../cron/overdueNotifier');

describe('Overdue Task Background Notifier Unit Tests (TG-5)', () => {
  let findTasksSpy;
  let findUserSpy;
  let sendEmailSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    sendEmailSpy = jest.spyOn(emailService, 'sendOverdueTaskAlert').mockResolvedValue({ messageId: 'test_mail_id' });
    findUserSpy = jest.spyOn(User, 'findById');
  });

  afterEach(() => {
    sendEmailSpy.mockRestore();
    if (findUserSpy) findUserSpy.mockRestore();
    stopOverdueNotifier();
  });

  it('CRON-01: should dispatch alert to assigned users for overdue incomplete tasks', async () => {
    const mockSave = jest.fn().mockResolvedValue(true);
    const mockOverdueTask = {
      _id: 'task_001',
      title: 'Fix Payment Gateway',
      deadline: new Date(Date.now() - 3600000), // 1 hour ago
      status: 'In Progress',
      project: { _id: 'proj_001', title: 'Fintech Hub', owner: 'usr_owner' },
      assignees: [
        { _id: 'usr_collab1', name: 'John Doe', email: 'john@example.com' },
        { _id: 'usr_collab2', name: 'Jane Smith', email: 'jane@example.com' },
      ],
      overdueEmailSentAt: null,
      save: mockSave,
    };

    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
    };
    mockQuery.populate.mockReturnValueOnce(mockQuery); // populate project
    mockQuery.populate.mockResolvedValueOnce([mockOverdueTask]); // populate assignees

    findTasksSpy = jest.spyOn(Task, 'find').mockReturnValue(mockQuery);

    const result = await runOverdueCheckNow();

    expect(result.processedCount).toBe(1);
    expect(result.dispatchedCount).toBe(2);
    expect(sendEmailSpy).toHaveBeenCalledTimes(2);
    expect(sendEmailSpy).toHaveBeenCalledWith(
      mockOverdueTask.assignees[0],
      mockOverdueTask,
      mockOverdueTask.project
    );
    expect(sendEmailSpy).toHaveBeenCalledWith(
      mockOverdueTask.assignees[1],
      mockOverdueTask,
      mockOverdueTask.project
    );
    expect(mockOverdueTask.overdueEmailSentAt).toBeInstanceOf(Date);
    expect(mockSave).toHaveBeenCalledTimes(1);

    findTasksSpy.mockRestore();
  });

  it('CRON-02: should fall back to project owner if task has zero assignees', async () => {
    const mockSave = jest.fn().mockResolvedValue(true);
    const mockOwner = {
      _id: 'usr_owner',
      name: 'Owner Admin',
      email: 'owner@example.com',
    };
    const mockOverdueTask = {
      _id: 'task_002',
      title: 'Unassigned Overdue Task',
      deadline: new Date(Date.now() - 7200000),
      status: 'To Do',
      project: { _id: 'proj_002', title: 'Operations', owner: 'usr_owner' },
      assignees: [], // Zero assignees
      overdueEmailSentAt: null,
      save: mockSave,
    };

    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
    };
    mockQuery.populate.mockReturnValueOnce(mockQuery);
    mockQuery.populate.mockResolvedValueOnce([mockOverdueTask]);

    findTasksSpy = jest.spyOn(Task, 'find').mockReturnValue(mockQuery);
    findUserSpy.mockResolvedValue(mockOwner);

    const result = await runOverdueCheckNow();

    expect(result.processedCount).toBe(1);
    expect(result.dispatchedCount).toBe(1);
    expect(sendEmailSpy).toHaveBeenCalledTimes(1);
    expect(sendEmailSpy).toHaveBeenCalledWith(
      mockOwner,
      mockOverdueTask,
      mockOverdueTask.project
    );
    expect(mockSave).toHaveBeenCalledTimes(1);

    findTasksSpy.mockRestore();
  });

  it('CRON-03: should initialize and stop cron schedule cleanly', () => {
    const job = initOverdueNotifier();
    expect(job).toBeDefined();

    // Calling again returns the existing job
    const duplicate = initOverdueNotifier();
    expect(duplicate).toBe(job);

    stopOverdueNotifier();
  });
});
