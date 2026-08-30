// components/Modals/bets/BetsExportModal.jsx
import { useState } from "react";
import { Modal, Button, Spin, DatePicker } from "antd";
import { useExportBets } from "../../../hooks/useExportBets";

const { RangePicker } = DatePicker;

export default function BetsExportModal({
  open = false,
  onCancel = () => {},
  filters = {},
  phone = "",
}) {
  const [dateRange, setDateRange] = useState([]);
  const exportMutation = useExportBets();

  const handleExport = () => {
    if (!dateRange || dateRange.length !== 2) {
      Modal.warning({ title: "Select a date range first." });
      return;
    }
    const start = dateRange[0].format("YYYY-MM-DD");
    const end = dateRange[1].format("YYYY-MM-DD");

    exportMutation.mutate(
      {
        start,
        end,
        type: filters.type,
        status: filters.status,
        game: filters.game,
        phone,
      },
      {
        onSuccess: () => {
          onCancel();
        },
      }
    );
  };

  return (
    <Modal
      title="Export Bets"
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
      <p>Select the date range for the bets export:</p>
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
