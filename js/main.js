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
    async fetchData(url) {
        try {
            const response = await fetch(url, { cache: "no-cache" });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.warn(`Failed to fetch from ${url}:`, error);
            return null;
        }
    },

    optimizeImage(img) {
        if (!img) return;

        const originalSrc = img.dataset.src || img.src;
        if (!originalSrc) return;

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
        const element = document.getElementById(id);
        if (!element) console.warn(`Element not found: ${id}`);
        return element;
    },

    getElements(selector) {
        return document.querySelectorAll(selector);
    },

    setHTML(element, html) {
        if (element) element.innerHTML = html;
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
};

/**
 * Navbar: Handles navigation bar rendering and interactions
 */
const Navbar = {
    generateHTML() {
        const navLinks = CONFIG.NAVIGATION.map(
            (link) => `
            <a class="nav-link" href="${link.href}" aria-label="${link.label}">
                ${link.label}
            </a>
        `
        ).join("");

        const mobileNavLinks = CONFIG.NAVIGATION.map(
            (link) => `
            <a class="dropdown-item" href="${link.href}" data-bs-dismiss="offcanvas">
                ${link.label}
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
                // Generate clean URLs based on release type
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
 * SinglePage: Handles loading and displaying individual singles/collaborations
 */
const SinglePage = {
    async loadSingleData(id) {
        try {
            const data = await Utils.fetchData(CONFIG.API.DISCOGRAPHY);
            return data.find((item) => item.id === id && (item.type === "single" || item.type === "collab" || item.type === "album-track"));
        } catch (err) {
            console.error("Error loading single data:", err);
            return null;
        }
    },

    formatTypeDisplay(type) {
        const typeMap = {
            single: "Single",
            collab: "Collaboration",
            "album-track": "Album Track",
        };
        return typeMap[type] || type;
    },

    async displaySingle(id) {
        const loading = Utils.getElement("loading-state");
        const error = Utils.getElement("error-state");
        const details = Utils.getElement("single-details");

        if (loading) Utils.removeClass(loading, "d-none");
        if (error) Utils.addClass(error, "d-none");
        if (details) Utils.addClass(details, "d-none");

        const single = await this.loadSingleData(id);

        if (!single) {
            if (loading) Utils.addClass(loading, "d-none");
            if (error) Utils.removeClass(error, "d-none");
            return;
        }

        const imageEl = Utils.getElement("single-image");
        if (imageEl) {
            imageEl.src = single.image;
            imageEl.alt = single.title;
        }

        Utils.setHTML(Utils.getElement("single-title"), single.title);
        Utils.setHTML(Utils.getElement("single-artist"), single.artist);
        Utils.setHTML(Utils.getElement("single-date"), Utils.formatDate(single.releaseDate));
        Utils.setHTML(Utils.getElement("single-type"), this.formatTypeDisplay(single.type));
        Utils.setHTML(Utils.getElement("single-type-text"), this.formatTypeDisplay(single.type));
        
        const listenBtn = Utils.getElement("listen-btn");
        if (listenBtn) {
            listenBtn.href = single.listenLink;
        }

        if (loading) Utils.addClass(loading, "d-none");
        if (details) Utils.removeClass(details, "d-none");

        document.title = `${single.title} | Ryze Tha Kidd`;
    },

    async init() {
        const params = new URLSearchParams(window.location.search);
        let id = params.get("id") || params.get("slug");

        // If no id/slug parameter, extract from clean URL path (e.g., /single/song-name)
        if (!id) {
            const pathSegments = window.location.pathname.split('/').filter(s => s);
            if (pathSegments.length >= 2) {
                id = pathSegments[pathSegments.length - 1]; // Get last segment as slug
            }
        }

        if (!id) {
            const error = Utils.getElement("error-state");
            const loading = Utils.getElement("loading-state");
            if (loading) Utils.addClass(loading, "d-none");
            if (error) Utils.removeClass(error, "d-none");
            return;
        }

        await this.displaySingle(id);
    },
};

/**
 * AlbumPage: Handles loading and displaying albums/EPs with tracklist
 */
const AlbumPage = {
    allReleases: [],

    async loadAlbumData(id) {
        try {
            const data = await Utils.fetchData(CONFIG.API.DISCOGRAPHY);
            this.allReleases = data;
            return data.find((item) => item.id === id && (item.type === "album" || item.type === "ep"));
        } catch (err) {
            console.error("Error loading album data:", err);
            return null;
        }
    },

    getAlbumTracks(albumId) {
        const albumIdPrefix = albumId.split("-").slice(0, -1).join("-") || albumId;
        return this.allReleases.filter((item) => item.type === "album-track" && item.id.startsWith(albumIdPrefix));
    },

    formatTypeDisplay(type) {
        const typeMap = {
            album: "Album",
            ep: "EP",
        };
        return typeMap[type] || type;
    },

    renderTracklist(tracks) {
        const container = Utils.getElement("tracklist-container");
        if (!container || !tracks.length) return;

        const html = tracks
            .map(
                (track, index) => `
            <div class="track-item">
                <div class="track-number">${index + 1}</div>
                <div class="track-info">
                    <div class="track-title">${track.title}</div>
                    <div class="track-artist">${track.artist}</div>
                </div>
                <div class="track-actions">
                    <a href="/single/${track.id}" class="track-btn">
                        <i class="fas fa-play"></i>Listen
                    </a>
                </div>
            </div>
            `
            )
            .join("");

        Utils.setHTML(container, html);
    },

    async displayAlbum(id) {
        const loading = Utils.getElement("loading-state");
        const error = Utils.getElement("error-state");
        const details = Utils.getElement("album-details");

        if (loading) Utils.removeClass(loading, "d-none");
        if (error) Utils.addClass(error, "d-none");
        if (details) Utils.addClass(details, "d-none");

        const album = await this.loadAlbumData(id);

        if (!album) {
            if (loading) Utils.addClass(loading, "d-none");
            if (error) Utils.removeClass(error, "d-none");
            return;
        }

        const imageEl = Utils.getElement("album-image");
        if (imageEl) {
            imageEl.src = album.image;
            imageEl.alt = album.title;
        }

        Utils.setHTML(Utils.getElement("album-title"), album.title);
        Utils.setHTML(Utils.getElement("album-artist"), album.artist);
        Utils.setHTML(Utils.getElement("album-date"), Utils.formatDate(album.releaseDate));
        Utils.setHTML(Utils.getElement("album-type"), this.formatTypeDisplay(album.type));
        Utils.setHTML(Utils.getElement("album-type-text"), this.formatTypeDisplay(album.type));

        const tracks = this.getAlbumTracks(id);
        Utils.setHTML(Utils.getElement("album-track-count"), tracks.length);
        this.renderTracklist(tracks);

        const listenBtn = Utils.getElement("listen-btn");
        if (listenBtn) {
            listenBtn.href = album.listenLink;
        }

        if (loading) Utils.addClass(loading, "d-none");
        if (details) Utils.removeClass(details, "d-none");

        document.title = `${album.title} | Ryze Tha Kidd`;
    },

    async init() {
        const params = new URLSearchParams(window.location.search);
        let id = params.get("id") || params.get("slug");

        // If no id/slug parameter, extract from clean URL path (e.g., /album/album-name)
        if (!id) {
            const pathSegments = window.location.pathname.split('/').filter(s => s);
            if (pathSegments.length >= 2) {
                id = pathSegments[pathSegments.length - 1]; // Get last segment as slug
            }
        }

        if (!id) {
            const error = Utils.getElement("error-state");
            const loading = Utils.getElement("loading-state");
            if (loading) Utils.addClass(loading, "d-none");
            if (error) Utils.removeClass(error, "d-none");
            return;
        }

        await this.displayAlbum(id);
    },
};

/**
 * App: Main application orchestrator
 * Coordinates initialization of all modules in proper order
 */
const App = {
    async init() {
        try {
            DarkMode.init();
            ImageOptimizer.init();
            await Navbar.load();

            const currentPage = window.location.pathname;
            const pathSegments = currentPage.split('/').filter(s => s);

            // Check if it's a single/album detail page (supports both old ?id= and new clean URLs)
            const isSingleDetailPage = currentPage.includes("single.html") || 
                                      pathSegments.includes("single") || 
                                      pathSegments.includes("collab");
            const isAlbumDetailPage = currentPage.includes("album.html") || 
                                     pathSegments.includes("album") || 
                                     pathSegments.includes("ep");

            if (isSingleDetailPage) {
                await Footer.load();
                await SinglePage.init();
            } else if (isAlbumDetailPage) {
                await Footer.load();
                await AlbumPage.init();
            } else {
                await Promise.all([
                    Footer.load(),
                    HomePage.loadLatestRelease(),
                    HomePage.loadYouTubeVideo(),
                    HomePage.setupSmoothScroll(),
                    Discography.init(),
                ]);
            }

            console.log("✓ Application initialized successfully");
        } catch (err) {
            console.error("✗ Application initialization error:", err);
        }
    },
};

/**
 * Initialize app when DOM is ready
 */
document.addEventListener("DOMContentLoaded", () => {
    App.init();
});
