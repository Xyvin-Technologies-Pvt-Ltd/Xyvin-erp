import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProjectStore } from "@/stores/projectStore";
import {
  ClockIcon,
  UserGroupIcon,
  CalendarIcon,
  CheckCircleIcon,
  ChatBubbleLeftIcon,
  PaperClipIcon,
  ArrowLeftIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { projectService } from "@/api/project.service";

const ProjectDetails = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!projectId) {
        toast.error("Project ID is missing");
        navigate("/projects/list");
        return;
      }

      try {
        setLoading(true);
        const projectData = await projectService.getProjectWithDetails(projectId);
        if (!projectData) {
          throw new Error("Project not found");
        }
        setProjects([projectData]);
      } catch (error) {
        console.error("Error loading project:", error);
        toast.error(error.message || "Failed to load project");
        navigate("/projects/list");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [projectId, navigate]);

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
      <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
          <p className="text-gray-500 font-medium">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-red-50 to-white">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto">
            <span className="text-red-600 text-2xl">⚠</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-900">Project Not Found</h3>
            <button
              onClick={() => navigate("/projects/list")}
              className="mt-4 inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
            >
              Back to Projects List
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-gradient-to-r from-green-50 to-emerald-50 text-emerald-700 border border-emerald-200";
      case "in_progress":
      case "in-progress":
        return "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200";
      case "on_hold":
      case "on-hold":
        return "bg-gradient-to-r from-yellow-50 to-amber-50 text-amber-700 border border-amber-200";
      case "cancelled":
        return "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200";
      default:
        return "bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border border-gray-200";
    }
  };

  return (
    <div className="min-h-screen space-y-6">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
        {/* Header with back arrow */}
        <div className="flex items-center justify-between relative mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="absolute -left-14 p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Go back"
            >
              <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Project Details
              </h1>
              <p className="text-gray-600">Overview of project and its details</p>
            </div>
          </div>
          <button
            onClick={() => handleViewKanban(projects[0]?._id || projects[0]?.id)}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            View Kanban Board
          </button>
        </div>

        {projects.map((project) => {
          const teamMembers = getTeamMembersFromTasks(project.tasks);
          
          return (
            <motion.div
              key={project._id || project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Project Info Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-4 flex-1">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          {project.name}
                        </h2>
                        <p className="text-gray-600">{project.description}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                          <div className="w-1.5 h-1.5 rounded-full bg-current mr-2"></div>
                          {project.status?.replace(/[-_]/g, " ").toUpperCase() || "PLANNING"}
                        </span>
                        <div className="flex items-center text-gray-500">
                          <CalendarIcon className="h-5 w-5 mr-2" />
                          <span className="text-sm">
                            {new Date(project.startDate).toLocaleDateString()} -
                            {project.endDate
                              ? new Date(project.endDate).toLocaleDateString()
                              : "Ongoing"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-6">
                      <div className="inline-flex items-start px-6 py-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 min-w-[300px]">
                        <div className="space-y-2">
                          <p className="text-base font-semibold text-gray-900">Client</p>
                          <div className="flex">
                            <p className="text-sm text-gray-500 w-20">Name:</p>
                            <p className="text-sm text-gray-900">
                              {project.client?.name || "N/A"}
                            </p>
                          </div>
                          {project.client?.company && (
                            <div className="flex">
                              <p className="text-sm text-gray-500 w-20">Company:</p>
                              <p className="text-sm text-gray-900">
                                {project.client.company}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Members Section */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-6 flex items-center">
                    <UserGroupIcon className="h-6 w-6 mr-2 text-gray-500" />
                    Team Members
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teamMembers.length > 0 ? (
                      teamMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center space-x-4 p-4 border rounded-xl hover:shadow-md transition-shadow bg-gradient-to-r from-gray-50 to-white"
                        >
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center">
                              <span className="text-blue-700 font-medium">
                                {member.firstName?.[0]}
                                {member.lastName?.[0]}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {member.name || `${member.firstName} ${member.lastName}`}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {member.position?.title || member.department?.name || "Team Member"}
                            </p>
                            {member.email && (
                              <p className="text-sm text-gray-500 truncate">
                                {member.email}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                          <UserGroupIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500">No team members assigned to this project</p>
                      </div>
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