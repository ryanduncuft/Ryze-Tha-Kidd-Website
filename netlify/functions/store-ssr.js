"use strict";

const Stripe = require("stripe");

let stripeClient;
const getStripe = () => {
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    if (!stripeClient) stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
    return stripeClient;
};

exports.handler = async function (event, context) {
    const productId = event.queryStringParameters && event.queryStringParameters.id;

    // If no product ID is requested, return standard fallback or redirect
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
        const prices = await stripe.prices.list({ product: product.id, active: true, limit: 1 });
        const priceObj = prices.data[0] || {};
        
        const unitAmount = priceObj.unit_amount || 0;
        const currency = (priceObj.currency || "gbp").toUpperCase();
        const formattedPrice = new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(unitAmount / 100);
        
        const name = product.name || "Official Merchandise";
        const description = product.description || "Official item from Ryze Tha Kidd.";
        const imageUrl = product.images && product.images[0] ? product.images[0] : "https://res.cloudinary.com/dvju1xiaw/image/upload/f_auto,q_auto/v1792020777/Logo-rtk_dzt3wv.png";
        const canonicalUrl = `https://www.ryzethakidd.com/store.html?id=${product.id}`;

        // Schema.org Product JSON-LD for Google Merchant Center / Google Shopping
        const jsonLd = JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": name,
            "image": [imageUrl],
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
                "availability": "https://schema.org/InStock"
            }
        });

        // Fully self-contained HTML payload that includes your site styles, 
    // full layout shell, AND the critical Product Schema JSON-LD for Google.
        const html = `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>${escapeHtml(name)} | Ryze Tha Kidd</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="description" content="${escapeHtml(description)}">
        <meta name="author" content="Ryze Tha Kidd">
        <meta name="theme-color" content="#9D00FF">

        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="product">
        <meta property="og:url" content="${canonicalUrl}">
        <meta property="og:title" content="${escapeHtml(name)} | Ryze Tha Kidd">
        <meta property="og:description" content="${escapeHtml(description)}">
        <meta property="og:image" content="${imageUrl}">
        <meta property="og:locale" content="en_GB">

        <!-- Twitter -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:site" content="@ryzethakidd">
        <meta name="twitter:title" content="${escapeHtml(name)} | Ryze Tha Kidd">
        <meta name="twitter:description" content="${escapeHtml(description)}">
        <meta name="twitter:image" content="${imageUrl}">

        <!-- Canonical & Icons -->
        <link rel="canonical" href="${canonicalUrl}">
        <link rel="icon" href="/WebpageIcon.ico" type="image/x-icon">
        <link rel="icon" href="/WebpageIcon.png" type="image/png" sizes="192x192">

        <!-- Stylesheets -->
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
        <link rel="stylesheet" href="https://cdn.ryzethakidd.com/shared/site.css">

        <!-- Google Merchant & Shopping Schema.org JSON-LD -->
        <script type="application/ld+json">
        ${jsonLd}
        </script>

        <script>
            window.ARTIST_ID = "ryzethakidd";
        </script>
        <script src="https://cdn.ryzethakidd.com/shared/main.js" defer></script>
    </head>
    <body>
        <canvas aria-hidden="true" id="interactive-bg"></canvas>
        <header id="navbar-container"></header>

        <main class="container flex-grow-1 py-5 py-md-7 w-100" id="main-content">
            <div class="mb-4">
                <a href="/store.html" class="link-arrow">
                    <i class="fas fa-arrow-left me-2"></i>Back to Shop
                </a>
            </div>
            <div class="row g-5 align-items-start">
                <div class="col-lg-6">
                    <div class="store-product-media rounded-4 overflow-hidden border mb-3 position-relative" style="aspect-ratio: 1 / 1; background: var(--bs-body-bg);">
                        <img src="${imageUrl}" alt="${escapeHtml(name)}" class="w-100 h-100 object-fit-cover position-absolute top-0 start-0" />
                    </div>
                </div>
                <div class="col-lg-6 d-flex flex-column gap-3">
                    <span class="text-muted small text-uppercase fw-bold">Merchandise</span>
                    <h1 class="display-5 fw-bold mb-0">${escapeHtml(name)}</h1>
                    <div class="fs-3 fw-900 text-primary mb-0">${formattedPrice}</div>
                    
                    <div class="p-3 rounded-3 border d-flex align-items-center gap-2 small" style="background: var(--card-bg); border-color: var(--border-color) !important; color: var(--text-primary);">
                        <i class="fas fa-truck fs-5" style="color: var(--accent);"></i>
                        <div>
                            <strong>Tracked Shipping:</strong> <span class="fw-semibold" style="color: var(--accent);">UK Free</span> | Europe £8.99 | Rest of World £13.99
                        </div>
                    </div>

                    <div class="p-3 rounded-3 border d-flex align-items-center gap-2 small" style="background: var(--card-bg); border-color: var(--border-color) !important; color: var(--text-primary);">
                        <i class="fas fa-rotate-left fs-5" style="color: var(--accent);"></i>
                        <div>
                            <strong>14-Day Money-Back Guarantee:</strong> Unopened physical media can be returned within 14 days. Read our <a href="/returns" class="text-decoration-underline" style="color: var(--accent);">Return & Refund Policy</a>.
                        </div>
                    </div>

                    <p class="text-muted" style="white-space: pre-line;">${escapeHtml(description)}</p>
                    <div class="mt-3">
                        <a href="/store.html?id=${product.id}" class="btn btn-primary btn-lg w-100">View in Full Shop</a>
                        <p class="text-center text-muted small mt-2 mb-0">
                            <i class="fas fa-shield-halved me-1"></i> Secure checkout powered by Stripe
                        </p>
                    </div>
                </div>
            </div>
        </main>

        <footer id="footer-container"></footer>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/js/bootstrap.bundle.min.js" defer></script>
    </body>
</html>`;

        return {
            statusCode: 200,
            headers: { "Content-Type": "text/html; charset=utf-8" },
            body: html
        };

    } catch (error) {
        console.error("SSR generation failed:", error);
        return {
            statusCode: 302,
            headers: { Location: "/store.html" },
            body: "Redirecting..."
        };
    }
};

function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}