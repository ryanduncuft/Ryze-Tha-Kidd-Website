/**
 * Ryze Tha Kidd - Main Application
 * Modern modular JavaScript architecture with light/dark mode support
 * All editable configuration is at the top for easy customization
 */

/**
 * CONFIG: Central configuration object
 * Edit these values to customize the site without touching code logic
 */
const CONFIG = {
    ARTIST: {
        NAME: "RYZE THA KIDD",
        DISPLAY_NAME: "Ryze Tha Kidd",
    },

    API: {
        DISCOGRAPHY: "https://gist.githubusercontent.com/ryanduncuft/39ade5f46c7b0a11618f5f016606ecc2/raw/rtk_data.json",
        VIDEO: "https://gist.githubusercontent.com/ryanduncuft/d67c1848410f5d6a77d914794848bc7d/raw/video_link.json",
    },

    DISCOGRAPHY: {
        PRIMARY_TYPES: ["album", "ep", "single", "collab"],
        CACHE_KEY: "discography-data",
    },

    SOCIAL: {
        TWITTER: "https://twitter.com/ryzethakidd",
        INSTAGRAM: "https://instagram.com/ryzethakidd",
        YOUTUBE: "https://youtube.com/@RyzeThaKidd",
        SPOTIFY: "https://open.spotify.com",
        APPLE_MUSIC: "https://music.apple.com",
        SOUNDCLOUD: "https://soundcloud.com",
    },

    NAVIGATION: [
        { label: "Home", href: "/" },
        { label: "About", href: "about" },
        { label: "Discography", href: "discography" },
        { label: "Faq", href: "faq", isNew: true },
        { label: "Contact", href: "contact" },
    ],

    DARK_MODE: {
        STORAGE_KEY: "dark-mode",
        DEFAULT_DARK: false,
    },

    CACHE: {
        DURATION_MS: 3600000,
        STORAGE_PREFIX: "rtk_",
    },

    DATE_FORMAT: {
        YEAR: "numeric",
        MONTH: "long",
        DAY: "numeric",
    },
};

/**
 * Utils: Reusable utility functions for DOM manipulation and common tasks
 */
const Utils = {
    // Security: Sanitize HTML to prevent XSS attacks
    sanitizeHTML(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    },

    // Security: Validate URL is same-origin or approved external domain
    isValidURL(url) {
        try {
            const parsed = new URL(url, window.location.href);
            const isExternal = parsed.origin !== window.location.origin;
            const approvedDomains = ['gist.githubusercontent.com', 'youtube.com', 'twitter.com', 'instagram.com'];
            return !isExternal || approvedDomains.some(domain => parsed.hostname.includes(domain));
        } catch {
            return false;
        }
    },

    // UX: Show loading spinner
    showLoading(element) {
        if (!element) return;
        element.innerHTML = '<div class="spinner-border spinner-border-sm text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
    },

    // UX: Toast notification system
    showNotification(message, type = 'info', duration = 3000) {
        const toastId = 'toast-' + Date.now();
        const backgroundColor = {
            'success': '#28a745',
            'error': '#dc3545',
            'warning': '#ffc107',
            'info': '#17a2b8'
        }[type] || '#17a2b8';

        const toast = document.createElement('div');
        toast.id = toastId;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${backgroundColor};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            animation: slideIn 0.3s ease;
            font-weight: 600;
            max-width: 300px;
        `;
        toast.textContent = message;

        if (!document.getElementById('toast-container')) {
            const container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
        document.getElementById('toast-container').appendChild(toast);

        if (duration > 0) {
            setTimeout(() => {
                toast.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
    },

    async fetchData(url) {
        try {
            // Security: Validate URL before fetching
            if (!this.isValidURL(url)) {
                throw new Error('Invalid or untrusted URL');
            }

            const response = await fetch(url, { 
                cache: "no-cache",
                credentials: 'omit', // Don't send credentials by default
                headers: {
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            
            // Security: Validate JSON response is array/object
            if (typeof data !== 'object' || data === null) {
                throw new Error('Invalid JSON response');
            }
            return data;
        } catch (error) {
            console.warn(`Failed to fetch from ${url}:`, error);
            this.showNotification('Failed to load data. Please try again.', 'error');
            return null;
        }
    },

    optimizeImage(img) {
        if (!img) return;

        const originalSrc = img.dataset.src || img.src;
        if (!originalSrc) return;

        // Skip optimization for external CDN images (YouTube thumbnails, etc.)
        const skipPatterns = ['i.ytimg.com', 'youtube.com', 'ytimg'];
        const shouldSkip = skipPatterns.some(pattern => originalSrc.includes(pattern));
        if (shouldSkip) return;

        const isTargetImage = /\.(jpg|jpeg|png)$/i.test(originalSrc);
        const isAlreadyOptimized = img.dataset.optimized === "true";

        if (isTargetImage && !isAlreadyOptimized) {
            const newSrc = originalSrc.replace(/\.(jpg|jpeg|png)$/i, ".webp");
            img.dataset.optimized = "true";

            img.onerror = () => {
                console.warn(`WebP not found, falling back to: ${originalSrc}`);
                img.src = originalSrc;
            };

            img.src = newSrc;
        } else if (img.dataset.src) {
            img.src = img.dataset.src;
        }
    },

    formatDate(dateString) {
        if (!dateString) return "TBD";
        try {
            const date = new Date(dateString);
            if (isNaN(date)) return "TBD";
            return date.toLocaleDateString("en-US", CONFIG.DATE_FORMAT);
        } catch {
            return "TBD";
        }
    },

    getElement(id) {
        return document.getElementById(id);
    },

    getElements(selector) {
        return document.querySelectorAll(selector);
    },

    setHTML(element, html) {
        if (element) {
            // Security: Use textContent for plain text, innerHTML for formatted content (pre-sanitized)
            element.innerHTML = html;
        }
    },

    toggleClass(element, className) {
        if (element) element.classList.toggle(className);
    },

    addClass(element, className) {
        if (element) element.classList.add(className);
    },

    removeClass(element, className) {
        if (element) element.classList.remove(className);
    },

    debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func(...args), delay);
        };
    },

    scrollToElement(selector, smooth = true) {
        const element = document.querySelector(selector);
        if (!element) return false;
        element.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
        return true;
    },

    // UX: Scroll to top button
    addScrollToTopButton() {
        const btn = document.createElement('button');
        btn.innerHTML = '<i class="fas fa-chevron-up"></i>';
        btn.className = 'scroll-to-top-btn';
        btn.setAttribute('aria-label', 'Scroll to top');
        btn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 40px;
            height: 40px;
            border: none;
            background: var(--accent);
            color: white;
            border-radius: 50%;
            cursor: pointer;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            z-index: 999;
            font-size: 18px;
        `;

        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                btn.style.opacity = '1';
                btn.style.visibility = 'visible';
            } else {
                btn.style.opacity = '0';
                btn.style.visibility = 'hidden';
            }
        });

        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        document.body.appendChild(btn);
    },
};

