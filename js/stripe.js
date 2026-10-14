"use strict";

// ============================================================================
// STOREFRONT & STRIPE CONFIGURATION
// ============================================================================
const STOREFRONT_CONFIG = Object.freeze({
  stripePublishableKey:
    window.STRIPE_PUBLISHABLE_KEY ||
    "pk_live_51UPmUc4gLJkkftaejlSDGISoMB5ZyLg3uR4D5GLCWO2NilHYZ6qHpkc3txnAP6kthvp9yIATbIaZtvqnbv8lTbHr000U3h4D1d",
  productsEndpoint: window.STORE_PRODUCTS_ENDPOINT || "/api/store/products",
  checkoutEndpoint:
    window.STORE_CHECKOUT_ENDPOINT || "/api/store/create-checkout-session",
  defaultCurrency: "GBP",
});

// ============================================================================
// STOREFRONT DATA & CHECKOUT MODULE
// ============================================================================

const Storefront = {
  /**
   * Normalize the public product shape returned by the store backend.
   */
  normalizeProduct: (product, index) => {
    if (!product || typeof product !== "object") return null;

    const unitAmount = Number(
      product.unitAmount ?? product.price ?? product.priceCents,
    );
    const id = String(product.id ?? product.productId ?? "").trim();
    const name = String(product.name ?? "").trim();

    if (!id || !name || !Number.isFinite(unitAmount) || unitAmount < 0)
      return null;

    const metadata =
      product.metadata && typeof product.metadata === "object"
        ? product.metadata
        : {};

    // 1. Start with the main product image (index 0)
    const images = [];
    if (typeof product.image === "string" && product.image.trim()) {
      images.push(product.image.trim());
    }

    // 2. Collect image_1 through image_10 from metadata (case-insensitive key check)
    const metaKeys = Object.keys(metadata);
    for (let i = 1; i <= 10; i++) {
      const matchKey = metaKeys.find(
        (k) => k.toLowerCase() === `image_${i}`
      );
      if (matchKey && metadata[matchKey]) {
        const url = String(metadata[matchKey]).trim();
        if (url && !images.includes(url)) {
          images.push(url);
        }
      }
    }

    const metadataComingSoon = String(
      metadata.coming_soon ?? metadata.status ?? "",
    ).toLowerCase();
    const comingSoon =
      product.comingSoon === true ||
      product.coming_soon === true ||
      metadataComingSoon === "true" ||
      metadataComingSoon === "coming_soon" ||
      product.available === false ||
      product.inStock === false;

    const metadataLimited = String(metadata.limited_edition ?? metadata.limited ?? "").toLowerCase();
    const limitedEdition = product.limitedEdition === true || metadataLimited === "true" || metadataLimited === "limited";
    const shippingNote = String(metadata.ship_date ?? metadata.shipping_note ?? "").trim();

    return {
      id,
      priceId: String(product.priceId ?? product.stripePriceId ?? id),
      name,
      description: String(product.description ?? ""),
      type: String(product.type ?? product.category ?? "Store item"),
      image: images[0] || "", // Primary image fallback
      images: images,        // Full array of images in exact sequential order
      unitAmount,
      currency: String(
        product.currency ?? STOREFRONT_CONFIG.defaultCurrency,
      ).toUpperCase(),
      comingSoon,
      limitedEdition,
      shippingNote,
      available: !comingSoon,
      index,
    };
  },

  formatPrice: (unitAmount, currency) => {
    try {
      return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: currency || STOREFRONT_CONFIG.defaultCurrency,
      }).format(unitAmount / 100);
    } catch {
      return `${(unitAmount / 100).toFixed(2)} ${currency || STOREFRONT_CONFIG.defaultCurrency}`;
    }
  },

  /**
   * Fetch public catalogue data. Configure productsEndpoint to return either
   * an array or an object with a `products` array; never call Stripe's secret
   * Products API directly from the browser.
   */
  async fetchProducts() {
    const response = await fetch(STOREFRONT_CONFIG.productsEndpoint, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok)
      throw new Error(`Store product request failed: ${response.status}`);

    const payload = await response.json();
    const products = Array.isArray(payload) ? payload : payload?.products;
    if (!Array.isArray(products))
      throw new Error("Store product response is invalid");

    return products
      .map((product, index) => this.normalizeProduct(product, index))
      .filter(Boolean);
  },

  /**
   * Request a server-created Stripe Checkout Session, then redirect to its
   * HTTPS URL. Insert Stripe server SDK/session creation at checkoutEndpoint.
   */
  async beginCheckout(productId, priceId, button) {
    if (!productId || !priceId || button?.disabled) return;

    const originalLabel = button.innerHTML;
    button.disabled = true;
    button.innerHTML =
      '<i class="fas fa-spinner fa-spin me-2"></i>Redirecting…';

    try {
      // Backend responsibility: validate the price ID and create a Stripe
      // Checkout Session with the Stripe secret key. Return { url } only.
      const response = await fetch(STOREFRONT_CONFIG.checkoutEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ productId, priceId }),
      });

      if (!response.ok)
        throw new Error(`Checkout request failed: ${response.status}`);

      const payload = await response.json();
      const checkoutUrl = new URL(payload?.url || "", location.origin);
      if (checkoutUrl.protocol !== "https:")
        throw new Error("Invalid checkout URL");

      window.location.assign(checkoutUrl.href);
    } catch (error) {
      console.error("Checkout could not start", error);
      
      // Fallback toast if Utils.toast exists globally, else console/alert
      if (typeof Utils !== "undefined" && Utils.toast) {
        Utils.toast(
          "Checkout is not available right now. Please try again later.",
          "error",
        );
      } else {
        alert("Checkout is not available right now. Please try again later.");
      }

      button.disabled = false;
      button.innerHTML = originalLabel;
    }
  },

  bindCheckout: (container) => {
    container.addEventListener("click", (event) => {
      const button = event.target.closest("[data-store-checkout]");
      if (!button) return;

      Storefront.beginCheckout(
        button.dataset.productId,
        button.dataset.priceId,
        button,
      );
    });
  },
};