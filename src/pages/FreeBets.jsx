import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
} from "antd";
import { FiPlus, FiRefreshCw } from "react-icons/fi";
import {
  useCreateFreeBetCampaign,
  useFreeBetCampaigns,
  useUpdateFreeBetCampaignStatus,
  useVirtualGames,
} from "../hooks/useFreeBets";
import FreeBetAwardPlayers from "../components/FreeBetAwardPlayers";
import FreeBetAwardHistory from "../components/FreeBetAwardHistory";

const formatDate = (value) => value
  ? new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
  : "—";

function CampaignForm({ open, onClose }) {
  const [form] = Form.useForm();
  const gamesQuery = useVirtualGames();
  const createCampaign = useCreateFreeBetCampaign();

  const submit = async (values) => {
    await createCampaign.mutateAsync({
      ...values,
      startDate: new Date(values.startDate).toISOString(),
      endDate: new Date(values.endDate).toISOString(),
    });
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Create free-bet campaign"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Create campaign"
      confirmLoading={createCampaign.isPending}
      width={760}
      destroyOnHidden
    >
      <Alert
        className="mb-5"
        type="info"
        showIcon
        message="The campaign will be created immediately on EuroVirtuals. Dates are submitted in UTC."
      />
      <Form
        form={form}
        layout="vertical"
        onFinish={submit}
        initialValues={{
          currency: "KES",
          countPerPlayer: 1,
          minimumMultiplier: 1.2,
          deductStakeOnWin: true,
          validity: 24,
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <Form.Item name="gameUuid" label="Game" rules={[{ required: true }]}>
            <Select
              showSearch
              loading={gamesQuery.isLoading}
              optionFilterProp="label"
              placeholder="Select a game"
              options={(gamesQuery.data || []).map((game) => ({
                value: game.game_uuid,
                label: game.game_name || game.title || game.game_uuid,
              }))}
            />
          </Form.Item>
          <Form.Item name="name" label="Campaign name" rules={[{ required: true, min: 2, max: 120 }]}>
            <Input placeholder="Weekend Free Bet" />
          </Form.Item>
          <Form.Item className="md:col-span-2" name="description" label="Description" rules={[{ required: true, max: 500 }]}>
            <Input.TextArea rows={3} placeholder="Describe the campaign" />
          </Form.Item>
          <Form.Item name="currency" label="Currency" rules={[{ required: true, len: 3 }]}>
            <Input maxLength={3} />
          </Form.Item>
          <Form.Item name="amount" label="Amount per free bet" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0.01} precision={2} />
          </Form.Item>
          <Form.Item name="countPerPlayer" label="Free bets per player" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={1} max={100} precision={0} />
          </Form.Item>
          <Form.Item name="minimumMultiplier" label="Minimum multiplier" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0.01} step={0.1} />
          </Form.Item>
          <Form.Item name="startDate" label="Start date and time" rules={[{ required: true }]}>
            <Input type="datetime-local" />
          </Form.Item>
          <Form.Item
            name="endDate"
            label="End date and time"
            dependencies={["startDate"]}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || !getFieldValue("startDate") || new Date(value) > new Date(getFieldValue("startDate"))) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("End date must be later than start date"));
                },
              }),
            ]}
          >
            <Input type="datetime-local" />
          </Form.Item>
          <Form.Item name="validity" label="Award validity (hours)" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={1} max={8760} precision={0} />
          </Form.Item>
          <Form.Item name="deductStakeOnWin" label="Deduct stake from winnings" valuePropName="checked">
            <Switch checkedChildren="Yes" unCheckedChildren="No" />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}