/**
 * FormValidator: Client-side form validation and security
 */
const FormValidator = {
    // Validation rules
    rules: {
        name: { 
            required: true, 
            minLength: 2,
            maxLength: 100,
            pattern: /^[a-zA-Z\s'-]+$/,
            message: 'Name must be 2-100 characters and contain only letters'
        },
        email: { 
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Please enter a valid email address'
        },
        message: { 
            required: true,
            minLength: 10,
            maxLength: 5000,
            message: 'Message must be 10-5000 characters'
        },
    },

    validateField(name, value) {
        if (!this.rules[name]) return { valid: true };
        const rule = this.rules[name];

        if (rule.required && !value.trim()) {
            return { valid: false, error: `${name} is required` };
        }

        if (rule.minLength && value.length < rule.minLength) {
            return { valid: false, error: `${name} is too short (min ${rule.minLength})` };
        }

        if (rule.maxLength && value.length > rule.maxLength) {
            return { valid: false, error: `${name} is too long (max ${rule.maxLength})` };
        }

        if (rule.pattern && !rule.pattern.test(value)) {
            return { valid: false, error: rule.message };
        }

        return { valid: true };
    },

    validateForm(formElement) {
        if (!formElement) return { valid: true, errors: {} };

        const errors = {};
        const inputs = formElement.querySelectorAll('input[name], textarea[name]');

        inputs.forEach(input => {
            const name = input.name;
            if (name && name !== 'form-name' && name !== 'bot-field') {
                const validation = this.validateField(name, input.value);
                if (!validation.valid) {
                    errors[name] = validation.error;
                    input.classList.add('is-invalid');
                } else {
                    input.classList.remove('is-invalid');
                }
            }
        });

        return {
            valid: Object.keys(errors).length === 0,
            errors
        };
    },

    initForm() {
        const forms = document.querySelectorAll('form[name="contact"]');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                const validation = this.validateForm(form);
                if (!validation.valid) {
                    e.preventDefault();
                    Object.entries(validation.errors).forEach(([field, error]) => {
                        Utils.showNotification(error, 'warning', 4000);
                    });
                } else {
                    Utils.showNotification('Form submitted successfully!', 'success', 2000);
                }
            });

            // Real-time validation
            form.querySelectorAll('input[name], textarea[name]').forEach(input => {
                input.addEventListener('blur', () => {
                    const name = input.name;
                    if (name && name !== 'form-name' && name !== 'bot-field') {
                        const validation = this.validateField(name, input.value);
                        if (!validation.valid) {
                            input.classList.add('is-invalid');
                        } else {
                            input.classList.remove('is-invalid');
                        }
                    }
                });
            });
        });
    },
};

/**
 * Navbar: Handles navigation bar rendering and interactions
 */
