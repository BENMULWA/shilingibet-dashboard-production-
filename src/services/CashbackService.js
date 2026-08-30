import { fetchAPI } from "../utils/fetchRequest";

export async function cashbacksService(page = 1, limit = 10, phone = "") {
  const user = JSON.parse(sessionStorage.getItem("user"));

  const token = user.token;
  try {
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (phone) query.set("phone", phone);
    const res = await fetchAPI(
      `admin/cashback/awards?${query.toString()}`,
      "GET",
      null,
      token
    );
    return { awards: res?.data || [], pagination: res?.meta || {} };
  } catch (error) {
    throw new Error(error);
  }
}
