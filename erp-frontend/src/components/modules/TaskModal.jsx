import { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useForm, Controller } from "react-hook-form";
import useHrmStore from "@/stores/useHrmStore";
import { taskService } from "@/api/task.service";
import { toast } from "react-hot-toast";
import AsyncSelect from "react-select/async";

const TaskModal = ({
  isOpen,
  onClose,
  projectId,
  task = null,
  defaultStatus = "todo",
}) => {
  const { employees, fetchEmployees } = useHrmStore();
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const isEditing = !!task;

  const defaultValues = {
    title: task?.title || "",
    description: task?.description || "",
    assigneeId: task?.assignee
      ? {
          value: task.assignee._id || task.assignee.id,
          label: `${task.assignee.firstName} ${task.assignee.lastName} (${task.assignee.role})`,
          role: task.assignee.role,
        }
      : null,
    priority: task?.priority || "medium",
    dueDate: task?.dueDate
      ? new Date(task.dueDate).toISOString().split("T")[0]
      : "",
    status: task?.status || defaultStatus,
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    defaultValues,
  });

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
      reset(defaultValues);
    }
  }, [isOpen, task, fetchEmployees]);

  useEffect(() => {
    if (Array.isArray(employees)) {
      const options = employees.map((emp) => ({
        value: emp._id || emp.id,
        label: `${emp.firstName} ${emp.lastName} (${emp.role})`,
        role: emp.role,
      }));
      setEmployeeOptions(options);
    }
  }, [employees]);

  const filterEmployees = (inputValue) => {
    return employeeOptions.filter((option) =>
      option.label.toLowerCase().includes(inputValue.toLowerCase())
    );
  };

  const loadOptions = (inputValue) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(filterEmployees(inputValue));
      }, 300);
    });
  };

  const customStyles = {
    control: (base) => ({
      ...base,
      borderColor: "#e5e7eb",
      "&:hover": {
        borderColor: "#d1d5db",
      },
    }),
    option: (base, { data }) => ({
      ...base,
      display: "flex",
      flexDirection: "column",
      gap: "2px",
      "&:after": {
        content: `'${data.role}'`,
        fontSize: "0.75rem",
        color: "#6b7280",
      },
    }),
  };

  const onSubmit = async (data) => {
    try {
      const formData = {
        ...data,
        assignee: data.assigneeId?.value || null,
        project: projectId,
        status: defaultStatus,
      };

      if (isEditing) {
        await taskService.updateTask(task._id, formData);
        toast.success("Task updated successfully");
      } else {
        await taskService.createTask(formData);
        toast.success("Task created successfully");
      }
      reset(defaultValues);
      onClose();
    } catch (error) {
      console.error("Error submitting task:", error);
      toast.error(error.message || "Failed to save task");
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title
                      as="h3"
                      className="text-base font-semibold leading-6 text-gray-900"
                    >
                      {isEditing ? "Edit Task" : "Create Task"}
                    </Dialog.Title>

                    <form
                      onSubmit={handleSubmit(onSubmit)}
                      className="mt-6 space-y-4"
                    >
                      <div>
                        <label
                          htmlFor="title"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Title
                        </label>
                        <input
                          type="text"
                          id="title"
                          {...register("title", {
                            required: "Title is required",
                          })}
                          className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                        />
                        {errors.title && (
                          <p className="mt-1 text-xs text-red-600">
                            {errors.title.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="description"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Description
                        </label>
                        <textarea
                          id="description"
                          rows={3}
                          {...register("description")}
                          className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="assigneeId"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Assignee
                        </label>
                        <Controller
                          name="assigneeId"
                          control={control}
                          defaultValue={null}
                          render={({ field }) => (
                            <AsyncSelect
                              {...field}
                              loadOptions={loadOptions}
                              defaultOptions={employeeOptions}
                              isSearchable
                              isClearable
                              placeholder="Search and select assignee..."
                              className="mt-1"
                              styles={customStyles}
                              noOptionsMessage={() => "No employees found"}
                              value={field.value || null}
                              onChange={(val) => field.onChange(val)}
                            />
                          )}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="priority"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Priority
                        </label>
                        <select
                          id="priority"
                          {...register("priority")}
                          className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="dueDate"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Due Date
                        </label>
                        <input
                          type="date"
                          id="dueDate"
                          {...register("dueDate")}
                          className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                        />
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          className="inline-flex w-full justify-center rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 sm:ml-3 sm:w-auto"
                        >
                          {isEditing ? "Update Task" : "Create Task"}
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
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default TaskModal;
