import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { syncThemeWithLocal } from "./helpers/theme_helpers";
import { useTranslation } from "react-i18next";
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ConnectionPage } from './pages/ConnectionPage';
import { DashboardPage } from './pages/DashboardPage';
import BaseLayout from "./layouts/BaseLayout";

export function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    syncThemeWithLocal();
  }, [i18n]);

  return (
    <Router>
      <BaseLayout>
        <Routes>
          <Route path="/" element={<ConnectionPage />} />
          <Route path="/dashboard/:connectionId" element={<DashboardPage />} />
        </Routes>
        <Toaster duration={1500} />
      </BaseLayout>
    </Router>
  );
}

const root = createRoot(document.getElementById("app")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
