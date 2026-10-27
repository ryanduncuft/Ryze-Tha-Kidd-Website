"use strict";

const Stripe = require("stripe");

const json = (statusCode, body) => ({
    statusCode,
    headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
    },
    body: JSON.stringify(body)
});

let stripeClient;
const getStripe = () => {
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    if (!stripeClient) stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
    return stripeClient;
};

exports.handler = async (event) => {

    if (event.httpMethod !== "GET") {
        console.warn("Method not allowed", event.httpMethod);
        return json(405, { error: "Method not allowed" });
    }

    try {

        const stripe = getStripe();

        // Fetch active products and prices efficiently
        const [productList, pricesList] = await Promise.all([
            stripe.products.list({ active: true, limit: 100 }),
            stripe.prices.list({ active: true, type: "one_time", limit: 100 })
        ]);

        // Map prices to their respective products to avoid N+1 queries inside loops
        const pricesByProduct = {};
        for (const price of pricesList.data) {
            const prodId = typeof price.product === "string" ? price.product : price.product.id;
            if (!pricesByProduct[prodId] && Number.isInteger(price.unit_amount)) {
                pricesByProduct[prodId] = price;
            }
        }

        const products = productList.data.map(product => {
            const price = pricesByProduct[product.id];
            if (!price) return null;

            const meta = product.metadata || {};
            const maxStock = parseInt(meta.max_stock || "20", 10);
            const soldCount = parseInt(meta.sold_count || "0", 10); // Recommended: manage via webhook or metadata instead of querying sessions live
            const remainingStock = Math.max(0, maxStock - soldCount);
            const isSoldOut = remainingStock === 0;

            const metadataComingSoon = String(meta.coming_soon || meta.status || "").toLowerCase();
            const comingSoon = metadataComingSoon === "true" || metadataComingSoon === "coming_soon";

            return {
                id: product.id,
                priceId: price.id,
                name: product.name,
                description: product.description || "",
                image: (product.images && product.images[0]) || "",
                type: meta.category || meta.type || "Store item",
                unitAmount: price.unit_amount,
                currency: price.currency,
                comingSoon,
                soldOut: isSoldOut,
                remainingStock,
                maxStock,
                available: product.active && price.active && !comingSoon && !isSoldOut,
                metadata: meta
            };
        }).filter(Boolean);

        return json(200, { products });
    } catch (error) {
        console.error("Unable to load Stripe products", error);
        return json(500, { error: "Unable to load products" });
    }
};
