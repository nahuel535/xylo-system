export const trackPageView = () => {
  if (window.fbq) {
    window.fbq("track", "PageView");
  }
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
};
