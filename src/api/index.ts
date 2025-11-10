import axios from "axios";
// import { apiStatesActions } from "../store/api-states/api-states";
// import { authActions } from "../store/auth/auth";
// import { store } from "../store/index";

// const baseURL = "http://localhost:3040/api/v1/";
const baseURL = import.meta.env.VITE_BASE_URL;
// const baseURL = "https://dashboard-backend-node.onrender.com/api/v1/";

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

  const headers = () => {
    const token = localStorage.getItem("token");

    return token
      ? {
          headers: {
            Authorization: `Bearer ${JSON.parse(token)}`,
            ...configuration,
          },
        }
      : { headers: { ...configuration } };
  };

  const apiInterceptor = axios.create({
    baseURL,
    timeoutErrorMessage: "Request timeout! please retry.",
    withCredentials: true,
    // credentials: "include",
    ...headers(),
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
