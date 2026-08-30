import { useState } from "react";
import { Alert, Button, Input, Modal, Select, Space, Table, Tag } from "antd";
import { FiSearch } from "react-icons/fi";
import {
  useAwardFreeBets,
  useFreeBetCampaigns,
  useFreeBetUsers,
} from "../hooks/useFreeBets";

const formatDate = (value) => value
  ? new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(new Date(value))
  : "—";

export default function FreeBetAwardPlayers() {
  const [campaignId, setCampaignId] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({ page: 1, limit: 20, search: "", status: "active" });
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const campaignsQuery = useFreeBetCampaigns({ page: 1, perPage: 100, status: 1 });
  const usersQuery = useFreeBetUsers(filters, Boolean(campaignId));
  const awardMutation = useAwardFreeBets();
  const campaigns = campaignsQuery.data?.campaigns || [];
  const campaign = campaigns.find((item) => item.campaign_id === campaignId);

  const applySearch = () => setFilters((current) => ({ ...current, search: searchInput.trim(), page: 1 }));

  const confirmAward = () => {
    if (!campaign || !selectedUserIds.length) return;
    Modal.confirm({
      title: `Award ${selectedUserIds.length} selected player${selectedUserIds.length === 1 ? "" : "s"}?`,
      content: (
        <div className="space-y-1 text-sm text-slate-600">
          <p><strong>Campaign:</strong> {campaign.name}</p>
          <p><strong>Value:</strong> {campaign.currency} {Number(campaign.amount).toLocaleString()}</p>
          <p><strong>Free bets per player:</strong> {campaign.count_per_player}</p>
          <p>Players with an existing active unused award will be rejected.</p>
        </div>
      ),
      okText: "Award free bets",
      onOk: async () => {
        await awardMutation.mutateAsync({ campaignId, userIds: selectedUserIds });
        setSelectedUserIds([]);
        usersQuery.refetch();
      },
    });
  };

  const columns = [
    {
      title: "Player",
      key: "player",
      render: (_, user) => (
        <div>
          <p className="font-medium text-slate-800">{user.name || "Unnamed player"}</p>
          <p className="text-xs text-slate-500">{user._id}</p>
        </div>
      ),
    },
    { title: "Phone", dataIndex: "phone", key: "phone" },
    { title: "Email", dataIndex: "email", key: "email", render: (value) => value || "—" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag color={status === "active" ? "green" : "red"}>{status}</Tag>,
    },
    {
      title: "Balance",
      dataIndex: "balance",
      key: "balance",
      render: (value) => `KES ${Number(value || 0).toLocaleString()}`,
    },
    { title: "Joined", dataIndex: "createdAt", key: "createdAt", render: formatDate },
  ];

  return (
    <div>
      <Alert
        className="mb-4"
        type="info"
        showIcon
        message="Select an active campaign first, then select up to 100 active players across table pages."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
        <Select
          className="w-full lg:col-span-2"
          showSearch
          optionFilterProp="label"
          loading={campaignsQuery.isLoading}
          placeholder="Select an active campaign"
          value={campaignId || undefined}
          onChange={(value) => {
            setCampaignId(value);
            setSelectedUserIds([]);
          }}
          options={campaigns.map((item) => ({
            value: item.campaign_id,
            label: `${item.name} — ${item.currency} ${item.amount}`,
          }))}
        />
        <Select
          className="w-full"
          value={filters.status}
          onChange={(status) => setFilters((current) => ({ ...current, status, page: 1 }))}
          options={[
            { value: "active", label: "Active players" },
            { value: "suspended", label: "Suspended players" },
          ]}
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-between mb-4">
        <Space.Compact className="w-full sm:max-w-lg">
          <Input
            allowClear
            value={searchInput}
            placeholder="Search name, phone, email, or user ID"
            onChange={(event) => setSearchInput(event.target.value)}
            onPressEnter={applySearch}
          />
          <Button icon={<FiSearch />} onClick={applySearch}>Search</Button>
        </Space.Compact>
        <Button
          type="primary"
          disabled={!campaignId || !selectedUserIds.length}
          loading={awardMutation.isPending}
          onClick={confirmAward}
        >
          Award {selectedUserIds.length || "selected"} player{selectedUserIds.length === 1 ? "" : "s"}
        </Button>
      </div>
      {selectedUserIds.length > 0 && (
        <p className="mb-3 text-sm text-slate-600">{selectedUserIds.length} of 100 players selected</p>
      )}
      {!campaignId ? (
        <div className="rounded-xl border border-dashed border-slate-300 py-14 text-center text-slate-500">
          Select a campaign to load eligible players.
        </div>
      ) : (
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={usersQuery.data?.users || []}
          loading={usersQuery.isLoading || usersQuery.isFetching}
          scroll={{ x: 900 }}
          rowSelection={{
            preserveSelectedRowKeys: true,
            selectedRowKeys: selectedUserIds,
            onChange: (keys) => setSelectedUserIds(keys.slice(0, 100)),
            getCheckboxProps: (user) => ({ disabled: user.status !== "active" }),
          }}
          pagination={{
            current: usersQuery.data?.page || filters.page,
            pageSize: usersQuery.data?.limit || filters.limit,
            total: usersQuery.data?.total || 0,
            showSizeChanger: true,
            onChange: (page, limit) => setFilters((current) => ({ ...current, page, limit })),
          }}
        />
      )}
    </div>
  );
}
