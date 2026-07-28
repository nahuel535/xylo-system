import { BrowserRouter, Routes, Route } from "react-router-dom";
import StorePage from "./pages/StorePage";
import StoreProductPage from "./pages/StoreProductPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StorePage />} />
        <Route path="/producto/:id" element={<StoreProductPage />} />
      </Routes>
    </BrowserRouter>
  );
}