const Navbar = {
    generateHTML() {
        const navLinks = CONFIG.NAVIGATION.map(
            (link) => `
            <a class="nav-link ${link.isNew ? 'nav-link-new' : ''}" href="${link.href}" aria-label="${link.label}">
                ${link.label}
                ${link.isNew ? '<span class="nav-badge-new">NEW</span>' : ''}
            </a>
        `
        ).join("");

        const mobileNavLinks = CONFIG.NAVIGATION.map(
            (link) => `
            <a class="dropdown-item ${link.isNew ? 'dropdown-item-new' : ''}" href="${link.href}">
                ${link.label}
                ${link.isNew ? '<span class="nav-badge-new">NEW</span>' : ''}
            </a>
        `
        ).join("");

        return `
            <nav class="navbar navbar-expand-lg sticky-top navbar-light" role="banner">
                <div class="container-fluid navbar-container-layout">
                    <a class="navbar-brand" href="/" aria-label="Home - ${CONFIG.ARTIST.NAME}">
                        ${CONFIG.ARTIST.NAME}
                    </a>

                    <div class="navbar-nav d-none d-lg-flex navbar-center">
                        ${navLinks}
                    </div>

                    <div class="navbar-controls d-none d-lg-flex">
                        <button id="dark-mode-toggle-desktop" class="btn btn-sm btn-outline-primary" aria-label="Toggle Dark Mode" title="Toggle Dark Mode">
                            <i class="fa-solid fa-moon"></i>
                        </button>
                    </div>

                    <button class="navbar-toggler d-lg-none ms-auto" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasNavbar" aria-label="Toggle navigation" aria-controls="offcanvasNavbar">
                        <span class="navbar-toggler-icon"></span>
                    </button>

                    <div class="offcanvas offcanvas-end d-lg-none" id="offcanvasNavbar" tabindex="-1" aria-labelledby="offcanvasNavbarLabel">
                        <div class="offcanvas-header">
                            <h5 class="offcanvas-title" id="offcanvasNavbarLabel">Navigation</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                        </div>
                        <div class="offcanvas-body">
                            <div class="navbar-nav flex-column w-100">
                                ${mobileNavLinks}
                                <hr class="my-3">
                                <button id="dark-mode-toggle-mobile" class="btn btn-sm btn-outline-primary w-100" aria-label="Toggle Dark Mode" title="Toggle Dark Mode">
                                    <i class="fa-solid fa-moon"></i> Dark Mode
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        `;
    },

    async load() {
        const container = Utils.getElement("navbar-container");
        if (!container) return;

        Utils.setHTML(container, this.generateHTML());

        const desktopToggle = Utils.getElement("dark-mode-toggle-desktop");
        const mobileToggle = Utils.getElement("dark-mode-toggle-mobile");

        const handleToggle = () => {
            DarkMode.toggle();
            DarkMode.updateToggleIcons(desktopToggle, mobileToggle);
        };

        if (desktopToggle) desktopToggle.addEventListener("click", handleToggle);
        if (mobileToggle) mobileToggle.addEventListener("click", handleToggle);

        // Fix mobile menu navigation - handle link clicks properly
        const mobileNavLinks = document.querySelectorAll('.offcanvas-body .dropdown-item');
        const offcanvasElement = Utils.getElement("offcanvasNavbar");
        
        if (offcanvasElement && mobileNavLinks.length > 0) {
            const offcanvasInstance = bootstrap.Offcanvas.getInstance(offcanvasElement) || new bootstrap.Offcanvas(offcanvasElement);
            
            mobileNavLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    // Allow the navigation to happen naturally
                    // Bootstrap's data-bs-dismiss will handle closing the offcanvas
                    setTimeout(() => {
                        offcanvasInstance.hide();
                    }, 50);
                });
            });
        }

        DarkMode.updateToggleIcons(desktopToggle, mobileToggle);
    },
};

/**
 * Footer: Handles footer rendering and cache management
 */
