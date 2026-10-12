
"use strict";

// ============================================================================
// STOREFRONT & STRIPE CONFIGURATION
// ============================================================================
// Publishable keys may be exposed in the browser. Never add a Stripe secret key
// here; product management and Checkout Session creation must stay on the server.
const STOREFRONT_CONFIG = Object.freeze({
    stripePublishableKey: window.STRIPE_PUBLISHABLE_KEY || "pk_test_51UPmUc4gLJkkftaebGbtvxqIdLd9hsZ5qzyJiT8atKh6cXMcgVtCKaFfTTtOKPzQLtH5ntIrhU137OBjZj9ntbB000DINTNNBd",
    productsEndpoint: window.STORE_PRODUCTS_ENDPOINT || "/api/store/products",
    checkoutEndpoint: window.STORE_CHECKOUT_ENDPOINT || "/api/store/create-checkout-session",
    defaultCurrency: "GBP"
});

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const ESC_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
};

const ESC_REG = /[&<>"']/g;
const KEBAB_REG = /([A-Z])/g;

const DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric"
});

const ASSET_BASE = window.SHARED_ASSET_BASE || "https://cdn.ryzethakidd.com/shared/";
const CACHE_VERSION = 1;

const CACHE_CONFIG = {
    config: { key: "label-config", ttl: 604800000 },
    ui: { key: "label-ui", ttl: 2592000000 },
    video: { key: "label-video", ttl: 86400000 },
    lyrics: { key: "label-lyrics", ttl: 604800000 }
};

const getUiTemplateUrl = () =>
    window.SHARED_UI_PATH || `https://cdn.ryzethakidd.com/shared/ui.html`;

const getConfigPath = () =>
    window.CONFIG_PATH || `https://cdn.ryzethakidd.com/${window.ARTIST_ID}/config.json`;


// ============================================================================
// DOM UTILITIES
// ============================================================================

const DOM = {
    get: (id) =>
        document.getElementById(id),

    qs: (selector, scope = document) =>
        scope.querySelector(selector),

    qsa: (selector, scope = document) =>
        Array.prototype.slice.call(scope.querySelectorAll(selector)),

    create: (tag, props = {}) =>
        Object.assign(document.createElement(tag), props),

    html: (node, val) => {
        if (!node || typeof val !== 'string') return;
        if (node.innerHTML !== val) node.innerHTML = val;
    },

    text: (node, val) => {
        if (!node) return;
        const text = val ?? "";
        if (node.textContent !== text) node.textContent = text;
    }
};


// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const Utils = {
    /**
     * Get the correct artist folder path from the global CONFIG
     */
    getArtistBase: () => {
        if (CONFIG?.artist?.assetBaseUrl) return CONFIG.artist.assetBaseUrl;
        if (CONFIG?.artist?.folderName) return `https://cdn.ryzethakidd.com/${CONFIG.artist.folderName}/`;
        return "./";
    },

    /**
     * Escape HTML special characters
     */
    esc: (val) =>
        val == null ? "" : String(val).replace(ESC_REG, m => ESC_MAP[m]),

    /**
     * URL encode a value
     */
    enc: (val) =>
        encodeURIComponent(String(val || "")),

    /**
     * Validate and sanitize URLs
     */
    safeUrl: (val) => {
        if (!val) return "#";
        if (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/')) {
            return val;
        }
        try {
            const url = new URL(val, location.href);
            return (url.protocol === "http:" || url.protocol === "https:") ? url.href : "#";
        } catch {
            const base = Utils.getArtistBase();
            return `${base}${val}`;
        }
    },

    /**
     * Debounce function calls
     */
    debounce: (fn, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn.apply(this, args), delay);
        };
    },

    /**
     * Format date for display
     */
    displayDate: (val) => {
        if (!val) return "TBD";
        const date = new Date(val);
        return isNaN(date.getTime()) ? "TBD" : DATE_FORMATTER.format(date);
    },

    /**
     * Display a toast notification
     */
    toast: (message, type = "info", duration = 3000) => {
        let container = DOM.get("toast-container") || DOM.create("div", { id: "toast-container" });
        if (!container.parentElement) document.body.appendChild(container);

        const item = DOM.create("div", {
            className: `label-toast label-toast-${type}`,
            textContent: message
        });
        container.appendChild(item);

        setTimeout(() => {
            item.classList.add("is-leaving");
            item.addEventListener('animationend', () => item.remove(), { once: true });
        }, duration);
    },

    /**
     * Render array of items using a renderer function
     */
    renderItems(items, renderer) {
        let html = "";
        for (let i = 0, len = items.length; i < len; i++) {
            html += renderer(items[i], i);
        }
        return html;
    },

    /**
     * Populate a select element with options
     */
    setOptions(select, values, firstLabel = "All") {
        if (!select) return;
        select.replaceChildren();
        select.add(new Option(firstLabel, "all"));
        values.forEach(value => select.add(new Option(value, value)));
    }
};


// ============================================================================
// CACHE HELPER
// ============================================================================

