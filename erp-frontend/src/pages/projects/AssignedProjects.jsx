import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/stores/projectStore';
import { useClientStore } from '@/stores/clientStore';
import { UserGroupIcon, CalendarIcon, PencilIcon } from '@heroicons/react/24/outline';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'react-hot-toast';

const ProjectCard = ({ project, getClientName, onEdit, index }) => {
  const navigate = useNavigate();
  
  return (
    <Draggable draggableId={project._id || project.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 mb-4"
        >
          <div className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium text-gray-900">{project.name}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {getClientName(project.client)}
                </p>
              </div>
            </div>
            
            <div className="mt-3 space-y-2">
              <div className="flex items-center text-xs text-gray-500">
                <CalendarIcon className="h-4 w-4 mr-1" />
                <span>{new Date(project.startDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <UserGroupIcon className="h-4 w-4 mr-1" />
                <span>{project.team?.length || 0} members</span>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-2 text-right">
            <button
              onClick={() => navigate(`/projects/assign/${project._id || project.id}`)}
              className="text-xs text-black hover:text-gray-600 font-medium"
            >
              View Details →
            </button>
          </div>
        </div>
      )}
    </Draggable>
  );
};

const KanbanColumn = ({ title, projects, getClientName, onEdit, bgColor = 'bg-gray-50', droppableId }) => (
  <div className="flex flex-col min-h-[500px] w-80 rounded-lg">
    <div className={`p-3 ${bgColor} rounded-t-lg border-b`}>
      <h3 className="font-medium text-gray-900">{title}</h3>
      <span className="text-sm text-gray-500">{projects.length} projects</span>
    </div>
    <Droppable droppableId={droppableId}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="flex-1 p-3 space-y-3 overflow-y-auto bg-gray-50/50"
        >
          {projects.map((project, index) => (
            <ProjectCard
              key={project._id || project.id}
              project={project}
              getClientName={getClientName}
              onEdit={onEdit}
              index={index}
            />
          ))}
          {provided.placeholder}
          {projects.length === 0 && (
            <div className="text-center py-8 text-sm text-gray-500">
              No projects in this status
            </div>
          )}
        </div>
      )}
    </Droppable>
  </div>
);

