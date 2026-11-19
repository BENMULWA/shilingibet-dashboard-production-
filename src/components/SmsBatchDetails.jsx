import { useCallback, useEffect, useState } from "react";
import { Button, Modal, Table, Tag } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import toast from "react-hot-toast";
import { getSmsBatchDetails, refreshBatchDelivery } from "../services/SmsService";

// What each delivery state means for staff.
const DELIVERY_TAGS = {
  delivered: { color: "green", label: "Delivered" },
  sent_to_network: { color: "gold", label: "Waiting on network" },
  pending: { color: "default", label: "Checking" },
  failed: { color: "red", label: "Not delivered" },
  expired: { color: "red", label: "Not delivered" },
  not_tracked: { color: "default", label: "Not tracked" },
};

const deliveryOf = (record) =>
  record.delivery_status || (record.status === "failed" ? "failed" : "not_tracked");

// Every recipient in one batch, whether the message reached the phone, and why not.
export default function SmsBatchDetails({ batchId, open, onClose, onChanged }) {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    if (!batchId) return;
    setLoading(true);
    try {
      setData((await getSmsBatchDetails(batchId)).data);
    } catch (error) {
      toast.error(error.message || "Could not load the batch");
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const result = await refreshBatchDelivery(batchId);
      toast.success(
        result.data.checked
          ? `Checked ${result.data.checked} message(s) with the network`
          : "Nothing waiting: every message already has a final delivery status"
      );
      await load();
      onChanged?.();
    } catch (error) {
      toast.error(error.message || "Could not check delivery");
    } finally {
      setRefreshing(false);
    }
  };

  const records = data?.records || [];
  const counts = records.reduce((acc, r) => {
    const s = deliveryOf(r);
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  return (
    <Modal
      title="Batch delivery"
      open={open}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="refresh" icon={<ReloadOutlined />} loading={refreshing} onClick={refresh}>
          Check delivery now
        </Button>,
        <Button key="close" type="primary" onClick={onClose}>Close</Button>,
      ]}
    >
      {data?.batch && (
        <p className="mb-3 text-sm text-slate-600">
          {new Date(data.batch.created_at).toLocaleString()} · {data.batch.sender_id} ·{" "}
          <b className="text-emerald-700">{counts.delivered || 0} delivered</b> ·{" "}
          <span className="text-amber-600">{(counts.sent_to_network || 0) + (counts.pending || 0)} waiting</span> ·{" "}
          <span className="text-red-600">{(counts.failed || 0) + (counts.expired || 0)} not delivered</span>
          {counts.not_tracked ? ` · ${counts.not_tracked} not tracked` : ""}
        </p>
      )}
      <Table
        rowKey="id"
        size="small"
        loading={loading}
        dataSource={records}
        pagination={{ pageSize: 20, hideOnSinglePage: true }}
        scroll={{ x: 760 }}
        columns={[
          { title: "Recipient", dataIndex: "recipient" },
          {
            title: "Delivery",
            render: (_, r) => {
              const tag = DELIVERY_TAGS[deliveryOf(r)];
              return <Tag color={tag.color}>{tag.label}</Tag>;
            },
            filters: Object.entries(DELIVERY_TAGS).map(([value, t]) => ({ text: t.label, value })),
            onFilter: (value, r) => deliveryOf(r) === value,
          },
          {
            title: "Reason / detail",
            render: (_, r) =>
              r.delivery_description ||
              (deliveryOf(r) === "not_tracked" ? "Accepted by the provider; this provider has no delivery reports" : "—"),
          },
          { title: "Delivered at", dataIndex: "delivered_at", render: (v) => (v ? new Date(v).toLocaleString() : "—") },
          { title: "Message ID", dataIndex: "provider_message_id", render: (v) => v || "—" },
        ]}
      />
    </Modal>
  );
}