const CacheHelper = {
    /**
     * Get a versioned cache key to enable cache invalidation
     */
    getVersionedKey: (key) =>
        `${key}-v${CACHE_VERSION}`,

    /**
     * Retrieve cached data with TTL validation
     */
    getCachedData: (cacheType) => {
        try {
            const config = CACHE_CONFIG[cacheType];
            if (!config) return null;

            const key = CacheHelper.getVersionedKey(config.key);
            const cached = localStorage.getItem(key);
            const timestamp = Number(localStorage.getItem(`${key}-time`) || 0);

            if (cached && Date.now() - timestamp < config.ttl) {
                try {
                    return JSON.parse(cached);
                } catch (e) {
                    localStorage.removeItem(key);
                    return null;
                }
            }

            localStorage.removeItem(key);
            localStorage.removeItem(`${key}-time`);
            return null;
        } catch (e) {
            console.warn(`Cache read failed for ${cacheType}`, e);
            return null;
        }
    },

    /**
     * Store data in cache with timestamp
     */
    setCachedData: (cacheType, data) => {
        try {
            const config = CACHE_CONFIG[cacheType];
            if (!config) return;

            const key = CacheHelper.getVersionedKey(config.key);
            localStorage.setItem(key, JSON.stringify(data));
            localStorage.setItem(`${key}-time`, Date.now().toString());
        } catch (e) {
            console.warn(`Cache write failed for ${cacheType}`, e);
        }
    },

    /**
     * Get optimal fetch options for a resource type
     */
    getFetchOptions: (cacheType, forceRefresh = false) => {
        if (forceRefresh) return { cache: "no-store" };
        if (cacheType === "config") return { cache: "default" };
        if (cacheType === "ui" || cacheType === "lyrics" || cacheType === "video") {
            return { cache: "force-cache" };
        }
        return { cache: "default" };
    }
};


// ============================================================================
// COMPONENT SYSTEM
// ============================================================================

const Components = {
    cache: Object.create(null),

    /**
     * Load UI templates from cache or fetch them
     */
    async load() {
        if (Object.keys(this.cache).length) return;

        // Try cached UI template first
        let cachedUI = CacheHelper.getCachedData("ui");
        if (cachedUI) {
            this.cache = cachedUI;
            return;
        }

        const res = await fetch(getUiTemplateUrl(), { cache: "force-cache" });
        if (!res.ok) throw new Error("Component module load failed: ui.html");

        const doc = new DOMParser().parseFromString(await res.text(), "text/html");
        const cache = Object.create(null);

        DOM.qsa("template[id]", doc).forEach(template => {
            cache[template.id] = template.innerHTML.trim();
        });

        this.cache = cache;
        CacheHelper.setCachedData("ui", cache);
    },

    /**
     * Render a template with provided data
     */
    render(name, data = {}) {
        const template = this.cache[name] || "";
        return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? "");
    }
};


// ============================================================================
// INTERSECTION OBSERVER FOR REVEAL ANIMATIONS
// ============================================================================

const GlobalRevealObserver = new IntersectionObserver(
    (entries) => {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        for (let i = 0, len = entries.length; i < len; i++) {
            const en = entries[i];

            if (en.isIntersecting) {
                en.target.classList.add("is-visible");
                if (!prefersReduced) {
                    GlobalRevealObserver.unobserve(en.target);
                }
            }
        }
    },
    {
        threshold: 0.01,
        rootMargin: "0px 0px 150px 0px"
    }
);


// ============================================================================
// APPLICATION STATE MANAGEMENT
// ============================================================================

const AppState = {
    releases: [],
    favorites: new Set(),
    settings: {
        reduceMotion: false,
        compactUI: false,
        minimalCards: false,
        lowDataMode: false,
        touchFriendly: false,
        denseGrid: false
    },
    configVersion: null,

    /**
     * Initialize app state from localStorage
     */
    async init() {
        try {
            const saved = localStorage.getItem("label-settings");
            if (saved && typeof saved === 'string') {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === 'object') {
                    Object.assign(this.settings, parsed);
                }
            }

            const favs = localStorage.getItem("label-favorites");
            if (favs && typeof favs === 'string') {
                const parsed = JSON.parse(favs);
                if (Array.isArray(parsed)) {
                    this.favorites = new Set(parsed.filter(id => typeof id === 'string'));
                }
            }
        } catch (e) {
            console.warn("State recovery failed", e);
            localStorage.removeItem("label-settings");
            localStorage.removeItem("label-favorites");
        }

        this.applySettings();
    },

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        localStorage.setItem("label-settings", JSON.stringify(this.settings));
        this.applySettings();
    },

    /**
     * Apply settings to DOM
     */
    applySettings() {
        const root = document.documentElement;
        const keys = Object.keys(this.settings);

        for (let i = 0, len = keys.length; i < len; i++) {
            const key = keys[i];
            const className = key.replace(KEBAB_REG, "-$1").toLowerCase();
            root.classList.toggle(className, !!this.settings[key]);

            if (key === "lowDataMode") {
                root.classList.toggle("low-data", !!this.settings[key]);
            }
        }
    }
};


// ============================================================================
// DATA MANAGEMENT
// ============================================================================

const Data = {
    /**
     * Fetch releases data with caching
     */
    async fetchReleases() {
        if (AppState.releases.length) return AppState.releases;

        // Check local cache first
        try {
            const cached = localStorage.getItem(CacheHelper.getVersionedKey(CONFIG.cache.key));
            const cachedAt = Number(localStorage.getItem(CacheHelper.getVersionedKey(CONFIG.cache.key) + "-time") || 0);

            if (cached && typeof cached === 'string' && (Date.now() - cachedAt < CONFIG.cache.ttl)) {
                try {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed)) {
                        AppState.releases = parsed;
                        return AppState.releases;
                    }
                } catch (e) {
                    localStorage.removeItem(CacheHelper.getVersionedKey(CONFIG.cache.key));
                }
            }
        } catch (e) {
            console.warn("Cache read failed", e);
        }

        // Fetch fresh data
        try {
            const res = await fetch(CONFIG.api.releases, { cache: "default" });
            if (!res.ok) throw new Error(`API error: ${res.status}`);

            const rawData = await res.json();
            if (!Array.isArray(rawData)) throw new Error("Invalid API response format");

            AppState.releases = this.normalize(rawData);

            // Cache the result
            try {
                localStorage.setItem(CacheHelper.getVersionedKey(CONFIG.cache.key), JSON.stringify(AppState.releases));
                localStorage.setItem(CacheHelper.getVersionedKey(CONFIG.cache.key) + "-time", Date.now().toString());
            } catch (e) {
                console.warn("Cache save failed", e);
            }

            return AppState.releases;
        } catch (err) {
            console.error("Releases fetch failed", err);
            return [];
        }
    },

    /**
     * Normalize raw release data for consistent handling
     */
    normalize(items) {
        const typeLabels = {
            album: "Album",
            ep: "EP",
            single: "Single",
            collab: "Collaboration",
            "album-track": "Album Track"
        };

        // Build album image map
        const albumMap = {};
        const len = items.length;
        for (let i = 0; i < len; i++) {
            const it = items[i];
            if (it.type === "album" || it.type === "ep") {
                albumMap[it.id] = it.image;
            }
        }

        // Normalize each item
        const normalized = new Array(len);
        for (let i = 0; i < len; i++) {
            const item = items[i];

            let albumId = item.albumId;
            if (!albumId && item.id) {
                const lastDash = item.id.lastIndexOf("-");
                if (lastDash !== -1) albumId = item.id.substring(0, lastDash);
            }

            const type = item.type || "";
            const title = item.title || "";
            const artist = item.artist || "";
            const label = typeLabels[type] || type;

            normalized[i] = {
                ...item,
                image: item.image || albumMap[albumId] || "",
                displayDate: Utils.displayDate(item.releaseDate),
                dateValue: item.releaseDate ? new Date(item.releaseDate).getTime() : 0,
                typeLabel: label,
                typeTag: type.toUpperCase(),
                searchIndex: (title + " " + artist + " " + type).toLowerCase()
            };
        }

        return normalized;
    }
};


