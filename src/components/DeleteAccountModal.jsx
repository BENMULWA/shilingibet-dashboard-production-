import { Modal, Button } from "antd";
import PropTypes from "prop-types";
import Loader from "./Loader";
import { useDeleteAccount } from "../hooks/useDeleteAccount";

DeleteModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onOk: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  userID: PropTypes.string,
};

function DeleteModal({ open, onOk, onCancel, userID }) {
  const { deleteAccountFn, isLoading } = useDeleteAccount();

  const handleDelete = () => {
    deleteAccountFn(userID, {
      onSuccess: () => {
        onOk();
      },
    });
  };

  return (
    <Modal
      className="custom-modal text-black"
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      title="Delete Account"
      footer={() => (
        <>
          <Button onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            className="bg-[red] text-white"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? <Loader /> : "Delete"}
          </Button>
        </>
      )}
    >
      <div>
        <h3 className="text-textGrey my-10 font-normal">
          Are you sure you want to delete this account permanently? This action
          cannot be undone.
        </h3>
      </div>
    </Modal>
  );
}

export default DeleteModal;
