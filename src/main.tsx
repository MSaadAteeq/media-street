// Explicitly import React first to ensure it's available for useSyncExternalStore
import 'react';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);