const Footer = {
    generateHTML() {
        return `
            <footer class="py-5">
                <div class="container">
                    <div class="row g-4 justify-content-center text-center">
                        <div class="col-12 col-sm-6 col-md-3">
                            <h3 class="mb-3">Navigation</h3>
                            <ul class="list-unstyled">
                                ${CONFIG.NAVIGATION.map(
                                    (link) => `
                                    <li>
                                        <a href="${link.href}" class="text-decoration-none">
                                            ${link.label}
                                        </a>
                                    </li>
                                `
                                ).join("")}
                            </ul>
                        </div>

                        <div class="col-12 col-sm-6 col-md-3">
                            <h3 class="mb-3">Connect</h3>
                            <div class="d-flex gap-3 justify-content-center">
                                <a href="${CONFIG.SOCIAL.TWITTER}" target="_blank" rel="noopener noreferrer" aria-label="X/Twitter" title="X/Twitter">
                                    <i class="fab fa-twitter fa-lg"></i>
                                </a>
                                <a href="${CONFIG.SOCIAL.INSTAGRAM}" target="_blank" rel="noopener noreferrer" aria-label="Instagram" title="Instagram">
                                    <i class="fab fa-instagram fa-lg"></i>
                                </a>
                                <a href="${CONFIG.SOCIAL.YOUTUBE}" target="_blank" rel="noopener noreferrer" aria-label="YouTube" title="YouTube">
                                    <i class="fab fa-youtube fa-lg"></i>
                                </a>
                            </div>
                        </div>

                        <div class="col-12 col-sm-6 col-md-3">
                            <h3 class="mb-3">Stream</h3>
                            <ul class="list-unstyled">
                                <li>
                                    <a href="${CONFIG.SOCIAL.SPOTIFY}" target="_blank" rel="noopener noreferrer" class="text-decoration-none">
                                        Spotify
                                    </a>
                                </li>
                                <li>
                                    <a href="${CONFIG.SOCIAL.APPLE_MUSIC}" target="_blank" rel="noopener noreferrer" class="text-decoration-none">
                                        Apple Music
                                    </a>
                                </li>
                                <li>
                                    <a href="${CONFIG.SOCIAL.SOUNDCLOUD}" target="_blank" rel="noopener noreferrer" class="text-decoration-none">
                                        SoundCloud
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <div class="col-12 col-sm-6 col-md-3">
                            <h3 class="mb-3">System</h3>
                            <p class="text-muted">© <span id="current-year">2024</span> ${CONFIG.ARTIST.DISPLAY_NAME}</p>
                            <button id="clear-cache-btn" class="btn btn-sm btn-outline-secondary">
                                Clear Cache
                            </button>
                        </div>
                    </div>
                    <div class="footer-bottom">
                        <p class="mb-0">Made with <i class="fas fa-heart"></i> for the music</p>
                    </div>
                </div>
            </footer>
        `;
    },

    async load() {
        const container = Utils.getElement("footer-container");
        if (!container) return;

        Utils.setHTML(container, this.generateHTML());

        const yearSpan = Utils.getElement("current-year");
        if (yearSpan) yearSpan.textContent = new Date().getFullYear();

        this.setupCacheButton();
    },

    setupCacheButton() {
        const btn = Utils.getElement("clear-cache-btn");
        if (!btn) return;

        btn.addEventListener("click", () => {
            if (confirm("Clear cache and reload?")) {
                localStorage.clear();
                sessionStorage.clear();
                location.reload();
            }
        });
    },
};

/**
 * HomePage: Manages the homepage content (latest release, videos, etc.)
 */
const HomePage = {
    renderLatestRelease(release) {
        return `
            <div class="row align-items-center">
                <div class="col-12 col-md-6 mb-4 mb-md-0">
                    <img
                        class="img-fluid rounded-3 shadow-lg"
                        src="${release.image}"
                        alt="${release.title} cover"
                        loading="lazy"
                    />
                </div>
                <div class="col-12 col-md-6">
                    <h2 class="display-4 fw-bold mb-3">Latest Drop: ${release.title}</h2>
                    <p class="fs-5 text-muted mb-4">${Utils.formatDate(release.releaseDate)}</p>
                    <a
                        href="${release.listenLink}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="btn btn-primary btn-lg"
                    >
                        <i class="fas fa-play me-2"></i> Stream Now
                    </a>
                </div>
            </div>
        `;
    },

    async loadLatestRelease() {
        const container = Utils.getElement("latest-release-container");
        const loading = Utils.getElement("latest-release-loading");
        const error = Utils.getElement("latest-release-error");

        if (!container || !loading || !error) return;

        Utils.removeClass(loading, "d-none");
        Utils.addClass(error, "d-none");
        Utils.addClass(container, "d-none");

        const releases = await Utils.fetchData(CONFIG.API.DISCOGRAPHY);

        if (releases && Array.isArray(releases) && releases.length > 0) {
            try {
                const latest = releases.reduce((prev, curr) =>
                    new Date(curr.releaseDate) > new Date(prev.releaseDate) ? curr : prev
                );

                Utils.setHTML(container, this.renderLatestRelease(latest));
                Utils.removeClass(container, "d-none");
                Utils.addClass(container, "fade-in");
            } catch (err) {
                console.error("Error processing release:", err);
                Utils.removeClass(error, "d-none");
            }
        } else {
            Utils.setHTML(container, '<p class="text-center text-muted">No releases found.</p>');
            Utils.removeClass(container, "d-none");
        }

        Utils.addClass(loading, "d-none");
    },

    async loadYouTubeVideo() {
        const container = Utils.getElement("youtube-video-container");
        if (!container) return;

        const data = await Utils.fetchData(CONFIG.API.VIDEO);

        if (data && data.youtube_embed_url) {
            Utils.setHTML(
                container,
                `
                <div class="position-relative w-100 h-100">
                    <iframe
                        width="100%"
                        height="100%"
                        src="${data.youtube_embed_url}?autoplay=1"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen
                        class="rounded-3"
                    ></iframe>
                </div>
            `
            );
        }
    },

    setupSmoothScroll() {
        const btn = Utils.getElement("latest-drop-button");
        if (!btn) return;

        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const href = btn.getAttribute("href");
            Utils.scrollToElement(href, true);
        });
    },
};

