import { Fragment, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-hot-toast";
import useHrmStore from "../../../stores/useHrmStore";
import useAuthStore from "../../../stores/auth.store";

const validationSchema = Yup.object({
  title: Yup.string().required("Title is required"),
  description: Yup.string().required("Description is required"),
  startDate: Yup.date().required("Start date is required"),
  endDate: Yup.date()
    .required("End date is required")
    .min(Yup.ref("startDate"), "End date must be after start date"),
});

const EventModal = ({ event, onClose, onSuccess }) => {
  const { createEvent, updateEvent } = useHrmStore();
  const { user } = useAuthStore();

  const formik = useFormik({
    initialValues: {
      title: event?.title || "",
      description: event?.description || "",
      startDate: event?.startDate
        ? new Date(event.startDate).toISOString().split("T")[0]
        : "",
      endDate: event?.endDate
        ? new Date(event.endDate).toISOString().split("T")[0]
        : "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        console.log("Form values:", values);

        const formData = {
          ...values,
          createdBy: user?._id,
        };

        console.log("Submitting form data:", formData);

        let response;
        try {
          if (event?._id) {
            response = await updateEvent(event._id, formData);
            console.log("Update response:", response);
          } else {
            response = await createEvent(formData);
            console.log("Create response:", response);
          }

          toast.success(`Event ${event ? "updated" : "created"} successfully`);
          if (typeof onSuccess === "function") {
            onSuccess(response);
          }
          onClose();
        } catch (error) {
          console.error("API Error:", error);
          const errorMessage =
            error.response?.data?.message ||
            error.message ||
            "Failed to save event";
          toast.error(errorMessage);
          formik.setSubmitting(false);
        }
      } catch (error) {
        console.error("Form submission error:", error);
        toast.error("Please check your form inputs");
        formik.setSubmitting(false);
      }
    },
  });

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
                  <div className="mt-3 w-full text-center sm:mt-0 sm:text-left">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold leading-6 text-gray-900"
                    >
                      {event ? "Edit Event" : "Add Event"}
                    </Dialog.Title>

                    <form
                      onSubmit={formik.handleSubmit}
                      className="mt-6 space-y-4"
                    >
                      <div className="grid grid-cols-1 gap-4">
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
                            name="title"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            {...formik.getFieldProps("title")}
                          />
                          {formik.touched.title && formik.errors.title && (
                            <p className="mt-2 text-sm text-red-600">
                              {formik.errors.title}
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
                            name="description"
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            {...formik.getFieldProps("description")}
                          />
                          {formik.touched.description &&
                            formik.errors.description && (
                              <p className="mt-2 text-sm text-red-600">
                                {formik.errors.description}
                              </p>
                            )}
                        </div>

                        <div>
                          <label
                            htmlFor="startDate"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Start Date
                          </label>
                          <input
                            type="date"
                            id="startDate"
                            name="startDate"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            {...formik.getFieldProps("startDate")}
                          />
                          {formik.touched.startDate &&
                            formik.errors.startDate && (
                              <p className="mt-2 text-sm text-red-600">
                                {formik.errors.startDate}
                              </p>
                            )}
                        </div>

                        <div>
                          <label
                            htmlFor="endDate"
                            className="block text-sm font-medium text-gray-700"
                          >
                            End Date
                          </label>
                          <input
                            type="date"
                            id="endDate"
                            name="endDate"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            {...formik.getFieldProps("endDate")}
                          />
                          {formik.touched.endDate && formik.errors.endDate && (
                            <p className="mt-2 text-sm text-red-600">
                              {formik.errors.endDate}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={formik.isSubmitting}
                          className="inline-flex w-full justify-center rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 sm:ml-3 sm:w-auto"
                        >
                          {formik.isSubmitting
                            ? "Processing..."
                            : event
                            ? "Update"
                            : "Create"}
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

export default EventModal;
