import { useAuth } from "../context/AuthContext";
import DashboardPage from "./DashboardPage";
import SellerDashboardPage from "./SellerDashboardPage";


export default function HomePage() {
  const { user } = useAuth();
  return user?.role === "admin" ? <DashboardPage /> : <SellerDashboardPage />;
}
