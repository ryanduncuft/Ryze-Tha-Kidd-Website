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

    const rawProductId = event.queryStringParameters && event.queryStringParameters.id;

    // Security Check: Validate that productId exists and matches expected Stripe format (alphanumeric/underscores, max length ~64)
    if (!rawProductId || typeof rawProductId !== "string" || !/^prod_[a-zA-Z0-9]{10,64}$/.test(rawProductId)) {
        return {
            statusCode: 302,
            headers: { Location: "/store.html" },
            body: "Redirecting..."
        };
    }

    const productId = rawProductId;

    try {

        const stripe = getStripe();
        const product = await stripe.products.retrieve(productId);

        // Fetch active prices and find a valid one-time price just like products.js does
        const prices = await stripe.prices.list({
            product: product.id,
            active: true,
            type: "one_time",
            limit: 100
        });

        const priceObj = prices.data.find(item => Number.isInteger(item.unit_amount)) || prices.data[0] || {};

const unitAmount = priceObj.unit_amount || 0;
        const currency = (priceObj.currency || "gbp").toUpperCase();
        const formattedPrice = new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(unitAmount / 100);

        const name = product.name || "Official Merchandise";
        const description = product.description || "Official item from Ryze Tha Kidd.";
        const meta = product.metadata || {};

        // Gather images from Stripe product gallery and explicitly mapped metadata keys (image_1, image_2, etc.)
        let images = Array.isArray(product.images) && product.images.length > 0
            ? [...product.images]
            : [];

        Object.keys(meta).forEach(key => {
            if (key.startsWith("image_") && meta[key]) {
                images.push(meta[key]);
            }
        });

        if (images.length === 0) {
            images = ["https://res.cloudinary.com/dvju1xiaw/image/upload/f_auto,q_auto/v1792020777/Logo-rtk_dzt3wv.png"];
        }

        images = [...new Set(images)];

        const primaryImageUrl = images[0];
        const canonicalUrl = `https://www.ryzethakidd.com/store.html?id=${product.id}`;
        const mpnValue = meta.mpn || meta.catalog_number || product.id;

        const isLimited = String(meta.limited_edition || "").toLowerCase() === "true";
        const limitedText = isLimited ? "Made-to-order batch. Secure your copy now!" : null;
        const limitedEditionClass = limitedText ? "d-flex" : "d-none";

        // Check if coming_soon is true in metadata (case-insensitive)
        const metadataComingSoon = String(meta.coming_soon || meta.status || "").toLowerCase();
        const isComingSoon = metadataComingSoon === "true" || metadataComingSoon === "coming_soon";

        const thumbnailsHtml = images.map((imgUrl, index) => `
            <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(name)} view ${index + 1}" class="rounded border object-fit-cover shadow-sm" style="width: 75px; height: 75px; cursor: pointer; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'" onclick="document.getElementById('detail-image').src='${escapeHtml(imgUrl)}'" />
        `).join("");

        const jsonLdData = {
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": name,
            "image": images,
            "description": description,
            "category": "Arts & Entertainment > Music & Media > Music CDs",
            "brand": {
                "@type": "Brand",
                "name": "Ryze Tha Kidd"
            },
            "sku": product.id,
            "mpn": mpnValue,
            "offers": {
                "@type": "Offer",
                "url": canonicalUrl,
                "priceCurrency": currency,
                "price": (unitAmount / 100).toFixed(2),
                "priceValidUntil": "2027-12-31",
                "itemCondition": "https://schema.org/NewCondition",
                "availability": isComingSoon ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
                "seller": {
                    "@type": "Organization",
                    "name": "Ryze Tha Kidd Official Store"
                },
                "hasMerchantReturnPolicy": {
                    "@type": "MerchantReturnPolicy",
                    "applicableCountry": "GB",
                    "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
                    "merchantReturnDays": 14,
                    "returnMethod": "https://schema.org/ReturnByMail",
                    "returnFees": "https://schema.org/FreeReturn"
                },
                "shippingDetails": [
                    {
                        "@type": "OfferShippingDetails",
                        "shippingRate": {
                            "@type": "MonetaryAmount",
                            "value": "0.00",
                            "currency": currency
                        },
                        "shippingDestination": {
                            "@type": "DefinedRegion",
                            "addressCountry": "GB"
                        },
                        "deliveryTime": {
                            "@type": "ShippingDeliveryTime",
                            "handlingTime": {
                                "@type": "QuantitativeValue",
                                "minValue": 0,
                                "maxValue": 1,
                                "unitCode": "DAY"
                            },
                            "transitTime": {
                                "@type": "QuantitativeValue",
                                "minValue": 2,
                                "maxValue": 4,
                                "unitCode": "DAY"
                            }
                        }
                    },
                    {
                        "@type": "OfferShippingDetails",
                        "shippingRate": {
                            "@type": "MonetaryAmount",
                            "value": "8.99",
                            "currency": currency
                        },
                        "shippingDestination": {
                            "@type": "DefinedRegion",
                            "addressCountry": "EU"
                        },
                        "deliveryTime": {
                            "@type": "ShippingDeliveryTime",
                            "handlingTime": {
                                "@type": "QuantitativeValue",
                                "minValue": 0,
                                "maxValue": 1,
                                "unitCode": "DAY"
                            },
                            "transitTime": {
                                "@type": "QuantitativeValue",
                                "minValue": 3,
                                "maxValue": 5,
                                "unitCode": "DAY"
                            }
                        }
                    },
                    {
                        "@type": "OfferShippingDetails",
                        "shippingRate": {
                            "@type": "MonetaryAmount",
                            "value": "13.99",
                            "currency": currency
                        },
                        "shippingDestination": {
                            "@type": "DefinedRegion",
                            "addressCountry": "WW"
                        },
                        "deliveryTime": {
                            "@type": "ShippingDeliveryTime",
                            "handlingTime": {
                                "@type": "QuantitativeValue",
                                "minValue": 0,
                                "maxValue": 1,
                                "unitCode": "DAY"
                            },
                            "transitTime": {
                                "@type": "QuantitativeValue",
                                "minValue": 5,
                                "maxValue": 10,
                                "unitCode": "DAY"
                            }
                        }
                    }
                ]
            }
        };

        const jsonLdString = JSON.stringify(jsonLdData);
        const priceIdValue = priceObj.id || "";
        const productIdValue = product.id || "";

        if (!priceIdValue && !isComingSoon) {
            console.error("Warning: No active price ID found for product:", product.id);
        }

        // Generate button HTML based on whether the product is coming soon
        const actionButtonHtml = isComingSoon
            ? `<button id="detail-checkout-btn" type="button" class="btn btn-secondary btn-lg w-100 disabled" disabled>Coming Soon</button>`
            : `<button id="detail-checkout-btn" type="button" class="btn btn-primary btn-lg w-100" data-store-checkout data-product-id="${escapeHtml(productIdValue)}" data-price-id="${escapeHtml(priceIdValue)}" data-quantity="1">Proceed to Checkout</button>`;

        const html = `<!DOCTYPE html>
<html lang="en">
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
    <meta property="og:image" content="${escapeHtml(primaryImageUrl)}">
    <meta property="og:locale" content="en_GB">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(name)} | Ryze Tha Kidd">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${escapeHtml(primaryImageUrl)}">

    <!-- Google Product Schema.org JSON-LD (Required for Rich Results & Merchant Center) -->
    <script type="application/ld+json">
    ${jsonLdString}
    </script>

    <!-- Stylesheets -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css" crossorigin="anonymous" referrerpolicy="no-referrer">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" crossorigin="anonymous" referrerpolicy="no-referrer">
    <link rel="preload" href="https://cdn.ryzethakidd.com/shared/ui.html" as="fetch" crossorigin="anonymous">
    <link rel="stylesheet" href="https://cdn.ryzethakidd.com/shared/site.css" crossorigin="anonymous">
    <script> window.ARTIST_ID = "ryzethakidd";</script>
    <script src="https://cdn.ryzethakidd.com/shared/main.js" crossorigin="anonymous" defer></script>
</head>
<body>
    <div class="scroll-trigger-sentinel"></div>
    <canvas aria-hidden="true" id="interactive-bg"></canvas>

    <!-- Navigation Header -->
    <header id="navbar-container"></header>

    <main class="container flex-grow-1 py-5 py-md-7 w-100" id="main-content">
        <!-- Static Product Container for Search & Crawler Bots -->
        <article id="crawler-product-content" class="product-static-wrapper" itemscope itemtype="https://schema.org/Product">
            <meta itemprop="sku" content="${escapeHtml(product.id)}">
            <meta itemprop="mpn" content="${escapeHtml(mpnValue)}">
            <meta itemprop="category" content="Music CDs">
            <div itemprop="brand" itemscope itemtype="https://schema.org/Brand">
                <meta itemprop="name" content="Ryze Tha Kidd">
            </div>

            <div id="store-detail-view">
                <div class="mb-4">
                    <a href="/store.html" class="link-arrow">
                        <i class="fas fa-arrow-left me-2"></i>Back to Shop
                    </a>
                </div>
                <div class="row g-5 align-items-start">
                    <div class="col-lg-6">
                        <div class="store-product-media rounded-4 overflow-hidden border mb-3 position-relative" style="aspect-ratio: 1 / 1; background: var(--bs-body-bg);">
                            <img id="detail-image" src="${escapeHtml(primaryImageUrl)}" alt="${escapeHtml(name)}" itemprop="image" class="w-100 h-100 object-fit-cover position-absolute top-0 start-0" />
                        </div>
                        <!-- Dynamic Image Thumbnails Container -->
                        <div id="detail-thumbnails" class="d-flex gap-2 flex-wrap">
                            ${thumbnailsHtml}
                        </div>
                    </div>
                    <div class="col-lg-6 d-flex flex-column gap-3">
                        <span id="detail-type" class="text-muted small text-uppercase fw-bold" itemprop="itemCondition" content="https://schema.org/NewCondition">${escapeHtml(meta.category || meta.type || "Music CD")}</span>
                        <h1 id="detail-title" class="display-5 fw-bold mb-0" itemprop="name">${escapeHtml(name)}</h1>

                        <div id="detail-price" class="fs-3 fw-900 text-primary mb-0" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
                            <meta itemprop="priceCurrency" content="${escapeHtml(currency)}">
                            <meta itemprop="price" content="${(unitAmount / 100).toFixed(2)}">
                            <meta itemprop="availability" content="${isComingSoon ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock'}">
                            ${formattedPrice}
                        </div>

                        <!-- Conditional Limited Edition Pre-Order Badge -->
                        <div id="limited-edition-banner" class="p-3 rounded-3 border ${limitedEditionClass} align-items-center gap-2 small" style="background: var(--card-bg); border-color: var(--border-color) !important; color: var(--text-primary);">
                            <i class="fas fa-fire fs-5 text-warning"></i>
                            <div id="limited-edition-banner-text">
                                <strong>Limited Edition Pre-Order:</strong> <span class="fw-semibold">Made-to-order batch. Secure your copy now!</span>
                            </div>
                        </div>

                        <!-- Shipping Information Badge -->
                        <div class="p-3 rounded-3 border d-flex align-items-center gap-2 small" style="background: var(--card-bg); border-color: var(--border-color) !important; color: var(--text-primary);">
                            <i class="fas fa-truck fs-5" style="color: var(--accent);"></i>
                            <div>
                                <strong>Tracked Shipping:</strong> <span class="fw-semibold" style="color: var(--accent);">UK Free</span> | Europe £8.99 | Rest of World £13.99
                            </div>
                        </div>

                        <!-- Returns & Guarantee Policy Badge -->
                        <div class="p-3 rounded-3 border d-flex align-items-center gap-2 small" style="background: var(--card-bg); border-color: var(--border-color) !important; color: var(--text-primary);">
                            <i class="fas fa-rotate-left fs-5" style="color: var(--accent);"></i>
                            <div>
                                <strong>14-Day Money-Back Guarantee:</strong> Unopened physical media can be returned within 14 days. Read our <a href="/returns" class="text-decoration-underline" style="color: var(--accent);">Return & Refund Policy</a>.
                            </div>
                        </div>

                        <p id="detail-description" class="text-muted" style="white-space: pre-line;" itemprop="description">${escapeHtml(description)}</p>

                        <div class="mt-3">
                            ${actionButtonHtml}
                            <p class="text-center text-muted small mt-2 mb-0">
                                <i class="fas fa-shield-halved me-1"></i> Secure checkout powered by Stripe
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    </main>

    <!-- Footer -->
    <footer id="footer-container"></footer>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/js/bootstrap.bundle.min.js" crossorigin="anonymous" referrerpolicy="no-referrer" defer></script>

    <script src="https://cdn.ryzethakidd.com/ryzethakidd/store/config.js" defer></script>
</body>
</html>`;

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            },
            body: html
        };

    } catch (error) {
        console.error("SSR generation failed:", error);
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
            },
            body: `<!DOCTYPE html><html><head><title>Shop | Ryze Tha Kidd</title><link rel="preload" href="https://cdn.ryzethakidd.com/shared/ui.html" as="fetch" crossorigin="anonymous"><link rel="stylesheet" href="https://cdn.ryzethakidd.com/shared/site.css"><script src="https://cdn.ryzethakidd.com/shared/main.js" defer></script><script src="https://cdn.ryzethakidd.com/ryzethakidd/store/config.js" defer></script></head><body><p>Error loading product. <a href="/store.html">Return to Shop</a></p></body></html>`
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
