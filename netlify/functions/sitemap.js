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
    if (event.httpMethod !== "GET") {
        return {
            statusCode: 405,
            body: "Method not allowed"
        };
    }

    try {
        const stripe = getStripe();
        const productList = await stripe.products.list({ active: true, limit: 100 });

        // Build the dynamic sitemap XML using your canonical domain
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.ryzethakidd.com/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://www.ryzethakidd.com/discography</loc>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://www.ryzethakidd.com/store</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;

        // Dynamically loop through every active product from Stripe
        for (const product of productList.data) {
            const id = product.id;
            if (id) {
                xml += `
  <url>
    <loc>https://www.ryzethakidd.com/store.html?id=${escapeXml(id)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
            }
        }

        xml += `
  <url>
    <loc>https://www.ryzethakidd.com/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://www.ryzethakidd.com/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://www.ryzethakidd.com/privacy</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://www.ryzethakidd.com/returns</loc>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>https://www.ryzethakidd.com/tos</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>`;

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/xml; charset=utf-8",
                "Cache-Control": "public, max-age=3600"
            },
            body: xml,
        };
    } catch (error) {
        console.error("Sitemap generation failed:", error);
        return {
            statusCode: 500,
            body: "Error generating sitemap",
        };
    }
};

function escapeXml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}