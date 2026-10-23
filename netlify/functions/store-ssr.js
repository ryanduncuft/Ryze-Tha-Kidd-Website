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

    // Fetch the live store.html layout directly from your domain to guarantee it's always found
    let baseTemplate = "";
    try {
        const response = await fetch("https://www.ryzethakidd.com/store.html");
        if (response.ok) {
            baseTemplate = await response.text();
        }
    } catch (e) {
        // Fallback skeleton if network fetch fails
    }

    if (!baseTemplate) {
        baseTemplate = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Official Shop | Ryze Tha Kidd</title></head><body><main class="container py-5"><h1>Official Shop</h1><p><a href="/store.html">Return to Shop</a></p></main></body></html>`;
    }

    // If no product ID is provided, return the base template cleanly
    if (!productId) {
        return {
            statusCode: 200,
            headers: { "Content-Type": "text/html; charset=utf-8" },
            body: baseTemplate
        };
    }

    try {
        const stripe = getStripe();
        const product = await stripe.products.retrieve(productId);
        const prices = await stripe.prices.list({ product: product.id, active: true, limit: 1 });
        const priceObj = prices.data[0] || {};
        
        const unitAmount = priceObj.unit_amount || 0;
        const currency = (priceObj.currency || "gbp").toUpperCase();
        
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

        // Remove generic title/meta descriptions to prevent duplicates
        let cleanedTemplate = baseTemplate
            .replace(/<title>.*?<\/title>/gi, "")
            .replace(/<meta\s+name=["']description["'].*?>/gi, "")
            .replace(/<link\s+rel=["']canonical["'].*?>/gi, "")
            .replace(/<meta\s+property=["']og:title["'].*?>/gi, "")
            .replace(/<meta\s+property=["']og:description["'].*?>/gi, "")
            .replace(/<meta\s+property=["']og:image["'].*?>/gi, "")
            .replace(/<meta\s+property=["']og:url["'].*?>/gi, "");

        // Inject product-specific SEO tags and the crucial JSON-LD schema block
        const seoInject = `
        <title>${escapeHtml(name)} | Ryze Tha Kidd</title>
        <meta name="description" content="${escapeHtml(description)}">
        <link rel="canonical" href="${canonicalUrl}">
        <meta property="og:type" content="product">
        <meta property="og:url" content="${canonicalUrl}">
        <meta property="og:title" content="${escapeHtml(name)} | Ryze Tha Kidd">
        <meta property="og:description" content="${escapeHtml(description)}">
        <meta property="og:image" content="${primaryImageUrl}">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${escapeHtml(name)} | Ryze Tha Kidd">
        <meta name="twitter:description" content="${escapeHtml(description)}">
        <meta name="twitter:image" content="${primaryImageUrl}">
        <script type="application/ld+json">
        ${jsonLdString}
        </script>
</head>`;

        const hydratedHtml = cleanedTemplate.replace("</head>", seoInject);

        return {
            statusCode: 200,
            headers: { 
                "Content-Type": "text/html; charset=utf-8",
                "Cache-Control": "public, max-age=300"
            },
            body: hydratedHtml
        };

    } catch (error) {
        console.error("SSR generation failed:", error);
        return {
            statusCode: 200,
            headers: { "Content-Type": "text/html; charset=utf-8" },
            body: baseTemplate
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