/**
 * Discography: Manages release filtering, sorting, and display
 */
const Discography = {
    allReleases: [],
    activeFilter: "all",
    activeSort: "date-desc",

    prepareReleases(data) {
        return data
            .filter((r) => CONFIG.DISCOGRAPHY.PRIMARY_TYPES.includes(r.type))
            .map((r) => ({
                ...r,
                displayDate: Utils.formatDate(r.releaseDate),
                typeTag: r.type ? r.type.toUpperCase() : "",
                dateValue: new Date(r.releaseDate).getTime() || 0,
                titleLower: (r.title || "").toLowerCase(),
                artistLower: (r.artist || "").toLowerCase(),
            }));
    },

    sortReleases(releases, sortValue) {
        const sorted = [...releases];
        switch (sortValue) {
            case "title-asc":
                sorted.sort((a, b) => a.titleLower.localeCompare(b.titleLower));
                break;
            case "artist-asc":
                sorted.sort((a, b) => a.artistLower.localeCompare(b.artistLower));
                break;
            case "date-asc":
                sorted.sort((a, b) => a.dateValue - b.dateValue);
                break;
            default:
                sorted.sort((a, b) => b.dateValue - a.dateValue);
        }
        return sorted;
    },

    renderCards(releases) {
        const grid = Utils.getElement("releases-grid");
        if (!grid) return;

        if (releases.length === 0) {
            Utils.setHTML(grid, '<div class="col-12"><p class="text-center text-muted">No releases found.</p></div>');
            return;
        }

        const html = releases
            .map((r) => {
                // Generate clean URLs - Netlify _redirects will rewrite these to query parameters
                let detailUrl;
                if (r.type === "album") {
                    detailUrl = `/album/${r.id}`;
                } else if (r.type === "ep") {
                    detailUrl = `/ep/${r.id}`;
                } else if (r.type === "collab") {
                    detailUrl = `/collab/${r.id}`;
                } else {
                    detailUrl = `/single/${r.id}`;
                }
                return `
                <div class="col">
                    <div class="release-card h-100">
                        <a href="${detailUrl}" class="text-decoration-none">
                            <div class="release-card-image position-relative overflow-hidden rounded-top-3">
                                <img src="${r.image}" alt="${r.title}" class="w-100 h-100 object-fit-cover" loading="lazy" />
                                <span class="release-type-tag">${r.typeTag}</span>
                                <div class="release-card-overlay position-absolute inset-0 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center opacity-0">
                                    <i class="fas fa-play-circle fa-3x text-white"></i>
                                </div>
                            </div>
                        </a>
                        <div class="release-card-content p-3 p-md-4">
                            <h3 class="release-title text-truncate mb-2" title="${r.title}">${r.title}</h3>
                            <p class="text-muted small text-truncate mb-2">${r.artist}</p>
                            <p class="text-secondary small mb-0">${r.displayDate}</p>
                        </div>
                    </div>
                </div>
            `;
            })
            .join("");

        Utils.setHTML(grid, html);
    },

    updateDisplay() {
        let filtered =
            this.activeFilter === "all"
                ? this.allReleases
                : this.allReleases.filter((r) => r.type === this.activeFilter);

        const sorted = this.sortReleases(filtered, this.activeSort);
        this.renderCards(sorted);
    },

    async loadData() {
        const loading = Utils.getElement("loading-state");
        const error = Utils.getElement("error-state");
        const noReleases = Utils.getElement("no-releases-message");

        if (loading) Utils.removeClass(loading, "d-none");
        if (error) Utils.addClass(error, "d-none");
        if (noReleases) Utils.addClass(noReleases, "d-none");

        try {
            const data = await Utils.fetchData(CONFIG.API.DISCOGRAPHY);

            if (data && Array.isArray(data) && data.length > 0) {
                this.allReleases = this.prepareReleases(data);
                this.updateDisplay();
            } else {
                if (noReleases) Utils.removeClass(noReleases, "d-none");
            }
        } catch (err) {
            console.error("Error loading discography:", err);
            if (error) Utils.removeClass(error, "d-none");
        } finally {
            if (loading) Utils.addClass(loading, "d-none");
        }
    },

    async init() {
        const filterBtns = Utils.getElements(".filter-btn");
        const sortDropdown = Utils.getElement("sort-by");

        if (!filterBtns.length || !sortDropdown) return;

        filterBtns.forEach((btn) => {
            btn.addEventListener("click", () => {
                filterBtns.forEach((b) => {
                    Utils.removeClass(b, "filter-btn-active");
                    Utils.addClass(b, "filter-btn-inactive");
                });
                Utils.addClass(btn, "filter-btn-active");
                Utils.removeClass(btn, "filter-btn-inactive");
                this.activeFilter = btn.dataset.category || "all";
                this.updateDisplay();
            });
        });

        sortDropdown.addEventListener("change", (e) => {
            this.activeSort = e.target.value;
            this.updateDisplay();
        });

        await this.loadData();
    },
};