// ============================================================================
// UI RENDERING
// ============================================================================

const UI = {
    /**
     * Generate URL for a release detail page
     */
    getReleaseUrl: (item) => {
        const type = item.type;
        const page = (type === "album" || type === "ep") ? "album.html" : "single.html";
        return `/${page}?id=${Utils.enc(item.id)}`;
    },

    /**
     * Render a mini release card
     */
    renderReleaseMini: (item, eyebrow = "Latest Release") => {
        const { esc, safeUrl } = Utils;
        return Components.render("release-mini", {
            eyebrow: esc(eyebrow),
            typeLabel: esc(item.typeLabel),
            title: esc(item.title),
            artist: esc(item.artist),
            displayDate: esc(item.displayDate),
            image: safeUrl(item.image),
            listenUrl: safeUrl(item.listenLink),
            detailUrl: UI.getReleaseUrl(item)
        });
    },

    /**
     * Render a full release card
     */
    renderCard: (item) => {
        const { esc, safeUrl } = Utils;
        const id = item.id;
        return Components.render("release-card", {
            id: esc(id),
            title: esc(item.title),
            artist: esc(item.artist),
            image: safeUrl(item.image),
            detailUrl: UI.getReleaseUrl(item),
            typeTag: esc(item.typeTag),
            favoriteClass: AppState.favorites.has(id) ? "is-favorite" : ""
        });
    },

    /**
     * Render one dynamically supplied storefront product.
     */
    renderStoreProduct: (product) => {
        const imageMarkup = product.image
            ? `<img src="${Utils.safeUrl(product.image)}" alt="${Utils.esc(product.name)}" loading="lazy">`
            : `<div class="store-product-image-placeholder" aria-hidden="true"><i class="fa-solid fa-record-vinyl"></i></div>`;

        return Components.render("store-product-card", {
            id: Utils.esc(product.id),
            priceId: Utils.esc(product.priceId),
            name: Utils.esc(product.name),
            description: Utils.esc(product.description),
            type: Utils.esc(product.type),
            price: Utils.esc(Storefront.formatPrice(product.unitAmount, product.currency)),
            imageMarkup,
            availabilityClass: product.available ? "" : "d-none",
            soldOutClass: product.available ? "d-none" : "",
            disabled: product.available ? "" : "disabled",
            checkoutLabel: product.available ? "Buy now" : "Sold out"
        });
    },

    /**
     * Render a navigation link
     */
    navLink: ([label, href], mobile = false) =>
        `<a class="${mobile ? "dropdown-item" : "nav-link"}" href="${Utils.esc(href)}">${Utils.esc(label)}</a>`,

    /**
     * Render a footer navigation item
     */
    footerNavItem: ([label, href]) =>
        `<li><a href="${Utils.esc(href)}" class="text-decoration-none">${Utils.esc(label)}</a></li>`,

    /**
     * Render a toggle switch
     */
    toggle: (id, label, key) => `
        <div class="form-check form-switch mb-2">
            <input class="form-check-input" type="checkbox" id="${Utils.esc(id)}" data-key="${Utils.esc(key)}">
            <label class="form-check-label" for="${Utils.esc(id)}">${Utils.esc(label)}</label>
        </div>`,

    /**
     * Render a theme option radio button
     */
    themeOption: (mode) => `
        <input type="radio" class="btn-check" name="theme-mode" id="th-${mode}" value="${mode}">
        <label class="btn btn-outline-primary" for="th-${mode}">${mode}</label>`,

    /**
     * Render an empty state message
     */
    emptyMessage: (message, className = "") =>
        `<p class="text-muted ${Utils.esc(className)}">${Utils.esc(message)}</p>`,

    /**
     * Render an embedded video frame
     */
    videoFrame: (url) => {
        const safe = Utils.safeUrl(url);
        const separator = safe.includes('?') ? '&' : '?';
        return `<iframe width="100%" height="100%" src="${safe}${separator}rel=0" frameborder="0" allowfullscreen class="rounded-3"></iframe>`;
    },

    /**
     * Render lyrics text
     */
    lyrics: (text) =>
        `<p>${Utils.esc(text)}</p>`
};


// ============================================================================
// STOREFRONT DATA & CHECKOUT
// ============================================================================

