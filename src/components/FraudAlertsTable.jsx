import { useState, useMemo, useCallback } from "react";
import { Table, Button, Input, Tooltip, Empty, Modal } from "antd";
import {
  FiSearch,
  FiRefreshCw,
  FiCopy,
  FiCheck,
  FiAlertTriangle,
  FiEye,
  FiCheckCircle,
  FiUser,
  FiClock,
} from "react-icons/fi";
import { HiOutlineShieldExclamation } from "react-icons/hi2";
import {
  useGetFraudAlerts,
  useResolveFraudAlert,
} from "../hooks/useGetFraudAlerts";
import { useFormatCurrency } from "../hooks/useFormatCurrency";
import UserRiskProfileModal from "./UserRiskProfileModal";
import toast from "react-hot-toast";

function FraudAlertsTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchPhone, setSearchPhone] = useState("");
  const [copiedText, setCopiedText] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolutionStatus, setResolutionStatus] = useState("resolved_legitimate");
  const [userProfileModalOpen, setUserProfileModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const { formatCurrency } = useFormatCurrency();
  const {
    alerts,
    pagination: apiPagination,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetFraudAlerts(currentPage, pageSize);

  const { resolveAlert, isResolving } = useResolveFraudAlert();

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
        : "N/A",
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
        : "N/A",
    []
  );

  const getRiskLevelConfig = useCallback((level) => {
    const config = {
      low: { color: "green", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Low" },
      medium: { color: "orange", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "Medium" },
      high: { color: "red", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "High" },
      critical: { color: "magenta", bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200", label: "Critical" },
    };
    return config[level] || { color: "default", bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", label: level || "N/A" };
  }, []);

  const getRiskLevelBadge = useCallback((level) => {
    const config = getRiskLevelConfig(level);
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text} border ${config.border}`}>
        {config.label}
      </span>
    );
  }, [getRiskLevelConfig]);

  const getTypeBadge = useCallback((type) => {
    const config = {
      bot_pattern: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", label: "Bot Pattern" },
      ip_mismatch: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "IP Mismatch" },
      velocity: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", label: "Velocity" },
      high_velocity: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "High Velocity" },
      abnormal_winrate: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", label: "Abnormal Winrate" },
      suspicious_activity: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "Suspicious" },
      referral_bonus: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "Referral Bonus" },
      welcome_bonus: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Welcome Bonus" },
    };
    const { bg, text, border, label } = config[type] || { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", label: type || "N/A" };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text} border ${border}`}>
        {label}
      </span>
    );
  }, []);

  const getStatusBadge = useCallback((status) => {
    const config = {
      open: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500", label: "Open" },
      investigating: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500", label: "Investigating" },
      resolved: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", label: "Resolved" },
      resolved_legitimate: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", label: "Legitimate" },
      resolved_fraud: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500", label: "Fraud" },
      dismissed: { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", dot: "bg-slate-400", label: "Dismissed" },
    };
    const { bg, text, border, dot, label } = config[status] || { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", dot: "bg-slate-400", label: status || "N/A" };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text} border ${border}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        {label}
      </span>
    );
  }, []);

  const handleSearch = useCallback((e) => {
    setSearchPhone(e.target.value);
  }, []);

  const handleTableChange = useCallback((pagination) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  }, []);

  const handleRefresh = useCallback(() => {
    setSearchPhone("");
    refetch();
  }, [refetch]);

  const filteredAlerts = useMemo(() => {
    if (!searchPhone.trim()) return alerts;
    return alerts?.filter((alert) =>
      alert.phone?.toLowerCase().includes(searchPhone.toLowerCase())
    );
  }, [alerts, searchPhone]);

  const showDetails = useCallback((alert) => {
    setSelectedAlert(alert);
    setDetailsModalOpen(true);
  }, []);

  const handleResolve = useCallback((alert) => {
    setSelectedAlert(alert);
    setResolutionStatus("resolved_legitimate");
    setResolveModalOpen(true);
  }, []);

  const confirmResolve = useCallback(() => {
    if (selectedAlert) {
      resolveAlert(
        { alertId: selectedAlert._id, status: resolutionStatus },
        {
          onSuccess: () => {
            setResolveModalOpen(false);
            setSelectedAlert(null);
            setResolutionStatus("resolved_legitimate");
          },
        }
      );
    }
  }, [selectedAlert, resolutionStatus, resolveAlert]);

  const handleViewUserProfile = useCallback((userId) => {
    setSelectedUserId(userId);
    setUserProfileModalOpen(true);
  }, []);

  const columns = useMemo(
    () => [
      {
        title: <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">User</span>,
        dataIndex: "phone",
        key: "phone",
        width: 180,
        render: (phone, record) => (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-slate-600">
                {phone?.slice(-2) || "??"}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-900 text-sm truncate">{phone || "N/A"}</span>
                {phone && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(phone);
                    }}
                    className="p-0.5 rounded hover:bg-slate-100 transition-colors flex-shrink-0"
                  >
                    {copiedText === phone ? (
                      <FiCheck className="text-emerald-500" size={12} />
                    ) : (
                      <FiCopy className="text-slate-400 hover:text-slate-600" size={12} />
                    )}
                  </button>
                )}
              </div>
              {record.user?._id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewUserProfile(record.user._id);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 mt-0.5"
                >
                  <FiUser size={10} />
                  View Profile
                </button>
              )}
            </div>
          </div>
        ),
      },
      {
        title: <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Alert Type</span>,
        dataIndex: "type",
        key: "type",
        width: 140,
        render: (type) => getTypeBadge(type),
      },
      {
        title: <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Risk</span>,
        key: "risk",
        width: 130,
        render: (_, record) => (
          <div className="space-y-1">
            {getRiskLevelBadge(record.riskLevel)}
            <div className="flex items-center gap-1">
              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    record.riskScore >= 50
                      ? "bg-red-500"
                      : record.riskScore >= 25
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(record.riskScore, 100)}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-slate-600">{record.riskScore}</span>
            </div>
          </div>
        ),
      },
      {
        title: <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Reward</span>,
        key: "betDetails",
        width: 150,
        render: (_, record) => (
          <div className="space-y-0.5">
            <div className="font-semibold text-slate-900">
              {formatCurrency(record.context?.betAmount ?? 0)}
            </div>
            <div className="text-xs text-slate-500 truncate" title={record.context?.provider}>
              {record.context?.provider?.replace(/_/g, " ") || "N/A"}
            </div>
          </div>
        ),
      },
      {
        title: <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">IP Info</span>,
        key: "ipInfo",
        width: 130,
        render: (_, record) => (
          <div className="space-y-0.5">
            <div className="text-xs">
              <span className="text-slate-500">Client: </span>
              <span className="font-mono text-slate-700">{record.context?.clientIp?.split('.').slice(0, 2).join('.') + '...' || "N/A"}</span>
            </div>
            {record.context?.clientIp !== record.context?.registrationIp && (
              <div className="text-xs text-amber-600 flex items-center gap-1">
                <FiAlertTriangle size={10} />
                IP Mismatch
              </div>
            )}
          </div>
        ),
      },
      {
        title: <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</span>,
        dataIndex: "status",
        key: "status",
        width: 120,
        render: (status) => getStatusBadge(status),
      },
      {
        title: <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Time</span>,
        dataIndex: "createdAt",
        key: "createdAt",
        width: 110,
        render: (date) => (
          <div className="flex items-center gap-1.5 text-slate-500">
            <FiClock size={12} />
            <span className="text-xs">{formatShortDate(date)}</span>
          </div>
        ),
      },
      {
        title: "",
        key: "actions",
        align: "right",
        width: 160,
        fixed: "right",
        render: (_, record) => (
          <div className="flex items-center justify-end gap-2">
            <Tooltip title="View Details">
              <button
                onClick={() => showDetails(record)}
                className="p-2 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-slate-600 hover:text-slate-800"
              >
                <FiEye size={16} />
              </button>
            </Tooltip>
            {record.status === "open" && (
              <button
                onClick={() => handleResolve(record)}
                className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm hover:shadow"
              >
                <FiCheckCircle size={14} />
                Resolve
              </button>
            )}
          </div>
        ),
      },
    ],
    [formatCurrency, formatShortDate, getTypeBadge, getRiskLevelBadge, getStatusBadge, handleCopy, copiedText, showDetails, handleResolve, handleViewUserProfile]
  );

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div className="text-center">
              <p className="text-slate-600 mb-4">Failed to load fraud alerts</p>
              <p className="text-slate-400 text-sm mb-4">{error.message}</p>
              <Button
                type="primary"
                onClick={() => refetch()}
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
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
              <HiOutlineShieldExclamation className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Fraud Alerts</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                <span className="font-semibold text-slate-700">{apiPagination?.total?.toLocaleString() ?? 0}</span> alerts detected
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Input
                prefix={<FiSearch className="text-slate-400" size={16} />}
                placeholder="Search by phone..."
                value={searchPhone}
                onChange={handleSearch}
                allowClear
                className="w-full sm:w-72 rounded-lg"
                size="large"
              />
            </div>

            <Tooltip title="Refresh data">
              <Button
                icon={<FiRefreshCw size={16} />}
                onClick={handleRefresh}
                loading={isFetching}
                size="large"
                className="border-slate-200 hover:border-slate-300 rounded-lg"
              >
                Refresh
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="block lg:hidden">
        {isLoading || isFetching ? (
          <div className="p-6 text-center text-slate-500">Loading...</div>
        ) : filteredAlerts?.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="text-center py-4">
                <p className="text-slate-500 mb-1">No fraud alerts found</p>
                <p className="text-slate-400 text-xs">All clear for now</p>
              </div>
            }
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAlerts?.map((alert) => (
              <div key={alert._id} className="p-4 hover:bg-slate-50/50 transition-colors">
                {/* Header: User & Status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-slate-600">
                        {alert.phone?.slice(-2) || "??"}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900 text-sm">{alert.phone || "N/A"}</span>
                        {alert.phone && (
                          <button
                            onClick={() => handleCopy(alert.phone)}
                            className="p-0.5 rounded hover:bg-slate-100 transition-colors"
                          >
                            {copiedText === alert.phone ? (
                              <FiCheck className="text-emerald-500" size={12} />
                            ) : (
                              <FiCopy className="text-slate-400" size={12} />
                            )}
                          </button>
                        )}
                      </div>
                      {alert.user?._id && (
                        <button
                          onClick={() => handleViewUserProfile(alert.user._id)}
                          className="text-xs text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <FiUser size={10} />
                          View Profile
                        </button>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(alert.status)}
                </div>

                {/* Alert Type & Risk */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {getTypeBadge(alert.type)}
                  {getRiskLevelBadge(alert.riskLevel)}
                  <div className="flex items-center gap-1 ml-auto">
                    <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          alert.riskScore >= 50
                            ? "bg-red-500"
                            : alert.riskScore >= 25
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(alert.riskScore, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-600">{alert.riskScore}</span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                  <div>
                    <span className="text-slate-500 text-xs">Bet Amount</span>
                    <p className="font-semibold text-slate-900">{formatCurrency(alert.context?.betAmount ?? 0)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs">Provider</span>
                    <p className="text-slate-700 truncate">{alert.context?.provider?.replace(/_/g, " ") || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs">Client IP</span>
                    <p className="font-mono text-xs text-slate-700">{alert.context?.clientIp || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs">Time</span>
                    <p className="text-slate-700 text-xs flex items-center gap-1">
                      <FiClock size={10} />
                      {formatShortDate(alert.createdAt)}
                    </p>
                  </div>
                </div>

                {/* IP Mismatch Warning */}
                {alert.context?.clientIp !== alert.context?.registrationIp && (
                  <div className="text-xs text-amber-600 flex items-center gap-1 mb-3 bg-amber-50 px-2 py-1.5 rounded-lg border border-amber-200">
                    <FiAlertTriangle size={12} />
                    IP Mismatch Detected
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => showDetails(alert)}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-slate-600 hover:text-slate-800 text-sm font-medium flex items-center justify-center gap-1.5"
                  >
                    <FiEye size={14} />
                    Details
                  </button>
                  {alert.status === "open" && (
                    <button
                      onClick={() => handleResolve(alert)}
                      className="flex-1 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow"
                    >
                      <FiCheckCircle size={14} />
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mobile Pagination */}
        <div className="px-4 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-slate-500 text-sm">
            Page {currentPage} of {Math.ceil((apiPagination?.total ?? 0) / pageSize) || 1}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="small"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              size="small"
              disabled={currentPage >= Math.ceil((apiPagination?.total ?? 0) / pageSize)}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <Table
          columns={columns}
          dataSource={filteredAlerts?.map((alert) => ({
            ...alert,
            key: alert._id,
          }))}
          onChange={handleTableChange}
          loading={isLoading || isFetching}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: apiPagination?.total ?? 0,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total, range) => (
              <span className="text-slate-500 text-sm">
                Showing <span className="font-semibold text-slate-700">{range[0]}-{range[1]}</span> of <span className="font-semibold text-slate-700">{total}</span>
              </span>
            ),
            className: "px-6 py-4",
          }}
          scroll={{ x: 1000 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div className="text-center py-4">
                    <p className="text-slate-500 mb-1">No fraud alerts found</p>
                    <p className="text-slate-400 text-xs">All clear for now</p>
                  </div>
                }
              />
            ),
          }}
          rowClassName="hover:bg-slate-50/50 transition-colors"
          className="fraud-alerts-table"
        />
      </div>

      {/* Details Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
              <FiAlertTriangle className="text-white" size={16} />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Fraud Alert Details</h3>
              <p className="text-xs text-slate-500 font-normal truncate">ID: {selectedAlert?._id?.slice(-8)}</p>
            </div>
          </div>
        }
        open={detailsModalOpen}
        onCancel={() => setDetailsModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsModalOpen(false)} size="middle" className="sm:!h-10">
            Close
          </Button>,
          selectedAlert?.status === "open" && (
            <Button
              key="resolve"
              type="primary"
              size="middle"
              className="bg-emerald-500 border-emerald-500 hover:bg-emerald-600 sm:!h-10"
              onClick={() => {
                setDetailsModalOpen(false);
                handleResolve(selectedAlert);
              }}
            >
              Resolve Alert
            </Button>
          ),
        ]}
        width="95%"
        style={{ maxWidth: 640 }}
        className="fraud-details-modal"
      >
        {selectedAlert && (
          <div className="space-y-4 sm:space-y-5 mt-3 sm:mt-4">
            {/* Basic Info */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-lg sm:rounded-xl p-3 sm:p-5 border border-slate-200">
              <h4 className="text-xs sm:text-sm font-semibold text-slate-800 mb-3 sm:mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                Basic Information
              </h4>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
                <div className="space-y-1">
                  <span className="text-slate-500 text-[10px] sm:text-xs uppercase tracking-wide">Phone</span>
                  <p className="font-semibold text-slate-900 text-xs sm:text-sm truncate">{selectedAlert.phone}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 text-[10px] sm:text-xs uppercase tracking-wide">Type</span>
                  <p>{getTypeBadge(selectedAlert.type)}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 text-[10px] sm:text-xs uppercase tracking-wide">Risk Level</span>
                  <p>{getRiskLevelBadge(selectedAlert.riskLevel)}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 text-[10px] sm:text-xs uppercase tracking-wide">Risk Score</span>
                  <p className="font-bold text-xl sm:text-2xl text-slate-900">{selectedAlert.riskScore}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 text-[10px] sm:text-xs uppercase tracking-wide">Status</span>
                  <p>{getStatusBadge(selectedAlert.status)}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 text-[10px] sm:text-xs uppercase tracking-wide">Action</span>
                  <p className="font-medium text-slate-700 capitalize text-xs sm:text-sm">{selectedAlert.action?.replace(/_/g, " ")}</p>
                </div>
              </div>
            </div>

            {/* Context Info */}
            <div className="bg-gradient-to-br from-blue-50/50 to-blue-100/30 rounded-lg sm:rounded-xl p-3 sm:p-5 border border-blue-200/50">
              <h4 className="text-xs sm:text-sm font-semibold text-slate-800 mb-3 sm:mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                Bet Context
              </h4>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <span className="text-slate-500 text-[10px] sm:text-xs uppercase tracking-wide">Bet ID</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] sm:text-xs bg-white px-2 py-1 rounded border border-slate-200 truncate max-w-[120px] sm:max-w-none">{selectedAlert.context?.betId}</span>
                    <button
                      onClick={() => handleCopy(selectedAlert.context?.betId)}
                      className="p-1 rounded hover:bg-white/50 flex-shrink-0"
                    >
                      {copiedText === selectedAlert.context?.betId ? (
                        <FiCheck className="text-emerald-500" size={12} />
                      ) : (
                        <FiCopy className="text-slate-400" size={12} />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 text-[10px] sm:text-xs uppercase tracking-wide">Provider</span>
                  <p className="font-medium text-slate-900 text-xs sm:text-sm truncate">{selectedAlert.context?.provider?.replace(/_/g, " ")}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 text-[10px] sm:text-xs uppercase tracking-wide">Bet Amount</span>
                  <p className="font-bold text-base sm:text-lg text-slate-900">
                    {formatCurrency(selectedAlert.context?.betAmount ?? 0)}
                  </p>
                </div>
                {selectedAlert.context?.amountVariety !== undefined && (
                  <div className="space-y-1">
                    <span className="text-slate-500 text-[10px] sm:text-xs uppercase tracking-wide">Amount Variety</span>
                    <p className="font-medium text-slate-900 text-xs sm:text-sm">{selectedAlert.context.amountVariety}</p>
                  </div>
                )}
                {selectedAlert.context?.intervalStdDev !== undefined && (
                  <div className="space-y-1">
                    <span className="text-slate-500 text-[10px] sm:text-xs uppercase tracking-wide">Interval Std Dev</span>
                    <p className="font-medium text-slate-900 text-xs sm:text-sm">{selectedAlert.context.intervalStdDev?.toLocaleString()}</p>
                  </div>
                )}
                {selectedAlert.context?.winRate !== undefined && (
                  <div className="space-y-1">
                    <span className="text-slate-500 text-[10px] sm:text-xs uppercase tracking-wide">Win Rate</span>
                    <p className="font-bold text-amber-600 text-xs sm:text-sm">{(selectedAlert.context.winRate * 100).toFixed(1)}%</p>
                  </div>
                )}
                {selectedAlert.context?.profitRatio !== undefined && (
                  <div className="space-y-1">
                    <span className="text-slate-500 text-[10px] sm:text-xs uppercase tracking-wide">Profit Ratio</span>
                    <p className="font-medium text-slate-900 text-xs sm:text-sm">{selectedAlert.context.profitRatio}</p>
                  </div>
                )}
              </div>
            </div>

            {/* IP Info */}
            <div className="bg-gradient-to-br from-purple-50/50 to-purple-100/30 rounded-lg sm:rounded-xl p-3 sm:p-5 border border-purple-200/50">
              <h4 className="text-xs sm:text-sm font-semibold text-slate-800 mb-3 sm:mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                IP Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                <div className="space-y-1">
                  <span className="text-slate-500 text-[10px] sm:text-xs uppercase tracking-wide">Client IP</span>
                  <p className="font-mono text-[10px] sm:text-xs bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded border border-slate-200 text-slate-900 inline-block break-all">{selectedAlert.context?.clientIp}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 text-[10px] sm:text-xs uppercase tracking-wide">Registration IP</span>
                  <p className="font-mono text-[10px] sm:text-xs bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded border border-slate-200 text-slate-900 inline-block break-all">{selectedAlert.context?.registrationIp}</p>
                </div>
              </div>
              {selectedAlert.context?.clientIp !== selectedAlert.context?.registrationIp && (
                <div className="mt-3 flex items-center gap-2 text-amber-600 bg-amber-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-amber-200">
                  <FiAlertTriangle size={12} className="flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs font-medium">IP addresses do not match - possible suspicious activity</span>
                </div>
              )}
            </div>

            {/* Timestamps */}
            <div className="bg-slate-50 rounded-lg sm:rounded-xl p-3 sm:p-5 border border-slate-200">
              <h4 className="text-xs sm:text-sm font-semibold text-slate-800 mb-3 sm:mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                Timeline
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                <div className="space-y-1">
                  <span className="text-slate-500 text-[10px] sm:text-xs uppercase tracking-wide">Created</span>
                  <p className="font-medium text-slate-900 flex items-center gap-2 text-xs sm:text-sm">
                    <FiClock size={12} className="text-slate-400 flex-shrink-0" />
                    <span className="truncate">{formatDate(selectedAlert.createdAt)}</span>
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 text-[10px] sm:text-xs uppercase tracking-wide">Expires</span>
                  <p className="font-medium text-slate-900 text-xs sm:text-sm truncate">{formatDate(selectedAlert.expiresAt)}</p>
                </div>
                {selectedAlert.resolvedAt && (
                  <div className="space-y-1 col-span-1 sm:col-span-2">
                    <span className="text-slate-500 text-[10px] sm:text-xs uppercase tracking-wide">Resolved</span>
                    <p className="font-medium text-emerald-600 text-xs sm:text-sm">{formatDate(selectedAlert.resolvedAt)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Resolution Notes */}
            {selectedAlert.resolutionNotes && (
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-lg sm:rounded-xl p-3 sm:p-5 border border-emerald-200">
                <h4 className="text-xs sm:text-sm font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                  <FiCheckCircle size={14} />
                  Resolution Notes
                </h4>
                <p className="text-xs sm:text-sm text-emerald-700">{selectedAlert.resolutionNotes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Resolve Modal */}
      <Modal
        title={null}
        open={resolveModalOpen}
        onCancel={() => setResolveModalOpen(false)}
        onOk={confirmResolve}
        okText="Confirm Resolution"
        okButtonProps={{
          loading: isResolving,
          className: "bg-emerald-500 border-emerald-500 hover:bg-emerald-600",
          size: "large",
        }}
        cancelButtonProps={{ size: "large" }}
        width="95%"
        style={{ maxWidth: 400 }}
        centered
      >
        <div className="pt-4 pb-2">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/20">
              <FiCheckCircle className="text-white" size={28} />
            </div>
            <h3 className="font-bold text-lg text-slate-900">Resolve Alert</h3>
            <p className="text-sm text-slate-500 mt-1">
              Phone: <span className="font-semibold text-slate-700">{selectedAlert?.phone}</span>
            </p>
          </div>

          {/* Resolution Options */}
          <div className="space-y-3">
            {/* Legitimate */}
            <button
              type="button"
              onClick={() => setResolutionStatus("resolved_legitimate")}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                resolutionStatus === "resolved_legitimate"
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  resolutionStatus === "resolved_legitimate"
                    ? "border-emerald-500 bg-emerald-500"
                    : "border-slate-300"
                }`}>
                  {resolutionStatus === "resolved_legitimate" && (
                    <FiCheck className="text-white" size={12} />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-emerald-700">Legitimate</p>
                  <p className="text-xs text-slate-500">User is innocent, alert was wrong</p>
                </div>
              </div>
            </button>

            {/* Confirmed Fraud */}
            <button
              type="button"
              onClick={() => setResolutionStatus("resolved_fraud")}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                resolutionStatus === "resolved_fraud"
                  ? "border-red-500 bg-red-50"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  resolutionStatus === "resolved_fraud"
                    ? "border-red-500 bg-red-500"
                    : "border-slate-300"
                }`}>
                  {resolutionStatus === "resolved_fraud" && (
                    <FiCheck className="text-white" size={12} />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-red-700">Confirmed Fraud</p>
                  <p className="text-xs text-slate-500">You have confirmed it was a fraud</p>
                </div>
              </div>
            </button>

            {/* Dismissed */}
            <button
              type="button"
              onClick={() => setResolutionStatus("dismissed")}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                resolutionStatus === "dismissed"
                  ? "border-slate-500 bg-slate-100"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  resolutionStatus === "dismissed"
                    ? "border-slate-500 bg-slate-500"
                    : "border-slate-300"
                }`}>
                  {resolutionStatus === "dismissed" && (
                    <FiCheck className="text-white" size={12} />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Dismissed</p>
                  <p className="text-xs text-slate-500">Noted but no action taken</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </Modal>

      {/* User Risk Profile Modal */}
      <UserRiskProfileModal
        open={userProfileModalOpen}
        onClose={() => {
          setUserProfileModalOpen(false);
          setSelectedUserId(null);
        }}
        userId={selectedUserId}
      />
    </div>
  );
}

export default FraudAlertsTable;