/**
 * DarkMode: Handles light/dark theme switching with localStorage persistence
 */
const DarkMode = {
    init() {
        const savedPreference = localStorage.getItem(CONFIG.DARK_MODE.STORAGE_KEY);
        const isDark = savedPreference === "true" || CONFIG.DARK_MODE.DEFAULT_DARK;

        if (isDark) {
            document.documentElement.classList.add("dark-mode");
        }

        window.toggleDarkMode = () => this.toggle();
    },

    toggle() {
        const isDark = document.documentElement.classList.toggle("dark-mode");
        localStorage.setItem(CONFIG.DARK_MODE.STORAGE_KEY, isDark);
        return isDark;
    },

    isDark() {
        return document.documentElement.classList.contains("dark-mode");
    },

    updateToggleIcons(desktopBtn, mobileBtn) {
        const isDark = this.isDark();
        const icon = isDark ? "fa-sun" : "fa-moon";
        const label = isDark ? "Light Mode" : "Dark Mode";

        if (desktopBtn) {
            desktopBtn.innerHTML = `<i class="fa-solid ${icon}"></i>`;
        }

        if (mobileBtn) {
            mobileBtn.innerHTML = `<i class="fa-solid ${icon}"></i> ${label}`;
        }
    },
};

/**
 * ImageOptimizer: Automatically converts images to WebP format where supported
 */
const ImageOptimizer = {
    init() {
        const allImgs = Utils.getElements("img, img[data-src]");
        allImgs.forEach((img) => Utils.optimizeImage(img));

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.tagName === "IMG") {
                        Utils.optimizeImage(node);
                    } else if (node.querySelectorAll) {
                        node.querySelectorAll("img").forEach((img) => Utils.optimizeImage(img));
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    },
};

/**
 * DetailPage: Unified handler for single/album detail pages
 */
const DetailPage = {
    allReleases: [],
    
    typeMap: {
        single: { display: "Single", types: ["single", "collab", "album-track"] },
        album: { display: "Album", types: ["album", "ep"] },
    },

    async loadData(id, pageType) {
        try {
            const data = await Utils.fetchData(CONFIG.API.DISCOGRAPHY);
            this.allReleases = data;
            const types = this.typeMap[pageType].types;
            return data.find((item) => item.id === id && types.includes(item.type));
        } catch (err) {
            console.error(`Error loading ${pageType} data:`, err);
            return null;
        }
    },

    getTypeDisplay(type) {
        const maps = { single: "Single", collab: "Collaboration", "album-track": "Album Track", album: "Album", ep: "EP" };
        return maps[type] || type;
    },

    renderTracks(albumId) {
        const container = Utils.getElement("tracklist-container");
        if (!container) return;
        const prefix = albumId.split("-").slice(0, -1).join("-") || albumId;
        const tracks = this.allReleases.filter((t) => t.type === "album-track" && t.id.startsWith(prefix));
        if (!tracks.length) return;

        const html = tracks.map((t, i) => `
            <div class="track-item">
                <div class="track-number">${i + 1}</div>
                <div class="track-info"><div class="track-title">${t.title}</div><div class="track-artist">${t.artist}</div></div>
                <div class="track-actions"><a href="/single/${t.id}" class="track-btn"><i class="fas fa-play"></i>Listen</a></div>
            </div>`).join("");
        Utils.setHTML(container, html);
    },

    async display(id, pageType) {
        const loading = Utils.getElement("loading-state");
        const error = Utils.getElement("error-state");
        const details = Utils.getElement(`${pageType}-details`);
        
        if (loading) Utils.removeClass(loading, "d-none");
        if (error) Utils.addClass(error, "d-none");
        if (details) Utils.addClass(details, "d-none");

        const item = await this.loadData(id, pageType);
        if (!item) {
            if (loading) Utils.addClass(loading, "d-none");
            if (error) Utils.removeClass(error, "d-none");
            return;
        }

        const imageEl = Utils.getElement(`${pageType}-image`);
        if (imageEl) { imageEl.src = item.image; imageEl.alt = item.title; }

        Utils.setHTML(Utils.getElement(`${pageType}-title`), item.title);
        Utils.setHTML(Utils.getElement(`${pageType}-artist`), item.artist);
        Utils.setHTML(Utils.getElement(`${pageType}-date`), Utils.formatDate(item.releaseDate));
        Utils.setHTML(Utils.getElement(`${pageType}-type`), this.getTypeDisplay(item.type));
        Utils.setHTML(Utils.getElement(`${pageType}-type-text`), this.getTypeDisplay(item.type));

        if (pageType === "album") {
            Utils.setHTML(Utils.getElement("album-track-count"), this.allReleases.filter((t) => t.type === "album-track" && t.id.startsWith(id.split("-").slice(0, -1).join("-"))).length);
            this.renderTracks(id);
        }

        const listenBtn = Utils.getElement("listen-btn");
        if (listenBtn) listenBtn.href = item.listenLink;

        if (loading) Utils.addClass(loading, "d-none");
        if (details) {
            Utils.removeClass(details, "d-none");
            Utils.addClass(details, "fade-in");
        }
        document.title = `${item.title} | Ryze Tha Kidd`;
    },

    extractId() {
        const params = new URLSearchParams(window.location.search);
        const pathname = window.location.pathname;
        const pathSegments = pathname.split('/').filter(s => s && !s.includes('.html'));
        
        if (params.has("id")) return params.get("id");
        if (params.has("slug")) return params.get("slug");
        return pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : null;
    },

    async init(pageType) {
        const id = this.extractId();
        if (!id) {
            const error = Utils.getElement("error-state");
            const loading = Utils.getElement("loading-state");
            if (loading) Utils.addClass(loading, "d-none");
            if (error) Utils.removeClass(error, "d-none");
            return;
        }
        await this.display(id, pageType);
    },
};

