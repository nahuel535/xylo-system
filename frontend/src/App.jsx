import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import NewProductPage from "./pages/NewProductPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import SellProductPage from "./pages/SellProductPage";
import SoldProductsPage from "./pages/SoldProductsPage";
import EditProductPage from "./pages/EditProductPage";
import SalesPage from "./pages/SalesPage";
import SaleDetailPage from "./pages/SaleDetailPage";
import ScanRedirectPage from "./pages/ScanRedirectPage";
import ProductLabelPage from "./pages/ProductLabelPage";
import ScannerPage from "./pages/ScannerPage";

function Layout() {
  return (
    <div className="flex min-h-screen bg-base-bg text-base-text">
      <Sidebar />
      <main className="flex-1 p-8">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/new" element={<NewProductPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/products/:id/sell" element={<SellProductPage />} />
          <Route path="/sold-products" element={<SoldProductsPage />} />
          <Route path="/products/:id/edit" element={<EditProductPage />} />
          <Route path="/sales/:id" element={<SaleDetailPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/scan/:id" element={<ScanRedirectPage />} />
          <Route path="/products/:id/label" element={<ProductLabelPage />} />
          <Route path="/scanner" element={<ScannerPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}