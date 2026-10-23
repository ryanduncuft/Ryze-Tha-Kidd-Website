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
        const prices = await stripe.prices.list({ product: product.id, active: true, limit: 1 });
        const priceObj = prices.data[0] || {};
        
        const unitAmount = priceObj.unit_amount || 0;
        const currency = (priceObj.currency || "gbp").toUpperCase();
        const formattedPrice = new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(unitAmount / 100);
        
        const name = product.name || "Official Merchandise";
        const description = product.description || "Official item from Ryze Tha Kidd.";
        const images = Array.isArray(product.images) && product.images.length > 0 
            ? product.images 
            : ["https://res.cloudinary.com/dvju1xiaw/image/upload/f_auto,q_auto/v1792020777/Logo-rtk_dzt3wv.png"];
        
        const primaryImageUrl = images[0];
        const canonicalUrl = `https://www.ryzethakidd.com/store.html?id=${product.id}`;

        // Schema.org Product JSON-LD block for Google Merchant Center & Rich Results Test
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
                "availability": "https://schema.org/InStock"
            }
        };

        const jsonLdString = JSON.stringify(jsonLdData);

        // Fully self-contained HTML layout guaranteed to contain the JSON-LD schema block
        const html = `<!DOCTYPE html>
<html lang="en" data-theme="light">
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
</head>
<body class="bg-body text-body">
    <main class="container py-5 my-5">
        <div class="mb-4">
            <a href="/store.html" class="link-arrow"><i class="fas fa-arrow-left me-2"></i>Back to Shop</a>
        </div>
        <div class="row g-5 align-items-start">
            <div class="col-lg-6">
                <div class="rounded-4 overflow-hidden border mb-3 position-relative" style="aspect-ratio: 1/1; background: var(--bs-body-bg);">
                    <img src="${primaryImageUrl}" alt="${escapeHtml(name)}" class="w-100 h-100 object-fit-cover position-absolute top-0 start-0">
                </div>
            </div>
            <div class="col-lg-6 d-flex flex-column gap-3">
                <h1 class="display-5 fw-bold mb-0">${escapeHtml(name)}</h1>
                <div class="fs-3 fw-900 text-primary mb-0">${formattedPrice}</div>
                <p class="text-muted" style="white-space: pre-line;">${escapeHtml(description)}</p>
                <div class="mt-3">
                    <a href="/store.html" class="btn btn-primary btn-lg w-100">View in Full Shop</a>
                </div>
            </div>
        </div>
    </main>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/js/bootstrap.bundle.min.js" defer></script>
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