const Storefront = {
    /**
     * Normalize the public product shape returned by the store backend.
     */
    normalizeProduct: (product, index) => {
        if (!product || typeof product !== "object") return null;

        const unitAmount = Number(product.unitAmount ?? product.price ?? product.priceCents);
        const id = String(product.id ?? product.productId ?? "").trim();
        const name = String(product.name ?? "").trim();

        if (!id || !name || !Number.isFinite(unitAmount) || unitAmount < 0) return null;

        return {
            id,
            priceId: String(product.priceId ?? product.stripePriceId ?? id),
            name,
            description: String(product.description ?? ""),
            type: String(product.type ?? product.category ?? "Store item"),
            image: typeof product.image === "string" ? product.image : "",
            unitAmount,
            currency: String(product.currency ?? STOREFRONT_CONFIG.defaultCurrency).toUpperCase(),
            available: product.available !== false && product.inStock !== false,
            index
        };
    },

    formatPrice: (unitAmount, currency) => {
        try {
            return new Intl.NumberFormat("en-GB", {
                style: "currency",
                currency: currency || STOREFRONT_CONFIG.defaultCurrency
            }).format(unitAmount / 100);
        } catch {
            return `${(unitAmount / 100).toFixed(2)} ${currency || STOREFRONT_CONFIG.defaultCurrency}`;
        }
    },

    /**
     * Fetch public catalogue data. Configure productsEndpoint to return either
     * an array or an object with a `products` array; never call Stripe's secret
     * Products API directly from the browser.
     */
    async fetchProducts() {
        const response = await fetch(STOREFRONT_CONFIG.productsEndpoint, {
            headers: { Accept: "application/json" },
            cache: "no-store"
        });

        if (!response.ok) throw new Error(`Store product request failed: ${response.status}`);

        const payload = await response.json();
        const products = Array.isArray(payload) ? payload : payload?.products;
        if (!Array.isArray(products)) throw new Error("Store product response is invalid");

        return products
            .map((product, index) => this.normalizeProduct(product, index))
            .filter(Boolean);
    },

    /**
     * Request a server-created Stripe Checkout Session, then redirect to its
     * HTTPS URL. Insert Stripe server SDK/session creation at checkoutEndpoint.
     */
    async beginCheckout(productId, priceId, button) {
        if (!productId || !priceId || button?.disabled) return;

        const originalLabel = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Redirecting…';

        try {
            // Backend responsibility: validate the price ID and create a Stripe
            // Checkout Session with the Stripe secret key. Return { url } only.
            const response = await fetch(STOREFRONT_CONFIG.checkoutEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ productId, priceId })
            });

            if (!response.ok) throw new Error(`Checkout request failed: ${response.status}`);

            const payload = await response.json();
            const checkoutUrl = new URL(payload?.url || "", location.origin);
            if (checkoutUrl.protocol !== "https:") throw new Error("Invalid checkout URL");

            window.location.assign(checkoutUrl.href);
        } catch (error) {
            console.error("Checkout could not start", error);
            Utils.toast("Checkout is not available right now. Please try again later.", "error");
            button.disabled = false;
            button.innerHTML = originalLabel;
        }
    },

    bindCheckout: (container) => {
        container.addEventListener("click", event => {
            const button = event.target.closest("[data-store-checkout]");
            if (!button) return;

            Storefront.beginCheckout(button.dataset.productId, button.dataset.priceId, button);
        });
    }
};


// ============================================================================
// SHELL - APPLICATION SHELL & INITIALIZATION
// ============================================================================

