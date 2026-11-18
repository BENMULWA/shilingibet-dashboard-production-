import { fetchAPI } from "../utils/fetchRequest";
import { downloadAuthenticatedFile } from "../utils/downloadRequest";

const token = () => JSON.parse(sessionStorage.getItem("user") || "null")?.token;

const rangeQuery = (start, end) =>
  new URLSearchParams({ dateFrom: new Date(start).toISOString(), dateTo: new Date(end).toISOString() }).toString();

// Daily revenue, withdrawal tax (owed to KRA), withdrawal fees and cash flow.
export async function getFinanceReport(start, end) {
  const response = await fetchAPI(`admin/analytics/finance?${rangeQuery(start, end)}`, "GET", null, token());
  return response.data;
}

export function exportFinanceReport(start, end, filename) {
  return downloadAuthenticatedFile(`admin/exports/finance?${rangeQuery(start, end)}`, filename);
}
