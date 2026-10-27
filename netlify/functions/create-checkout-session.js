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

const getSiteUrl = () => {
    const siteUrl = process.env.SITE_URL || process.env.URL;
    if (!siteUrl) throw new Error("SITE_URL is not configured");
    return siteUrl.replace(/\/$/, "");
};

exports.handler = async (event) => {

    if (event.httpMethod !== "POST") {
        console.warn("Method not allowed", event.httpMethod);
        return json(405, { error: "Method not allowed" });
    }

    let request;
    try {
        request = JSON.parse(event.body || "{}");
    } catch {
        console.error("Request body was not valid JSON");
        return json(400, { error: "Invalid JSON body" });
    }

    const productId = typeof request.productId === "string" ? request.productId.trim() : "";
    const priceId = typeof request.priceId === "string" ? request.priceId.trim() : "";
    const quantity = request.quantity === undefined ? 1 : Number(request.quantity);

    if (!productId || !priceId || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        console.warn("Invalid product, price, or quantity", {
            hasProductId: Boolean(productId),
            hasPriceId: Boolean(priceId),
            quantity
        });
        return json(400, { error: "Valid product, price, and quantity are required" });
    }

    try {

        const stripe = getStripe();

        const price = await stripe.prices.retrieve(priceId);
        if (!price.active || price.type !== "one_time" || !Number.isInteger(price.unit_amount)) {
            return json(400, { error: "This item is not available" });
        }

        const stripeProductId = typeof price.product === "string" ? price.product : price.product.id;
        if (stripeProductId !== productId) {
            return json(400, { error: "Product and price do not match" });
        }

        const product = await stripe.products.retrieve(productId);
        if (!product.active) return json(400, { error: "This item is not available" });

        // ==================================================================
        // LIMITED EDITION STOCK CHECK (Optimized via Metadata)
        // ==================================================================
        const meta = product.metadata || {};
        const maxStock = parseInt(meta.max_stock || "20", 10);
        const soldCount = parseInt(meta.sold_count || "0", 10);

        if (soldCount + quantity > maxStock) {
            console.warn("Requested quantity exceeds available stock", {
                quantity,
                remainingStock: Math.max(0, maxStock - soldCount)
            });
            return json(400, { error: "This limited edition pre-order is completely sold out!" });
        }
        // ==================================================================

        const siteUrl = getSiteUrl();

        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            line_items: [{ price: price.id, quantity }],

            shipping_address_collection: {
                allowed_countries: [
                    "GB", "US", "CA", "AU", "DE", "FR", "IE", "NL", "NZ", "SE", "NO", "DK",
                    "AT", "BE", "FI", "IT", "ES", "PT", "CH", "PL", "JP"
                ]
            },

            shipping_options: [
                {
                    shipping_rate_data: {
                        type: "fixed_amount",
                        fixed_amount: { amount: 0, currency: "gbp" },
                        display_name: "UK Royal Mail 48 Tracked (Free)",
                        delivery_estimate: {
                            minimum: { unit: "business_day", value: 2 },
                            maximum: { unit: "business_day", value: 4 }
                        }
                    }
                },
                {
                    shipping_rate_data: {
                        type: "fixed_amount",
                        fixed_amount: { amount: 899, currency: "gbp" },
                        display_name: "European Royal Mail International Tracked",
                        delivery_estimate: {
                            minimum: { unit: "business_day", value: 3 },
                            maximum: { unit: "business_day", value: 5 }
                        }
                    }
                },
                {
                    shipping_rate_data: {
                        type: "fixed_amount",
                        fixed_amount: { amount: 1399, currency: "gbp" },
                        display_name: "Rest of World Royal Mail International Tracked",
                        delivery_estimate: {
                            minimum: { unit: "business_day", value: 5 },
                            maximum: { unit: "business_day", value: 10 }
                        }
                    }
                }
            ],

            success_url: `${siteUrl}/store.html?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${siteUrl}/store.html?checkout=cancel`,
            metadata: { productId: product.id, priceId: price.id }
        });

        if (!session.url) throw new Error("Stripe did not return a checkout URL");

        return json(200, { url: session.url });
    } catch (error) {
        console.error("Unable to create Stripe Checkout Session", error);
        return json(500, { error: "Unable to start checkout" });
    }
};
