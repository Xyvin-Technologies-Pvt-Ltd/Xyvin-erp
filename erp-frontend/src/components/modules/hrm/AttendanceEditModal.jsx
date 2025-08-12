import { Fragment, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import useHrmStore from "../../../stores/useHrmStore";

const AttendanceEditModal = ({ attendance, onClose, onSuccess }) => {
  const { updateAttendance } = useHrmStore();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      date: attendance?.date
        ? new Date(attendance.date).toISOString().split("T")[0]
        : "",
      checkIn: attendance?.checkIn?.time
        ? new Date(attendance.checkIn.time).toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
      checkOut: attendance?.checkOut?.time
        ? new Date(attendance.checkOut.time).toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
      status: attendance?.status || "Present",
      notes: attendance?.notes || "",
      shift: attendance?.shift || "Morning",
    },
  });

  const checkInTime = watch("checkIn");
  const checkOutTime = watch("checkOut");
  const date = watch("date");

  useEffect(() => {
    if (checkInTime && checkOutTime && date) {
      const parseTime = (time) => {
        const [hours, minutes] = time.split(":");
        const dateObj = new Date(date);
        dateObj.setHours(parseInt(hours), parseInt(minutes), 0);
        return dateObj;
      };

      const checkIn = parseTime(checkInTime);
      const checkOut = parseTime(checkOutTime);
      const workHours = Math.max(
        0,
        Math.round(((checkOut - checkIn) / (1000 * 60 * 60)) * 100) / 100
      );

      let status = "Absent";
      const startTime = new Date(checkIn).setHours(10, 0, 0, 0);

      if (checkIn > startTime) status = "Late";
      else if (workHours >= 8) status = "Present";
      else if (workHours >= 4) status = "Half-Day";
      else if (workHours > 0) status = "Early-Leave";

      setValue("status", status);
    }
  }, [checkInTime, checkOutTime, date, setValue]);

  useEffect(() => {
    if (attendance) {
      reset({
        date: attendance.date
          ? new Date(attendance.date).toISOString().split("T")[0]
          : "",
        checkIn: attendance.checkIn?.time
          ? new Date(attendance.checkIn.time).toLocaleTimeString("en-US", {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
        checkOut: attendance.checkOut?.time
          ? new Date(attendance.checkOut.time).toLocaleTimeString("en-US", {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
        status: attendance.status || "Present",
        notes: attendance.notes || "",
        shift: attendance.shift || "Morning",
      });
    }
  }, [attendance, reset]);

  const onSubmit = async (data) => {
    try {
      const parseDateTime = (time) => {
        if (!time) return null;
        const [hours, minutes] = time.split(":");
        const dateObj = new Date(data.date);
        dateObj.setHours(parseInt(hours), parseInt(minutes), 0);
        return dateObj;
      };

      const checkInDateTime = parseDateTime(data.checkIn);
      const checkOutDateTime = parseDateTime(data.checkOut);
      const workHours =
        checkInDateTime && checkOutDateTime
          ? Math.max(
              0,
              Math.round(
                ((checkOutDateTime - checkInDateTime) / (1000 * 60 * 60)) * 100
              ) / 100
            )
          : 0;

      await updateAttendance(attendance._id, {
        date: data.date,
        checkIn: checkInDateTime
          ? { time: checkInDateTime, device: "Web" }
          : undefined,
        checkOut: checkOutDateTime
          ? { time: checkOutDateTime, device: "Web" }
          : undefined,
        status: data.status,
        notes: data.notes,
        shift: data.shift,
        workHours,
      });

      toast.success("Attendance updated successfully");
      onSuccess();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update attendance"
      );
    }
  };

  const InputField = ({ label, type, id, validation = {}, options }) => (
    <div className="mb-4">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
      </label>
      {type === "select" ? (
        <select
          id={id}
          {...register(id, validation)}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          id={id}
          rows={3}
          {...register(id, validation)}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      ) : (
        <input
          type={type}
          id={id}
          {...register(id, validation)}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      )}
      {errors[id] && (
        <p className="mt-1 text-sm text-red-600">{errors[id].message}</p>
      )}
    </div>
  );

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
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-lg transform rounded-lg bg-white p-6 shadow-xl transition-all">
                <div className="absolute right-4 top-4">
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="mb-6">
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    Edit Attendance
                  </Dialog.Title>
                  {attendance?.employee && (
                    <div className="mt-2 rounded-lg bg-gray-50 p-3">
                      <p className="text-sm font-medium text-gray-900">
                        {attendance.employee.firstName}{" "}
                        {attendance.employee.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {attendance.employee.department?.name} •{" "}
                        {attendance.employee.position?.title}
                      </p>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <InputField
                    label="Date"
                    type="date"
                    id="date"
                    validation={{ required: "Date is required" }}
                  />
                  <InputField label="Check In Time" type="time" id="checkIn" />
                  <InputField
                    label="Check Out Time"
                    type="time"
                    id="checkOut"
                  />
                  <InputField
                    label="Status"
                    type="select"
                    id="status"
                    validation={{ required: "Status is required" }}
                    options={[
                      "Present",
                      "Absent",
                      "Half-Day",
                      "Late",
                      "Early-Leave",
                    ]}
                  />
                  <InputField
                    label="Shift"
                    type="select"
                    id="shift"
                    validation={{ required: "Shift is required" }}
                    options={["Morning", "Evening", "Night"]}
                  />
                  <InputField label="Notes" type="textarea" id="notes" />

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500"
                    >
                      Update
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default AttendanceEditModal;
