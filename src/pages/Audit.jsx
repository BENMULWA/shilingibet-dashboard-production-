import AuditLogsTable from "../components/AuditLogsTable";
import AuditStatsCards from "../components/AuditStatsCards";

function Audit() {
  return (
    <div className="space-y-6">
      <AuditStatsCards />
      <AuditLogsTable />
    </div>
  );
}

export default Audit;
