import api from './api';

export const taskService = {
  // Create a new task
  async createTask(taskData) {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },

  // Get all tasks
  async getTasks(projectId) {
    const response = await api.get(`/tasks?project=${projectId}`);
    return response.data;
  },

  // Get a single task
  async getTask(taskId) {
    const response = await api.get(`/tasks/${taskId}`);
    console.log(response.data,"getTask");
    return response.data;
  },

  // Update a task
  async updateTask(taskId, taskData) {
    const response = await api.patch(`/tasks/${taskId}`, taskData);
    return response.data;
  },

  // Delete a task
  async deleteTask(taskId) {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  },

  // Update task status
  async updateTaskStatus(taskId, status) {
    const response = await api.patch(`/tasks/${taskId}/status`, { status });
    return response.data;
  },

  // Assign task to employee
  async assignTask(taskId, assigneeId) {
    const response = await api.patch(`/tasks/${taskId}/assign`, { assigneeId });
    return response.data;
  },

  // Unassign task from employee
  async unassignTask(taskId) {
    const response = await api.patch(`/tasks/${taskId}/unassign`);
    return response.data;
  },

  async getProjectTasks(projectId) {
    try {
      if (!projectId) {
        console.warn('No projectId provided to getProjectTasks');
        return [];
      }
      const response = await api.get(`/tasks/project/${projectId}`);
      console.log('Project tasks response:', response.data);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching project tasks:', error);
      return [];
    }
  },

  async addComment(taskId, commentData) {
    try {
      const response = await api.post(`/tasks/${taskId}/comments`, commentData);
      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  async addAttachment(taskId, attachmentData) {
    try {
      const response = await api.post(`/tasks/${taskId}/attachments`, attachmentData);
      return response.data;
    } catch (error) {
      console.error('Error adding attachment:', error);
      throw error;
    }
  }
}; 