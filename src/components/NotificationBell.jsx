import { useState } from "react";
import { Dropdown, Badge, Empty, Spin } from "antd";
import { FiBell, FiCheck } from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";
import { useNotifications } from "../hooks/useNotifications";

const SEVERITY_DOT = {
  critical: "bg-red-500",
  warning: "bg-amber-500",
  info: "bg-blue-500",
};

function NotificationItem({ notification, onMarkRead }) {
  return (
    <div
      className={`flex gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700 last:border-0 ${
        notification.read ? "" : "bg-blue-50/60 dark:bg-blue-950/20"
      }`}
    >
      <span
        className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${
          SEVERITY_DOT[notification.severity] || SEVERITY_DOT.info
        }`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
          {notification.title}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>
      {!notification.read && (
        <button
          type="button"
          title="Mark as read"
          onClick={() => onMarkRead(notification._id)}
          className="shrink-0 self-start p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          <FiCheck size={14} />
        </button>
      )}
    </div>
  );
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, isLoading, markRead, markAllRead } =
    useNotifications();

  const panel = (
    <div className="w-80 sm:w-96 max-h-[28rem] flex flex-col bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
        <h5 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          Notifications
        </h5>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllRead()}
            className="text-xs font-medium text-[#e6bd2e] hover:text-[#d4ad26]"
          >
            Mark all read
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spin size="small" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8">
            <Empty description="No notifications" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationItem key={n._id} notification={n} onMarkRead={markRead} />
          ))
        )}
      </div>
    </div>
  );

  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      trigger={["click"]}
      placement="bottomRight"
      dropdownRender={() => panel}
    >
      <button
        className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        title="Notifications"
      >
        <Badge count={unreadCount} size="small" offset={[-2, 2]}>
          <FiBell className="text-slate-600 dark:text-slate-300" size={20} />
        </Badge>
      </button>
    </Dropdown>
  );
}

export default NotificationBell;
