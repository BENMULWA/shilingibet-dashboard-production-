import { Table, Tag, Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment";
import { useTransactions } from "../hooks/useTransactions";

const formatCurrency = (amount, currency = "KES") =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number(amount || 0));

const InvoiceTable = () => {
  const { transactions, isLoading } = useTransactions(1, 5);

  const downloadReceipt = (record) => {
    const reference = record.transactionCode || record._id;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Transaction Receipt", 14, 22);
    autoTable(doc, {
      startY: 30,
      head: [["Field", "Value"]],
      body: [
        ["Reference", reference],
        ["Type", record.type],
        ["Amount", formatCurrency(record.amount, record.currency)],
        ["Provider", record.provider || "Internal Treasury"],
        ["Phone", record.phone || "N/A"],
        ["Date", moment(record.createdAt).format("DD MMM YYYY, h:mm A")],
        ["Status", record.status],
      ],
    });
    doc.save(`${reference}.pdf`);
  };

  const columns = [
    {
      title: "Reference",
      dataIndex: "transactionCode",
      key: "reference",
      ellipsis: true,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type) => String(type || "N/A").replaceAll("_", " "),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount, record) => formatCurrency(amount, record.currency),
    },
    {
      title: "Provider",
      dataIndex: "provider",
      key: "provider",
      render: (provider) => provider || "Internal Treasury",
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "date",
      render: (date) => moment(date).format("DD MMM YYYY, h:mm A"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag
          color={
            status === "completed"
              ? "green"
              : status === "pending"
                ? "gold"
                : "red"
          }
          className="capitalize"
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "Download",
      key: "download",
      render: (_, record) => (
        <Button
          icon={<DownloadOutlined />}
          size="small"
          onClick={() => downloadReceipt(record)}
        >
          PDF
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Table
        columns={columns}
        dataSource={transactions}
        rowKey={(record) => `${record.source || "payment"}-${record._id}`}
        loading={isLoading}
        pagination={false}
        scroll={{ x: "max-content" }}
      />
    </div>
  );
};

export default InvoiceTable;