/**
 * VideoFAQ: Manages video FAQ accordion with questions and answers
 * Easy to add new videos and Q&A pairs - just edit the data array below
 */
const VideoFAQ = {
    // CONFIG: Edit this array to add/modify video FAQs
    // To add a new video: add object with { videoId, title, thumbnail, watchUrl, questions: [...] }
    // Each question object: { question: "Q?", answer: "A." }
    data: [
        {
            videoId: "video-1",
            title: "Music Production Process",
            thumbnail: "https://i.ytimg.com/vi/8dCv09a0tlM/maxresdefault.jpg",
            watchUrl: "https://youtube.com/watch?v=8dCv09a0tlM",
            questions: [
                {
                    question: "What DAW do you use?",
                    answer: "I primarily use FL Studio for production. It has great workflow and stock plugins that work perfectly for the sound I'm going for."
                },
                {
                    question: "How long does it take to make a beat?",
                    answer: "It varies! Some beats come together in 30 minutes, while others take weeks of refinement. Usually I spend 2-4 hours on a production session."
                },
                {
                    question: "Do you use samples or play everything?",
                    answer: "I use a mix of both. I sample licensed content, play some instruments myself, and use synths to create unique sounds. It's all about finding the right balance."
                }
            ]
        }
    ],

    renderAccordion() {
        const container = Utils.getElement("faq-container");
        if (!container) return;

        if (this.data.length === 0) {
            Utils.setHTML(container, '<p class="text-center text-muted">No FAQs available yet.</p>');
            return;
        }

        let html = '<div class="accordion accordion-flush" id="faqAccordion">';

        this.data.forEach((video, vidIndex) => {
            const safeId = `faq-video-${video.videoId}`;
            
            html += `
                <div class="accordion-item faq-video-item bg-transparent border-0 mb-4">
                    <div class="accordion-header">
                        <button class="faq-video-card p-0 border-0 w-100" type="button" data-bs-toggle="collapse" data-bs-target="#${safeId}" aria-expanded="false" aria-controls="${safeId}">
                            <div class="row g-0 align-items-center">
                                <div class="col-5 col-md-4">
                                    <div class="faq-thumbnail-wrapper">
                                        <img src="${video.thumbnail}" class="faq-thumbnail" alt="${video.title}" loading="lazy">
                                        <div class="play-overlay"><i class="fas fa-play-circle"></i></div>
                                    </div>
                                </div>
                                <div class="col-7 col-md-8 p-3 p-md-4">
                                    <h3 class="faq-title fw-bold mb-0">${video.title}</h3>
                                    <small class="faq-questions-count d-block mt-2"><i class="fas fa-chevron-down"></i> ${video.questions.length} questions</small>
                                </div>
                            </div>
                        </button>
                    </div>
                    <div id="${safeId}" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                        <div class="faq-content-wrapper">
                            <div class="faq-questions-list">`;

            video.questions.forEach((qa, qaIndex) => {
                const answerAccordionId = `${safeId}-qa-${qaIndex}`;
                html += `
                                <div class="faq-qa-item">
                                    <button class="faq-question-btn" type="button" data-bs-toggle="collapse" data-bs-target="#${answerAccordionId}" aria-expanded="false" aria-controls="${answerAccordionId}">
                                        <div class="faq-question-content">
                                            <i class="fas fa-question-circle faq-question-icon"></i>
                                            <span class="faq-question-text">${qa.question}</span>
                                        </div>
                                        <i class="fas fa-chevron-down faq-chevron"></i>
                                    </button>
                                    <div id="${answerAccordionId}" class="collapse faq-answer-collapse">
                                        <div class="faq-answer-content">
                                            <i class="fas fa-lightbulb faq-answer-icon"></i>
                                            <p class="faq-answer-text">${qa.answer}</p>
                                        </div>
                                    </div>
                                </div>`;
            });

            html += `
                            </div>
                            <div class="faq-video-link">
                                <a href="${video.watchUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
                                    <i class="fas fa-play me-2"></i> Watch Full Video
                                </a>
                            </div>
                        </div>
                    </div>
                </div>`;
        });

        html += '</div>';
        Utils.setHTML(container, html);
    },

    async init() {
        const container = Utils.getElement("faq-container");
        const loading = Utils.getElement("faq-loading");
        const error = Utils.getElement("faq-error");

        if (!container) {
            console.error("VideoFAQ.init() - No container found!");
            return;
        }

        try {
            if (loading) Utils.removeClass(loading, "d-none");
            if (error) Utils.addClass(error, "d-none");
            
            // Simulate small delay for better UX
            await new Promise(resolve => setTimeout(resolve, 300));
            
            this.renderAccordion();
            if (loading) Utils.addClass(loading, "d-none");
        } catch (err) {
            console.error("Error initializing FAQ:", err);
            if (loading) Utils.addClass(loading, "d-none");
            if (error) Utils.removeClass(error, "d-none");
        }
    }
};

