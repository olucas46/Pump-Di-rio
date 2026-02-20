import { WorkoutPlan, WorkoutLog } from '../types';

const API_BASE = '/api';

export const api = {
  async getPlans(userId: string): Promise<WorkoutPlan[]> {
    const res = await fetch(`${API_BASE}/plans/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch plans');
    return res.json();
  },

  async createPlan(userId: string, plan: WorkoutPlan): Promise<void> {
    const res = await fetch(`${API_BASE}/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...plan, userId }),
    });
    if (!res.ok) throw new Error('Failed to create plan');
  },

  async updatePlan(plan: WorkoutPlan): Promise<void> {
    const res = await fetch(`${API_BASE}/plans/${plan.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan),
    });
    if (!res.ok) throw new Error('Failed to update plan');
  },

  async deletePlan(planId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/plans/${planId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete plan');
  },

  async getLogs(userId: string): Promise<WorkoutLog[]> {
    const res = await fetch(`${API_BASE}/logs/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch logs');
    return res.json();
  },

  async createLog(userId: string, log: WorkoutLog): Promise<void> {
    const res = await fetch(`${API_BASE}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...log, userId }),
    });
    if (!res.ok) throw new Error('Failed to create log');
  },

  async updateLog(logId: string, updates: Partial<WorkoutLog>): Promise<void> {
    const res = await fetch(`${API_BASE}/logs/${logId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update log');
  }
};
