function DeletionModal({ cancelDelete, confirmDelete, id, phone }) {
  return (
    <div className="fixed inset-0  flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Confirm Deletion
        </h3>
        <p className="mb-6 text-gray-600">
          Are you sure you want to delete user {id} ({phone})? This action
          cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={cancelDelete}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            className="px-4 py-2 bg-red-600 text-[red] rounded-md hover:bg-red-700 transition-colors"
          >
            Delete User
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeletionModal;
