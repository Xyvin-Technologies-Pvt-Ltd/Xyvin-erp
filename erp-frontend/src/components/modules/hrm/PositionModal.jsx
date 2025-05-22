import React, { useEffect } from "react";
import { Dialog, Switch } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { XMarkIcon } from "@heroicons/react/24/outline";
import useHrmStore from "../../../stores/useHrmStore";

const PositionModal = ({ isOpen, onClose, position, onSuccess }) => {
  const { 
    departments, 
    fetchDepartments, 
    getNextPositionCode,
    createPosition,
    updatePosition 
  } = useHrmStore();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm();
  const selectedDepartment = watch("department");
  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    console.log("Current departments:", departments);
    if (position) {
      setValue("title", position.title);
      setValue("code", position.code);
      setValue("description", position.description);

      // Find the department object and set its value without disabling
      const departmentId =
        typeof position.department === "object"
          ? position.department._id || position.department.id
          : position.department;

      // Simply set the value, no need to find department object or disable
      setValue("department", departmentId);

      setValue("responsibilities", position.responsibilities?.join("\n"));
      setValue("requirements", position.requirements?.join("\n"));
      setValue("employmentType", position.employmentType);
      setValue("isActive", position.isActive);
      setValue("level", position.level || 1);
      setValue("maxPositions", position.maxPositions || 1);
    } else {
      reset({
        isActive: true,
        level: 1,
        maxPositions: 1,
        employmentType: "Full-time",
      });
    }
  }, [position, setValue, reset, departments]);
  useEffect(() => {
    console.log("Selected department changed:", selectedDepartment);
  }, [selectedDepartment]);

  useEffect(() => {
    const fetchPositionCode = async () => {
      if (!position) {
        try {
          const response = await getNextPositionCode();
          if (response?.data?.position?.code) {
            setValue("code", response.data.position.code);
          } else {
            throw new Error("Invalid position code received");
          }
        } catch (error) {
          console.error("Error fetching position code:", error);
          toast.error("Failed to generate position code. Please try again.");
        }
      }
    };

    fetchPositionCode();
  }, [position, setValue, getNextPositionCode]);

  const onSubmit = async (data) => {
    try {
      console.log("Form data before submission:", data);
      console.log("Selected department ID:", data.department);
      // Validate department ID
      if (!data.department || !/^[0-9a-fA-F]{24}$/.test(data.department)) {
        throw new Error("Invalid department selected");
      }
      // Check if the selected department exists in the available departments
      const departmentExists = departments.some(
        (dept) => dept.id === data.department
      );
      if (!departmentExists) {
        throw new Error(
          "Selected department is not valid. Please select again."
        );
      }
      // Find the selected department to verify it exists
      const selectedDept = departments.find(
        (dept) => dept.id === data.department
      );
      if (!selectedDept) {
        throw new Error("Invalid department selected. Please try again.");
      }

      const formattedData = {
        ...data,
        // Ensure department is the MongoDB ObjectId string
        department: selectedDept.id,
        responsibilities: data.responsibilities
          .split("\n")
          .filter((item) => item.trim()),
        requirements: data.requirements
          .split("\n")
          .filter((item) => item.trim()),
        level: parseInt(data.level),
        maxPositions: parseInt(data.maxPositions),
      };

      if (position) {
        await updatePosition(position.id, formattedData);
        toast.success("Position updated successfully");
      } else {
        await createPosition(formattedData);
        toast.success("Position created successfully");
      }

      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.message || "Something went wrong");
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-xl w-full rounded bg-white p-4">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-medium">
              {position ? "Edit Position" : "Create Position"}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  {...register("title", { required: "Title is required" })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Code
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  className="input"
                  {...register("code")}
                  readOnly
                  disabled
                />
                {errors.code && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.code.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <select
                  {...register("department", {
                    required: "Department is required",
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm "
                >
                  <option value="">Select Department</option>
                  {departments?.map((dept) => (
                    <option
                      key={dept.id || dept._id}
                      value={dept.id || dept._id}
                    >
                      {dept.name}
                    </option>
                  ))}
                </select>
                {errors.department && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.department.message}
                  </p>
                )}
                {/* Debug info */}
                <p className="mt-1 text-xs text-gray-500">
                  Selected ID: {selectedDepartment || "none"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Employment Type
                </label>
                <select
                  {...register("employmentType", {
                    required: "Employment type is required",
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Intern">Intern</option>
                </select>
                {errors.employmentType && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.employmentType.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Level
                </label>
                <input
                  type="number"
                  min="1"
                  {...register("level", {
                    required: "Level is required",
                    min: { value: 1, message: "Level must be at least 1" },
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
                {errors.level && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.level.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Max Positions
                </label>
                <input
                  type="number"
                  min="1"
                  {...register("maxPositions", {
                    required: "Max positions is required",
                    min: {
                      value: 1,
                      message: "Max positions must be at least 1",
                    },
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
                {errors.maxPositions && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.maxPositions.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                {...register("description", {
                  required: "Description is required",
                })}
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Responsibilities (one per line)
              </label>
              <textarea
                {...register("responsibilities", {
                  required: "At least one responsibility is required",
                })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
              {errors.responsibilities && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.responsibilities.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Requirements (one per line)
              </label>
              <textarea
                {...register("requirements", {
                  required: "At least one requirement is required",
                })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
              {errors.requirements && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.requirements.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="isActive" className="label">
                Status
              </label>
              <div className="flex items-center space-x-3">
                <Switch
                  checked={watch("isActive")}
                  onChange={(checked) => {
                    setValue("isActive", checked);
                  }}
                  className={`${
                    watch("isActive") ? "bg-black" : "bg-gray-200"
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2`}
                >
                  <span className="sr-only">Enable status</span>
                  <span
                    className={`${
                      watch("isActive") ? "translate-x-6" : "translate-x-1"
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
                <span className="text-sm text-gray-600">
                  {watch("isActive") ? "Active" : "Inactive"}
                </span>
              </div>
              {errors.isActive && (
                <div className="error-message">{errors.isActive.message}</div>
              )}
            </div>

            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={errors.isActive}
                className={`inline-flex w-full justify-center rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 sm:ml-3 sm:w-auto ${
                  errors.isActive ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {errors.isActive ? (
                  <div className="spinner border-2 h-5 w-5" />
                ) : position ? (
                  "Update"
                ) : (
                  "Create"
                )}
              </button>
              <button
                type="button"
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default PositionModal;
