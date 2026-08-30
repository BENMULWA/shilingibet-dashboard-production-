import { fetchAPI } from "../utils/fetchRequest";

export async function pauseAccount(id) {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const token = user?.token;

  try {
    const res = await fetchAPI(
      `admin/users/${id}/controls`,
      "PATCH",
      { status: "suspended" },
      token,
    );
    return res;
  } catch (error) {
    throw new Error(error?.message || "Failed to pause account");
  }
}
export async function activateAccount(id) {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const token = user?.token;

  try {
    const res = await fetchAPI(
      `admin/users/${id}/controls`,
      "PATCH",
      { status: "active" },
      token,
    );
    return res;
  } catch (error) {
    throw new Error(error?.message || "Failed to activate account");
  }
}
export async function pauseWithdrawal(id) {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const token = user?.token;

  try {
    const res = await fetchAPI(
      `admin/users/${id}/controls`,
      "PATCH",
      { withdrawalPaused: true },
      token,
    );
    return res;
  } catch (error) {
    throw new Error(error?.message || "Failed to pause withdrawals");
  }
}

export async function activateWithdrawal(id) {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const token = user?.token;

  try {
    const res = await fetchAPI(
      `admin/users/${id}/controls`,
      "PATCH",
      { withdrawalPaused: false },
      token,
    );
    return res;
  } catch (error) {
    throw new Error(error?.message || "Failed to activate withdrawals");
  }
}
export async function pauseDeposit(id) {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const token = user?.token;

  try {
    const res = await fetchAPI(
      `admin/users/${id}/controls`,
      "PATCH",
      { depositPaused: true },
      token,
    );
    return res;
  } catch (error) {
    throw new Error(error?.message || "Failed to pause deposits");
  }
}
export async function activateDeposit(id) {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const token = user?.token;

  try {
    const res = await fetchAPI(
      `admin/users/${id}/controls`,
      "PATCH",
      { depositPaused: false },
      token,
    );
    return res;
  } catch (error) {
    throw new Error(error?.message || "Failed to activate deposits");
  }
}

export async function zeroBalance(userID) {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const token = user?.token;
  try {
    const response = await fetchAPI(
      `admin/users/${userID}/zero-balance`,
      "POST",
      null,
      token,
    );
    return response;
  } catch (error) {
    throw new Error(error?.message || "Something went wrong");
  }
}

// Delete Account
export async function deleteAccount(userID) {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const token = user?.token;
  try {
    if (!token) {
      throw new Error("Something went wrong");
    }
    const response = await fetchAPI(
      `admin/users/${userID}`,
      "DELETE",
      null,
      token
    );

    return response;
  } catch (error) {
    throw new Error(error?.message || "Something went wrong");
  }
}
