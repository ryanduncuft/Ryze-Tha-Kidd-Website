"use strict";

const Stripe = require("stripe");

let stripeClient;
const getStripe = () => {
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    if (!stripeClient) {
        stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
    return stripeClient;
};

exports.handler = async function (event, context) {
    const productId = event.queryStringParameters && event.queryStringParameters.id;

    if (!productId) {
        return {
            statusCode: 302,
            headers: { Location: "/store.html" },
            body: "Redirecting..."
        };
    }

    try {
        const stripe = getStripe();
        const product = await stripe.products.retrieve(productId);
        
        // Fetch active prices and find a valid one-time price just like products.js does
        const prices = await stripe.prices.list({ 
            product: product.id, 
            active: true, 
            type: "one_time",
            limit: 100 
        });
        
        const priceObj = prices.data.find(item => Number.isInteger(item.unit_amount)) || prices.data[0] || {};
        
        const unitAmount = priceObj.unit_amount || 0;
        const currency = (priceObj.currency || "gbp").toUpperCase();
        const formattedPrice = new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(unitAmount / 100);
        
        const name = product.name || "Official Merchandise";
        const description = product.description || "Official item from Ryze Tha Kidd.";
        const meta = product.metadata || {};
        
        // Gather images from Stripe product gallery and explicitly mapped metadata keys (image_1, image_2, etc.)
        let images = Array.isArray(product.images) && product.images.length > 0 
            ? [...product.images] 
            : [];

        Object.keys(meta).forEach(key => {
            if (key.startsWith("image_") && meta[key]) {
                images.push(meta[key]);
            }
        });

        if (images.length === 0) {
            images = ["https://res.cloudinary.com/dvju1xiaw/image/upload/f_auto,q_auto/v1792020777/Logo-rtk_dzt3wv.png"];
        }

        images = [...new Set(images)];

        const primaryImageUrl = images[0];
        const canonicalUrl = `https://www.ryzethakidd.com/store.html?id=${product.id}`;

        const isLimited = String(meta.limited_edition || "").toLowerCase() === "true";
        const limitedText = isLimited ? "Made-to-order batch. Secure your copy now!" : null;
        const limitedEditionClass = limitedText ? "d-flex" : "d-none";

        // Check if coming_soon is true in metadata (case-insensitive)
        const metadataComingSoon = String(meta.coming_soon || meta.status || "").toLowerCase();
        const isComingSoon = metadataComingSoon === "true" || metadataComingSoon === "coming_soon";

        const thumbnailsHtml = images.map((imgUrl, index) => `
            <img src="${imgUrl}" alt="${escapeHtml(name)} view ${index + 1}" class="rounded border object-fit-cover shadow-sm" style="width: 75px; height: 75px; cursor: pointer; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'" onclick="document.getElementById('detail-image').src='${imgUrl}'" />
        `).join("");

        const jsonLdData = {
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": name,
            "image": images,
            "description": description,
            "brand": {
                "@type": "Brand",
                "name": "Ryze Tha Kidd"
            },
            "offers": {
                "@type": "Offer",
                "url": canonicalUrl,
                "priceCurrency": currency,
                "price": (unitAmount / 100).toFixed(2),
                "priceValidUntil": "2027-12-31",
                "itemCondition": "https://schema.org/NewCondition",
                "availability": isComingSoon ? "https://schema.org/OutOfStock" : "https://schema.org/InStock"
            }
        };

        const jsonLdString = JSON.stringify(jsonLdData);
        const priceIdValue = priceObj.id || "";
        const productIdValue = product.id || "";

        if (!priceIdValue && !isComingSoon) {
            console.error("Warning: No active price ID found for product:", product.id);
        }

        // Generate button HTML based on whether the product is coming soon
        const actionButtonHtml = isComingSoon
            ? `<button id="detail-checkout-btn" type="button" class="btn btn-secondary btn-lg w-100 disabled" disabled>Coming Soon</button>`
            : `<button id="detail-checkout-btn" type="button" class="btn btn-primary btn-lg w-100" data-product-id="${escapeHtml(productIdValue)}" data-price-id="${escapeHtml(priceIdValue)}">Proceed to Checkout</button>`;

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>${escapeHtml(name)} | Ryze Tha Kidd</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="canonical" href="${canonicalUrl}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="product">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:title" content="${escapeHtml(name)} | Ryze Tha Kidd">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${primaryImageUrl}">
    <meta property="og:locale" content="en_GB">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(name)} | Ryze Tha Kidd">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${primaryImageUrl}">

    <!-- Google Product Schema.org JSON-LD (Required for Rich Results & Merchant Center) -->
    <script type="application/ld+json">
    ${jsonLdString}
    </script>

    <!-- Stylesheets -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
    <link rel="stylesheet" href="https://cdn.ryzethakidd.com/shared/site.css">
    <script>window.ARTIST_ID = "ryzethakidd";</script>
    <script src="https://cdn.ryzethakidd.com/shared/main.js" defer></script>
</head>
<body>
    <div class="scroll-trigger-sentinel"></div>
    <canvas aria-hidden="true" id="interactive-bg"></canvas>

    <!-- Navigation Header -->
    <header id="navbar-container"></header>

    <main class="container flex-grow-1 py-5 py-md-7 w-100" id="main-content">
        <div id="store-detail-view">
            <div class="mb-4">
                <a href="/store.html" class="link-arrow">
                    <i class="fas fa-arrow-left me-2"></i>Back to Shop
                </a>
            </div>
            <div class="row g-5 align-items-start">
                <div class="col-lg-6">
                    <div class="store-product-media rounded-4 overflow-hidden border mb-3 position-relative" style="aspect-ratio: 1 / 1; background: var(--bs-body-bg);">
                        <img id="detail-image" src="${primaryImageUrl}" alt="${escapeHtml(name)}" class="w-100 h-100 object-fit-cover position-absolute top-0 start-0" />
                    </div>
                    <!-- Dynamic Image Thumbnails Container -->
                    <div id="detail-thumbnails" class="d-flex gap-2 flex-wrap">
                        ${thumbnailsHtml}
                    </div>
                </div>
                <div class="col-lg-6 d-flex flex-column gap-3">
                    <span id="detail-type" class="text-muted small text-uppercase fw-bold">${escapeHtml(meta.category || meta.type || "Store item")}</span>
                    <h1 id="detail-title" class="display-5 fw-bold mb-0">${escapeHtml(name)}</h1>
                    <div id="detail-price" class="fs-3 fw-900 text-primary mb-0">${formattedPrice}</div>

                    <!-- Conditional Limited Edition Pre-Order Badge -->
                    <div id="limited-edition-banner" class="p-3 rounded-3 border ${limitedEditionClass} align-items-center gap-2 small" style="background: var(--card-bg); border-color: var(--border-color) !important; color: var(--text-primary);">
                        <i class="fas fa-fire fs-5 text-warning"></i>
                        <div id="limited-edition-banner-text">
                            <strong>Limited Edition Pre-Order:</strong> <span class="fw-semibold">Made-to-order batch. Secure your copy now!</span>
                        </div>
                    </div>

                    <!-- Shipping Information Badge -->
                    <div class="p-3 rounded-3 border d-flex align-items-center gap-2 small" style="background: var(--card-bg); border-color: var(--border-color) !important; color: var(--text-primary);">
                        <i class="fas fa-truck fs-5" style="color: var(--accent);"></i>
                        <div>
                            <strong>Tracked Shipping:</strong> <span class="fw-semibold" style="color: var(--accent);">UK Free</span> | Europe £8.99 | Rest of World £13.99
                        </div>
                    </div>

                    <!-- Returns & Guarantee Policy Badge -->
                    <div class="p-3 rounded-3 border d-flex align-items-center gap-2 small" style="background: var(--card-bg); border-color: var(--border-color) !important; color: var(--text-primary);">
                        <i class="fas fa-rotate-left fs-5" style="color: var(--accent);"></i>
                        <div>
                            <strong>14-Day Money-Back Guarantee:</strong> Unopened physical media can be returned within 14 days. Read our <a href="/returns" class="text-decoration-underline" style="color: var(--accent);">Return & Refund Policy</a>.
                        </div>
                    </div>

                    <p id="detail-description" class="text-muted" style="white-space: pre-line;">${escapeHtml(description)}</p>
                    
                    <div class="mt-3">
                        ${actionButtonHtml}
                        <p class="text-center text-muted small mt-2 mb-0">
                            <i class="fas fa-shield-halved me-1"></i> Secure checkout powered by Stripe
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Footer -->
    <footer id="footer-container"></footer>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/js/bootstrap.bundle.min.js" defer></script>
    
    <!-- Direct Checkout Handler Script -->
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const btn = document.getElementById('detail-checkout-btn');
            if (btn && !btn.hasAttribute('data-listener-attached') && !btn.classList.contains('disabled')) {
                btn.setAttribute('data-listener-attached', 'true');
                btn.addEventListener('click', async () => {
                    const productId = btn.getAttribute('data-product-id');
                    const priceId = btn.getAttribute('data-price-id');
                    if (!productId || !priceId) {
                        alert('Product and price IDs are required');
                        return;
                    }
                    btn.disabled = true;
                    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Preparing checkout...';
                    try {
                        const res = await fetch('/api/store/create-checkout-session', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ productId: productId, priceId: priceId })
                        });
                        const data = await res.json();
                        if (data.url) {
                            window.location.href = data.url;
                        } else {
                            alert(data.error || 'Could not initiate checkout.');
                            btn.disabled = false;
                            btn.textContent = 'Proceed to Checkout';
                        }
                    } catch (err) {
                        console.error(err);
                        alert('Network error. Please try again.');
                        btn.disabled = false;
                        btn.textContent = 'Proceed to Checkout';
                    }
                });
            }
        });
    </script>
</body>
</html>`;

        return {
            statusCode: 200,
            headers: { 
                "Content-Type": "text/html; charset=utf-8",
                "Cache-Control": "no-cache, no-store, must-revalidate"
            },
            body: html
        };

    } catch (error) {
        console.error("SSR generation failed:", error);
        return {
            statusCode: 200,
            headers: { "Content-Type": "text/html; charset=utf-8" },
            body: `<!DOCTYPE html><html><head><title>Shop | Ryze Tha Kidd</title></head><body><p>Error loading product. <a href="/store.html">Return to Shop</a></p></body></html>`
        };
    }
};

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}