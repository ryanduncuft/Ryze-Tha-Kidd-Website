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

    // If no product ID is requested, fall back to serving standard static store instructions or header shell
    if (!productId) {
        return {
            statusCode: 200,
            headers: { "Content-Type": "text/html; charset=utf-8" },
            body: getBaseStoreHtml()
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

        // Schema.org structured data for Google Merchant / Google Shopping
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

        // Hydrated HTML specifically for search crawlers / bots / direct hits
        const html = `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>${escapeHtml(name)} | Ryze Tha Kidd</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="description" content="${escapeHtml(description)}">
        <link rel="canonical" href="${canonicalUrl}">
        
        <!-- Open Graph -->
        <meta property="og:type" content="product">
        <meta property="og:url" content="${canonicalUrl}">
        <meta property="og:title" content="${escapeHtml(name)} | Ryze Tha Kidd">
        <meta property="og:description" content="${escapeHtml(description)}">
        <meta property="og:image" content="${imageUrl}">

        <!-- Twitter -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${escapeHtml(name)} | Ryze Tha Kidd">
        <meta name="twitter:description" content="${escapeHtml(description)}">
        <meta name="twitter:image" content="${imageUrl}">

        <!-- Product Structured Data for Google Shopping / Merchant Center -->
        <script type="application/ld+json">
        ${jsonLd}
        </script>

        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
        <link rel="stylesheet" href="https://cdn.ryzethakidd.com/shared/site.css">
        <script>window.ARTIST_ID = "ryzethakidd";</script>
        <script src="https://cdn.ryzethakidd.com/shared/main.js" defer></script>
    </head>
    <body>
        <main class="container py-5">
            <h1>${escapeHtml(name)}</h1>
            <p class="fs-3 text-primary">${formattedPrice}</p>
            <img src="${imageUrl}" alt="${escapeHtml(name)}" style="max-width:300px;" class="rounded mb-3">
            <p>${escapeHtml(description)}</p>
            <a href="/store.html" class="btn btn-primary">Back to Shop</a>
        </main>
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

function getBaseStoreHtml() {
    return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Official Shop | Ryze Tha Kidd</title><meta http-equiv="refresh" content="0;url=/store.html"></head><body></body></html>`;
}