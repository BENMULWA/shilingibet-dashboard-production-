import { useState } from "react";
import { Alert, Button, Input, Modal, Select, Space, Table, Tag } from "antd";
import { FiRefreshCw } from "react-icons/fi";
import {
  useFreeBetAwards,
  useFreeBetCampaigns,
  useFreeBetUsers,
  useRevokeFreeBet,
} from "../hooks/useFreeBets";

const STATUS = {
  1: { label: "Active / unused", color: "green" },
  2: { label: "Used", color: "blue" },
  3: { label: "Revoked", color: "default" },
  4: { label: "Expired", color: "orange" },
  5: { label: "Pending", color: "gold" },
  6: { label: "Failed", color: "red" },
  7: { label: "Revocation pending", color: "purple" },
};

const formatDate = (value) => value
  ? new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
  : "—";

export default function FreeBetAwardHistory() {
  const [filters, setFilters] = useState({ page: 1, perPage: 20, campaignId: "", playerId: "", status: "" });
  const [playerSearch, setPlayerSearch] = useState("");
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revokeReason, setRevokeReason] = useState("");
  const campaignsQuery = useFreeBetCampaigns({ page: 1, perPage: 100 });
  const playersQuery = useFreeBetUsers(
    { page: 1, limit: 20, search: playerSearch || undefined },
    playerSearch.length >= 2,
  );
  const awardsQuery = useFreeBetAwards(filters);
  const revokeMutation = useRevokeFreeBet();

  const submitRevocation = async () => {
    await revokeMutation.mutateAsync({ freeBetId: revokeTarget.freebet_id, reason: revokeReason.trim() });
    setRevokeTarget(null);
    setRevokeReason("");
  };

  const columns = [
    {
      title: "Player",
      key: "player",
      render: (_, award) => (
        <div>
          <p className="font-medium text-slate-800">{award.player?.name || award.player?.phone || "Unknown player"}</p>
          <p className="text-xs text-slate-500">{award.player_id}</p>
        </div>
      ),
    },
    {
      title: "Free-bet ID",
      dataIndex: "freebet_id",
      key: "freebet_id",
      render: (value) => <span className="text-xs text-slate-600">{value}</span>,
    },
    { title: "Value", key: "value", render: (_, award) => `${award.currency} ${Number(award.amount).toLocaleString()}` },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value) => {
        const status = STATUS[Number(value)] || { label: `Unknown (${value})`, color: "default" };
        return <Tag color={status.color}>{status.label}</Tag>;
      },
    },
    { title: "Valid from", dataIndex: "valid_from", key: "valid_from", render: formatDate },
    { title: "Expires", dataIndex: "expiry_date", key: "expiry_date", render: formatDate },
    {
      title: "Action",
      key: "action",
      fixed: "right",
      render: (_, award) => Number(award.status) === 1 ? (
        <Button danger size="small" onClick={() => setRevokeTarget(award)}>Revoke</Button>
      ) : "—",
    },
  ];

  return (
    <div>
      <Alert
        className="mb-4"
        type="info"
        showIcon
        message="Use Active / unused to find players who have not used their free bet. Only those awards can be revoked."
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="All campaigns"
          loading={campaignsQuery.isLoading}
          value={filters.campaignId || undefined}
          onChange={(campaignId) => setFilters((current) => ({ ...current, campaignId: campaignId || "", page: 1 }))}
          options={(campaignsQuery.data?.campaigns || []).map((campaign) => ({
            value: campaign.campaign_id,
            label: campaign.name,
          }))}
        />
        <Select
          allowClear
          showSearch
          filterOption={false}
          placeholder="Search and select a player"
          value={filters.playerId || undefined}
          onSearch={setPlayerSearch}
          onClear={() => setPlayerSearch("")}
          onChange={(playerId) => setFilters((current) => ({ ...current, playerId: playerId || "", page: 1 }))}
          notFoundContent={playerSearch.length < 2 ? "Type at least 2 characters" : null}
          loading={playersQuery.isFetching}
          options={(playersQuery.data?.users || []).map((user) => ({
            value: user._id,
            label: `${user.name || "Unnamed"} — ${user.phone}`,
          }))}
        />
        <Select
          allowClear
          placeholder="All statuses"
          value={filters.status || undefined}
          onChange={(status) => setFilters((current) => ({ ...current, status: status || "", page: 1 }))}
          options={Object.entries(STATUS).map(([value, status]) => ({ value: Number(value), label: status.label }))}
        />
      </div>
      <div className="flex justify-end mb-4">
        <Space>
          <Button icon={<FiRefreshCw />} loading={awardsQuery.isFetching} onClick={() => awardsQuery.refetch()}>
            Refresh
          </Button>
        </Space>
      </div>
      {awardsQuery.error && (
        <Alert className="mb-4" type="error" showIcon message="Unable to load award history" description={awardsQuery.error.message} />
      )}
      <Table
        rowKey="freebet_id"
        columns={columns}
        dataSource={awardsQuery.data?.awards || []}
        loading={awardsQuery.isLoading}
        scroll={{ x: 1100 }}
        pagination={{
          current: awardsQuery.data?.page || filters.page,
          pageSize: awardsQuery.data?.perPage || filters.perPage,
          total: awardsQuery.data?.total || 0,
          showSizeChanger: true,
          onChange: (page, perPage) => setFilters((current) => ({ ...current, page, perPage })),
        }}
      />
      <Modal
        title="Revoke active free bet"
        open={Boolean(revokeTarget)}
        okText="Revoke free bet"
        okButtonProps={{ danger: true, disabled: revokeReason.trim().length < 2 }}
        confirmLoading={revokeMutation.isPending}
        onOk={submitRevocation}
        onCancel={() => {
          setRevokeTarget(null);
          setRevokeReason("");
        }}
      >
        <p className="mb-3 text-sm text-slate-600">
          This stops the player from using this free bet. Used or expired awards cannot be revoked.
        </p>
        <Input.TextArea
          rows={3}
          maxLength={240}
          showCount
          value={revokeReason}
          placeholder="Reason for revocation"
          onChange={(event) => setRevokeReason(event.target.value)}
        />
      </Modal>
    </div>
  );
}
