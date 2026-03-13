import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";

import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import NewProductPage from "./pages/NewProductPage";
import SoldProductsPage from "./pages/SoldProductsPage";
import SalesPage from "./pages/SalesPage";
import ExchangePage from "./pages/ExchangePage";
import ScannerPage from "./pages/ScannerPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import EditProductPage from "./pages/EditProductPage";
import SellProductPage from "./pages/SellProductPage";
import ProductLabelPage from "./pages/ProductLabelPage";
import ScanRedirectPage from "./pages/ScanRedirectPage";

function Layout() {
  return (
     <div className="flex min-h-screen bg-base-bg text-base-text">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 pb-24 md:pb-8">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/scanner" element={<ScannerPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/sold-products" element={<SoldProductsPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/exchange" element={<ExchangePage />} />
          <Route path="/products/new" element={<NewProductPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/products/:id/edit" element={<EditProductPage />} />
          <Route path="/products/:id/sell" element={<SellProductPage />} />
          <Route path="/products/:id/label" element={<ProductLabelPage />} />
          <Route path="/scan/:id" element={<ScanRedirectPage />} />
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