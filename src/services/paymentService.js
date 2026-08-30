import { fetchAPI } from "../utils/fetchRequest";

export async function getSecondaryWallet() {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const token = user?.token;
  try {
    const response = await fetchAPI(
      `admin/treasury/withdrawals`,
      "GET",
      null,
      token
    );
    return response?.data;
  } catch (error) {
    throw new Error(error?.message || "Something went wrong");
  }
}

export async function transferSecondaryWallet({ amount }) {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const token = user?.token;
  try {
    const response = await fetchAPI(
      `admin/treasury/withdrawals/allocations`,
      "POST",
      {
        amount: +amount,
        idempotencyKey: crypto.randomUUID(),
        note: "Dashboard treasury allocation",
      },
      token
    );
    return response;
  } catch (error) {
    throw new Error(error?.message || "Something went wrong");
  }
}
