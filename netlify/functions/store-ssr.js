"use strict";

const Stripe = require("stripe");
const fs = require("fs");
const path = require("path");

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

// Safe helper to read store.html across all Netlify serverless deployment environments
function getStoreTemplate() {
    const possiblePaths = [
        path.resolve(process.cwd(), "store.html"),
        path.join(__dirname, "store.html"),
        path.join(__dirname, "..", "store.html"),
        path.join(__dirname, "..", "..", "store.html")
    ];

    for (const p of possiblePaths) {
        try {
            if (fs.existsSync(p)) {
                return fs.readFileSync(p, "utf8");
            }
        } catch (err) {
            // Continue checking next candidate path
        }
    }
    return null;
}

exports.handler = async function (event, context) {
    const productId = event.queryStringParameters && event.queryStringParameters.id;

    // Load static template safely
    let baseTemplate = getStoreTemplate() || `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Official Shop | Ryze Tha Kidd</title></head><body><main id="main-content"><p>Loading shop...</p></main></body></html>`;

    // If no product ID is present, return the un-hydrated store page cleanly
    if (!productId) {
        return {
            statusCode: 200,
            headers: { 
                "Content-Type": "text/html; charset=utf-8",
                "Cache-Control": "public, max-age=0, must-revalidate"
            },
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
        
        // Collect all available product images
        const images = Array.isArray(product.images) && product.images.length > 0 
            ? product.images 
            : ["https://res.cloudinary.com/dvju1xiaw/image/upload/f_auto,q_auto/v1792020777/Logo-rtk_dzt3wv.png"];
        
        const primaryImageUrl = images[0];
        const canonicalUrl = `https://www.ryzethakidd.com/store.html?id=${product.id}`;

        // Schema.org Product JSON-LD block for Google Merchant Center & Google Rich Results
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

        // Clean existing generic SEO tags out of the template head to avoid duplicate tags
        let cleanedTemplate = baseTemplate
            .replace(/<title>.*?<\/title>/gi, "")
            .replace(/<meta\s+name=["']description["'].*?>/gi, "")
            .replace(/<link\s+rel=["']canonical["'].*?>/gi, "")
            .replace(/<meta\s+property=["']og:title["'].*?>/gi, "")
            .replace(/<meta\s+property=["']og:description["'].*?>/gi, "")
            .replace(/<meta\s+property=["']og:image["'].*?>/gi, "")
            .replace(/<meta\s+property=["']og:url["'].*?>/gi, "")
            .replace(/<meta\s+property=["']og:type["'].*?>/gi, "");

        // Construct dynamic, product-specific tags
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
        <meta name="twitter:site" content="@ryzethakidd">
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
                "Cache-Control": "public, max-age=300, s-maxage=600"
            },
            body: hydratedHtml
        };

    } catch (error) {
        console.error("SSR generation failed:", error);
        // Fallback gracefully without redirect loops
        return {
            statusCode: 200,
            headers: { 
                "Content-Type": "text/html; charset=utf-8",
                "Cache-Control": "public, max-age=0, must-revalidate"
            },
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