export default function FreeBets() {
  const [createOpen, setCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("campaigns");
  const [filters, setFilters] = useState({ page: 1, perPage: 20, status: "", gameUuid: "" });
  const campaignsQuery = useFreeBetCampaigns(filters);
  const gamesQuery = useVirtualGames();
  const statusMutation = useUpdateFreeBetCampaignStatus();

  const confirmStatusChange = (campaign, status) => {
    Modal.confirm({
      title: status === 1 ? "Activate this campaign?" : "Deactivate this campaign?",
      content: status === 1
        ? "Players can receive new awards while this campaign is active."
        : "No new free bets can be awarded while this campaign is inactive.",
      okText: status === 1 ? "Activate" : "Deactivate",
      okButtonProps: { danger: status === 3 },
      onOk: () => statusMutation.mutateAsync({ campaignId: campaign.campaign_id, status }),
    });
  };

  const columns = [
    { title: "Campaign", dataIndex: "name", key: "name", render: (name, row) => (
      <div><p className="font-medium text-slate-800 dark:text-slate-100">{name}</p><p className="text-xs text-slate-500 dark:text-slate-400">{row.campaign_id}</p></div>
    ) },
    { title: "Game", dataIndex: "game_uuid", key: "game_uuid", render: (id) => (
      gamesQuery.data?.find((game) => game.game_uuid === id)?.game_name || id
    ) },
    { title: "Value", key: "value", render: (_, row) => `${row.currency} ${Number(row.amount).toLocaleString()}` },
    { title: "Per player", dataIndex: "count_per_player", key: "count_per_player" },
    { title: "Period", key: "period", render: (_, row) => (
      <div className="text-xs"><p>{formatDate(row.start_date)}</p><p className="text-slate-500 dark:text-slate-400">to {formatDate(row.end_date)}</p></div>
    ) },
    { title: "Status", dataIndex: "status", key: "status", render: (status) => (
      <Tag color={Number(status) === 1 ? "green" : "default"}>{Number(status) === 1 ? "Active" : "Inactive"}</Tag>
    ) },
    { title: "Action", key: "action", render: (_, row) => (
      <Button
        size="small"
        danger={Number(row.status) === 1}
        loading={statusMutation.isPending && statusMutation.variables?.campaignId === row.campaign_id}
        onClick={() => confirmStatusChange(row, Number(row.status) === 1 ? 3 : 1)}
      >
        {Number(row.status) === 1 ? "Deactivate" : "Activate"}
      </Button>
    ) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Free Bets</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Create and manage EuroVirtuals campaigns.</p>
        </div>
        <Space>
          <Button icon={<FiRefreshCw />} onClick={() => campaignsQuery.refetch()} loading={campaignsQuery.isFetching}>
            Refresh
          </Button>
          <Button type="primary" icon={<FiPlus />} onClick={() => setCreateOpen(true)}>
            Create campaign
          </Button>
        </Space>
      </div>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: "campaigns", label: "Campaigns", children: (
              <>
                <div className="flex flex-col md:flex-row gap-3 mb-4">
                  <Select
                    className="w-full md:w-64"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    placeholder="Filter by game"
                    loading={gamesQuery.isLoading}
                    value={filters.gameUuid || undefined}
                    onChange={(gameUuid) => setFilters((current) => ({ ...current, gameUuid: gameUuid || "", page: 1 }))}
                    options={(gamesQuery.data || []).map((game) => ({ value: game.game_uuid, label: game.game_name }))}
                  />
                  <Select
                    className="w-full md:w-48"
                    allowClear
                    placeholder="Filter by status"
                    value={filters.status || undefined}
                    onChange={(status) => setFilters((current) => ({ ...current, status: status || "", page: 1 }))}
                    options={[{ value: 1, label: "Active" }, { value: 3, label: "Inactive" }]}
                  />
                </div>
                {campaignsQuery.error && (
                  <Alert className="mb-4" type="error" showIcon message="Unable to load campaigns" description={campaignsQuery.error.message} />
                )}
                <Table
                  rowKey="campaign_id"
                  columns={columns}
                  dataSource={campaignsQuery.data?.campaigns || []}
                  loading={campaignsQuery.isLoading}
                  scroll={{ x: 1000 }}
                  pagination={{
                    current: campaignsQuery.data?.page || filters.page,
                    pageSize: campaignsQuery.data?.perPage || filters.perPage,
                    total: campaignsQuery.data?.total || 0,
                    showSizeChanger: true,
                    onChange: (page, perPage) => setFilters((current) => ({ ...current, page, perPage })),
                  }}
                />
              </>
            ) },
            { key: "players", label: "Award Players", children: <FreeBetAwardPlayers /> },
            { key: "history", label: "Award History", children: <FreeBetAwardHistory /> },
          ]}
        />
      </Card>
      <CampaignForm open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
