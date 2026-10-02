import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Form, Input, Modal, Select, Table, Tag, message } from "antd";
import { FiKey, FiPlus, FiRefreshCw } from "react-icons/fi";
import { createStaff, listStaff, sendStaffPasswordReset, updateStaff } from "../services/staffService";
import { readStoredUser } from "../utils/authSession";

const KENYAN_PHONE_PATTERN = /^(?:\+?254|0)?[71]\d{8}$/;

const roleLabels = {
  support: "Support",
  admin: "Admin",
  super_admin: "Super Admin",
};

function StaffManagement() {
  const currentUser = readStoredUser();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const query = useQuery({
    queryKey: ["staff", page, pageSize],
    queryFn: () => listStaff(page, pageSize),
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["staff"] });
  const updateMutation = useMutation({ mutationFn: ({ id, changes }) => updateStaff(id, changes) });
  const resetMutation = useMutation({ mutationFn: sendStaffPasswordReset });
  const createMutation = useMutation({ mutationFn: createStaff });

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm] = Form.useForm();

  const openAddModal = () => setAddModalOpen(true);
  const closeAddModal = () => {
    setAddModalOpen(false);
    addForm.resetFields();
  };

  const handleCreateStaff = async () => {
    try {
      const values = await addForm.validateFields();
      const response = await createMutation.mutateAsync(values);
      message.success(response.message || "Staff account created");
      closeAddModal();
      refresh();
    } catch (error) {
      if (error?.errorFields) return; // antd form validation error, already shown inline
      message.error(error.message || "Unable to create staff account");
    }
  };

  const confirmUpdate = (staff, changes, title) => {
    Modal.confirm({
      title,
      content: `This action affects ${staff.phone}.`,
      okButtonProps: { danger: changes.status === "suspended" },
      onOk: async () => {
        try {
          const response = await updateMutation.mutateAsync({ id: staff._id, changes });
          message.success(response.message || "Staff account updated");
          refresh();
        } catch (error) {
          message.error(error.message || "Unable to update staff account");
          throw error;
        }
      },
    });
  };

  const confirmReset = (staff) => {
    Modal.confirm({
      title: "Send password reset link and code?",
      content: `A reset-page link and new one-time code will be sent by SMS to ${staff.phone}.`,
      okText: "Send reset SMS",
      onOk: async () => {
        try {
          const response = await resetMutation.mutateAsync(staff._id);
          message.success(response.message || "Reset code sent");
        } catch (error) {
          message.error(error.message || "Unable to send reset SMS");
          throw error;
        }
      },
    });
  };

  const columns = [
    { title: "Name", dataIndex: "name", render: (value) => value || "—" },
    { title: "Phone", dataIndex: "phone" },
    {
      title: "Role",
      dataIndex: "adminLevel",
      render: (role, staff) => (
        <Select
          value={role}
          className="min-w-36"
          disabled={staff._id === currentUser?._id}
          options={Object.entries(roleLabels).map(([value, label]) => ({ value, label }))}
          onChange={(adminLevel) => confirmUpdate(staff, { adminLevel }, `Change role to ${roleLabels[adminLevel]}?`)}
        />
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => <Tag color={status === "active" ? "success" : "error"}>{status}</Tag>,
    },
    {
      title: "Actions",
      render: (_, staff) => {
        const ownAccount = staff._id === currentUser?._id;
        return (
          <div className="flex flex-wrap gap-2">
            <Button
              icon={<FiKey />}
              disabled={ownAccount}
              title={ownAccount ? "You cannot reset your own account here" : "Send password reset SMS"}
              loading={resetMutation.isPending}
              onClick={() => confirmReset(staff)}
            >
              Send reset SMS
            </Button>
            <Button
              danger={staff.status === "active"}
              disabled={ownAccount}
              title={ownAccount ? "You cannot suspend your own account" : undefined}
              loading={updateMutation.isPending}
              onClick={() => confirmUpdate(
                staff,
                { status: staff.status === "active" ? "suspended" : "active" },
                staff.status === "active" ? "Suspend this staff account?" : "Activate this staff account?",
              )}
            >
              {staff.status === "active" ? "Suspend" : "Activate"}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <Alert
        type="info"
        showIcon
        message="Super-admin staff controls"
        description="Password reset codes are sent directly to the staff member. Passwords are never displayed to administrators."
      />
      <div className="rounded-xl bg-white dark:bg-slate-800 p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Staff Management</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage access, roles, and password recovery.</p>
          </div>
          <div className="flex gap-2">
            <Button type="primary" icon={<FiPlus />} onClick={openAddModal}>Add Staff</Button>
            <Button icon={<FiRefreshCw />} onClick={() => query.refetch()}>Refresh</Button>
          </div>
        </div>
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={query.data?.data || []}
          loading={query.isLoading || query.isFetching}
          pagination={{
            current: query.data?.meta?.page || page,
            pageSize: query.data?.meta?.limit || pageSize,
            total: query.data?.meta?.total || 0,
            showSizeChanger: true,
          }}
          onChange={(pagination) => {
            setPage(pagination.current);
            setPageSize(pagination.pageSize);
          }}
          scroll={{ x: "max-content" }}
        />
      </div>

      <Modal
        title="Add staff account"
        open={addModalOpen}
        onCancel={closeAddModal}
        onOk={handleCreateStaff}
        okText="Create account"
        confirmLoading={createMutation.isPending}
        destroyOnClose
      >
        <Form form={addForm} layout="vertical" requiredMark={false} className="mt-4">
          <Form.Item
            name="name"
            label="Name"
            rules={[{ min: 2, max: 80, message: "Name must be 2-80 characters" }]}
          >
            <Input placeholder="Optional" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Phone number"
            rules={[
              { required: true, message: "Phone number is required" },
              { pattern: KENYAN_PHONE_PATTERN, message: "Enter a valid Kenyan phone number" },
            ]}
          >
            <Input placeholder="0712345678" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: "email", message: "Enter a valid email address" }]}
          >
            <Input placeholder="Optional" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Temporary password"
            rules={[
              { required: true, message: "Password is required" },
              { min: 8, message: "Password must be at least 8 characters" },
            ]}
          >
            <Input.Password placeholder="At least 8 characters" />
          </Form.Item>
          <Form.Item
            name="adminLevel"
            label="Role"
            initialValue="support"
            rules={[{ required: true, message: "Select a role" }]}
          >
            <Select
              options={Object.entries(roleLabels).map(([value, label]) => ({ value, label }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default StaffManagement;
