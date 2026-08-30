
import { Modal, Button, Select, DatePicker } from "antd";

const { Option } = Select;
const { RangePicker } = DatePicker;

export default function UsersFilterModal({
  open,
  onOk,
  onCancel,
  onReset,
  filters,
  onAccountStatusChange,
  onDateChange,
}) {
  return (
    <Modal
      title="Filter Users"
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      footer={[
        <Button key="reset" onClick={onReset}>
          Reset Filters
        </Button>,
        <Button key="back" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={onOk}>
          Apply Filters
        </Button>,
      ]}
    >
      <div className="space-y-4">
        {/* Account Status */}
        <div>
          <h4 className="font-medium">Account Status</h4>
          <Select
            placeholder="Select account status"
            style={{ width: "100%" }}
            onChange={onAccountStatusChange}
            value={filters.accountStatus}
            allowClear
          >
            <Option value="active">Active</Option>
            <Option value="blocked">Blocked</Option>
            <Option value="inactive">Inactive</Option>
          </Select>
        </div>

        {/* Date Range */}
        <div>
          <h4 className="font-medium">Date Range</h4>
          <RangePicker
            style={{ width: "100%" }}
            onChange={onDateChange}
            value={filters.dateRange}
          />
        </div>
      </div>
    </Modal>
  );
}