const Shell = {
    /**
     * Initialize the entire application
     */
    async init() {
        // 1. Fetch and load configuration
        try {
            const configPath = getConfigPath();

            // Try cached config first
            let configData = CacheHelper.getCachedData("config");
            if (!configData) {
                const configRes = await fetch(configPath, { cache: "default" });
                if (!configRes.ok) throw new Error(`Config not found at ${configPath}`);
                configData = await configRes.json();
                CacheHelper.setCachedData("config", configData);
            }

            window.CONFIG = configData;
        } catch (err) {
            console.error("App Initialization Failed: Could not load artist config.", err);
            return;
        }

        // 2. Initialize application state and components
        await AppState.init();
        await Components.load();

        // 3. Set up DOM cache and render core UI
        this.cache = {
            root: document.documentElement,
            navbar: DOM.get("navbar-container"),
            footer: DOM.get("footer-container")
        };

        this.renderNavbar();
        this.renderFooter();
        this.initSearch();
        this.initTheme();
        this.initScrollTop();

        // 4. Route to the correct page logic
        const path = location.pathname.toLowerCase();
        const params = new URLSearchParams(location.search);
        const hasGrid = DOM.get("releases-grid");
        const hasHero = DOM.get("hero-release-card") || DOM.get("latest-release-container");
        const hasStorefront = DOM.get("store-products");

        if (hasGrid) {
            await Pages.discography();
        } else if (hasHero) {
            await Pages.home();
        } else if (hasStorefront) {
            await Pages.store();
        } else if (path.includes("single.html")) {
            await Pages.detail("single", params.get("id"));
        } else if (path.includes("album.html")) {
            await Pages.detail("album", params.get("id"));
        } else if (path.includes("about")) {
            await Pages.about();
        }

        // 5. Initialize scroll animations
        this.initReveal();
        this.initInteractiveTilt();
    },

    /**
     * Render the navigation bar
     */
    renderNavbar() {
        const container = this.cache.navbar;
        if (!container) return;

        const navLinks = Utils.renderItems(CONFIG.nav, item => UI.navLink(item));
        const mobileNavLinks = Utils.renderItems(CONFIG.nav, item => UI.navLink(item, true));
        const themeOptions = Utils.renderItems(["system", "light", "dark"], UI.themeOption);

        const toggles = (...items) =>
            Utils.renderItems(items, ([id, label, key]) => this.renderToggle(id, label, key));

        DOM.html(container, Components.render("navbar", {
            artistName: Utils.esc(CONFIG.artist.name),
            navLinks,
            mobileNavLinks,
            themeOptions,
            performanceToggles: toggles(
                ["setting-reduce-motion", "Reduce motion", "reduceMotion"],
                ["setting-compact-ui", "Compact spacing", "compactUI"]
            ),
            mobileToggles: toggles(
                ["setting-low-data-mode", "Low data mode", "lowDataMode"],
                ["setting-touch-friendly", "Touch-friendly UI", "touchFriendly"]
            ),
            desktopToggles: toggles(
                ["setting-minimal-cards", "Minimal Cards", "minimalCards"],
                ["setting-dense-grid", "Dense release grid", "denseGrid"]
            )
        }));

        // Handle random release button
        const handleRandom = async () => {
            const items = await Data.fetchReleases();
            if (!items.length) return;
            const valid = items.filter(r => r.type !== 'album-track');
            location.href = UI.getReleaseUrl(valid[(Math.random() * valid.length) | 0]);
        };

        const r1 = DOM.get("global-random");
        const r2 = DOM.get("global-random-mobile");
        if (r1) r1.onclick = handleRandom;
        if (r2) r2.onclick = handleRandom;

        // Set up settings checkboxes
        const checkboxes = DOM.qsa('.settings-panel input[type="checkbox"]');
        for (let i = 0, len = checkboxes.length; i < len; i++) {
            const el = checkboxes[i];
            const key = el.dataset.key;
            el.checked = AppState.settings[key];
            el.onchange = () => {
                AppState.settings[key] = el.checked;
                AppState.saveSettings();
            };
        }
    },

    /**
     * Helper to render toggle switches
     */
    renderToggle: UI.toggle,

    /**
     * Render the footer
     */
    renderFooter() {
        const target = this.cache.footer;
        if (!target) return;

        const year = new Date().getFullYear();
        const footerNav = Utils.renderItems(CONFIG.nav, UI.footerNavItem);

        DOM.html(target, Components.render("footer", {
            footerNav,
            year,
            artistDisplay: Utils.esc(CONFIG.artist.display),
            facebookUrl: Utils.safeUrl(CONFIG.social.facebook),
            instagramUrl: Utils.safeUrl(CONFIG.social.instagram),
            youtubeUrl: Utils.safeUrl(CONFIG.social.youtube),
            spotifyUrl: Utils.safeUrl(CONFIG.social.spotify),
            appleUrl: Utils.safeUrl(CONFIG.social.apple),
            soundcloudUrl: Utils.safeUrl(CONFIG.social.soundcloud)
        }));

        // Handle cache clear button
        const clearBtn = DOM.get("clear-cache-btn");
        if (clearBtn) {
            clearBtn.onclick = () => {
                if (confirm("Clear cache and reset settings?")) {
                    try {
                        localStorage.clear();
                        sessionStorage.clear();
                    } catch (e) {
                        console.error("Cache clear failed", e);
                    }
                    location.reload();
                }
            };
        }
    },

    /**
     * Initialize quick search functionality
     */
    initSearch() {
        const input = DOM.get("quick-search-input");
        const resultsBox = DOM.get("quick-search-results");
        if (!input || !resultsBox) return;

        input.oninput = Utils.debounce(async (e) => {
            if (!(e.target instanceof HTMLInputElement)) return;

            const query = String(e.target.value).toLowerCase().trim();
            if (!query || query.length > 100) {
                DOM.html(resultsBox, "");
                return;
            }

            try {
                const releases = await Data.fetchReleases();
                const results = [];

                for (let i = 0, len = releases.length; i < len; i++) {
                    if (releases[i].searchIndex && releases[i].searchIndex.indexOf(query) !== -1) {
                        results.push(releases[i]);
                        if (results.length === 5) break;
                    }
                }

                const html = Utils.renderItems(results, r =>
                    Components.render("quick-result", {
                        detailUrl: UI.getReleaseUrl(r),
                        image: Utils.safeUrl(r.image),
                        title: Utils.esc(r.title),
                        typeTag: Utils.esc(r.typeTag)
                    })
                );

                DOM.html(resultsBox, html || UI.emptyMessage("No results found.", "p-2"));
            } catch (err) {
                console.warn("Search failed", err);
                DOM.html(resultsBox, UI.emptyMessage("Search unavailable.", "p-2"));
            }
        }, 200);
    },

    /**
     * Initialize theme switcher
     */
    initTheme() {
        const saved = String(localStorage.getItem("theme-mode") || "light").slice(0, 10);
        const root = this.cache.root;
        if (!root) return;

        const media = window.matchMedia("(prefers-color-scheme: dark)");

        const apply = (m) => {
            if (!['light', 'dark', 'system'].includes(m)) m = 'light';

            const isDark = m === "dark" || (m === "system" && media.matches);
            root.dataset.theme = m;
            root.classList.toggle("dark-mode", isDark);

            try {
                localStorage.setItem("theme-mode", m);
            } catch (e) {
                console.warn("Theme save failed", e);
            }

            const radio = DOM.get(`th-${m}`);
            if (radio && radio instanceof HTMLInputElement) radio.checked = true;
        };

        const radios = DOM.qsa('input[name="theme-mode"]');
        for (let i = 0, len = radios.length; i < len; i++) {
            if (!(radios[i] instanceof HTMLInputElement)) continue;
            radios[i].onchange = (e) => {
                if (e.target instanceof HTMLInputElement) apply(e.target.value);
            };
        }

        media.addEventListener?.("change", () => {
            const current = String(localStorage.getItem("theme-mode") || "light");
            if (current === "system") apply("system");
        });

        apply(saved);
    },

    /**
     * Initialize scroll-to-top button
     */
    initScrollTop() {
        const btn = DOM.create("button", {
            id: "scroll-to-top-btn",
            className: "scroll-to-top-btn"
        });
        btn.appendChild(DOM.create("i", { className: "fas fa-chevron-up" }));
        document.body.appendChild(btn);

        const scrollTrigger = DOM.create("div", {
            className: "scroll-trigger-sentinel"
        });
        document.body.prepend(scrollTrigger);

        new IntersectionObserver(([entry]) => {
            btn.classList.toggle("is-visible", !entry.isIntersecting);
        }, { threshold: 0 }).observe(scrollTrigger);

        btn.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });
    },

    /**
     * Initialize interactive 3D tilt effect on cards
     */
    initInteractiveTilt() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
            AppState.settings.reduceMotion ||
            AppState.settings.touchFriendly ||
            AppState.settings.lowDataMode) {
            return;
        }

        const targets = DOM.qsa('.release-card, .release-mini, .hero-card, .surface');
        if (!targets.length) return;

        const maxTilt = 12;
        const handlers = new WeakMap();

        targets.forEach((el) => {
            let animationFrame = null;

            const reset = () => {
                el.style.setProperty('--tilt-x', '0deg');
                el.style.setProperty('--tilt-y', '0deg');
                if (animationFrame) {
                    cancelAnimationFrame(animationFrame);
                    animationFrame = null;
                }
            };

            const updateTilt = (event) => {
                if (animationFrame) cancelAnimationFrame(animationFrame);

                animationFrame = requestAnimationFrame(() => {
                    const rect = el.getBoundingClientRect();
                    const offsetX = event.clientX - rect.left;
                    const offsetY = event.clientY - rect.top;
                    const pctX = offsetX / rect.width;
                    const pctY = offsetY / rect.height;
                    const tiltX = (pctY - 0.5) * maxTilt;
                    const tiltY = (0.5 - pctX) * maxTilt;

                    el.style.setProperty('--tilt-x', `${tiltX.toFixed(2)}deg`);
                    el.style.setProperty('--tilt-y', `${tiltY.toFixed(2)}deg`);
                    animationFrame = null;
                });
            };

            handlers.set(el, { updateTilt, reset });
            el.addEventListener('pointermove', updateTilt);
            el.addEventListener('pointerleave', reset);
            el.addEventListener('pointercancel', reset);
            el.addEventListener('pointerdown', reset);
        });
    },

    /**
     * Initialize reveal animations on scroll
     */
    initReveal() {
        const els = DOM.qsa(".reveal, .card, .release-card, .release-mini, .track-item");
        for (let i = 0, len = els.length; i < len; i++) {
            GlobalRevealObserver.observe(els[i]);
        }
    }
};


