const pixelId = import.meta.env.VITE_META_PIXEL_ID?.trim();
const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();

export const initializeAnalytics = () => {
  if (pixelId && /^\d+$/.test(pixelId) && !window.fbq) {
    const fbq = function (...args) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue.push(args);
    };
    window.fbq = fbq;
    window._fbq = fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
    fbq("init", pixelId);
    fbq("track", "PageView");
  }

  if (gaId && /^G-[A-Z0-9]+$/i.test(gaId) && !window.gtag) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", gaId);
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
    document.head.appendChild(script);
  }
};

const trackGa = (eventName, params = {}) => {
  if (window.gtag) window.gtag("event", eventName, params);
};

export const trackPageView = () => {
  if (window.fbq) {
    window.fbq("track", "PageView");
  }
  trackGa("page_view");
};

export const trackViewContent = (product) => {
  if (window.fbq && product) {
    window.fbq("track", "ViewContent", {
      content_ids: [String(product.id)],
      content_name: product.model,
      content_type: "product",
      value: Number(product.suggested_sale_price_usd || 0),
      currency: "USD",
    });
  }
  if (product) trackGa("view_item", productParams(product));
};

export const trackContact = (product) => {
  if (window.fbq && product) {
    window.fbq("track", "Contact", {
      content_ids: [String(product.id)],
      content_name: product.model,
      content_type: "product",
      value: Number(product.suggested_sale_price_usd || 0),
      currency: "USD",
    });
  }
  if (product) trackGa("contact", productParams(product));
};

export const trackPurchase = (product) => {
  if (window.fbq && product) {
    window.fbq("track", "Purchase", {
      content_ids: [String(product.id)],
      content_name: product.model,
      content_type: "product",
      value: Number(product.suggested_sale_price_usd || 0),
      currency: "USD",
    });
  }
  if (product) trackGa("purchase", productParams(product));
};

export const trackReservationRequest = (product) => {
  if (window.fbq && product) {
    window.fbq("trackCustom", "ReservationRequest", productParams(product));
  }
  if (product) trackGa("generate_lead", { ...productParams(product), lead_type: "reservation" });
};

function productParams(product) {
  return {
    content_ids: [String(product.id)],
    content_name: product.model,
    content_type: "product",
    value: Number(product.suggested_sale_price_usd || 0),
    currency: "USD",
    items: [{
      item_id: String(product.id),
      item_name: product.model,
      price: Number(product.suggested_sale_price_usd || 0),
      quantity: 1,
    }],
  };
}
