import { fetchAPI } from "../utils/fetchRequest";
import {
  downloadAuthenticatedFile,
  exportDateQuery,
} from "../utils/downloadRequest";

export async function transactionsService(page = 1, limit = 10) {
  const user = JSON.parse(sessionStorage.getItem("user"));

  const token = user?.token;

  try {
    const res = await fetchAPI(
      `admin/transactions?page=${page}&limit=${limit}`,
      "GET",
      null,
      token
    );

    return {
      transactions: (res?.data || []).map((transaction) => ({
        ...transaction,
        transactionCode:
          transaction.receipt || transaction.externalId || transaction.secureId,
      })),
      page: res?.meta?.page || page,
      limit: res?.meta?.limit || limit,
      total: res?.meta?.total || 0,
      totalPages: res?.meta?.pages || 0,
    };
  } catch (error) {
    throw new Error(error);
  }
}
export async function getUserTransactionService(phone, page = 1, limit = 10) {
  const user = JSON.parse(sessionStorage.getItem("user"));

  const { token } = user;

  try {
    const response = await fetchAPI(
      `admin/transactions?phone=${encodeURIComponent(
        phone,
      )}&page=${page}&limit=${limit}`,
      "GET",
      null,
      token
    );
    return {
      transactions: (response?.data || []).map((transaction) => ({
        ...transaction,
        transactionCode:
          transaction.receipt || transaction.externalId || transaction.secureId,
      })),
      currentPage: response?.meta?.page || page,
      limit: response?.meta?.limit || limit,
      transactionsLength: response?.meta?.total || 0,
      totalPages: response?.meta?.pages || 0,
    };
  } catch (error) {
    throw new Error(
      error.message || "Something went wrong while fetching transactions"
    );
  }
}
export async function exportTransactions(start, end) {
  if (!start || !end) {
    throw new Error("Start and end dates are required");
  }

  await downloadAuthenticatedFile(
    `admin/exports/transactions?${exportDateQuery(start, end)}`,
    `transactions-${start}-to-${end}.csv`,
  );
  return { message: "Transactions exported successfully" };
}

function staffToken() {
  return JSON.parse(sessionStorage.getItem("user") || "null")?.token;
}

export async function reconcileWithdrawal(transactionId) {
  return fetchAPI(
    `admin/transactions/${transactionId}/reconcile`,
    "POST",
    {},
    staffToken(),
  );
}

export async function resolveWithdrawal(transactionId, resolution) {
  return fetchAPI(
    `admin/transactions/${transactionId}/resolve`,
    "POST",
    resolution,
    staffToken(),
  );
}
