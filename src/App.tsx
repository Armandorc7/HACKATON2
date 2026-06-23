
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { SectorStoryPage } from "./pages/SectorStoryPage";
import { SectorsPage } from "./pages/SectorsPage";
import { SignalDetailPage } from "./pages/SignalDetailPage";
import { SignalsFeedPage } from "./pages/SignalsFeedPage";
import { TropelsPage } from "./pages/TropelsPage";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tropels" element={<TropelsPage />} />
            <Route path="/signals" element={<SignalsFeedPage />} />
            <Route path="/signals/:id" element={<SignalDetailPage />} />
            <Route path="/sectors" element={<SectorsPage />} />
          </Route>
          <Route path="/sectors/:id/story" element={<SectorStoryPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
