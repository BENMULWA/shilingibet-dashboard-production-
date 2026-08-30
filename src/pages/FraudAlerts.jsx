import FraudAlertsTable from "../components/FraudAlertsTable";
import FraudStatsCards from "../components/FraudStatsCards";

function FraudAlerts() {
  return (
    <div className="space-y-6">
      <FraudStatsCards />
      <FraudAlertsTable />
    </div>
  );
}

export default FraudAlerts;
