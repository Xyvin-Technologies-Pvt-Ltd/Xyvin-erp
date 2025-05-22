import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition, Tab } from "@headlessui/react";
import {
  XMarkIcon,
  PaperClipIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import { useForm, Controller } from "react-hook-form";
import { taskService } from "@/api/task.service";
import { toast } from "react-hot-toast";
import AsyncSelect from "react-select/async";
import { format } from "date-fns";

const TaskDetailModal = ({ task, onClose, onTaskUpdate, employees }) => {
  const [activeTab, setActiveTab] = useState("details");
  const [comment, setComment] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const defaultValues = {
    title: task?.title || "",
    description: task?.description || "",
    assignee: task?.assignee
      ? {
          value: task.assignee._id || task.assignee.id,
          label: `${task.assignee.firstName} ${task.assignee.lastName} (${
            task.assignee.role || "No Role"
          })`,
          role: task.assignee.role || "No Role",
        }
      : null,
    priority: task?.priority || "medium",
    dueDate: task?.dueDate
      ? new Date(task.dueDate).toISOString().split("T")[0]
      : "",
    status: task?.status || "todo",
  };

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues,
  });

  useEffect(() => {
    if (task) {
      reset({
        title: task.title || "",
        description: task.description || "",
        assignee: task.assignee
          ? {
              value: task.assignee._id || task.assignee.id,
              label: `${task.assignee.firstName} ${task.assignee.lastName} (${
                task.assignee.role || "No Role"
              })`,
              role: task.assignee.role || "No Role",
            }
          : null,
        priority: task.priority || "medium",
        dueDate: task.dueDate
          ? new Date(task.dueDate).toISOString().split("T")[0]
          : "",
        status: task.status || "todo",
      });
    }
  }, [task, reset]);

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      const formData = {
        title: data.title,
        description: data.description,
        assignee: data.assignee?.value,
        priority: data.priority,
        status: data.status,
        dueDate: data.dueDate,
      };

      await taskService.updateTask(task._id, formData);
      toast.success("Task updated successfully");
      onTaskUpdate();
      onClose();
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error(error.message || "Failed to update task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;

    try {
      setIsSubmitting(true);
      await taskService.addComment(task._id, { content: comment });
      setComment("");
      onTaskUpdate();
      toast.success("Comment added successfully");
    } catch (error) {
      toast.error("Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setSelectedFile(file);
  };

  const handleAttachmentSubmit = async (type) => {
    try {
      setIsSubmitting(true);
      if (type === "file" && selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("name", attachmentName || selectedFile.name);
        await taskService.addAttachment(task._id, formData);
      } else if (type === "link" && attachmentUrl) {
        await taskService.addAttachment(task._id, {
          name: attachmentName || "Link",
          url: attachmentUrl,
          type: "link",
        });
      }
      setSelectedFile(null);
      setAttachmentName("");
      setAttachmentUrl("");
      onTaskUpdate();
      toast.success("Attachment added successfully");
    } catch (error) {
      toast.error("Failed to add attachment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const employeeOptions = employees.map((emp) => ({
    value: emp._id || emp.id,
    label: `${emp.firstName} ${emp.lastName} (${emp.role || "No Role"})`,
    role: emp.role || "No Role",
  }));

  const loadOptions = async (inputValue) => {
    const filteredOptions = employeeOptions.filter((option) =>
      option.label.toLowerCase().includes(inputValue.toLowerCase())
    );
    return filteredOptions;
  };

  const customStyles = {
    control: (base) => ({
      ...base,
      minHeight: "38px",
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
      padding: "8px 12px",
      "&:after": {
        content: `'${data.role}'`,
        fontSize: "0.75rem",
        color: "#6b7280",
      },
    }),
  };

  // Function to handle comment author display safely
  const getCommentAuthorName = (comment) => {
    if (!comment || !comment.author) return "Unknown User";
    return `${comment.author.firstName || ""} ${comment.author.lastName || ""}`.trim() || "Unknown User";
  };

  return (
    <Transition.Root show={true} as={Fragment}>
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
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

                <div className="bg-white">
                  <Tab.Group
                    selectedIndex={[
                      "details",
                      "comments",
                      "attachments",
                    ].indexOf(activeTab)}
                    onChange={(index) =>
                      setActiveTab(
                        ["details", "comments", "attachments"][index]
                      )
                    }
                  >
                    <Tab.List className="border-b border-gray-200">
                      <div className="flex space-x-8 px-6 pt-6">
                        <Tab
                          className={({ selected }) =>
                            `${
                              selected
                                ? "border-primary-500 text-primary-600"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                            }
                          whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium`
                          }
                        >
                          Details
                        </Tab>
                        <Tab
                          className={({ selected }) =>
                            `${
                              selected
                                ? "border-primary-500 text-primary-600"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                            }
                          whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium`
                          }
                        >
                          Comments
                        </Tab>
                        <Tab
                          className={({ selected }) =>
                            `${
                              selected
                                ? "border-primary-500 text-primary-600"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                            }
                          whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium`
                          }
                        >
                          Attachments
                        </Tab>
                      </div>
                    </Tab.List>

                    <Tab.Panels className="px-6 py-6">
                      <Tab.Panel>
                        <form
                          onSubmit={handleSubmit(onSubmit)}
                          className="space-y-4"
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
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
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
                              {...register("description")}
                              rows={3}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="assignee"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Assignee
                            </label>
                            <Controller
                              name="assignee"
                              control={control}
                              render={({ field }) => (
                                <AsyncSelect
                                  {...field}
                                  loadOptions={loadOptions}
                                  defaultOptions={employeeOptions}
                                  isSearchable
                                  isClearable
                                  styles={customStyles}
                                  className="mt-1"
                                />
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
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
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                              >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                              </select>
                            </div>

                            <div>
                              <label
                                htmlFor="status"
                                className="block text-sm font-medium text-gray-700"
                              >
                                Status
                              </label>
                              <select
                                id="status"
                                {...register("status")}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                              >
                                <option value="todo">To Do</option>
                                <option value="in-progress">In Progress</option>
                                <option value="on-hold">On Hold</option>
                                <option value="done">Done</option>
                              </select>
                            </div>
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
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            />
                          </div>

                          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="inline-flex w-full justify-center rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 sm:ml-3 sm:w-auto disabled:opacity-50"
                            >
                              {isSubmitting ? "Updating..." : "Update Task"}
                            </button>
                            <button
                              type="button"
                              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-black shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                              onClick={onClose}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </Tab.Panel>

                      <Tab.Panel className="relative h-[600px] flex flex-col">
                        <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4">
                          {task?.comments && task.comments.length > 0 ? (
                            task.comments.map((comment, index) => (
                              <div
                                key={index}
                                className="bg-gray-50 rounded-lg p-4"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-900">
                                    {getCommentAuthorName(comment)}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {comment.createdAt && format(
                                      new Date(comment.createdAt),
                                      "MMM d, yyyy h:mm a"
                                    )}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm text-gray-600">
                                  {comment.content}
                                </p>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-6 text-gray-500">
                              No comments yet
                            </div>
                          )}
                        </div>

                        <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-200">
                          <label
                            htmlFor="comment"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Add a comment
                          </label>
                          <div className="space-y-3">
                            <textarea
                              rows={3}
                              name="comment"
                              id="comment"
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                              placeholder="Write your comment here..."
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                            />
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={handleAddComment}
                                disabled={isSubmitting || !comment.trim()}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                              >
                                {isSubmitting ? (
                                  <>
                                    <svg
                                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                    >
                                      <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                      />
                                      <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                      />
                                    </svg>
                                    Submitting...
                                  </>
                                ) : (
                                  "Submit Comment"
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </Tab.Panel>

                      <Tab.Panel className="space-y-6">
                        <div className="space-y-4">
                          {task?.attachments?.map((attachment, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between bg-gray-50 rounded-lg p-4"
                            >
                              <div className="flex items-center space-x-3">
                                {attachment.type === "link" ? (
                                  <LinkIcon className="h-5 w-5 text-gray-400" />
                                ) : (
                                  <PaperClipIcon className="h-5 w-5 text-gray-400" />
                                )}
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {attachment.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Added by {attachment.uploadedBy?.firstName}{" "}
                                    {attachment.uploadedBy?.lastName}
                                  </p>
                                </div>
                              </div>
                              <a
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary-600 hover:text-primary-500"
                              >
                                View
                              </a>
                            </div>
                          ))}
                          
                          {(!task?.attachments || task.attachments.length === 0) && (
                            <div className="text-center py-6 text-gray-500">
                              No attachments yet
                            </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">
                              Upload File
                            </h4>
                            <div className="mt-2 space-y-2">
                              <input
                                type="text"
                                placeholder="Attachment name (optional)"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                value={attachmentName}
                                onChange={(e) =>
                                  setAttachmentName(e.target.value)
                                }
                              />
                              <input
                                type="file"
                                onChange={handleFileUpload}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100"
                              />
                              <button
                                type="button"
                                onClick={() => handleAttachmentSubmit("file")}
                                disabled={isSubmitting || !selectedFile}
                                className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 disabled:opacity-50"
                              >
                                {isSubmitting ? "Uploading..." : "Upload File"}
                              </button>
                            </div>
                          </div>

                          <div className="border-t border-gray-200 pt-4">
                            <h4 className="text-sm font-medium text-gray-900">
                              Add Link
                            </h4>
                            <div className="mt-2 space-y-2">
                              <input
                                type="text"
                                placeholder="Attachment name"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                value={attachmentName}
                                onChange={(e) =>
                                  setAttachmentName(e.target.value)
                                }
                              />
                              <input
                                type="url"
                                placeholder="https://example.com"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                value={attachmentUrl}
                                onChange={(e) =>
                                  setAttachmentUrl(e.target.value)
                                }
                              />
                              <button
                                type="button"
                                onClick={() => handleAttachmentSubmit("link")}
                                disabled={isSubmitting || !attachmentUrl}
                                className="inline-flex items-center rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 disabled:opacity-50"
                              >
                                {isSubmitting ? "Adding..." : "Add Link"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </Tab.Panel>
                    </Tab.Panels>
                  </Tab.Group>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default TaskDetailModal;