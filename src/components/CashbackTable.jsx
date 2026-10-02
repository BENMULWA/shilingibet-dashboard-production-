import { useEffect, useState } from "react";
import { Table, Spin, Alert, Button, Input } from "antd";
import { FiFilter } from "react-icons/fi";
import moment from "moment";
import { useCashbacks } from "../hooks/useCashbacks";

function CashbacksTable() {
  const [searchPhone, setSearchPhone] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  // Fetch all cashbacks
  const {
    data: allCashbacks,
    isLoading: isLoadingAll,
    error: errorAll,
  } = useCashbacks(pagination.current, pagination.pageSize, phoneFilter);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhoneFilter(searchPhone.length >= 4 ? searchPhone : "");
      setPagination((current) => ({ ...current, current: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchPhone]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchPhone(value);
  };

  const displayData = allCashbacks?.awards || [];
  const displayPagination = allCashbacks?.pagination || {};

  // Formatters
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 2,
    }).format(amount);

  const formatDate = (dateString) =>
    moment(dateString).format("DD/MM/YYYY, h:mm A");

  const columns = [
    {
      title: "Date",
      dataIndex: "windowEnd",
      key: "windowEnd",
      render: (windowEnd) =>
        windowEnd ? moment(windowEnd).format("DD/MM/YYYY") : "N/A",
    },
    { title: "Phone", dataIndex: ["user", "phone"], key: "phone" },
    {
      title: "Cashback (KES)",
      dataIndex: "amount",
      key: "amount",
      render: (cashback) => (
        <span className="text-green-600">{formatCurrency(cashback)}</span>
      ),
    },
    {
      title: "Total Loss (KES)",
      dataIndex: "netLoss",
      key: "netLoss",
      render: (loss) => formatCurrency(loss),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: () => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            "bg-green-100 text-green-800"
          }`}
        >
          Credited
        </span>
      ),
    },
    {
      title: "Applied At",
      dataIndex: "creditedAt",
      key: "creditedAt",
      render: (creditedAt) => (creditedAt ? formatDate(creditedAt) : "N/A"),
    },
  ];

  if (isLoadingAll) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (errorAll) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <Alert
          message="Error loading cashbacks"
          description={errorAll?.message}
          type="error"
          showIcon
        />
        <Button className="mt-4" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800">
          Cashback History
        </h3>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            placeholder="Search by phone (min 4 digits)"
            value={searchPhone}
            onChange={handleSearch}
            allowClear
            className="w-full sm:w-64"
          />
          <Button icon={<FiFilter />} className="w-full sm:w-auto">
            Filter
          </Button>
        </div>
      </div>

      {/* Table wrapper for small devices */}
      <div className="overflow-x-auto">
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={displayData}
          pagination={{
            current: displayPagination?.page || pagination.current,
            pageSize: displayPagination?.limit || pagination.pageSize,
            total: displayPagination?.total || 0,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            responsive: true,
          }}
          scroll={{ x: "max-content" }} // horizontal scroll on small screens
          onChange={(newPagination) => {
            setPagination({
              current: newPagination.current,
              pageSize: newPagination.pageSize,
            });
          }}
        />
      </div>
    </div>
  );
}

export default CashbacksTable;
