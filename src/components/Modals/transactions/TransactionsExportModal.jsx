import { useState } from "react";
import { Modal, Button, Spin, DatePicker } from "antd";
import { useExportTransactions } from "../../../hooks/useExportTransactions";

const { RangePicker } = DatePicker;

function TransactionsExportModal({ open, onCancel }) {
  const [dateRange, setDateRange] = useState([]);
  const exportMutation = useExportTransactions();

  const handleExport = () => {
    if (!dateRange || dateRange.length !== 2) {
      return Modal.warning({ title: "Select a date range first." });
    }
    const start = dateRange[0].format("YYYY-MM-DD");
    const end = dateRange[1].format("YYYY-MM-DD");

    exportMutation.mutate(
      { start, end },
      {
        onSuccess: () => {
          onCancel();
        },
      }
    );
  };

  return (
    <Modal
      title="Export Transactions"
      open={open}
      onCancel={onCancel}
      footer={[
        <Button
          key="cancel"
          onClick={onCancel}
          disabled={exportMutation.isPending}
        >
          Cancel
        </Button>,
        <Button
          key="export"
          type="primary"
          loading={exportMutation.isPending}
          onClick={handleExport}
          disabled={
            !dateRange || dateRange.length !== 2 || exportMutation.isPending
          }
        >
          Export
        </Button>,
      ]}
    >
      <p>Select the date range for the transactions export:</p>
      <RangePicker
        style={{ width: "100%" }}
        onChange={(dates) => setDateRange(dates)}
        disabled={exportMutation.isPending}
      />
      {exportMutation.isPending && (
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Spin tip="Generating export..." />
        </div>
      )}
    </Modal>
  );
}

export default TransactionsExportModal;
