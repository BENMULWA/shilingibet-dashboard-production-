import { useState, useMemo, useCallback } from "react";
import { Table, Modal, Button, Input, Tooltip, Empty, message } from "antd";
import { FiDownload, FiSearch, FiFilter, FiUsers, FiRefreshCw, FiCopy, FiCheck } from "react-icons/fi";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import DeletionModal from "./DeletionModal";
import { useGetUsers } from "../hooks/useGetUsers";
import ModalView from "./ModalView";
import MyDrawer from "./Drawer";
import { useGetUserByPhone } from "../hooks/useGetUserByPhone";
import UsersExportModal from "./Modals/user/UsersExportModal";
import UsersFilterModal from "./Modals/user/UsersFilterModal";
import { useFormatCurrency } from "../hooks/useFormatCurrency";

function UsersTable() {
  const [exportVisible, setExportVisible] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete] = useState(null);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchPhone, setSearchPhone] = useState("");
  const [filters, setFilters] = useState({
    status: null,
    dateRange: null,
    accountStatus: null,
  });
  const [copiedPhone, setCopiedPhone] = useState(null);

  const handleCopyPhone = useCallback(async (phone) => {
    if (phone) {
      try {
        await navigator.clipboard.writeText(phone);
        setCopiedPhone(phone);
        message.success("Phone number copied!");
        setTimeout(() => setCopiedPhone(null), 2000);
      } catch {
        message.error("Failed to copy");
      }
    }
  }, []);

  const { formatCurrency } = useFormatCurrency();
  const {
    users,
    pagination: apiPagination,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetUsers(currentPage, pageSize);

  const { searchUser, isSearching, searchError, searchResults, resetSearch } =
    useGetUserByPhone();

  const showDrawer = useCallback(() => setOpen(true), []);
  const onClose = useCallback(() => {
    setOpen(false);
    setSelectedUser(null);
  }, []);

  const formatDate = useCallback(
    (dateString) =>
      dateString
        ? new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "N/A",
    []
  );

  const getStatusBadge = useCallback((status) => {
    const statusConfig = {
      active: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
      blocked: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
      inactive: { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" },
    };
    const config = statusConfig[status] || statusConfig.inactive;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
      >
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : "N/A"}
      </span>
    );
  }, []);

  const handleSearch = useCallback(
    (e) => {
      const phone = e.target.value;
      setSearchPhone(phone);

      if (!phone.trim()) {
        resetSearch();
        return;
      }
      if (phone.length >= 4) searchUser({ phone });
    },
    [resetSearch, searchUser]
  );

  const handleTableChange = useCallback(
    (pagination) => {
      setCurrentPage(pagination.current);
      setPageSize(pagination.pageSize);
    },
    []
  );

  const handleRefresh = useCallback(() => {
    setSearchPhone("");
    resetSearch();
    refetch();
  }, [resetSearch, refetch]);

  const handleResetFilters = useCallback(() => {
    setFilters({ status: null, dateRange: null, accountStatus: null });
  }, []);

  const filteredUsers = useMemo(() => {
    return users?.filter((user) => {
      if (filters.status && user.status !== filters.status) return false;
      if (filters.accountStatus && user.accountStatus !== filters.accountStatus)
        return false;
      if (filters.dateRange && filters.dateRange.length === 2) {
        const userDate = new Date(user.createdAt);
        const startDate = new Date(filters.dateRange[0]);
        const endDate = new Date(filters.dateRange[1]);
        if (userDate < startDate || userDate > endDate) return false;
      }
      return true;
    });
  }, [users, filters]);

  const displayedUsers = useMemo(
    () => searchResults || filteredUsers,
    [searchResults, filteredUsers]
  );

  const hasActiveFilters = useMemo(
    () => filters.status || filters.dateRange || filters.accountStatus,
    [filters]
  );

  // Get the current user data from the users list to ensure drawer shows updated data
  const currentSelectedUser = useMemo(() => {
    if (!selectedUser?._id) return selectedUser;
    const updatedUser = displayedUsers?.find(u => u._id === selectedUser._id);
    return updatedUser || selectedUser;
  }, [selectedUser, displayedUsers]);

  const columns = useMemo(
    () => [
      {
        title: "Phone Number",
        dataIndex: "phone",
        key: "phone",
        render: (phone) => (
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-900">{phone || "N/A"}</span>
            {phone && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyPhone(phone);
                }}
                className="p-1 rounded hover:bg-slate-100 transition-colors"
                title="Copy phone number"
              >
                {copiedPhone === phone ? (
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
        title: "Referred By",
        dataIndex: "referredBy",
        key: "referredBy",
        render: (referredBy) => {
          let referralText = null;
          if (typeof referredBy === "string" && referredBy.trim()) {
            referralText = referredBy;
          } else if (Array.isArray(referredBy) && referredBy.length > 0) {
            referralText = referredBy.join(", ");
          } else if (referredBy?.phone) {
            referralText = referredBy.phone;
          }
          return (
            <div className="flex items-center gap-2">
              <span className="text-slate-600">{referralText || "—"}</span>
              {referralText && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyPhone(referralText);
                  }}
                  className="p-1 rounded hover:bg-slate-100 transition-colors"
                  title="Copy referral"
                >
                  {copiedPhone === referralText ? (
                    <FiCheck className="text-emerald-500" size={14} />
                  ) : (
                    <FiCopy className="text-slate-400 hover:text-slate-600" size={14} />
                  )}
                </button>
              )}
            </div>
          );
        },
      },
      {
        title: "Total Balance",
        dataIndex: "balance",
        key: "balance",
        render: (balance) => (
          <span
            className={`font-semibold ${
              balance > 1000 ? "text-emerald-600" : "text-slate-700"
            }`}
          >
            {formatCurrency(balance ?? 0)}
          </span>
        ),
      },
      {
        title: "Bonus",
        dataIndex: "bonusBalance",
        key: "bonusBalance",
        render: (balance) => (
          <span className="font-medium text-amber-600">
            {formatCurrency(balance ?? 0)}
          </span>
        ),
      },
      {
        title: "Withdrawable",
        dataIndex: "withdrawableBalance",
        key: "withdrawableBalance",
        render: (balance) => (
          <span className="font-medium text-emerald-600">
            {formatCurrency(balance ?? 0)}
          </span>
        ),
      },
      {
        title: "Status",
        dataIndex: "accountStatus",
        key: "accountStatus",
        render: (status) => getStatusBadge(status),
      },
      {
        title: "Joined",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (date) => (
          <span className="text-slate-500 text-sm">{formatDate(date)}</span>
        ),
      },
      {
        title: "",
        key: "actions",
        align: "right",
        width: 100,
        render: (_, user) => (
          <Button
            type="primary"
            size="small"
            onClick={() => {
              setSelectedUser(user);
              showDrawer();
            }}
          >
            Manage
          </Button>
        ),
      },
    ],
    [formatCurrency, formatDate, getStatusBadge, showDrawer, handleCopyPhone, copiedPhone]
  );

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div className="text-center">
              <p className="text-slate-600 mb-4">Failed to load users</p>
              <p className="text-slate-400 text-sm mb-4">{error.message}</p>
              <Button
                type="primary"
                onClick={() => window.location.reload()}
                className="bg-[#f9ce36] text-black border-[#f9ce36] hover:bg-[#e6bd2e]"
              >
                Try Again
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {showDeleteModal && (
        <DeletionModal
          cancelDelete={() => setShowDeleteModal(false)}
          confirmDelete={() => setShowDeleteModal(false)}
          id={userToDelete?.id}
          phone={userToDelete?.phone}
        />
      )}

      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#f9ce36]/20 flex items-center justify-center">
              <FiUsers className="text-amber-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Users</h3>
              <p className="text-sm text-slate-500">
                {apiPagination?.total ?? 0} total users
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Input
                prefix={<FiSearch className="text-slate-400" size={16} />}
                placeholder="Search by phone..."
                value={searchPhone}
                onChange={handleSearch}
                allowClear
                className="w-full sm:w-64"
                suffix={
                  isSearching ? (
                    <span className="text-slate-400 text-xs">Searching...</span>
                  ) : searchError ? (
                    <Tooltip title={searchError.message}>
                      <ExclamationCircleOutlined className="text-red-500" />
                    </Tooltip>
                  ) : null
                }
              />
            </div>

            <div className="flex gap-2">
              <Tooltip title="Refresh">
                <Button
                  icon={<FiRefreshCw size={14} />}
                  onClick={handleRefresh}
                  loading={isFetching}
                  className="border-slate-200"
                />
              </Tooltip>

              <Button
                icon={<FiFilter size={14} />}
                onClick={() => setIsFilterModalVisible(true)}
                className={
                  hasActiveFilters
                    ? "bg-[#f9ce36] text-black border-[#f9ce36]"
                    : "border-slate-200"
                }
              >
                <span className="hidden sm:inline">Filter</span>
                {hasActiveFilters && (
                  <span className="ml-1 w-2 h-2 bg-amber-600 rounded-full inline-block" />
                )}
              </Button>

              <Button
                type="primary"
                icon={<FiDownload size={14} />}
                onClick={() => setExportVisible(true)}
              >
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table
          columns={columns}
          dataSource={displayedUsers?.map((user) => ({
            ...user,
            balance: user?.wallet?.totalBalance,
            bonusBalance: user?.wallet?.bonusBalance,
            withdrawableBalance: user?.wallet?.withdrawableBalance,
            key: user._id,
          }))}
          onChange={handleTableChange}
          loading={isLoading || isFetching || isSearching}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: searchResults ? searchResults.length : apiPagination?.total ?? 0,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total, range) => (
              <span className="text-slate-500 text-sm">
                Showing {range[0]}-{range[1]} of {total}
              </span>
            ),
            className: "px-4 py-3",
          }}
          scroll={{ x: 800 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  searchResults?.length === 0
                    ? "No users found for this search"
                    : "No users found"
                }
              />
            ),
          }}
          className="users-table"
        />
      </div>

      <MyDrawer open={open} onClose={onClose} user={currentSelectedUser} />

      <UsersFilterModal
        open={isFilterModalVisible}
        onOk={() => setIsFilterModalVisible(false)}
        onCancel={() => setIsFilterModalVisible(false)}
        onReset={handleResetFilters}
        filters={filters}
        onAccountStatusChange={(value) =>
          setFilters((prev) => ({ ...prev, accountStatus: value }))
        }
        onDateChange={(dates) =>
          setFilters((prev) => ({ ...prev, dateRange: dates }))
        }
      />

      <UsersExportModal
        open={exportVisible}
        onCancel={() => setExportVisible(false)}
        filters={filters}
      />

      <Modal
        title={currentAction?.label}
        open={currentAction !== null}
        onOk={() => setCurrentAction(null)}
        onCancel={() => setCurrentAction(null)}
        footer={null}
      >
        <ModalView actionKey={currentAction?.key} />
      </Modal>
    </div>
  );
}

export default UsersTable;
