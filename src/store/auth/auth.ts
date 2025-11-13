// src/store/auth/auth.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { stat } from "fs";

interface AuthData {
  role: string;
  email: string;
  fullName: string;
}

interface AuthState {
  authData: AuthData;
  token: boolean;
  error: string;
}


const initialState: AuthState = {
  authData: {
    role: "",
    email: "",
    fullName: "",
  },
  token: false,
  error: "",
};


const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    role: (state, action: PayloadAction<{ role: string }>) => {
      state.authData.role = action.payload.role.toLowerCase();
    },
    email: (state, action: PayloadAction<{ email: string }>) => {
      state.authData.email = action.payload.email;
    },
    fullName: (state, action: PayloadAction<{ fullName: string }>) => {
      state.authData.fullName = action.payload.fullName;
    },
    error: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    logout: (state) => {
      state.token = false;
      state.authData = { role: "", email: "", fullName: "" };
      state.error = "";
    },
    login: (state, action: PayloadAction<{ email: string, fullName: string }>) => {
      state.authData.email = action.payload.email;
      state.authData.fullName = action.payload.fullName;
      state.token = true;
    },
  },
});

export const authActions = authSlice.actions;

export default authSlice.reducer;
