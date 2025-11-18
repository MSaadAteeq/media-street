import axios from "axios";
// import { apiStatesActions } from "../store/api-states/api-states";
// import { authActions } from "../store/auth/auth";
// import { store } from "../store/index";

// Backend API base URL
const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1/";

let logoutTimeoutId = null;

console.log(baseURL)

const apiHandler = async ({
  token = false,
  method = "get",
  end_point = "",
  body = {},
  configuration = {},
}) => {
  // store.dispatch(apiStatesActions.startLoading());
  // store.dispatch(apiStatesActions.clearError());

  // Get token from localStorage if token parameter is true
  let tokenValue = null;
  if (token) {
    const storedToken = localStorage.getItem("token");
    tokenValue = storedToken ? (storedToken.startsWith('"') ? JSON.parse(storedToken) : storedToken) : null;
  }

  const apiInterceptor = axios.create({
    baseURL,
    timeout: 30000,
    timeoutErrorMessage: "Request timeout! please retry.",
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
      ...(tokenValue && { Authorization: `Bearer ${tokenValue}` }),
      ...configuration,
    },
  });

  const createError = (message, status) => {
    const error = new Error(message);
    // error.status = status;
    // store.dispatch(apiStatesActions.setError({ error: error?.message }));
    return error;
  };

  apiInterceptor.interceptors.request.use(
    (req) => req,
    (error) => Promise.reject(error)
  );

  apiInterceptor.interceptors.response.use(
    (res) => res,
    (error) => Promise.reject(error)
  );

  try {
    const res = await apiInterceptor[method](end_point, body);

    if (logoutTimeoutId) {
      clearTimeout(logoutTimeoutId);
      logoutTimeoutId = null;
    }

    return res;
  } catch (error) {
    if (error.response) {
      const statusCode = error.response.status;

      if (statusCode >= 500) {
        throw createError(
          "Something went wrong! Please try again later.",
          statusCode
        );
      } else if (statusCode === 401) {
        if (logoutTimeoutId) clearTimeout(logoutTimeoutId);

        logoutTimeoutId = setTimeout(() => {
          localStorage.removeItem("token");
          // store.dispatch(authActions.logout());
          logoutTimeoutId = null;
        }, 2000);

        throw createError(
          error.response.data?.message || "An error occurred.",
          statusCode
        );
      } else {
        throw createError(
          error.response.data?.message || "An error occurred.",
          statusCode
        );
      }
    } else if (error.request) {
      throw createError(
        "No response from the server. Please check your connection.",
        503
      );
    } else {
      throw createError(error.message || "An unexpected error occurred.", 500);
    }
  } finally {
    // store.dispatch(apiStatesActions.stopLoading());
  }
};

export default apiHandler;
