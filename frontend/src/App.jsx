import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import NewProductPage from "./pages/NewProductPage";
import SoldProductsPage from "./pages/SoldProductsPage";
import SaleDetailPage from "./pages/SaleDetailPage";
import EditSalePage from "./pages/EditSalePage";
import SalesPage from "./pages/SalesPage";
import ExchangePage from "./pages/ExchangePage";
import ScannerPage from "./pages/ScannerPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import EditProductPage from "./pages/EditProductPage";
import SellProductPage from "./pages/SellProductPage";
import ProductLabelPage from "./pages/ProductLabelPage";
import ScanRedirectPage from "./pages/ScanRedirectPage";
import StorePage from "./pages/public/StorePage";
import StoreProductPage from "./pages/public/StoreProductPage";
import UsersPage from "./pages/UsersPage";

function Layout() {
  return (
    <div className="flex min-h-screen bg-base-bg text-base-text">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 pb-24 md:pb-8">
        <Routes>
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/scanner" element={<ProtectedRoute><ScannerPage /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
          <Route path="/sold-products" element={<ProtectedRoute><SoldProductsPage /></ProtectedRoute>} />
          <Route path="/sales" element={<ProtectedRoute><SalesPage /></ProtectedRoute>} />
          <Route path="/sales/:id" element={<ProtectedRoute><SaleDetailPage /></ProtectedRoute>} />
          <Route path="/sales/:id/edit" element={<ProtectedRoute requireAdmin><EditSalePage /></ProtectedRoute>} />
          <Route path="/exchange" element={<ProtectedRoute><ExchangePage /></ProtectedRoute>} />
          <Route path="/products/new" element={<ProtectedRoute requireAdmin><NewProductPage /></ProtectedRoute>} />
          <Route path="/products/:id" element={<ProtectedRoute><ProductDetailPage /></ProtectedRoute>} />
          <Route path="/products/:id/edit" element={<ProtectedRoute requireAdmin><EditProductPage /></ProtectedRoute>} />
          <Route path="/products/:id/sell" element={<ProtectedRoute><SellProductPage /></ProtectedRoute>} />
          <Route path="/products/:id/label" element={<ProtectedRoute><ProductLabelPage /></ProtectedRoute>} />
          <Route path="/scan/:id" element={<ScanRedirectPage />} />
          <Route path="/users" element={<ProtectedRoute requireAdmin><UsersPage /></ProtectedRoute>} />

        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/store" element={<StorePage />} />
          <Route path="/store/:id" element={<StoreProductPage />} />
          <Route path="/*" element={<Layout />} />
        </Routes>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}