import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import StorePage from "./pages/StorePage";

const StoreProductPage = lazy(() => import("./pages/StoreProductPage"));

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StorePage />} />
        <Route path="/producto/:id" element={
          <Suspense fallback={<div style={{ minHeight: "100vh", background: "#fff" }} />}>
            <StoreProductPage />
          </Suspense>
        } />
      </Routes>
    </BrowserRouter>
  );
}
