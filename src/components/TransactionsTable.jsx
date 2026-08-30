import { useState, useMemo } from "react";
import moment from "moment";
import {
  Table,
  Modal,
  Button,
  Spin,
  Alert,
  Select,
  DatePicker,
  Radio,
  Typography,
  Input,
} from "antd";
import { FiArrowDown, FiArrowUp, FiFilter, FiDownload, FiCopy, FiCheck } from "react-icons/fi";
import {
  useGetUserTransactions,
  useTransactions,
} from "../hooks/useTransactions";
import { debounce } from "lodash";
import TransactionsExportModal from "./Modals/transactions/TransactionsExportModal";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text } = Typography;

function TransactionsTable() {
  const [exportVisible, setExportVisible] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [searchPhone, setSearchPhone] = useState("");
  const [filters, setFilters] = useState({
    type: null,
    status: null,
    dateRange: null,
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [copiedPhone, setCopiedPhone] = useState(null);

  const handleCopyPhone = async (phone) => {
    if (phone) {
      try {
        await navigator.clipboard.writeText(phone);
        setCopiedPhone(phone);
        setTimeout(() => setCopiedPhone(null), 2000);
      } catch {
        console.error("Failed to copy");
      }
    }
  };

  const {
    transactions: allTransactions,
    pagination: apiPagination,
    isLoading,
    error,
  } = useTransactions(pagination.current, pagination.pageSize);

  const {
    getUserTransactions,
    isLoading: isSearching,
    searchResults,
    searchPagination,
  } = useGetUserTransactions();

  const isSearchingMode = searchPhone.length >= 5;
  const displayTransactions = isSearchingMode ? searchResults : allTransactions;

  const displayPagination = isSearchingMode
    ? {
        current: searchPagination.current,
        pageSize: searchPagination.pageSize,
        total: searchPagination.total,
      }
    : {
        current: apiPagination.currentPage,
        pageSize: apiPagination.pageSize,
        total: apiPagination.total,
      };

  const handleTableChange = (newPagination) => {
    if (isSearchingMode) {
      getUserTransactions({
        phone: searchPhone,
        page: newPagination.current,
        limit: newPagination.pageSize,
      });
    } else {
      setPagination({
        current: newPagination.current,
        pageSize: newPagination.pageSize,
      });
    }
  };

  const debouncedSearch = useMemo(
    () =>
      debounce((value) => {
        if (value.length >= 5) {
          getUserTransactions({
            phone: value,
            page: 1,
            limit: pagination.pageSize,
          });
        }
      }, 700),
    [getUserTransactions, pagination.pageSize]
  );

  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchPhone(value);
    debouncedSearch(value);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return moment(dateString).format("DD/MM/YYYY, h:mm A");
  };
  const handleCancel = () => {
    setIsModalVisible(false);
  };
  const getStatusBadge = (status) => {
    const statusClasses = {
      success: "bg-green-100 text-green-800",
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
          statusClasses[status] || "bg-gray-100"
        }`}
      >
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : "N/A"}
      </span>
    );
  };
  const typeLabel = (type) =>
    ({
      deposit: "Deposit",
      withdrawal: "Withdrawal",
      internal_allocation: "Treasury allocation",
      internal_withdrawal_reserve: "Withdrawal reserve",
      internal_withdrawal_release: "Withdrawal release",
    })[type] || type || "N/A";

  const filteredTransactions = displayTransactions?.filter((tx) => {
    if (filters.type && tx.type !== filters.type) return false;
    if (filters.status && tx.status !== filters.status) return false;
    if (filters.dateRange?.length === 2) {
      const txDate = new Date(tx.date);
      const start = new Date(filters.dateRange[0]);
      const end = new Date(filters.dateRange[1]);
      if (txDate < start || txDate > end) return false;
    }
    return true;
  });

  const columns = [
    {
      title: "Date/Time",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt) => (
        <span className="whitespace-nowrap">
          {createdAt ? formatDate(createdAt) : "N/A"}
        </span>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type) => (
        <div className="flex items-center whitespace-nowrap">
          {type === "deposit" || type === "internal_allocation" || type === "internal_withdrawal_release" ? (
            <FiArrowUp className="text-green-600" />
          ) : (
            <FiArrowDown className="text-red-500" />
          )}
          <span className="ml-2">
            {typeLabel(type)}
          </span>
        </div>
      ),
    },
    {
      title: "Amount (KES)",
      dataIndex: "amount",
      key: "amount",
      render: (amount, record) => (
        <span
          className={`whitespace-nowrap ${
            record.type === "deposit" ||
            record.type === "internal_allocation" ||
            record.type === "internal_withdrawal_release"
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {amount ? formatCurrency(amount) : formatCurrency(0)}
        </span>
      ),
    },
    {
      title: "Reference",
      dataIndex: "transactionCode",
      key: "reference",
      render: (code) => (
        <span className="font-mono truncate max-w-[150px] block">
          {code || "N/A"}
        </span>
      ),
    },
    {
      title: "Phone",
      key: "user",
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <span className="truncate max-w-[120px]">{record.phone || "N/A"}</span>
          {record.phone && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopyPhone(record.phone);
              }}
              className="p-1 rounded hover:bg-slate-100 transition-colors"
              title="Copy phone number"
            >
              {copiedPhone === record.phone ? (
                <FiCheck className="text-emerald-500" size={14} />
              ) : (
                <FiCopy className="text-slate-400 hover:text-slate-600" size={14} />
              )}
            </button>
          )}
        </div>
      ),
    },
    {
      title: "Tax",
      dataIndex: "tax",
      key: "tax",
      render: (tax) => (
        <div className="whitespace-nowrap">{formatCurrency(tax ?? 0)}</div>
      ),
    },

    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => getStatusBadge(status),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => {
            setSelectedTransaction(record);
            setIsModalVisible(true);
          }}
        >
          View Details
        </Button>
      ),
    },
  ];
  const handleOk = () => {
    setIsModalVisible(false);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden p-6">
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (error) {
    console.log(error);
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden p-6">
        <Alert
          message="Error loading transactions"
          description={error.message}
          type="error"
          showIcon
        />
        <Button className="mt-4" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }
  console.log(error);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="lg:px-6 py-4 border-b border-gray-200 flex flex-col gap-2 md:flex-row md:justify-between md:items-center">
        <h3 className="text-lg font-semibold text-gray-800">
          Transaction History
        </h3>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Input
            placeholder="Search by phone number (min 5 digits)"
            value={searchPhone}
            onChange={handleSearchInput}
            allowClear
          />
          <Button
            icon={<FiFilter />}
            onClick={() => setIsFilterModalVisible(true)}
          >
            Filter
          </Button>
          <Button icon={<FiDownload />} onClick={() => setExportVisible(true)}>
            Export
          </Button>

          <TransactionsExportModal
            open={exportVisible}
            onCancel={() => setExportVisible(false)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table
          columns={columns}
          rowKey="_id"
          dataSource={filteredTransactions}
          loading={isSearchingMode ? isSearching : isLoading}
          pagination={{
            current: displayPagination.current,
            pageSize: displayPagination.pageSize,
            total: displayPagination.total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            responsive: true,
          }}
          onChange={handleTableChange}
          scroll={{ x: 'max-content' }}
        />
      </div>

      {/* Transaction Details Modal */}
      <Modal
        title="Transaction Details"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel}>
            Close
          </Button>,
        ]}
      >
        {selectedTransaction && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-500">Transaction ID</h4>
              <p>{selectedTransaction.transactionCode || "N/A"}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-500">Type</h4>
              <p>
                {typeLabel(selectedTransaction.type)}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-500">Amount</h4>
              <p
                className={
                  selectedTransaction.type === "deposit"
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {selectedTransaction.amount
                  ? formatCurrency(selectedTransaction.amount)
                  : formatCurrency(0)}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-500">User</h4>
              <p>{selectedTransaction._id || "N/A"}</p>
              <p className="text-gray-500">
                {selectedTransaction.phone || "N/A"}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-500">Method</h4>
              <p>{selectedTransaction.provider || "N/A"}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-500">Date/Time</h4>
              <p>
                {selectedTransaction.createdAt
                  ? formatDate(selectedTransaction.createdAt)
                  : "N/A"}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-500">Status</h4>
              <p>{getStatusBadge(selectedTransaction.status)}</p>
            </div>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-auto text-sm">
              <code>
                {JSON.stringify(selectedTransaction?.trnNarration, null, 2)}
              </code>
            </pre>
          </div>
        )}
      </Modal>

      {/* Filter Modal */}
      <Modal
        title="Filter Transactions"
        open={isFilterModalVisible}
        onOk={() => setIsFilterModalVisible(false)}
        onCancel={() => setIsFilterModalVisible(false)}
        footer={[
          <Button
            onClick={() =>
              setFilters({ type: null, status: null, dateRange: null })
            }
          >
            Reset
          </Button>,
          <Button onClick={() => setIsFilterModalVisible(false)}>Close</Button>,
        ]}
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-medium">Transaction Type</h4>
            <Select
              style={{ width: "100%" }}
              value={filters.type}
              onChange={(val) => setFilters({ ...filters, type: val })}
              allowClear
            >
              <Option value="deposit">Deposit</Option>
              <Option value="withdrawal">Withdrawal</Option>
              <Option value="internal_allocation">Treasury allocation</Option>
              <Option value="internal_withdrawal_reserve">Withdrawal reserve</Option>
              <Option value="internal_withdrawal_release">Withdrawal release</Option>
            </Select>
          </div>
          <div>
            <h4 className="font-medium">Status</h4>
            <Radio.Group
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
            >
              <Radio value={null}>All</Radio>
              <Radio value="completed">Completed</Radio>
              <Radio value="pending">Pending</Radio>
              <Radio value="failed">Failed</Radio>
            </Radio.Group>
          </div>
          <div>
            <h4 className="font-medium">Date Range</h4>
            <RangePicker
              style={{ width: "100%" }}
              value={filters.dateRange}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
              showTime
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default TransactionsTable;
