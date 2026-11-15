import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { AdminRoute, ProtectedRoute } from "./lib/auth";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Parcels from "./pages/Parcels";
import ParcelNew from "./pages/ParcelNew";
import ParcelDetail from "./pages/ParcelDetail";
import Simulator from "./pages/Simulator";
import Campaigns from "./pages/Campaigns";
import Health from "./pages/Health";
import Nasa from "./pages/Nasa";
import Admin from "./pages/Admin";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/entrar" element={<Login />} />
      <Route path="/registro" element={<Register />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="parcelas" element={<Parcels />} />
        <Route path="parcelas/nueva" element={<ParcelNew />} />
        <Route path="parcelas/:id" element={<ParcelDetail />} />
        <Route path="simulador" element={<Simulator />} />
        <Route path="campanas" element={<Campaigns />} />
        <Route path="sanidad" element={<Health />} />
        <Route path="nasa" element={<Nasa />} />
        <Route path="cuenta" element={<Account />} />
        <Route
          path="admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />
      </Route>

      <Route path="/app/*" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
