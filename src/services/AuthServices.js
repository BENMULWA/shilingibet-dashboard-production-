import { fetchAPI } from "../utils/fetchRequest";

export async function login({ phone, password }) {
  try {
    const response = await fetchAPI("users/staff-login", "POST", {
      phone,
      password,
    });

    return response.data;
  } catch (error) {
    throw new Error(error?.message || "Something went wrong");
  }
}

export async function forgotPassword(phone) {
  return fetchAPI("users/request-password-reset", "POST", { phone });
}
export async function resetPassword({ phone, newPassword, code }) {
  return fetchAPI("users/reset-password", "POST", {
    phone,
    newPassword,
    code,
  });
}

export async function createAdmin({ phone, password, role }) {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const token = user?.token;

  try {
    const response = await fetchAPI(
      "admin/staff",
      "POST",
      { phone, password, adminLevel: role },
      token,
    );

    return response.data;
  } catch (error) {
    throw new Error(error?.message || "Something went wrong");
  }
}
export async function deleteAccount() {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const token = user?.token;

  try {
    const response = await fetchAPI(
      "user/delete-account",
      "DELETE",
      null,
      token,
    );

    return response;
  } catch (error) {
    throw new Error(error?.message || "Something went wrong");
  }
}
