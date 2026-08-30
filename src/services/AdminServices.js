import { fetchAPI } from "../utils/fetchRequest";

function getToken() {
  const user = JSON.parse(sessionStorage.getItem("user"));
  return user?.token;
}

export async function creditUserWallet({ userId, amount }) {
  const token = getToken();
  return fetchAPI(
    "users/credit",
    "POST",
    { userId, amount: Number(amount) },
    token
  );
}

export async function createEvent(payload) {
  const token = getToken();
  return fetchAPI("events", "POST", payload, token);
}

export async function settleEvent({ eventId, result }) {
  const token = getToken();
  return fetchAPI(`events/${eventId}/settle`, "POST", { result }, token);
}

export async function cancelEvent({ eventId }) {
  const token = getToken();
  return fetchAPI(`events/${eventId}/cancel`, "POST", null, token);
}

export async function createVirtualShortcode({ gameUuid, payload }) {
  const token = getToken();
  return fetchAPI(`virtuals/shortcode/${gameUuid}`, "POST", payload, token);
}
