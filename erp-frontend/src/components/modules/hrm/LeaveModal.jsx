import { Fragment, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-hot-toast";
import useHrmStore from "@/stores/useHrmStore";

const validationSchema = Yup.object({
  leaveType: Yup.string().required("Leave type is required"),
  startDate: Yup.date().required("Start date is required"),
  endDate: Yup.date()
    .min(Yup.ref("startDate"), "End date must be after start date")
    .required("End date is required"),
  reason: Yup.string().required("Reason is required"),
  attachment: Yup.mixed(),
  status: Yup.string().required("Status is required"),
  reviewNotes: Yup.string().when("status", {
    is: (status) => status === "Approved" || status === "Rejected",
    then: () =>
      Yup.string().required(
        "Review notes are required when approving or rejecting"
      ),
    otherwise: () => Yup.string(),
  }),
});

const LeaveModal = ({ leave, onClose, onSuccess }) => {
  const { createLeave, updateLeave, reviewLeave } = useHrmStore();
  const formik = useFormik({
    initialValues: {
      leaveType: leave?.leaveType || "",
      startDate: leave?.startDate
        ? new Date(leave.startDate).toISOString().split("T")[0]
        : "",
      endDate: leave?.endDate
        ? new Date(leave.endDate).toISOString().split("T")[0]
        : "",
      reason: leave?.reason || "",
      status: leave?.status || "Pending",
      duration: leave?.duration || 0,
      reviewNotes: leave?.reviewNotes || "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const formData = new FormData();
        Object.keys(values).forEach((key) => {
          if (values[key] !== null) {
            formData.append(key, values[key]);
          }
        });

        // Calculate duration in days
        const start = new Date(values.startDate);
        const end = new Date(values.endDate);
        const durationInDays =
          Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        formData.append("duration", durationInDays);

        if (leave) {
          // If status is being changed to Approved or Rejected, use reviewLeave
          if (
            values.status !== leave.status &&
            (values.status === "Approved" || values.status === "Rejected")
          ) {
            await reviewLeave(leave._id, {
              status: values.status,
              reviewNotes: values.reviewNotes,
            });
            toast.success(
              `Leave request ${values.status.toLowerCase()} successfully`
            );
          } else {
            // For other updates, use updateLeave
            await updateLeave(leave._id, formData);
            toast.success("Leave request updated successfully");
          }
        } else {
          await createLeave(formData);
          toast.success("Leave request submitted successfully");
        }
        onSuccess();
      } catch (error) {
        toast.error(error.response?.data?.message || "Something went wrong");
      }
    },
  });

  // Update duration when dates change
  useEffect(() => {
    if (formik.values.startDate && formik.values.endDate) {
      const start = new Date(formik.values.startDate);
      const end = new Date(formik.values.endDate);
      const durationInDays =
        Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      formik.setFieldValue("duration", durationInDays);
    }
  }, [formik.values.startDate, formik.values.endDate]);

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
                      {leave ? "Edit Leave Request" : "Submit Leave Request"}
                    </Dialog.Title>

                    <form
                      onSubmit={formik.handleSubmit}
                      className="mt-6 space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="leaveType" className="label">
                            Leave Type
                          </label>
                          <select
                            id="leaveType"
                            className="input"
                            {...formik.getFieldProps("leaveType")}
                          >
                            <option value="">Select Type</option>
                            <option value="Annual">Annual Leave</option>
                            <option value="Sick">Sick Leave</option>
                            <option value="Halfday">Half-Day Leave</option>
                            <option value="Emergency">Emergency Leave</option>
                            <option value="Personal">Personal Leave</option>
                            <option value="Maternity">Maternity Leave</option>
                            <option value="Paternity">Paternity Leave</option>
                            <option value="Unpaid">Unpaid Leave</option>
                          </select>
                          {formik.touched.leaveType &&
                            formik.errors.leaveType && (
                              <div className="error-message">
                                {formik.errors.leaveType}
                              </div>
                            )}
                        </div>

                        <div>
                          <label htmlFor="status" className="label">
                            Status
                          </label>
                          <select
                            id="status"
                            className="input"
                            {...formik.getFieldProps("status")}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                          {formik.touched.status && formik.errors.status && (
                            <div className="error-message">
                              {formik.errors.status}
                            </div>
                          )}
                        </div>

                        <div>
                          <label htmlFor="startDate" className="label">
                            Start Date
                          </label>
                          <input
                            type="date"
                            id="startDate"
                            className="input"
                            {...formik.getFieldProps("startDate")}
                          />
                          {formik.touched.startDate &&
                            formik.errors.startDate && (
                              <div className="error-message">
                                {formik.errors.startDate}
                              </div>
                            )}
                        </div>

                        <div>
                          <label htmlFor="endDate" className="label">
                            End Date
                          </label>
                          <input
                            type="date"
                            id="endDate"
                            className="input"
                            {...formik.getFieldProps("endDate")}
                          />
                          {formik.touched.endDate && formik.errors.endDate && (
                            <div className="error-message">
                              {formik.errors.endDate}
                            </div>
                          )}
                        </div>

                        <div>
                          <label htmlFor="duration" className="label">
                            Duration (Days)
                          </label>
                          <input
                            type="number"
                            id="duration"
                            className="input"
                            value={formik.values.duration}
                            disabled
                          />
                        </div>

                        <div className="col-span-2">
                          <label htmlFor="reason" className="label">
                            Reason
                          </label>
                          <textarea
                            id="reason"
                            rows={3}
                            className="input"
                            {...formik.getFieldProps("reason")}
                          />
                          {formik.touched.reason && formik.errors.reason && (
                            <div className="error-message">
                              {formik.errors.reason}
                            </div>
                          )}
                        </div>

                        {(formik.values.status === "Approved" ||
                          formik.values.status === "Rejected") && (
                          <div className="col-span-2">
                            <label htmlFor="reviewNotes" className="label">
                              Review Notes
                            </label>
                            <textarea
                              id="reviewNotes"
                              rows={3}
                              className="input"
                              {...formik.getFieldProps("reviewNotes")}
                              placeholder={`Enter your ${formik.values.status.toLowerCase()} notes...`}
                            />
                            {formik.touched.reviewNotes &&
                              formik.errors.reviewNotes && (
                                <div className="error-message">
                                  {formik.errors.reviewNotes}
                                </div>
                              )}
                          </div>
                        )}

                        <div className="col-span-2">
                          <label htmlFor="attachment" className="label">
                            Attachment (if any)
                          </label>
                          <input
                            type="file"
                            id="attachment"
                            className="input"
                            onChange={(event) => {
                              formik.setFieldValue(
                                "attachment",
                                event.currentTarget.files[0]
                              );
                            }}
                          />
                          {formik.touched.attachment &&
                            formik.errors.attachment && (
                              <div className="error-message">
                                {formik.errors.attachment}
                              </div>
                            )}
                        </div>
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          className="btn btn-primary w-full sm:ml-3 sm:w-auto"
                          disabled={formik.isSubmitting}
                        >
                          {formik.isSubmitting ? (
                            <div className="spinner border-2 h-5 w-5" />
                          ) : leave ? (
                            "Update"
                          ) : (
                            "Submit"
                          )}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline mt-3 w-full sm:mt-0 sm:w-auto"
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

export default LeaveModal;
