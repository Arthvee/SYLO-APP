const { calculateProjectMetrics } = require('../../utils/projectMetrics');
const Task = require('../../models/Task');
const Project = require('../../models/Project');

describe('Project Progress & Derived Status Logic (FR-32, FR-33, BR-12, BR-13)', () => {
  let findTasksSpy;
  let updateProjectSpy;

  beforeEach(() => {
    findTasksSpy = jest.spyOn(Task, 'find');
    updateProjectSpy = jest.spyOn(Project, 'findByIdAndUpdate').mockResolvedValue({});
  });

  afterEach(() => {
    findTasksSpy.mockRestore();
    updateProjectSpy.mockRestore();
  });

  it('PROG-01: should return 0% progress and "Active" status for zero total tasks (zero-division guard)', async () => {
    findTasksSpy.mockResolvedValue([]);

    const metrics = await calculateProjectMetrics('dummy_proj_id');

    expect(metrics.totalTasks).toBe(0);
    expect(metrics.completedTasks).toBe(0);
    expect(metrics.progress).toBe(0);
    expect(metrics.status).toBe('Active');
    expect(Number.isNaN(metrics.progress)).toBe(false);
  });

  it('PROG-02: should calculate 50% and "Active" status for 5 of 10 completed tasks', async () => {
    const tasks = [
      ...Array(5).fill({ status: 'Completed' }),
      ...Array(5).fill({ status: 'To Do' }),
    ];
    findTasksSpy.mockResolvedValue(tasks);

    const metrics = await calculateProjectMetrics('dummy_proj_id');

    expect(metrics.totalTasks).toBe(10);
    expect(metrics.completedTasks).toBe(5);
    expect(metrics.progress).toBe(50);
    expect(metrics.status).toBe('Active');
  });

  it('PROG-03: should calculate 75% and "Almost Done" status for 15 of 20 completed tasks', async () => {
    const tasks = [
      ...Array(15).fill({ status: 'Completed' }),
      ...Array(5).fill({ status: 'In Progress' }),
    ];
    findTasksSpy.mockResolvedValue(tasks);

    const metrics = await calculateProjectMetrics('dummy_proj_id');

    expect(metrics.totalTasks).toBe(20);
    expect(metrics.completedTasks).toBe(15);
    expect(metrics.progress).toBe(75);
    expect(metrics.status).toBe('Almost Done');
  });

  it('PROG-04: should calculate 100% and "Completed" status when all tasks are complete', async () => {
    const tasks = Array(8).fill({ status: 'Completed' });
    findTasksSpy.mockResolvedValue(tasks);

    const metrics = await calculateProjectMetrics('dummy_proj_id');

    expect(metrics.totalTasks).toBe(8);
    expect(metrics.completedTasks).toBe(8);
    expect(metrics.progress).toBe(100);
    expect(metrics.status).toBe('Completed');
  });
});
