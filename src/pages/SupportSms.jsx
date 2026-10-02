import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Input, Select, Space, Statistic, Table, Tag } from "antd";
import { ReloadOutlined, SendOutlined } from "@ant-design/icons";
import toast from "react-hot-toast";
import {
  getSmsBatches,
  getSmsContacts,
  getSmsProviders,
  getSmsStats,
  sendBulkSms,
} from "../services/SmsService";

const { TextArea } = Input;

function normalizeRecipient(value) {
  const digits = value.replace(/\D/g, "");
  if (/^0[17]\d{8}$/.test(digits)) return `254${digits.slice(1)}`;
  if (/^[17]\d{8}$/.test(digits)) return `254${digits}`;
  if (/^254[17]\d{8}$/.test(digits)) return digits;
  return null;
}

function SupportSms() {
  const [recipientsText, setRecipientsText] = useState("");
  const [message, setMessage] = useState("");
  const [provider, setProvider] = useState("zeaworld");
  const [providers, setProviders] = useState([]);
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [batches, setBatches] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [stats, setStats] = useState({});
  const [error, setError] = useState("");

  const recipients = useMemo(() => {
    const normalized = recipientsText
      .split(/[\s,;]+/)
      .map(normalizeRecipient)
      .filter(Boolean);
    return [...new Set(normalized)];
  }, [recipientsText]);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    setError("");
    try {
      const [statsResponse, batchesResponse, contactsResponse, providersResponse] = await Promise.all([
        getSmsStats(),
        getSmsBatches(),
        getSmsContacts(),
        getSmsProviders(),
      ]);
      setStats(statsResponse.data || {});
      setBatches(batchesResponse.data || []);
      setContacts(contactsResponse.data || []);
      const availableProviders = providersResponse.data || [];
      setProviders(availableProviders);
      setProvider((current) => {
        const currentIsConfigured = availableProviders.some(
          (item) => item.id === current && item.configured
        );
        if (currentIsConfigured) return current;
        const configuredDefault = availableProviders.find(
          (item) => item.id === providersResponse.defaultProvider && item.configured
        );
        return configuredDefault?.id || availableProviders.find((item) => item.configured)?.id || current;
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSend = async () => {
    if (!recipients.length) {
      toast.error("Enter at least one valid Kenyan mobile number");
      return;
    }
    if (!message.trim()) {
      toast.error("Enter an SMS message");
      return;
    }

    setSending(true);
    try {
      const response = await sendBulkSms({
        recipients,
        message: message.trim(),
        provider,
      });
      const result = response.results;
      toast.success(
        response.queued
          ? `Queued ${result.total} messages via ${provider === "semasms" ? "SemaSMS" : "Zea World"}`
          : `Sent ${result.sent} of ${result.total} messages`
      );
      setRecipientsText("");
      setMessage("");
      await loadHistory();
    } catch (requestError) {
      toast.error(requestError.message);
    } finally {
      setSending(false);
    }
  };

  const allTime = stats.allTime || {};
  const allContactNumbers = useMemo(
    () => contacts.map((contact) => contact.recipient).filter(Boolean),
    [contacts]
  );
  const allContactsSelected =
    allContactNumbers.length > 0 && selectedContacts.length === allContactNumbers.length;

  const addSelectedContacts = () => {
    const existing = recipientsText.split(/[\s,;]+/).filter(Boolean);
    setRecipientsText([...new Set([...existing, ...selectedContacts])].join("\n"));
    setSelectedContacts([]);
  };

  const toggleAllContacts = () => {
    setSelectedContacts(allContactsSelected ? [] : allContactNumbers);
  };

  const contactColumns = [
    { title: "Phone number", dataIndex: "recipient" },
    { title: "Messages sent", dataIndex: "send_count" },
    {
      title: "Last sent",
      dataIndex: "last_sent_at",
      render: (value) => value ? new Date(value).toLocaleString() : "—",
    },
  ];

  const columns = [
    { title: "Date", dataIndex: "created_at", render: (value) => new Date(value).toLocaleString() },
    {
      title: "Provider",
      dataIndex: "provider",
      render: (value) => value === "semasms" ? "SemaSMS" : value === "zeaworld" ? "Zea World" : value,
    },
    { title: "Sender", dataIndex: "sender_id" },
    { title: "Recipients", dataIndex: "total_recipients" },
    { title: "Sent", dataIndex: "sent_count" },
    { title: "Failed", dataIndex: "failed_count" },
    {
      title: "Status",
      dataIndex: "status",
      render: (value) => (
        <Tag color={value === "completed" ? "green" : value === "failed" ? "red" : "gold"}>
          {value}
        </Tag>
      ),
    },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-4 pb-6">
        {error && <Alert type="error" showIcon message="SMS service unavailable" description={error} />}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card><Statistic title="Total messages" value={allTime.total_messages || 0} /></Card>
          <Card><Statistic title="Successfully sent" value={allTime.sent_messages || 0} valueStyle={{ color: "#059669" }} /></Card>
          <Card><Statistic title="Failed" value={allTime.failed_messages || 0} valueStyle={{ color: "#dc2626" }} /></Card>
        </div>

        <Card title="Send bulk SMS">
          <Space direction="vertical" size="middle" className="w-full">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">SMS provider</label>
              <Select
                value={provider}
                onChange={setProvider}
                className="w-full sm:max-w-xs"
                options={providers.map((item) => ({
                  value: item.id,
                  label: item.name,
                  disabled: !item.configured,
                }))}
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Choose the gateway for this batch. Unconfigured providers are disabled.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Recipients</label>
              <TextArea
                rows={5}
                value={recipientsText}
                onChange={(event) => setRecipientsText(event.target.value)}
                placeholder="Paste Kenyan phone numbers separated by commas, spaces, or new lines"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{recipients.length} valid unique recipients</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Message</label>
              <TextArea
                rows={4}
                maxLength={480}
                showCount
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Type the message to send"
              />
            </div>
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={sending}
              disabled={!recipients.length || !message.trim()}
              onClick={handleSend}
            >
              Send to {recipients.length || 0} recipients
            </Button>
          </Space>
        </Card>

        <Card
          title={`Saved recipients (${contacts.length})`}
          extra={
            <Space wrap>
              <Button
                disabled={!allContactNumbers.length}
                onClick={toggleAllContacts}
              >
                {allContactsSelected ? "Clear selection" : "Select all phone numbers"}
              </Button>
              <Button
                type="primary"
                disabled={!selectedContacts.length}
                onClick={addSelectedContacts}
              >
                Use selected ({selectedContacts.length})
              </Button>
            </Space>
          }
        >
          <Table
            rowKey="recipient"
            columns={contactColumns}
            dataSource={contacts}
            loading={loadingHistory}
            rowSelection={{
              selectedRowKeys: selectedContacts,
              onChange: setSelectedContacts,
              preserveSelectedRowKeys: true,
            }}
            pagination={{ pageSize: 10, hideOnSinglePage: true }}
            scroll={{ x: 520 }}
          />
        </Card>

        <Card
          title="Recent SMS batches"
          extra={<Button icon={<ReloadOutlined />} onClick={loadHistory} loading={loadingHistory}>Refresh</Button>}
        >
          <Table
            rowKey="id"
            columns={columns}
            dataSource={batches}
            loading={loadingHistory}
            pagination={false}
            scroll={{ x: 720 }}
          />
        </Card>
      </div>
    </div>
  );
}

export default SupportSms;
