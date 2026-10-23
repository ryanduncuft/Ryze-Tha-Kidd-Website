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
    const userAgent = (event.headers && (event.headers["user-agent"] || event.headers["User-Agent"])) || "";

    // Define known search engine / social crawlers that need the SEO meta tags
    const isBot = /googlebot|bingbot|yahoo|duckduckbot|baiduspider|yandex|facebookexternalhit|twitterbot|linkedinbot|embedly|whatsapp|telegram/i.test(userAgent);

    // If it's a regular user, or no product ID, don't intercept — let Netlify serve the normal store.html
    if (!productId || !isBot) {
        return {
            statusCode: 302,
            headers: { Location: `/store.html${productId ? '?id=' + productId : ''}` },
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

        // Response tailored specifically for Google and social scrapers
        const html = `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>${escapeHtml(name)} | Ryze Tha Kidd</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="description" content="${escapeHtml(description)}">
        <link rel="canonical" href="${canonicalUrl}">
        
        <meta property="og:type" content="product">
        <meta property="og:url" content="${canonicalUrl}">
        <meta property="og:title" content="${escapeHtml(name)} | Ryze Tha Kidd">
        <meta property="og:description" content="${escapeHtml(description)}">
        <meta property="og:image" content="${imageUrl}">

        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${escapeHtml(name)} | Ryze Tha Kidd">
        <meta name="twitter:description" content="${escapeHtml(description)}">
        <meta name="twitter:image" content="${imageUrl}">

        <script type="application/ld+json">
        ${jsonLd}
        </script>
    </head>
    <body>
        <h1>${escapeHtml(name)}</h1>
        <p>${formattedPrice}</p>
        <img src="${imageUrl}" alt="${escapeHtml(name)}">
        <p>${escapeHtml(description)}</p>
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