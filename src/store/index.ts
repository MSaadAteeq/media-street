// src/store/index.ts
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import loginReducer from "./auth/auth";
import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore, Persistor } from "redux-persist";
import thunk from "redux-thunk";

const rootReducerConfig = {
  key: "root",
  storage,
};

const authPersistConfig = {
  key: "auth",
  storage,
};


const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, loginReducer),
});

const persistedReducer = persistReducer(rootReducerConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  // middleware: (getDefaultMiddleware) =>
  //   getDefaultMiddleware({
  //     serializableCheck: true,
  //   }).concat(thunk), //
});


export const persistor: Persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
