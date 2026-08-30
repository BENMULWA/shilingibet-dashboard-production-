import { Modal, Tag, Spin, Empty, Table } from "antd";
import { FiUser, FiAlertTriangle, FiGlobe, FiPhone } from "react-icons/fi";
import { HiOutlineShieldExclamation } from "react-icons/hi2";
import { useGetUserFraudProfile } from "../hooks/useGetFraudAlerts";
import { useFormatCurrency } from "../hooks/useFormatCurrency";

function UserRiskProfileModal({ open, onClose, userId }) {
  const { profile, isLoading, error } = useGetUserFraudProfile(userId);
  const { formatCurrency } = useFormatCurrency();

  const getRiskLevelBadge = (level) => {
    const config = {
      low: { color: "green", label: "Low" },
      medium: { color: "orange", label: "Medium" },
      high: { color: "red", label: "High" },
      critical: { color: "magenta", label: "Critical" },
    };
    const { color, label } = config[level] || { color: "default", label: level || "N/A" };
    return <Tag color={color}>{label}</Tag>;
  };

  const getTypeBadge = (type) => {
    const config = {
      bot_pattern: { color: "purple", label: "Bot Pattern" },
      ip_mismatch: { color: "blue", label: "IP Mismatch" },
      abnormal_winrate: { color: "orange", label: "Abnormal Winrate" },
      high_velocity: { color: "red", label: "High Velocity" },
      suspicious_activity: { color: "pink", label: "Suspicious Activity" },
      referral_bonus: { color: "blue", label: "Referral Bonus" },
      welcome_bonus: { color: "green", label: "Welcome Bonus" },
    };
    const { color, label } = config[type] || { color: "default", label: type || "N/A" };
    return <Tag color={color}>{label}</Tag>;
  };

  const formatDate = (dateString) =>
    dateString
      ? new Date(dateString).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A";

  const recentAlertsColumns = [
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type) => getTypeBadge(type),
    },
    {
      title: "Risk",
      dataIndex: "riskLevel",
      key: "riskLevel",
      render: (level) => getRiskLevelBadge(level),
    },
    {
      title: "Score",
      dataIndex: "riskScore",
      key: "riskScore",
      render: (score) => (
        <span className={`font-medium ${score >= 25 ? "text-red-600" : "text-slate-700"}`}>
          {score}
        </span>
      ),
    },
    {
      title: "Reward Amount",
      key: "betAmount",
      render: (_, record) => formatCurrency(record.context?.betAmount || 0),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => <span className="text-sm text-slate-500">{formatDate(date)}</span>,
    },
  ];

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <HiOutlineShieldExclamation className="text-red-500" size={20} />
          <span>User Risk Profile</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Spin size="large" />
        </div>
      ) : error ? (
        <Empty description="Failed to load user risk profile" />
      ) : profile ? (
        <div className="space-y-6">
          {/* User Info */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                <FiUser className="text-red-600" size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <FiPhone className="text-slate-400" size={14} />
                  <span className="font-semibold text-slate-900">{profile.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <FiGlobe className="text-slate-400" size={14} />
                  <span>Registration IP: {profile.registrationIp}</span>
                </div>
              </div>
              <div className="ml-auto">
                {getRiskLevelBadge(profile.riskProfile?.riskLevel)}
              </div>
            </div>
          </div>

          {/* Risk Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-red-50 rounded-lg p-4 border border-red-100">
              <p className="text-sm text-red-600 mb-1">Open Alerts</p>
              <p className="text-2xl font-bold text-red-700">
                {profile.riskProfile?.openAlerts || 0}
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
              <p className="text-sm text-orange-600 mb-1">Total Risk Score</p>
              <p className="text-2xl font-bold text-orange-700">
                {profile.riskProfile?.totalRiskScore?.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <p className="text-sm text-blue-600 mb-1">Average Score</p>
              <p className="text-2xl font-bold text-blue-700">
                {profile.riskProfile?.averageRiskScore?.toFixed(1) || 0}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
              <p className="text-sm text-purple-600 mb-1">Risk Level</p>
              <p className="text-2xl font-bold text-purple-700 capitalize">
                {profile.riskProfile?.riskLevel || "N/A"}
              </p>
            </div>
          </div>

          {/* Alert Types Breakdown */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Alert Types Breakdown</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(profile.riskProfile?.alertTypes || {}).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-slate-200">
                  {getTypeBadge(type)}
                  <span className="font-semibold text-slate-900">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Alerts */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Recent Alerts</h4>
            <Table
              columns={recentAlertsColumns}
              dataSource={profile.recentAlerts?.slice(0, 10)?.map((alert) => ({
                ...alert,
                key: alert._id,
              }))}
              pagination={false}
              size="small"
              scroll={{ x: 500 }}
              locale={{
                emptyText: <Empty description="No recent alerts" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
              }}
            />
          </div>
        </div>
      ) : (
        <Empty description="No profile data available" />
      )}
    </Modal>
  );
}

export default UserRiskProfileModal;
