import api from "./api";

const BASE_URL = "/projects";

export const projectService = {
  createProject: async (projectData) => {
    try {
      const response = await api.post(BASE_URL, projectData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  updatePendingToViewProjectIsAvailable: async (id) => {
    try {
      const response = await api.post(
        `hrm/employees/updateProjectViewPending/${id}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getPendingToViewProjectIsAvailable: async (id) => {
    try {
      const response = await api.get(`hrm/employees/user/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getProjects: async () => {
    try {
      const response = await api.get(`${BASE_URL}`);
      const data = response.data;
      return Array.isArray(data) ? data : data.projects || [];
    } catch (error) {
      throw error;
    }
  },

  getProject: async (id) => {
    try {
      const response = await api.get(
        `${BASE_URL}/${id}?populate=client,team,tasks`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateProject: async (id, projectData) => {
    try {
      const response = await api.put(`${BASE_URL}/${id}`, projectData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteProject: async (id) => {
    try {
      const response = await api.delete(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  assignEmployees: async (projectId, employeeIds) => {
    try {
      const response = await api.post(`${BASE_URL}/${projectId}/assign-team`, {
        employees: employeeIds,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getProjectWithDetails: async (id) => {
    try {
      const response = await api.get(`${BASE_URL}/${id}/details`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
