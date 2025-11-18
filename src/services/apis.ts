// import apiHandler from "../../api";
import apiHandler from "@/api";

export const get = async ({
  end_point = "",
  token = false,
  configuration = {},
}) => {
  configuration = {
    "Content-Type": "application/json",
    Accept: "*/*",
    ...configuration,
  };
  try {
    const response = await apiHandler({
      method: "get",
      end_point,
      token,
      configuration,
    });
    return response.data;
  } catch (error) {
    console.error("GET request error:", error);
    throw error;
  }
};

export const post = async ({
  end_point = "",
  body = {},
  token = false,
  configuration = {},
}) => {
  try {
    const response = await apiHandler({
      method: "post",
      end_point,
      body,
      token,
      configuration,
    });
    return response.data;
  } catch (error) {
    console.error("POST request error:", error);
    throw error;
  }
};

export const patch = async ({
  end_point = "",
  body = {},
  token = false,
  configuration = {},
}) => {
  try {
    const response = await apiHandler({
      method: "patch",
      end_point,
      body,
      token,
      configuration,
    });
    return response.data;
  } catch (error) {
    console.error("PATCH request error:", error);
    throw error;
  }
};

export const deleteApi = async ({
  end_point = "",
  token = false,
  configuration = {},
}) => {
  try {
    const response = await apiHandler({
      method: "delete",
      end_point,
      token,
      configuration,
    });
    return response.data;
  } catch (error) {
    console.error("DELETE request error:", error);
    throw error;
  }
};
