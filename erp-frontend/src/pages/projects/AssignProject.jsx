import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProjectStore } from "@/stores/projectStore";
import { XMarkIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import useHrmStore from "@/stores/useHrmStore";
const AssignProject = () => {
  const navigate = useNavigate();
  const { id } = useParams();
    const { getProject, assignEmployees, getEmployees } = useProjectStore();
  const [project, setProject] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Load project and employee data
  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        toast.error("Project ID is missing");
        navigate("/projects/list");
        return;
      }

      try {
        console.log("Starting data load...");
        const [projectData, employeesData] = await Promise.all([
          getProject(id),
              getEmployees(),
        ]);

        console.log("Project data loaded:", projectData);
        console.log("Employees data loaded:", employeesData);

        if (!projectData) {
          throw new Error("Project not found");
        }

        setProject(projectData);

        if (Array.isArray(employeesData) && employeesData.length > 0) {
          setEmployees(employeesData);

          // Set initially selected employees based on current team
          if (projectData.team && Array.isArray(projectData.team)) {
            const currentTeamIds = projectData.team.map(
              (member) => member._id || member.id
            );
            setSelectedEmployees(currentTeamIds);
          } else {
            setSelectedEmployees([]);
          }
        } else {
          console.warn("No employees found");
          setEmployees([]);
          setSelectedEmployees([]);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error(error.message || "Failed to load data");
        navigate("/projects/list");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, getProject, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!id) {
      toast.error("Project ID is missing");
      return;
    }

    if (selectedEmployees.length === 0) {
      toast.warn("Please select at least one team member");
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("Assigning employees:", selectedEmployees, "to project:", id);
      const updatedProject = await assignEmployees(id, selectedEmployees);
      console.log("Updated project after assignment:", updatedProject);
      setProject(updatedProject);
      toast.success("Team members assigned successfully");
      setShowModal(false);
    } catch (error) {
      console.error("Error assigning employees:", error);
      toast.error(error.message || "Failed to assign team members");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleEmployee = (employeeId) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAll = () => {
    const allEmployeeIds = employees.map((emp) => emp._id || emp.id);
    setSelectedEmployees(allEmployeeIds);
  };

  const handleDeselectAll = () => {
    setSelectedEmployees([]);
  };

  const getPositionString = (position) => {
    if (typeof position === "string") return position;
    if (typeof position === "object" && position !== null) {
      if (position.title) return position.title;
      if (position.id && typeof position.id === "object") {
        return position.id.title || "No position specified";
      }
      return position.name || "No position specified";
    }
    return "No position specified";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Project Team Assignment
          </h1>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          >
            <UserGroupIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Assign Team Members
          </button>
        </div>

        {/* Project Details Card */}
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Project Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Project Name</p>
              <p className="mt-1 text-sm text-gray-900">{project?.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <p className="mt-1 text-sm text-gray-900">
                {project?.status?.replace("_", " ").toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Start Date</p>
              <p className="mt-1 text-sm text-gray-900">
                {project?.startDate &&
                  new Date(project.startDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">End Date</p>
              <p className="mt-1 text-sm text-gray-900">
                {project?.endDate
                  ? new Date(project.endDate).toLocaleDateString()
                  : "Ongoing"}
              </p>
            </div>
          </div>
        </div>

        {/* Current Team Members */}
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Current Team Members
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {project?.team?.length > 0 ? (
              project.team.map((member) => (
                <div
                  key={member._id || member.id}
                  className="bg-gray-50 rounded-lg p-4"
                >
                  <h3 className="text-sm font-medium text-gray-900">
                    {member.name || `${member.firstName} ${member.lastName}`}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {getPositionString(member.position)}
                  </p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
              ))
            ) : (
              <div className="col-span-full text-sm text-gray-500">
                No team members assigned yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Employee Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowModal(false)}
            />

            <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between pb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Select Team Members
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex justify-between mb-4">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      Deselect All
                    </button>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {employees.length > 0 ? (
                      employees.map((employee) => {
                        const employeeId = employee._id || employee.id;
                        const isAssigned =
                          selectedEmployees.includes(employeeId);
                        return (
                          <div
                            key={employeeId}
                            className={`relative flex items-start p-3 rounded-lg border ${
                              isAssigned
                                ? "border-primary-600 bg-primary-50"
                                : "border-gray-200"
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <label
                                htmlFor={`employee-${employeeId}`}
                                className="select-none font-medium text-gray-900 flex items-center cursor-pointer"
                              >
                                <input
                                  id={`employee-${employeeId}`}
                                  type="checkbox"
                                  checked={isAssigned}
                                  onChange={() => toggleEmployee(employeeId)}
                                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600 mr-3"
                                />
                                <div>
                                  <p className="font-medium">
                                    {employee.name ||
                                      `${employee.firstName} ${employee.lastName}`}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {getPositionString(employee.position)}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {employee.email}
                                  </p>
                                </div>
                              </label>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No employees available.
                      </p>
                    )}
                  </div>

                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex w-full justify-center rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black sm:col-start-2"
                    >
                      {isSubmitting ? "Assigning..." : "Assign Members"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AssignProject;
