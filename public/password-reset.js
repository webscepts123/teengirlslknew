import { api, message } from "./feature-client.js";
document.getElementById("reset-form").onsubmit = async (event) => {
  event.preventDefault();
  try {
    const data = await api(
      "/customer/reset-password",
      Object.fromEntries(new FormData(event.target)),
    );
    message(data.message);
    location.href = "/login";
  } catch (error) {
    message(error.message);
  }
};
