import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon, ArrowDownTrayIcon, TrashIcon } from "@heroicons/react/24/outline";
import useHrmStore from "../../../stores/useHrmStore";
import { toast } from "react-hot-toast";

const ViewDocumentsModal = ({ isOpen, onClose, documents = [], employeeId }) => {
  const store = useHrmStore();

  const handleDownload = async (doc) => {
    try {
      if (!employeeId) {
        console.error('No employee ID provided');
        toast.error('Cannot download document: Missing employee information');
        return;
      }

      if (!doc._id) {
        console.error('No document ID available');
        toast.error('Cannot download document: Missing document information');
        return;
      }

      console.log('Downloading document:', {
        employeeId,
        documentId: doc._id,
        fileName: doc.title,
        url: doc.url
      });

      await store.downloadDocument(doc.url, doc.title, employeeId, doc._id);
      toast.success('Document downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document. Please try again.');
    }
  };

  const handleDelete = async (doc) => {
    try {
      if (!employeeId || !doc._id) {
        toast.error('Cannot delete document: Missing information');
        return;
      }

      // Show confirmation dialog
      if (!window.confirm('Are you sure you want to delete this document?')) {
        return;
      }

      await store.deleteDocument(employeeId, doc._id);
      
      // Close modal with updated documents
      if (typeof onClose === 'function') {
        const updatedDocs = documents.filter(d => d._id !== doc._id);
        onClose(updatedDocs);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document. Please try again.');
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
                  <div className="mt-3 w-full text-center sm:mt-0 sm:text-left">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold leading-6 text-gray-900 mb-4"
                    >
                      Employee Documents
                    </Dialog.Title>

                    <div className="mt-2">
                      {documents.length === 0 ? (
                        <p className="text-gray-500">No documents available</p>
                      ) : (
                        <div className="space-y-4">
                          {documents.map((doc, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                            >
                              <div className="flex-grow">
                                <h4 className="font-medium text-gray-900">
                                  {doc.type.charAt(0).toUpperCase() + doc.type.slice(1).replace('_', ' ')}
                                </h4>
                                <p className="text-sm text-gray-500">{doc.title}</p>
                                <p className="text-xs text-gray-400">
                                  Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleDownload(doc)}
                                  className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
                                  title="Download Document"
                                >
                                  <ArrowDownTrayIcon className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(doc)}
                                  className="p-2 text-red-600 hover:text-red-900 rounded-full hover:bg-red-50"
                                  title="Delete Document"
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={() => onClose()}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default ViewDocumentsModal; 