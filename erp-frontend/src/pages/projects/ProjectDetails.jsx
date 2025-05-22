import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectStore } from "@/stores/projectStore";
import {
  ClockIcon,
  UserGroupIcon,
  CalendarIcon,
  CheckCircleIcon,
  ChatBubbleLeftIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { projectService } from "@/api/project.service";

const ProjectDetails = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Use the getProjects method that includes population of related data
        const projectsData = await projectService.getProjects();
        console.log("Fetched projects:", projectsData);

        if (!projectsData || projectsData.length === 0) {
          throw new Error("No projects found");
        }

        setProjects(projectsData);
      } catch (error) {
        console.error("Error loading projects:", error);
        toast.error(error.message || "Failed to load projects");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleViewKanban = (projectId) => {
    navigate(`/projects/kanban/${projectId}`);
  };

  // Function to extract unique team members from task assignees
  const getTeamMembersFromTasks = (tasks) => {
    if (!tasks || tasks.length === 0) return [];
    
    // Use a Map to track unique team members by their ID
    const uniqueMembers = new Map();
    
    tasks.forEach(task => {
      if (task.assignee && task.assignee.id) {
        uniqueMembers.set(task.assignee.id, task.assignee);
      }
    });
    
    // Convert Map values to array
    return Array.from(uniqueMembers.values());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900">
          No projects found
        </h2>
        <button
          onClick={() => navigate("/projects/list")}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800"
        >
          Back to Projects List
        </button>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "on_hold":
      case "on-hold":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Project Details</h1>
        <p className="mt-2 text-gray-600">
          Overview of all projects and their details
        </p>
      </div>

      <div className="space-y-8">
        {projects.map((project) => {
          // Get team members from task assignees
          const teamMembers = getTeamMembersFromTasks(project.tasks);
          
          return (
            <motion.div
              key={project._id || project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-lg shadow-lg overflow-hidden"
            >
              {/* Project Overview Card */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {project.name}
                    </h2>
                    <p className="text-gray-600 mb-4">{project.description}</p>
                    <div className="flex flex-wrap items-center gap-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          project.status
                        )}`}
                      >
                        {project.status?.replace(/[-_]/g, " ").toUpperCase() ||
                          "PLANNING"}
                      </span>
                      <div className="flex items-center text-gray-500">
                        <CalendarIcon className="h-5 w-5 mr-2" />
                        <span>
                          {new Date(project.startDate).toLocaleDateString()} -
                          {project.endDate
                            ? new Date(project.endDate).toLocaleDateString()
                            : "Ongoing"}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          handleViewKanban(project._id || project.id)
                        }
                        className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium text-white bg-black hover:bg-gray-800 transition-colors"
                      >
                        View Kanban Board
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Client</p>
                    <p className="text-lg font-semibold">
                      {project.client?.name || "N/A"}
                    </p>
                    {project.client?.company && (
                      <p className="text-sm text-gray-500">
                        {project.client.company}
                      </p>
                    )}
                    {project.client?.email && (
                      <p className="text-sm text-gray-500">
                        {project.client.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
                {/* Tasks Section */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <CheckCircleIcon className="h-6 w-6 mr-2 text-gray-500" />
                    Project Tasks
                  </h3>
                  <div className="space-y-4">
                    {project.tasks?.map((task) => (
                      <div
                        key={task._id || task.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                task.status
                              )}`}
                            >
                              {task.status?.replace(/[-_]/g, " ").toUpperCase() ||
                                "PENDING"}
                            </span>
                            {task.priority && (
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                                  task.priority
                                )}`}
                              >
                                {task.priority.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">
                          {task.description}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center">
                              <ClockIcon className="h-4 w-4 mr-1" />
                              <span>
                                Due:{" "}
                                {task.dueDate
                                  ? new Date(task.dueDate).toLocaleDateString()
                                  : "No due date"}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <UserGroupIcon className="h-4 w-4 mr-1" />
                              <span>
                                {task.assignee
                                  ? `${task.assignee.firstName} ${task.assignee.lastName}`
                                  : "Unassigned"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {task.attachments?.length > 0 && (
                              <span className="flex items-center text-gray-500">
                                <PaperClipIcon className="h-4 w-4 mr-1" />
                                {task.attachments.length}
                              </span>
                            )}
                            {task.comments?.length > 0 && (
                              <span className="flex items-center text-gray-500">
                                <ChatBubbleLeftIcon className="h-4 w-4 mr-1" />
                                {task.comments.length}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!project.tasks || project.tasks.length === 0) && (
                      <p className="text-gray-500 text-center py-4">
                        No tasks found for this project
                      </p>
                    )}
                  </div>
                </div>

                {/* Team Members Section */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <UserGroupIcon className="h-6 w-6 mr-2 text-gray-500" />
                    Team Members
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {/* First show team members from task assignees */}
                    {teamMembers.length > 0 ? (
                      teamMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center space-x-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-600 font-medium">
                                {member.firstName?.[0]}
                                {member.lastName?.[0]}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {member.name ||
                                `${member.firstName} ${member.lastName}`}
                            </p>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                              <p className="text-sm text-gray-500">
                                {member.position?.title ||
                                  member.department?.name ||
                                  "Task Assignee"}
                              </p>
                              {member.email && (
                                <p className="text-sm text-gray-500">
                                  {member.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      // If no task assignees, fallback to project.team or show empty message
                      project.team && project.team.length > 0 ? (
                        project.team.map((member) => (
                          <div
                            key={member._id || member.id}
                            className="flex items-center space-x-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
                          >
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-600 font-medium">
                                  {member.firstName?.[0]}
                                  {member.lastName?.[0]}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {member.name ||
                                  `${member.firstName} ${member.lastName}`}
                              </p>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                                <p className="text-sm text-gray-500">
                                  {member.position?.title ||
                                    member.department?.name ||
                                    "Team Member"}
                                </p>
                                {member.email && (
                                  <p className="text-sm text-gray-500">
                                    {member.email}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-4">
                          No team members assigned to this project
                        </p>
                      )
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectDetails;