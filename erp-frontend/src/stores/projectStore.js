import { create } from 'zustand';
import { projectService } from '../api/project.service';

const useProjectStore = create((set, get) => ({
  projects: [],
  selectedProject: null,
  loading: false,
  error: null,

  // Fetch all projects
  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const response = await projectService.getProjects();
      console.log('fetchProjects raw response:', response);

      // Ensure we have an array of projects
      const projectsArray = Array.isArray(response) ? response :
        Array.isArray(response?.projects) ? response.projects :
          Array.isArray(response?.data) ? response.data : [];

      // Format each project
      const formattedProjects = projectsArray.map(project => ({
        ...project,
        id: project._id || project.id,
        _id: project._id || project.id,
        // Handle client reference which can be either an ObjectId string or an object with $oid
        client: project.client?.$oid || project.client?._id || project.client?.id || project.client || project.clientId,
        // Handle team members array which contains ObjectId references
        team: (project.team || project.assignedEmployees || []).map(member =>
          typeof member === 'object' ? (member.$oid || member._id || member.id) : member
        ),
        // Keep status as-is, just ensure lowercase
        status: (project.status || 'planning').toLowerCase()
      }));

      console.log('Setting formatted projects in store:', formattedProjects);

      set({
        projects: formattedProjects,
        loading: false
      });

      return formattedProjects;
    } catch (error) {
      console.error('Error in fetchProjects:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Fetch single project
  fetchProject: async (id) => {
    set({ loading: true, error: null });
    try {
      const project = await projectService.getProject(id);
      set({ selectedProject: project, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Create project (also available as addProject for backward compatibility)
  createProject: async (projectData) => {
    set({ loading: true, error: null });
    try {
      const newProject = await projectService.createProject(projectData);
      console.log('New project created:', newProject);

      if (newProject) {
        set((state) => {
          const updatedProjects = [...state.projects, newProject];
          console.log('Updated projects list:', updatedProjects);
          return {
            projects: updatedProjects,
            loading: false
          };
        });
      }

      return newProject;
    } catch (error) {
      console.error('Error in createProject:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Alias for createProject
  addProject: async (projectData) => {
    return get().createProject(projectData);
  },

  // Update project
  updateProject: async (id, data) => {
    try {
      console.log('Updating project:', { id, data });

      // Remove _id from the data before sending to API
      const { _id, id: projectId, ...updateData } = data;

      const response = await projectService.updateProject(id, updateData);

      if (response) {
        set((state) => ({
          projects: state.projects.map((p) =>
            (p._id === id || p.id === id) ? response : p
          )
        }));
        return response;
      }
    } catch (error) {
      console.error('Error in updateProject:', error);
      throw error?.response?.data || error;
    }
  },

  // Delete project
  deleteProject: async (id) => {
    if (!id) {
      throw new Error('Project ID is required for deletion');
    }

    set({ loading: true, error: null });
    try {
      const result = await projectService.deleteProject(id);
      console.log('Project deletion result:', result);

      set((state) => {
        const updatedProjects = state.projects.filter((project) =>
          project._id !== id && project.id !== id
        );
        console.log('Updated projects list after deletion:', updatedProjects);
        return {
          projects: updatedProjects,
          loading: false
        };
      });
    } catch (error) {
      console.error('Error in deleteProject:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Clear selected project
  clearSelectedProject: () => set({ selectedProject: null }),

  // Clear error
  clearError: () => set({ error: null }),

  // Get single project
  getProject: async (id) => {
    set({ loading: true, error: null });
    try {
      const project = await projectService.getProject(id);
      console.log('Get project result:', project);
      return project;
    } catch (error) {
      console.error('Error in getProject:', error);
      set({ error: error.message, loading: false });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Assign employees to project
  assignEmployees: async (projectId, employeeIds) => {
    set({ loading: true, error: null });
    try {
      const updatedProject = await projectService.assignEmployees(projectId, employeeIds);
      console.log('Project assignment result:', updatedProject);

      set((state) => {
        const updatedProjects = state.projects.map((project) =>
          (project._id === projectId || project.id === projectId) ? updatedProject : project
        );
        console.log('Updated projects list after assignment:', updatedProjects);
        return {
          projects: updatedProjects,
          selectedProject: updatedProject,
          loading: false
        };
      });

      return updatedProject;
    } catch (error) {
      console.error('Error in assignEmployees:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  }
}));

export { useProjectStore }; 