import { createElement, useState, useMemo, useCallback } from "react";
import { Table, Button, Input, Tooltip, Modal, Select, DatePicker, Spin } from "antd";
import {
  FiSearch,
  FiRefreshCw,
  FiCopy,
  FiCheck,
  FiClock,
  FiUser,
  FiGlobe,
  FiMonitor,
  FiEye,
  FiActivity,
  FiCalendar,
  FiFilter,
} from "react-icons/fi";
import { HiOutlineClipboardDocumentList, HiOutlineDocumentMagnifyingGlass } from "react-icons/hi2";
import {
  useGetAuditLogs,
  useGetAuditLogsByDate,
  useGetAuditDates,
  useGetAuditLogsByUser,
} from "../hooks/useGetAuditLogs";
import { useFormatCurrency } from "../hooks/useFormatCurrency";
import toast from "react-hot-toast";
import dayjs from "dayjs";

function AuditLogsTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchUserId, setSearchUserId] = useState("");
  const [activeUserId, setActiveUserId] = useState("");
  const [copiedText, setCopiedText] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState("paginated");

  const { formatCurrency } = useFormatCurrency();

  const { dates: availableDates } = useGetAuditDates();

  const {
    logs: paginatedLogs,
    pagination: apiPagination,
    isLoading: isPaginatedLoading,
    isFetching: isPaginatedFetching,
    error: paginatedError,
    refetch: refetchPaginated,
  } = useGetAuditLogs(currentPage, pageSize);

  const {
    logs: dateLogs,
    pagination: datePagination,
    isLoading: isDateLoading,
    isFetching: isDateFetching,
    error: dateError,
    refetch: refetchByDate,
  } = useGetAuditLogsByDate(selectedDate, currentPage, 20);

  const {
    logs: userLogs,
    pagination: userPagination,
    isLoading: isUserLoading,
    isFetching: isUserFetching,
    error: userError,
  } = useGetAuditLogsByUser(activeUserId, currentPage, pageSize);

  const logs = viewMode === "byDate" && selectedDate
    ? dateLogs
    : viewMode === "byUser" && activeUserId
    ? userLogs
    : paginatedLogs;
  const isLoading = viewMode === "byDate" ? isDateLoading : viewMode === "byUser" ? isUserLoading : isPaginatedLoading;
  const isFetching = viewMode === "byDate" ? isDateFetching : viewMode === "byUser" ? isUserFetching : isPaginatedFetching;
  const error = viewMode === "byDate" ? dateError : viewMode === "byUser" ? userError : paginatedError;
  const pagination = viewMode === "byDate" ? datePagination : viewMode === "byUser" ? userPagination : apiPagination;

  const handleCopy = useCallback(async (text) => {
    if (text) {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedText(text);
        toast.success("Copied to clipboard!");
        setTimeout(() => setCopiedText(null), 2000);
      } catch {
        toast.error("Failed to copy");
      }
    }
  }, []);

  const formatDate = useCallback(
    (dateString) =>
      dateString
        ? new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "-",
    []
  );

  const formatShortDate = useCallback(
    (dateString) =>
      dateString
        ? new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "-",
    []
  );

  const getActionBadge = useCallback((action) => {
    if (!action) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
          Login Activity
        </span>
      );
    }
    const config = {
      deposit_initiated: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "Deposit Initiated", icon: "+" },
      deposit_successful: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Deposit Success", icon: "+" },
      deposit_retry_scheduled: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "Deposit Retry", icon: "+" },
      deposit_retry_executed: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "Retry Executed", icon: "+" },
      withdrawal_requested: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", label: "Withdrawal Requested", icon: "-" },
      withdrawal_successful: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Withdrawal Success", icon: "-" },
      cashback_redeemed: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", label: "Cashback Redeemed", icon: "+" },
      referral_earnings_redeemed: { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200", label: "Referral Redeemed", icon: "+" },
      internal_transfer_success: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", label: "Transfer Success", icon: "=" },
      internal_transfer_failed: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "Transfer Failed", icon: "x" },
      secondary_wallet_transfer: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", label: "Wallet Transfer", icon: "=" },
    };
    const { bg, text, border, label } = config[action] || { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", label: action };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text} border ${border}`}>
        {label}
      </span>
    );
  }, []);

  const handleSearch = useCallback((e) => {
    setSearchUserId(e.target.value);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    if (searchUserId.trim()) {
      setActiveUserId(searchUserId.trim());
      setViewMode("byUser");
      setCurrentPage(1);
    }
  }, [searchUserId]);

  const handleSearchKeyDown = useCallback((e) => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    }
  }, [handleSearchSubmit]);

  const handleTableChange = useCallback((pag) => {
    setCurrentPage(pag.current);
    setPageSize(pag.pageSize);
  }, []);

  const handleRefresh = useCallback(() => {
    setSearchUserId("");
    setActiveUserId("");
    if (viewMode === "byDate" && selectedDate) {
      refetchByDate();
    } else if (viewMode === "byUser") {
      setViewMode("paginated");
      refetchPaginated();
    } else {
      refetchPaginated();
    }
  }, [viewMode, selectedDate, refetchByDate, refetchPaginated]);

  const handleDateChange = useCallback((date) => {
    if (date) {
      setSelectedDate(date.format("YYYY-MM-DD"));
      setViewMode("byDate");
      setActiveUserId("");
      setSearchUserId("");
      setCurrentPage(1);
    } else {
      setSelectedDate(null);
      setViewMode("paginated");
      setCurrentPage(1);
    }
  }, []);

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
    setCurrentPage(1);
    if (mode === "paginated") {
      setSelectedDate(null);
      setActiveUserId("");
      setSearchUserId("");
    }
  }, []);

  const showDetails = useCallback((log) => {
    setSelectedLog(log);
    setDetailsModalOpen(true);
  }, []);

  const parseUserAgent = useCallback((userAgent) => {
    if (!userAgent) return { browser: "-", os: "-", device: "-" };

    let browser = "Other";
    let os = "Other";
    let device = "Desktop";

    if (userAgent.includes("Chrome")) browser = "Chrome";
    else if (userAgent.includes("Firefox")) browser = "Firefox";
    else if (userAgent.includes("Safari")) browser = "Safari";
    else if (userAgent.includes("Edge")) browser = "Edge";
    else if (userAgent.includes("Opera") || userAgent.includes("OPR")) browser = "Opera";

    if (userAgent.includes("Windows")) os = "Windows";
    else if (userAgent.includes("Mac OS X") || userAgent.includes("Macintosh")) os = "macOS";
    else if (userAgent.includes("Android")) os = "Android";
    else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS";
    else if (userAgent.includes("Linux")) os = "Linux";

    if (userAgent.includes("Mobile") || userAgent.includes("Android") || userAgent.includes("iPhone")) {
      device = "Mobile";
    } else if (userAgent.includes("Tablet") || userAgent.includes("iPad")) {
      device = "Tablet";
    }

    return { browser, os, device };
  }, []);

  const columns = useMemo(
    () => [
      {
        title: <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Timestamp</span>,
        dataIndex: "timestamp",
        key: "timestamp",
        width: 170,
        render: (timestamp) => (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center">
              <FiClock size={14} className="text-slate-500" />
            </div>
            <span className="text-sm text-slate-700 font-medium">{formatShortDate(timestamp)}</span>
          </div>
        ),
      },
      {
        title: <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">User ID</span>,
        dataIndex: "userId",
        key: "userId",
        width: 220,
        render: (userId) => (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 flex items-center justify-center flex-shrink-0">
              <FiUser className="text-indigo-600" size={14} />
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-mono text-xs text-slate-700 truncate" title={userId}>
                {userId ? `${userId.slice(0, 8)}...${userId.slice(-4)}` : "-"}
              </span>
              {userId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(userId);
                  }}
                  className="p-1 rounded-md hover:bg-slate-100 transition-colors flex-shrink-0"
                >
                  {copiedText === userId ? (
                    <FiCheck className="text-emerald-500" size={12} />
                  ) : (
                    <FiCopy className="text-slate-400 hover:text-slate-600" size={12} />
                  )}
                </button>
              )}
            </div>
          </div>
        ),
      },
      {
        title: <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</span>,
        dataIndex: "action",
        key: "action",
        width: 180,
        render: (action) => getActionBadge(action),
      },
      {
        title: <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">IP Address</span>,
        dataIndex: "ipAddress",
        key: "ipAddress",
        width: 150,
        render: (ipAddress) => (
          ipAddress ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-blue-50 flex items-center justify-center">
                <FiGlobe className="text-blue-500" size={12} />
              </div>
              <span className="font-mono text-xs text-slate-700">{ipAddress}</span>
            </div>
          ) : (
            <span className="text-sm text-slate-300 italic">No IP recorded</span>
          )
        ),
      },
      {
        title: <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Device</span>,
        dataIndex: "userAgent",
        key: "device",
        width: 140,
        render: (userAgent) => {
          if (!userAgent) return <span className="text-sm text-slate-300 italic">No device info</span>;
          const { device, os } = parseUserAgent(userAgent);
          return (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-purple-50 flex items-center justify-center">
                <FiMonitor className="text-purple-500" size={12} />
              </div>
              <div className="text-xs">
                <span className="text-slate-700 font-medium">{device}</span>
                <span className="text-slate-400 mx-1">/</span>
                <span className="text-slate-500">{os}</span>
              </div>
            </div>
          );
        },
      },
      {
        title: <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Details</span>,
        key: "details",
        width: 160,
        render: (_, record) => {
          if (!record.details) {
            return <span className="text-sm text-slate-300 italic">No details</span>;
          }
          if (record.details.amount !== undefined) {
            return (
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-lg px-3 py-1.5 border border-emerald-200/50 inline-block">
                <div className="font-bold text-emerald-700 text-sm">
                  {formatCurrency(record.details.amount)}
                </div>
                {record.details.method && (
                  <span className="text-[10px] text-emerald-600/70 uppercase tracking-wide">{record.details.method}</span>
                )}
              </div>
            );
          }
          return (
            <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200">
              <FiActivity size={10} />
              Has details
            </span>
          );
        },
      },
      {
        title: "",
        key: "actions",
        align: "right",
        width: 70,
        fixed: "right",
        render: (_, record) => (
          <Tooltip title="View Details">
            <button
              onClick={() => showDetails(record)}
              className="p-2 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 hover:border-indigo-300 hover:from-indigo-50 hover:to-indigo-100 transition-all text-slate-500 hover:text-indigo-600 shadow-sm"
            >
              <FiEye size={16} />
            </button>
          </Tooltip>
        ),
      },
    ],
    [formatShortDate, getActionBadge, handleCopy, copiedText, parseUserAgent, formatCurrency, showDetails]
  );

  // Custom empty state component
  const EmptyState = ({ title, description, icon: Icon }) => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-6 shadow-inner">
        {createElement(Icon, { className: "text-slate-400", size: 36 })}
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm text-center max-w-sm">{description}</p>
    </div>
  );

  // Loading state component
  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <Spin size="large" />
      <p className="text-slate-500 mt-4">Loading audit logs...</p>
    </div>
  );

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8">
          <EmptyState
            icon={HiOutlineDocumentMagnifyingGlass}
            title="Failed to load audit logs"
            description={error.message || "Something went wrong while fetching the data. Please try again."}
          />
          <div className="flex justify-center mt-4">
            <Button
              type="primary"
              onClick={handleRefresh}
              className="bg-[#f9ce36] text-black border-[#f9ce36] hover:bg-[#e6bd2e]"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <HiOutlineClipboardDocumentList className="text-white" size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Audit Logs</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                  <span className="text-xs font-semibold text-indigo-700">
                    {pagination?.total?.toLocaleString() ?? 0}
                  </span>
                  <span className="text-xs text-indigo-600">
                    {viewMode === "byDate" && selectedDate
                      ? `logs for ${selectedDate}`
                      : viewMode === "byUser" && activeUserId
                      ? "logs for user"
                      : "total logs"}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* View Mode Toggle */}
            <Select
              value={viewMode}
              onChange={handleViewModeChange}
              className="w-full sm:w-36"
              size="large"
              suffixIcon={<FiFilter className="text-slate-400" size={14} />}
              options={[
                { value: "paginated", label: "All Logs" },
                { value: "byDate", label: "By Date" },
              ]}
            />

            {/* Date Picker */}
            {viewMode === "byDate" && (
              <DatePicker
                value={selectedDate ? dayjs(selectedDate) : null}
                onChange={handleDateChange}
                className="w-full sm:w-44"
                size="large"
                suffixIcon={<FiCalendar className="text-slate-400" size={14} />}
                disabledDate={(current) => {
                  if (!availableDates.length) return false;
                  const dateStr = current.format("YYYY-MM-DD");
                  return !availableDates.includes(dateStr);
                }}
                placeholder="Select date"
              />
            )}

            {/* Search */}
            <div className="flex gap-2">
              <Input
                prefix={<FiSearch className="text-slate-400" size={16} />}
                placeholder="Search by user ID..."
                value={searchUserId}
                onChange={handleSearch}
                onKeyDown={handleSearchKeyDown}
                allowClear
                onClear={() => {
                  setActiveUserId("");
                  if (viewMode === "byUser") {
                    setViewMode("paginated");
                  }
                }}
                className="w-full sm:w-64 rounded-lg"
                size="large"
              />
              <Button
                type="primary"
                onClick={handleSearchSubmit}
                disabled={!searchUserId.trim()}
                size="large"
                icon={<FiSearch size={16} />}
                className="bg-[#f9ce36] text-black border-[#f9ce36] hover:bg-[#e6bd2e] shadow-sm"
              />
            </div>

            <Tooltip title="Refresh data">
              <Button
                icon={<FiRefreshCw size={16} className={isFetching ? "animate-spin" : ""} />}
                onClick={handleRefresh}
                size="large"
                className="border-slate-200 hover:border-indigo-300 hover:text-indigo-600 rounded-lg shadow-sm"
              />
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="block lg:hidden">
        {isLoading || isFetching ? (
          <LoadingState />
        ) : logs?.length === 0 ? (
          <EmptyState
            icon={HiOutlineDocumentMagnifyingGlass}
            title="No audit logs found"
            description={viewMode === "byUser" ? "No logs found for this user ID." : viewMode === "byDate" ? "No logs recorded for this date." : "No activity has been recorded yet."}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {logs?.map((log, index) => (
              <div key={log._id || index} className="p-4 hover:bg-gradient-to-r hover:from-slate-50 hover:to-white transition-colors">
                {/* Header: Time & Action */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center">
                      <FiClock size={14} className="text-slate-500" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{formatShortDate(log.timestamp)}</span>
                  </div>
                  {getActionBadge(log.action)}
                </div>

                {/* User ID */}
                <div className="flex items-center gap-2 mb-4 p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 flex items-center justify-center flex-shrink-0">
                    <FiUser className="text-indigo-600" size={14} />
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="font-mono text-xs text-slate-700 truncate" title={log.userId}>
                      {log.userId}
                    </span>
                    {log.userId && (
                      <button
                        onClick={() => handleCopy(log.userId)}
                        className="p-1 rounded hover:bg-white transition-colors flex-shrink-0"
                      >
                        {copiedText === log.userId ? (
                          <FiCheck className="text-emerald-500" size={12} />
                        ) : (
                          <FiCopy className="text-slate-400" size={12} />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-100">
                    <span className="text-[10px] text-blue-600 uppercase tracking-wide font-semibold">IP Address</span>
                    <p className="font-mono text-xs text-slate-700 mt-0.5">
                      {log.ipAddress || <span className="text-slate-400 italic">Not recorded</span>}
                    </p>
                  </div>
                  <div className="p-2.5 bg-purple-50/50 rounded-lg border border-purple-100">
                    <span className="text-[10px] text-purple-600 uppercase tracking-wide font-semibold">Device</span>
                    <p className="text-xs text-slate-700 mt-0.5">
                      {log.userAgent ? (
                        `${parseUserAgent(log.userAgent).device} / ${parseUserAgent(log.userAgent).os}`
                      ) : (
                        <span className="text-slate-400 italic">Not recorded</span>
                      )}
                    </p>
                  </div>
                  {log.details?.amount !== undefined && (
                    <div className="p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-100">
                      <span className="text-[10px] text-emerald-600 uppercase tracking-wide font-semibold">Amount</span>
                      <p className="font-bold text-emerald-700 mt-0.5">{formatCurrency(log.details.amount)}</p>
                    </div>
                  )}
                  {log.details?.method && (
                    <div className="p-2.5 bg-amber-50/50 rounded-lg border border-amber-100">
                      <span className="text-[10px] text-amber-600 uppercase tracking-wide font-semibold">Method</span>
                      <p className="text-slate-700 capitalize text-xs mt-0.5">{log.details.method}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <button
                  onClick={() => showDetails(log)}
                  className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 hover:border-indigo-300 hover:from-indigo-100 hover:to-purple-100 transition-all text-indigo-700 text-sm font-medium flex items-center justify-center gap-2"
                >
                  <FiEye size={16} />
                  View Full Details
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Mobile Pagination */}
        {logs?.length > 0 && (
          <div className="px-4 py-4 border-t border-slate-100 bg-gradient-to-r from-slate-50 to-white flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-slate-500 text-sm font-medium">
              Page <span className="text-indigo-600">{currentPage}</span> of <span className="text-slate-700">{pagination?.totalPages || 1}</span>
            </span>
            <div className="flex items-center gap-2">
              <Button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="border-slate-200"
              >
                Previous
              </Button>
              <Button
                disabled={currentPage >= (pagination?.totalPages || 1)}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="border-slate-200"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <Table
          columns={columns}
          dataSource={logs?.map((log, index) => ({
            ...log,
            key: log._id || index,
          }))}
          onChange={handleTableChange}
          loading={isLoading || isFetching}
          pagination={{
            current: currentPage,
            pageSize: viewMode === "byDate" ? 20 : pageSize,
            total: pagination?.total ?? 0,
            showSizeChanger: viewMode !== "byDate",
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total, range) => (
              <span className="text-slate-500 text-sm">
                Showing <span className="font-semibold text-indigo-600">{range[0]}-{range[1]}</span> of <span className="font-semibold text-slate-700">{total}</span> logs
              </span>
            ),
            className: "px-6 py-4",
          }}
          scroll={{ x: 1100 }}
          locale={{
            emptyText: (
              <EmptyState
                icon={HiOutlineDocumentMagnifyingGlass}
                title="No audit logs found"
                description={viewMode === "byUser" ? "No logs found for this user ID." : viewMode === "byDate" ? "No logs recorded for this date." : "No activity has been recorded yet."}
              />
            ),
          }}
          rowClassName="hover:bg-gradient-to-r hover:from-slate-50 hover:to-white transition-colors"
          className="audit-logs-table"
        />
      </div>

      {/* Details Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <FiActivity className="text-white" size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Audit Log Details</h3>
              <p className="text-xs text-slate-500 font-normal">{formatDate(selectedLog?.timestamp)}</p>
            </div>
          </div>
        }
        open={detailsModalOpen}
        onCancel={() => setDetailsModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsModalOpen(false)} size="large" className="px-6">
            Close
          </Button>,
        ]}
        width={640}
        className="audit-details-modal"
      >
        {selectedLog && (
          <div className="space-y-5 mt-4">
            {/* Basic Info */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-5 border border-slate-200">
              <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                Basic Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">User ID</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-sm text-slate-700 truncate">{selectedLog.userId}</span>
                    <button
                      onClick={() => handleCopy(selectedLog.userId)}
                      className="p-1.5 rounded-md hover:bg-slate-100 flex-shrink-0"
                    >
                      {copiedText === selectedLog.userId ? (
                        <FiCheck className="text-emerald-500" size={14} />
                      ) : (
                        <FiCopy className="text-slate-400" size={14} />
                      )}
                    </button>
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Action</span>
                  <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Timestamp</span>
                  <p className="font-medium text-slate-700 text-sm mt-1 flex items-center gap-2">
                    <FiClock size={14} className="text-slate-400" />
                    {formatDate(selectedLog.timestamp)}
                  </p>
                </div>
              </div>
            </div>

            {/* Connection Info */}
            <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/50 rounded-xl p-5 border border-blue-200/50">
              <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Connection Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/80 rounded-lg border border-blue-200/50">
                  <span className="text-[10px] text-blue-600 uppercase tracking-wide font-semibold">IP Address</span>
                  <div className="flex items-center gap-2 mt-1">
                    <FiGlobe className="text-blue-500" size={14} />
                    <span className="font-mono text-sm text-slate-700">
                      {selectedLog.ipAddress || <span className="text-slate-400 italic">Not recorded</span>}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-white/80 rounded-lg border border-blue-200/50">
                  <span className="text-[10px] text-blue-600 uppercase tracking-wide font-semibold">Device</span>
                  <div className="flex items-center gap-2 mt-1">
                    <FiMonitor className="text-blue-500" size={14} />
                    <span className="text-sm text-slate-700">
                      {selectedLog.userAgent ? parseUserAgent(selectedLog.userAgent).device : <span className="text-slate-400 italic">Not recorded</span>}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-white/80 rounded-lg border border-blue-200/50">
                  <span className="text-[10px] text-blue-600 uppercase tracking-wide font-semibold">Operating System</span>
                  <p className="text-sm text-slate-700 mt-1">
                    {selectedLog.userAgent ? parseUserAgent(selectedLog.userAgent).os : <span className="text-slate-400 italic">Not recorded</span>}
                  </p>
                </div>
                <div className="p-3 bg-white/80 rounded-lg border border-blue-200/50">
                  <span className="text-[10px] text-blue-600 uppercase tracking-wide font-semibold">Browser</span>
                  <p className="text-sm text-slate-700 mt-1">
                    {selectedLog.userAgent ? parseUserAgent(selectedLog.userAgent).browser : <span className="text-slate-400 italic">Not recorded</span>}
                  </p>
                </div>
                {selectedLog.userAgent && (
                  <div className="col-span-2 p-3 bg-white/80 rounded-lg border border-blue-200/50">
                    <span className="text-[10px] text-blue-600 uppercase tracking-wide font-semibold">Full User Agent</span>
                    <p className="font-mono text-[11px] text-slate-600 mt-1 break-all leading-relaxed">{selectedLog.userAgent}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Details */}
            {selectedLog.details && (
              <div className="bg-gradient-to-br from-purple-50/70 to-pink-50/50 rounded-xl p-5 border border-purple-200/50">
                <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  Transaction Details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {selectedLog.details.amount !== undefined && (
                    <div className="p-3 bg-white/80 rounded-lg border border-purple-200/50">
                      <span className="text-[10px] text-purple-600 uppercase tracking-wide font-semibold">Amount</span>
                      <p className="font-bold text-xl text-slate-900 mt-1">{formatCurrency(selectedLog.details.amount)}</p>
                    </div>
                  )}
                  {selectedLog.details.phone && (
                    <div className="p-3 bg-white/80 rounded-lg border border-purple-200/50">
                      <span className="text-[10px] text-purple-600 uppercase tracking-wide font-semibold">Phone</span>
                      <p className="font-medium text-slate-700 text-sm mt-1">{selectedLog.details.phone}</p>
                    </div>
                  )}
                  {selectedLog.details.method && (
                    <div className="p-3 bg-white/80 rounded-lg border border-purple-200/50">
                      <span className="text-[10px] text-purple-600 uppercase tracking-wide font-semibold">Method</span>
                      <p className="font-medium text-slate-700 capitalize text-sm mt-1">{selectedLog.details.method}</p>
                    </div>
                  )}
                  {selectedLog.details.type && (
                    <div className="p-3 bg-white/80 rounded-lg border border-purple-200/50">
                      <span className="text-[10px] text-purple-600 uppercase tracking-wide font-semibold">Type</span>
                      <p className="font-medium text-slate-700 capitalize text-sm mt-1">{selectedLog.details.type}</p>
                    </div>
                  )}
                  {selectedLog.details.transactionId && (
                    <div className="col-span-2 p-3 bg-white/80 rounded-lg border border-purple-200/50">
                      <span className="text-[10px] text-purple-600 uppercase tracking-wide font-semibold">Transaction ID</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-xs text-slate-700 truncate">{selectedLog.details.transactionId}</span>
                        <button
                          onClick={() => handleCopy(selectedLog.details.transactionId)}
                          className="p-1.5 rounded-md hover:bg-white flex-shrink-0"
                        >
                          {copiedText === selectedLog.details.transactionId ? (
                            <FiCheck className="text-emerald-500" size={14} />
                          ) : (
                            <FiCopy className="text-slate-400" size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  {selectedLog.details.availableBefore !== undefined && (
                    <div className="p-3 bg-white/80 rounded-lg border border-purple-200/50">
                      <span className="text-[10px] text-purple-600 uppercase tracking-wide font-semibold">Balance Before</span>
                      <p className="font-medium text-slate-700 text-sm mt-1">{formatCurrency(selectedLog.details.availableBefore)}</p>
                    </div>
                  )}
                  {selectedLog.details.availableAfter !== undefined && (
                    <div className="p-3 bg-white/80 rounded-lg border border-purple-200/50">
                      <span className="text-[10px] text-purple-600 uppercase tracking-wide font-semibold">Balance After</span>
                      <p className="font-medium text-slate-700 text-sm mt-1">{formatCurrency(selectedLog.details.availableAfter)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default AuditLogsTable;