/**
 * SinglePage: Initializes detail page for singles
 */
const SinglePage = {
    init: () => DetailPage.init("single"),
};

/**

 * AlbumPage: Initializes detail page for albums
 */
const AlbumPage = {
    init: () => DetailPage.init("album"),
};

/**
 * App: Main application orchestrator
 * Coordinates initialization of all modules in proper order
 */
const App = {
    async init() {
        try {
            const currentPage = window.location.pathname.toLowerCase();
            
            // Handle clean URLs for local development (Netlify.toml handles this on production)
            // Convert /single/id, /album/id, /ep/id, /collab/id to ?id=id format
            // NOTE: We must actually NAVIGATE to the HTML file, not just replaceState,
            // because replaceState doesn't trigger a page load or data refresh
            const pathSegments = currentPage.split('/').filter(s => s && !s.includes('.html'));
            
            if (pathSegments.length >= 2) {
                const pageType = pathSegments[pathSegments.length - 2];
                const itemId = pathSegments[pathSegments.length - 1];
                
                if (['single', 'album', 'ep', 'collab'].includes(pageType) && !window.location.search.includes('id=')) {
                    // Determine which HTML file to load based on page type
                    const htmlFile = pageType === 'album' || pageType === 'ep' ? 'album.html' : 'single.html';
                    const newUrl = `/${htmlFile}?id=${itemId}`;
                    // Actually navigate to the page - don't just replaceState
                    window.location.href = newUrl;
                    return; // Stop execution, page will reload
                }
            }
            
            // Initialize UX features early
            Utils.addScrollToTopButton();
            this.injectAnimationStyles();
            FormValidator.initForm();

            DarkMode.init();
            ImageOptimizer.init();
            await Navbar.load();

            // Check if it's a detail page
            // Supports: old format (album.html, single.html) and clean URLs (/album/*, /single/*, /ep/*, /collab/*)
            const isSingleDetailPage = currentPage.includes("single.html") ||  
                                      pathSegments.includes("single") || 
                                      pathSegments.includes("collab");
            const isAlbumDetailPage = currentPage.includes("album.html") || 
                                     pathSegments.includes("album") || 
                                     pathSegments.includes("ep");
            const isFAQPage = currentPage.includes("faq.html") || currentPage.includes("/faq") || pathSegments.includes("faq");

            if (isSingleDetailPage) {
                await Footer.load();
                await SinglePage.init();
            } else if (isAlbumDetailPage) {
                await Footer.load();
                await AlbumPage.init();
            } else if (isFAQPage) {
                await Footer.load();
                await VideoFAQ.init();
            } else {
                await Promise.all([
                    Footer.load(),
                    HomePage.loadLatestRelease(),
                    HomePage.loadYouTubeVideo(),
                    HomePage.setupSmoothScroll(),
                    Discography.init(),
                ]);
            }

        } catch (err) {
            console.error("Application initialization error:", err);
            Utils.showNotification('An error occurred. Please refresh the page.', 'error', 5000);
        }
    },

    injectAnimationStyles() {
        if (document.getElementById('rtk-animations')) return;
        const style = document.createElement('style');
        style.id = 'rtk-animations';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(400px); opacity: 0; }
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            .scroll-to-top-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4);
            }
        `;
        document.head.appendChild(style);
    },
};

/**
 * Initialize app when DOM is ready
 */
document.addEventListener("DOMContentLoaded", () => {
    App.init();
});
