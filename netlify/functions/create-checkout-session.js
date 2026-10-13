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
        return json(405, { error: "Method not allowed" });
    }

    let request;
    try {
        request = JSON.parse(event.body || "{}");
    } catch {
        return json(400, { error: "Invalid JSON body" });
    }

    const productId = typeof request.productId === "string" ? request.productId.trim() : "";
    const priceId = typeof request.priceId === "string" ? request.priceId.trim() : "";
    if (!productId || !priceId) {
        return json(400, { error: "Product and price IDs are required" });
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
        // LIMITED EDITION PRE-ORDER CHECK (20 COPIES MAX)
        // ==================================================================
        // We look up successful checkout sessions or payment intents for this product
        // to enforce your strict 20-copy limit automatically.
        const maxStock = parseInt(product.metadata.max_stock || "20", 10);
        
        // Search for completed checkout sessions containing this product
        const sessions = await stripe.checkout.sessions.list({
            limit: 100,
            status: "complete"
        });

        let soldCount = 0;
        for (const session of sessions.data) {
            if (session.payment_status === "paid") {
                // Check line items of completed orders
                const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
                for (const item of lineItems.data) {
                    if (item.price.product === productId) {
                        soldCount += item.quantity;
                    }
                }
            }
        }

        if (soldCount >= maxStock) {
            return json(400, { error: "This limited edition pre-order is completely sold out!" });
        }
        // ==================================================================

        const siteUrl = getSiteUrl();
        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            line_items: [{ price: price.id, quantity: 1 }],
            
            shipping_address_collection: {
                allowed_countries: [
                    "GB", "US", "CA", "AU", "DE", "FR", "IE", "NL", "NZ", "SE", "NO", "DK",
                    "AT", "BE", "FI", "IT", "ES", "PT", "CH", "PL", "JP"
                ]
            },

            shipping_options: [
                // UK Option (£7.99 base price includes free UK shipping)
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
                // European Option
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
                // Rest of World Option
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