const AssignedProjects = () => {
  const navigate = useNavigate();
  const { projects, fetchProjects, updateProject } = useProjectStore();
  const { clients, fetchClients } = useClientStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to refresh data
  const refreshData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // First fetch projects
      await fetchProjects();
      // Then fetch clients
      await fetchClients();
      
      // Access the data from the store directly
      if (!Array.isArray(projects)) {
        console.error('Projects not available in store:', projects);
        throw new Error('Failed to load projects data correctly');
      }
      
      if (!Array.isArray(clients)) {
        console.error('Clients not available in store:', clients);
        throw new Error('Failed to load clients data correctly');
      }
      
      console.log('Current projects in store:', projects?.length);
      console.log('Current clients in store:', clients?.length);
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error.message || 'Failed to load data');
      toast.error(error.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    refreshData();
  }, []);

  // Periodic refresh every minute (increased from 30s to reduce server load)
  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshData();
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  const getClientName = (clientId) => {
    if (!clientId) return 'N/A';
    
    // Handle different client ID formats
    const normalizedClientId = typeof clientId === 'object' ? clientId.$oid || clientId._id || clientId.id : clientId;
    
    const client = clients.find(c => {
      const cId = c._id || c.id;
      return cId === normalizedClientId;
    });
    
    return client ? client.name : 'N/A';
  };

  const handleEdit = (project) => {
    navigate(`/projects/${project._id || project.id}`);
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    const project = projects.find(p => (p._id || p.id) === draggableId);
    if (!project) {
      toast.error('Project not found');
      return;
    }

    const newStatus = destination.droppableId;
    
    // Validate status before updating
    const validStatuses = ['planning', 'in-progress', 'on-hold', 'completed', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      toast.error('Invalid status value');
      return;
    }

    try {
      // Extract client ID as string
      let clientId = '';
      if (typeof project.client === 'string') {
        clientId = project.client;
      } else if (project.client?.$oid) {
        clientId = project.client.$oid;
      } else if (project.client?._id) {
        clientId = project.client._id;
      } else if (project.client?.id) {
        clientId = project.client.id;
      }

      // Format the project data before sending to the server
      const updateData = {
        name: project.name,
        description: project.description,
        client: clientId,
        startDate: project.startDate,
        endDate: project.endDate,
        status: newStatus,
        team: Array.isArray(project.team) 
          ? project.team.map(member => 
              typeof member === 'object' ? (member.$oid || member._id || member.id) : member
            )
          : []
      };

      await updateProject(draggableId, updateData);
      toast.success(`Project moved to ${newStatus.replace('-', ' ').toUpperCase()}`);
      
      // Refresh data after successful update
      await refreshData();
    } catch (error) {
      console.error('Error updating project status:', error);
      toast.error(error.message || 'Failed to update project status');
      // Refresh data to ensure UI is in sync
      await refreshData();
    }
  };

  // Group projects by status with additional validation
  const groupProjectsByStatus = () => {
    if (!Array.isArray(projects)) {
      console.error('Invalid projects array:', projects);
      return {
        todoProjects: [],
        inProgressProjects: [],
        onHoldProjects: [],
        completedProjects: []
      };
    }

    // Log each project's status for debugging
    projects.forEach(project => {
      console.log(`Project "${project.name}" status: "${project.status}"`);
    });

    const grouped = {
      todoProjects: projects.filter(p => p && p.status === 'planning'),
      inProgressProjects: projects.filter(p => p && p.status === 'in-progress'),
      onHoldProjects: projects.filter(p => p && p.status === 'on-hold'),
      completedProjects: projects.filter(p => p && p.status === 'completed')
    };

    // Log the grouping results
    console.log('Grouped projects:', {
      planning: grouped.todoProjects.length,
      'in-progress': grouped.inProgressProjects.length,
      'on-hold': grouped.onHoldProjects.length,
      completed: grouped.completedProjects.length
    });

    return grouped;
  };

  const {
    todoProjects,
    inProgressProjects,
    onHoldProjects,
    completedProjects
  } = groupProjectsByStatus();

  // Debug logging for project updates
  useEffect(() => {
    if (projects?.length > 0) {
      console.log('All projects:', projects.map(p => ({
        id: p._id || p.id,
        name: p.name,
        status: p.status
      })));
    }
    console.log('Projects count by status:', {
      total: projects?.length || 0,
      todo: todoProjects.length,
      inProgress: inProgressProjects.length,
      onHold: onHoldProjects.length,
      completed: completedProjects.length
    });
  }, [projects]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-red-600">{error}</p>
        <button
          onClick={refreshData}
          className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Project Board</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {projects?.length || 0} total projects
          </span>
          <button
            onClick={refreshData}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Refresh
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-6">
          <KanbanColumn
            title="To Do"
            projects={todoProjects}
            getClientName={getClientName}
            onEdit={handleEdit}
            bgColor="bg-gray-100"
            droppableId="planning"
          />
          <KanbanColumn
            title="In Progress"
            projects={inProgressProjects}
            getClientName={getClientName}
            onEdit={handleEdit}
            bgColor="bg-blue-50"
            droppableId="in-progress"
          />
          <KanbanColumn
            title="On Hold"
            projects={onHoldProjects}
            getClientName={getClientName}
            onEdit={handleEdit}
            bgColor="bg-yellow-50"
            droppableId="on-hold"
          />
          <KanbanColumn
            title="Completed"
            projects={completedProjects}
            getClientName={getClientName}
            onEdit={handleEdit}
            bgColor="bg-green-50"
            droppableId="completed"
          />
        </div>
      </DragDropContext>
    </div>
  );
};

export default AssignedProjects; 