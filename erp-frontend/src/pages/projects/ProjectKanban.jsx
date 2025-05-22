import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useProjectStore } from "../../stores/projectStore";
import useHrmStore from "../../stores/useHrmStore";
import {
  PlusIcon,
  PaperClipIcon,
  ChatBubbleLeftIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import TaskModal from "../../components/modules/TaskModal";
import TaskDetailModal from "../../components/modules/TaskDetailModal";
import { taskService } from "../../api/task.service";

const statusOptions = [
  {
    value: "planning",
    label: "Planning",
    bgColor: "bg-gray-100",
    textColor: "text-gray-800",
  },
  {
    value: "in-progress",
    label: "In Progress",
    bgColor: "bg-blue-100",
    textColor: "text-blue-800",
  },
  {
    value: "on-hold",
    label: "On Hold",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-800",
  },
  {
    value: "completed",
    label: "Completed",
    bgColor: "bg-green-100",
    textColor: "text-green-800",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    bgColor: "bg-red-100",
    textColor: "text-red-800",
  },
];

const TaskCard = ({ task, index, onTaskClick }) => {
  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onTaskClick(task)}
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-3 cursor-pointer hover:shadow-md transition-shadow"
        >
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            {task.title}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-2 mb-2">
            {task.description}
          </p>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-2">
              {task.assignee && (
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100">
                  {task.assignee.firstName} {task.assignee.lastName}
                </span>
              )}
              <span
                className={`px-2 py-1 rounded-full ${
                  task.priority === "high"
                    ? "bg-red-100 text-red-800"
                    : task.priority === "medium"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {task.priority}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {task.attachments?.length > 0 && (
                <span className="flex items-center">
                  <PaperClipIcon className="w-4 h-4 mr-1" />
                  {task.attachments.length}
                </span>
              )}
              {task.comments?.length > 0 && (
                <span className="flex items-center">
                  <ChatBubbleLeftIcon className="w-4 h-4 mr-1" />
                  {task.comments.length}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

const KanbanColumn = ({
  title,
  tasks = [],
  status,
  projectId,
  onTaskClick,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col bg-gray-50 rounded-lg p-4 min-w-[280px] md:min-w-[300px] w-full md:w-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-medium text-gray-900">{title}</h2>
          <p className="text-xs text-gray-500">{tasks.length} tasks</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="p-1 rounded-full hover:bg-gray-200"
        >
          <PlusIcon className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <Droppable droppableId={status}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex-1"
            style={{
              minHeight: "100px",
              maxHeight: "calc(100vh - 250px)",
              overflowY: "auto",
            }}
          >
            <div className="space-y-3">
              {tasks.map((task, index) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  index={index}
                  onTaskClick={onTaskClick}
                />
              ))}
            </div>
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={projectId}
        defaultStatus={status}
      />
    </div>
  );
};

const ProjectKanban = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { projects, fetchProjects, updateProject } = useProjectStore();
  const { employees, fetchEmployees } = useHrmStore();
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await Promise.all([fetchProjects(), fetchEmployees(), loadTasks()]);
      } catch (error) {
        console.error("Error loading data:", error);
        setError("Failed to load project data");
        toast.error("Failed to load project data");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [projectId]);

  const loadTasks = async () => {
    try {
      const projectTasks = await taskService.getProjectTasks(projectId);
      console.log("Loaded tasks:", projectTasks);
      setTasks(projectTasks || []);
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast.error("Failed to load tasks");
      setTasks([]);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    try {
      const newStatus = destination.droppableId;
      console.log("Updating task status:", {
        taskId: draggableId,
        status: newStatus,
      });

      await taskService.updateTaskStatus(draggableId, newStatus);
      await loadTasks();
      toast.success("Task status updated successfully");
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error(
        error?.response?.data?.message || "Failed to update task status"
      );
      // Refresh tasks to ensure UI is in sync with server state
      await loadTasks();
    }
  };

  const project = projects.find(
    (p) => p._id === projectId || p.id === projectId
  );

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    if (!project || newStatus === project.status) return;

    try {
      setIsUpdatingStatus(true);
      const updatedProject = {
        name: project.name,
        description: project.description,
        client:
          typeof project.client === "object"
            ? project.client._id || project.client.id
            : project.client,
        startDate: project.startDate,
        endDate: project.endDate,
        status: newStatus,
        team: Array.isArray(project.team)
          ? project.team.map((member) =>
              typeof member === "object" ? member._id || member.id : member
            )
          : [],
      };

      await updateProject(projectId, updatedProject);
      await fetchProjects(); // Refresh projects to get updated data
      toast.success("Project status updated successfully");
    } catch (error) {
      console.error("Error updating project status:", error);
      toast.error(error.message || "Failed to update project status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    const statusOption = statusOptions.find((opt) => opt.value === status);
    return {
      bgColor: statusOption?.bgColor || "bg-gray-100",
      textColor: statusOption?.textColor || "text-gray-800",
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-base font-semibold text-gray-900">
          Error loading project
        </h2>
        <p className="mt-2 text-sm text-gray-500">{error}</p>
        <button
          onClick={() => navigate("/projects")}
          className="mt-4 text-sm text-primary-600 hover:text-primary-500"
        >
          Go back to projects
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-base font-semibold text-gray-900">
          Project not found
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          The project you're looking for doesn't exist or you don't have access
          to it.
        </p>
        <button
          onClick={() => navigate("/projects")}
          className="mt-4 text-sm text-primary-600 hover:text-primary-500"
        >
          Go back to projects
        </button>
      </div>
    );
  }

  const todoTasks = Array.isArray(tasks)
    ? tasks.filter((task) => task.status === "todo")
    : [];
  const inProgressTasks = Array.isArray(tasks)
    ? tasks.filter((task) => task.status === "in-progress")
    : [];
  const onHoldTasks = Array.isArray(tasks)
    ? tasks.filter((task) => task.status === "on-hold")
    : [];
  const doneTasks = Array.isArray(tasks)
    ? tasks.filter((task) => task.status === "done")
    : [];

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 md:p-0">
        <div className="space-y-1 w-full md:w-auto">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
            {project?.name}
          </h1>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <p className="text-sm text-gray-500 line-clamp-2">
              {project?.description}
            </p>
            <div className="flex items-center space-x-2">
              <label
                htmlFor="project-status"
                className="text-sm font-medium text-gray-700 whitespace-nowrap"
              >
                Status:
              </label>
              <div className="relative">
                <select
                  id="project-status"
                  value={project?.status || "planning"}
                  onChange={handleStatusChange}
                  disabled={isUpdatingStatus}
                  className={`text-sm rounded-full px-4 py-1.5 font-medium ${
                    getStatusBadgeColor(project?.status).bgColor
                  } ${
                    getStatusBadgeColor(project?.status).textColor
                  } border-0 pr-8 appearance-none cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-primary-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {statusOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      className={`${option.bgColor} ${option.textColor}`}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                  {isUpdatingStatus ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent"></div>
                  ) : (
                    <svg
                      className="h-4 w-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 overflow-x-auto pb-6 px-4 md:px-0">
          <KanbanColumn
            title="To Do"
            tasks={todoTasks}
            status="todo"
            projectId={projectId}
            onTaskClick={setSelectedTask}
          />
          <KanbanColumn
            title="In Progress"
            tasks={inProgressTasks}
            status="in-progress"
            projectId={projectId}
            onTaskClick={setSelectedTask}
          />
          <KanbanColumn
            title="On Hold"
            tasks={onHoldTasks}
            status="on-hold"
            projectId={projectId}
            onTaskClick={setSelectedTask}
          />
          <KanbanColumn
            title="Done"
            tasks={doneTasks}
            status="done"
            projectId={projectId}
            onTaskClick={setSelectedTask}
          />
        </div>
      </DragDropContext>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onTaskUpdate={loadTasks}
          employees={employees}
        />
      )}
    </div>
  );
};

export default ProjectKanban;