// ============================================================================
// PAGE HANDLERS
// ============================================================================

const Pages = {
    /**
     * Load the public product catalogue and wire delegated checkout buttons.
     */
    async store() {
        const grid = DOM.get("store-products");
        const status = DOM.get("store-status");
        if (!grid) return;

        grid.setAttribute("aria-busy", "true");
        Storefront.bindCheckout(grid);

        try {
            const products = await Storefront.fetchProducts();
            if (!products.length) {
                DOM.html(grid, UI.emptyMessage("New items are being prepared. Please check back soon.", "store-empty-state"));
                DOM.text(status, "No items are available yet");
                return;
            }

            DOM.html(grid, Utils.renderItems(products, UI.renderStoreProduct));
            DOM.text(status, `${products.length} item${products.length === 1 ? "" : "s"} available`);
            Shell.initReveal();
        } catch (error) {
            console.error("Store catalogue load failed", error);
            DOM.html(grid, UI.emptyMessage("The store is unavailable right now. Please try again later.", "store-empty-state"));
            DOM.text(status, "Store temporarily unavailable");
        } finally {
            grid.removeAttribute("aria-busy");
        }
    },

    /**
     * Render the home page
     */
    async home() {
        const items = await Data.fetchReleases();
        const len = items.length;
        let latest = null;
        const radarItems = [];
        const radarTypes = ["album", "ep", "single", "collab"];

        // Find latest release and radar items
        for (let i = 0; i < len; i++) {
            const item = items[i];
            const isTrack = item.type === "album-track";

            if (!isTrack) {
                if (!latest || item.dateValue > latest.dateValue) latest = item;
                if (radarItems.length < 3 && radarTypes.indexOf(item.type) !== -1) {
                    radarItems.push(item);
                }
            }
        }

        // Render latest release
        if (latest) {
            const hero = DOM.get("hero-release-card");
            if (hero) DOM.html(hero, UI.renderReleaseMini(latest));

            const container = DOM.get("latest-release-container");
            if (container) {
                DOM.html(container, Components.render("latest-release", {
                    image: Utils.safeUrl(latest.image),
                    title: Utils.esc(latest.title),
                    displayDate: Utils.esc(latest.displayDate),
                    listenUrl: Utils.safeUrl(latest.listenLink)
                }));
                container.classList.remove("d-none");
            }
        }

        // Render release radar
        const radarGrid = DOM.get("release-radar-grid");
        if (radarGrid && radarItems.length) {
            DOM.html(radarGrid, Utils.renderItems(radarItems, item =>
                UI.renderReleaseMini(item, item.typeTag)
            ));
        }

        // Load and render video
        const vidContainer = DOM.get("youtube-video-container");
        if (vidContainer && CONFIG.api.video) {
            try {
                // Try cached video data first
                let videoData = CacheHelper.getCachedData("video");
                if (!videoData) {
                    const res = await fetch(CONFIG.api.video, { cache: "force-cache" });
                    if (res.ok) {
                        videoData = await res.json();
                        CacheHelper.setCachedData("video", videoData);
                    }
                }
                if (videoData?.youtube_embed_url) {
                    DOM.html(vidContainer, UI.videoFrame(videoData.youtube_embed_url));
                }
            } catch (err) {
                console.warn("Video embed load failed", err);
            }
        }

        Shell.initReveal();
    },

    /**
     * Render the discography/releases page
     */
    async discography() {
        const allItems = await Data.fetchReleases();
        const grid = DOM.get("releases-grid");
        if (!grid) return;

        const mainTypes = ["album", "ep", "single", "collab"];
        const items = allItems.filter(r => mainTypes.indexOf(r.type) !== -1);

        // Initialize filter state
        const state = {
            category: "all",
            search: "",
            sort: "date-desc",
            artist: "all",
            minYear: 2019,
            maxYear: new Date().getFullYear()
        };

        // Determine year range and artists
        const artists = new Set();
        let minDataYear = 9999;
        let maxDataYear = 0;

        for (let i = 0; i < items.length; i++) {
            const r = items[i];
            if (r.artist) artists.add(r.artist);
            if (r.dateValue) {
                const year = new Date(r.dateValue).getFullYear();
                if (year < minDataYear) minDataYear = year;
                if (year > maxDataYear) maxDataYear = year;
            }
        }

        if (minDataYear === 9999) minDataYear = 2019;
        if (maxDataYear === 0) maxDataYear = new Date().getFullYear();
        state.minYear = minDataYear;
        state.maxYear = maxDataYear;

        // Set up artist filter
        const artistSelect = DOM.get("artist-filter");
        Utils.setOptions(artistSelect, Array.from(artists).sort(), "All Artists");

        // Set up year range sliders
        const yearMinEl = DOM.get("year-min");
        const yearMaxEl = DOM.get("year-max");
        const yearMinLbl = DOM.get("year-min-label");
        const yearMaxLbl = DOM.get("year-max-label");

        if (yearMinEl && yearMaxEl) {
            yearMinEl.min = yearMaxEl.min = minDataYear;
            yearMinEl.max = yearMaxEl.max = maxDataYear;
            yearMinEl.value = minDataYear;
            yearMaxEl.value = maxDataYear;
            if (yearMinLbl) yearMinLbl.textContent = minDataYear;
            if (yearMaxLbl) yearMaxLbl.textContent = maxDataYear;
        }

        /**
         * Render filtered releases based on current state
         */
        const render = () => {
            let filtered = items.filter(r => {
                if (state.category === "favorites" && !AppState.favorites.has(r.id)) return false;
                if (state.category !== "all" && state.category !== "favorites" && r.type !== state.category) return false;
                if (state.search && r.searchIndex.indexOf(state.search) === -1) return false;
                if (state.artist !== "all" && r.artist !== state.artist) return false;
                if (r.dateValue) {
                    const year = new Date(r.dateValue).getFullYear();
                    if (year < state.minYear || year > state.maxYear) return false;
                }
                return true;
            });

            // Sort filtered results
            filtered.sort((a, b) => {
                if (state.sort === "date-desc") return b.dateValue - a.dateValue;
                if (state.sort === "date-asc") return a.dateValue - b.dateValue;
                if (state.sort === "title-asc") return a.title.localeCompare(b.title);
                if (state.sort === "artist-asc") return a.artist.localeCompare(b.artist);
                return 0;
            });

            DOM.html(grid, Utils.renderItems(filtered, UI.renderCard));

            // Update counters
            const releaseCount = filtered.length;
            let albumCount = 0;
            for (let i = 0; i < filtered.length; i++) {
                if (filtered[i].type === "album") albumCount++;
            }

            let favCount = 0;
            for (let i = 0; i < items.length; i++) {
                if (AppState.favorites.has(items[i].id)) favCount++;
            }

            DOM.text(DOM.get("release-count"), `${releaseCount} Releases`);
            DOM.text(DOM.get("album-count"), `${albumCount} Albums`);
            DOM.text(DOM.get("favorite-count"), `${favCount} Favorites`);

            // Show/hide empty message
            const emptyMsg = DOM.get("no-releases-message");
            if (emptyMsg) {
                if (filtered.length === 0) {
                    emptyMsg.classList.remove("d-none");
                } else {
                    emptyMsg.classList.add("d-none");
                }
            }

            Shell.initReveal();
        };

        // Set up category filter buttons
        const filterBtns = DOM.qsa(".filter-btn");
        for (let i = 0; i < filterBtns.length; i++) {
            const btn = filterBtns[i];
            btn.onclick = () => {
                const activeBtn = DOM.qs(".filter-btn-active");
                if (activeBtn) {
                    activeBtn.classList.remove("filter-btn-active");
                    activeBtn.classList.add("filter-btn-inactive");
                }
                btn.classList.remove("filter-btn-inactive");
                btn.classList.add("filter-btn-active");
                state.category = btn.dataset.category;
                render();
            };
        }

        // Set up search
        const searchInput = DOM.get("discography-search");
        const searchClear = DOM.get("discography-search-clear");

        if (searchInput) {
            searchInput.oninput = Utils.debounce((e) => {
                state.search = e.target.value.toLowerCase().trim();
                render();
            }, 200);
        }

        if (searchClear && searchInput) {
            searchClear.onclick = () => {
                searchInput.value = "";
                state.search = "";
                render();
            };
        }

        // Set up sort selector
        const sortSelect = DOM.get("sort-by");
        if (sortSelect) {
            sortSelect.onchange = (e) => {
                state.sort = e.target.value;
                render();
            };
        }

        // Set up artist filter
        if (artistSelect) {
            artistSelect.onchange = (e) => {
                state.artist = e.target.value;
                render();
            };
        }

        // Set up year range sliders
        if (yearMinEl && yearMaxEl) {
            const updateYears = (e) => {
                let minVal = parseInt(yearMinEl.value);
                let maxVal = parseInt(yearMaxEl.value);

                if (minVal > maxVal) {
                    if (e && e.target === yearMinEl) {
                        yearMinEl.value = maxVal;
                        minVal = maxVal;
                    } else if (e && e.target === yearMaxEl) {
                        yearMaxEl.value = minVal;
                        maxVal = minVal;
                    }
                }

                if (yearMinLbl) yearMinLbl.textContent = minVal;
                if (yearMaxLbl) yearMaxLbl.textContent = maxVal;
                state.minYear = minVal;
                state.maxYear = maxVal;
                render();
            };

            yearMinEl.oninput = updateYears;
            yearMaxEl.oninput = updateYears;
        }

        // Set up favorite button handling
        grid.onclick = (e) => {
            const btn = e.target.closest(".favorite-btn");
            if (!btn) return;
            e.preventDefault();

            const id = btn.dataset.id;
            if (AppState.favorites.has(id)) {
                AppState.favorites.delete(id);
                btn.classList.remove("is-favorite");
            } else {
                AppState.favorites.add(id);
                btn.classList.add("is-favorite");
            }

            localStorage.setItem("label-favorites", JSON.stringify([...AppState.favorites]));

            if (state.category === "favorites") {
                render();
            } else {
                let favCount = 0;
                for (let i = 0; i < items.length; i++) {
                    if (AppState.favorites.has(items[i].id)) favCount++;
                }
                DOM.text(DOM.get("favorite-count"), `${favCount} Favorites`);
            }
        };

        render();
        DOM.get("loading-state")?.classList.add("d-none");
    },

    /**
     * Render release detail page (album or single)
     */
    async detail(kind, id) {
        const releases = await Data.fetchReleases();
        const item = releases.find(r => r.id === id);

        if (!item) {
            DOM.get("error-state")?.classList.remove("d-none");
            DOM.get("loading-state")?.classList.add("d-none");
            return;
        }

        DOM.get(`${kind}-details`)?.classList.remove("d-none");
        DOM.get("loading-state")?.classList.add("d-none");

        const tracklistContainer = DOM.get("tracklist-container");

        // Get element references
        const elements = {
            title: DOM.get(`${kind}-title`),
            artist: DOM.get(`${kind}-artist`),
            date: DOM.get(`${kind}-date`),
            type: DOM.get(`${kind}-type`),
            typeText: DOM.get(`${kind}-type-text`),
            count: DOM.get("album-track-count"),
            img: DOM.get(`${kind}-image`),
            listen: DOM.get("listen-btn")
        };

        // Populate detail information
        if (elements.title) elements.title.textContent = item.title;
        if (elements.artist) elements.artist.textContent = item.artist;
        if (elements.date) elements.date.textContent = item.displayDate;
        if (elements.type) elements.type.textContent = item.typeLabel;
        if (elements.typeText) elements.typeText.textContent = item.typeLabel;
        if (elements.count) elements.count.textContent = item.trackCount || "0";

        if (elements.img) {
            elements.img.src = Utils.safeUrl(item.image);
            elements.img.alt = `${item.title} cover`;
        }

        if (elements.listen) {
            elements.listen.href = Utils.safeUrl(item.listenLink || "#");
        }

        // Get associated tracks
        const tracks = releases.filter(r => {
            const isTrack = r.type === 'album-track' || r.type === 'track';
            const match = r.albumId === id || (r.albumId && id.startsWith(r.albumId)) || (r.id && r.id.startsWith(id));
            return isTrack && match;
        }).sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0));

        // Render tracklist
        const trackHtml = Utils.renderItems(tracks, (t, i) =>
            Components.render("track-item", {
                trackNumber: t.trackNumber || i + 1,
                title: Utils.esc(t.title),
                detailUrl: UI.getReleaseUrl(t)
            })
        );

        if (tracklistContainer) {
            DOM.html(tracklistContainer, trackHtml || UI.emptyMessage("Tracklist pending update.", "p-3"));
        }

        // Set page title
        document.title = `${item.title} | ${CONFIG.artist.display}`;

        // Load lyrics
        this.fetchLyrics(id);
    },

    /**
     * Fetch and display lyrics for a release
     */
    async fetchLyrics(id) {
        if (!id || typeof id !== 'string' || id.length > 200) return;

        try {
            // Try cached lyrics first
            let lyricsData = CacheHelper.getCachedData("lyrics");
            if (!lyricsData) {
                const res = await fetch(CONFIG.api.lyrics, { cache: "force-cache" });
                if (!res.ok) throw new Error(`Lyrics fetch failed: ${res.status}`);
                lyricsData = await res.json();
                if (!lyricsData || typeof lyricsData !== 'object') throw new Error("Invalid lyrics format");
                CacheHelper.setCachedData("lyrics", lyricsData);
            }

            const box = DOM.get("single-description-content");
            if (box && lyricsData[id] && typeof lyricsData[id] === 'string') {
                DOM.html(box, UI.lyrics(lyricsData[id]));
            }
        } catch (e) {
            console.warn("Lyrics fetch failed", e);
        }
    },

    /**
     * Render the about page
     */
    async about() {
        this.updateAge();

        // Load lazy images
        const images = DOM.qsa("img[data-src]");
        for (let i = 0, len = images.length; i < len; i++) {
            images[i].src = images[i].dataset.src;
            images[i].removeAttribute("data-src");
        }

        Shell.initReveal();
    },

    /**
     * Calculate and display current age
     */
    updateAge() {
        const ageEl = DOM.get("current-age");
        if (!ageEl) return;

        const birthDate = new Date(CONFIG.artist.birthDate);
        const now = new Date();
        let age = now.getFullYear() - birthDate.getFullYear();
        const monthDelta = now.getMonth() - birthDate.getMonth();

        if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birthDate.getDate())) {
            age--;
        }

        ageEl.textContent = `age ${age} years`;
    }
};


// ============================================================================
// APPLICATION BOOTSTRAP
// ============================================================================

(() => {
    const boot = () => {
        window.requestAnimationFrame(() => {
            Shell.init().catch(err => {
                console.error("App Critical Failure:", err);
                const loader = DOM.get("loading-state") || DOM.get("latest-release-loading");
                if (loader) loader.classList.add("d-none");
            });
        });
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
    } else {
        boot();
    }
})();
