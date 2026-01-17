/**
 * Ryze Tha Kidd - Main Application
 * Modular JavaScript with clean organization for easy development
 * Light/Dark mode with purple accents
 */

// ============================================================================
// EDITABLE CONFIGURATION - Modify these values to customize the application
// ============================================================================

const CONFIG = {
  // Artist Information
  ARTIST: {
    NAME: "RYZE THA KIDD",
    DISPLAY_NAME: "Ryze Tha Kidd",
  },

  // API Endpoints
  API: {
    DISCOGRAPHY:
      "https://gist.githubusercontent.com/ryanduncuft/39ade5f46c7b0a11618f5f016606ecc2/raw/rtk_data.json",
    VIDEO:
      "https://gist.githubusercontent.com/ryanduncuft/d67c1848410f5d6a77d914794848bc7d/raw/video_link.json",
  },

  // Discography Settings
  DISCOGRAPHY: {
    PRIMARY_TYPES: ["album", "ep", "single", "collab"],
    CACHE_KEY: "discography-data",
  },

  // Social Media Links
  SOCIAL: {
    TWITTER: "https://twitter.com/ryzethakidd",
    INSTAGRAM: "https://instagram.com/ryzethakidd",
    YOUTUBE: "https://youtube.com/@RyzeThaKidd",
    SPOTIFY: "https://open.spotify.com",
    APPLE_MUSIC: "https://music.apple.com",
    SOUNDCLOUD: "https://soundcloud.com",
  },

  // Navigation Links
  NAVIGATION: [
    { label: "Home", href: "/" },
    { label: "About", href: "about" },
    { label: "Discography", href: "discography" },
    //{ label: "FAQ", href: "faq" },
    { label: "Contact", href: "contact" },
  ],

  // Dark Mode
  DARK_MODE: {
    STORAGE_KEY: "dark-mode",
    DEFAULT_DARK: false,
  },

  // Cache Settings
  CACHE: {
    DURATION_MS: 3600000, // 1 hour
    STORAGE_PREFIX: "rtk_",
  },

  // Date Format
  DATE_FORMAT: {
    YEAR: "numeric",
    MONTH: "long",
    DAY: "numeric",
  },
};

// ============================================================================
// UTILITY MODULE - Common helper functions
// ============================================================================

const Utils = {
  /**
   * Fetch data from URL with error handling
   */
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

  /**
   * Optimizes an image by swapping its extension to .webp
   * and setting the src from data-src to prevent flashing.
   */
  optimizeImage(img) {
    if (!img) return;

    // Use data-src if available (prevents the flash), otherwise fallback to src
    const originalSrc = img.dataset.src || img.src;
    if (!originalSrc) return;

    const isTargetImage = /\.(jpg|jpeg|png)$/i.test(originalSrc);
    const isAlreadyOptimized = img.dataset.optimized === "true";

    if (isTargetImage && !isAlreadyOptimized) {
      const newSrc = originalSrc.replace(/\.(jpg|jpeg|png)$/i, ".webp");
      img.dataset.optimized = "true";

      // Error fallback: If webp fails, use the original extension
      img.onerror = () => {
        console.warn(
          `WebP not found, falling back to original: ${originalSrc}`,
        );
        img.src = originalSrc;
      };

      img.src = newSrc;
    } else if (img.dataset.src) {
      // If it's not a target for webp but has a data-src, load it normally
      img.src = img.dataset.src;
    }
  },

  /**
   * Format date string to readable format
   */
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

  /**
   * Get element by ID with safety check
   */
  getElement(id) {
    const element = document.getElementById(id);
    if (!element) console.warn(`Element not found: ${id}`);
    return element;
  },

  /**
   * Get all elements matching selector
   */
  getElements(selector) {
    return document.querySelectorAll(selector);
  },

  /**
   * Safe HTML injection
   */
  setHTML(element, html) {
    if (element) element.innerHTML = html;
  },

  /**
   * Toggle class on element
   */
  toggleClass(element, className) {
    if (element) element.classList.toggle(className);
  },

  /**
   * Add class to element
   */
  addClass(element, className) {
    if (element) element.classList.add(className);
  },

  /**
   * Remove class from element
   */
  removeClass(element, className) {
    if (element) element.classList.remove(className);
  },

  /**
   * Debounce function to prevent excessive function calls
   */
  debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  },

  /**
   * Safely scroll to element with smooth animation
   */
  scrollToElement(selector, smooth = true) {
    const element = document.querySelector(selector);
    if (!element) return false;
    element.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    return true;
  },
};

// ============================================================================
// NAVBAR MODULE - Navigation bar management
// ============================================================================

const Navbar = {
  /**
   * Generate navigation HTML
   */
  generateHTML() {
    const navLinks = CONFIG.NAVIGATION.map(
      (link) => `
      <li class="nav-item">
        <a class="nav-link" href="${link.href}" aria-label="${link.label}">
          ${link.label}
        </a>
      </li>
    `,
    ).join("");

    return `
      <nav class="navbar navbar-expand-lg sticky-top navbar-light" role="banner">
        <div class="container-fluid">
          <a class="navbar-brand" href="/" aria-label="Home - ${
            CONFIG.ARTIST.NAME
          }">
            ${CONFIG.ARTIST.NAME}
          </a>
          <button class="navbar-toggler d-lg-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasNavbar" aria-label="Open Mobile Menu" aria-controls="offcanvasNavbar">
            <i class="fa fa-bars"></i>
          </button>

          <!-- Desktop Navigation -->
          <div class="collapse navbar-collapse d-none d-lg-flex" id="navbarNav">
            <ul class="navbar-nav">
              ${navLinks}
              <li class="nav-item">
                <button id="dark-mode-toggle-desktop" class="btn btn-sm btn-outline-primary" aria-label="Toggle Dark Mode" title="Toggle Dark Mode">
                  <i class="fa-solid fa-moon"></i>
                </button>
              </li>
            </ul>
          </div>

          <!-- Mobile Navigation -->
          <div class="offcanvas offcanvas-end d-lg-none custom-offcanvas" id="offcanvasNavbar" tabindex="-1" aria-labelledby="offcanvasNavbarLabel">
            <div class="offcanvas-header">
              <h5 class="offcanvas-title" id="offcanvasNavbarLabel">Menu</h5>
              <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
            </div>
            <div class="offcanvas-body">
              <ul class="navbar-nav ms-auto">
                ${CONFIG.NAVIGATION.map(
                  (link) => `
                  <li class="nav-item">
                    <a class="nav-link" href="${link.href}" data-bs-dismiss="offcanvas">
                      ${link.label}
                    </a>
                  </li>
                `,
                ).join("")}
                <li class="nav-item">
                  <button id="dark-mode-toggle-mobile" class="btn btn-sm btn-outline-primary w-100 mt-3" aria-label="Toggle Dark Mode" title="Toggle Dark Mode">
                    <i class="fa-solid fa-moon"></i> Dark Mode
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>
    `;
  },

  /**
   * Load and setup navbar
   */
  async load() {
    const container = Utils.getElement("navbar-container");
    if (!container) return;

    Utils.setHTML(container, this.generateHTML());

    // Setup dark mode toggle buttons
    const desktopToggle = Utils.getElement("dark-mode-toggle-desktop");
    const mobileToggle = Utils.getElement("dark-mode-toggle-mobile");

    const handleToggle = () => {
      DarkMode.toggle();
      DarkMode.updateToggleIcons(desktopToggle, mobileToggle);
    };

    if (desktopToggle) desktopToggle.addEventListener("click", handleToggle);
    if (mobileToggle) mobileToggle.addEventListener("click", handleToggle);

    DarkMode.updateToggleIcons(desktopToggle, mobileToggle);

    // Setup offcanvas behavior
    this.setupOffcanvasBehavior();
  },

  /**
   * Lock body scroll when mobile menu opens
   */
  setupOffcanvasBehavior() {
    const offcanvasEl = Utils.getElement("offcanvasNavbar");
    if (!offcanvasEl) return;

    offcanvasEl.addEventListener("show.bs.offcanvas", () => {
      Utils.addClass(document.body, "no-scroll");
    });

    offcanvasEl.addEventListener("hidden.bs.offcanvas", () => {
      Utils.removeClass(document.body, "no-scroll");
    });
  },
};

// ============================================================================
// FOOTER MODULE - Footer management
// ============================================================================

const Footer = {
  /**
   * Generate footer HTML
   */
  generateHTML() {
    return `
      <footer class="py-5">
        <div class="container">
          <div class="row g-4 justify-content-center text-center">
            <!-- Navigation Section -->
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
                `,
                ).join("")}
              </ul>
            </div>

            <!-- Connect Section -->
            <div class="col-12 col-sm-6 col-md-3">
              <h3 class="mb-3">Connect</h3>
              <div class="d-flex gap-3 justify-content-center">
                <a href="${
                  CONFIG.SOCIAL.TWITTER
                }" target="_blank" rel="noopener noreferrer" aria-label="X/Twitter" title="X/Twitter">
                  <i class="fab fa-twitter fa-lg"></i>
                </a>
                <a href="${
                  CONFIG.SOCIAL.INSTAGRAM
                }" target="_blank" rel="noopener noreferrer" aria-label="Instagram" title="Instagram">
                  <i class="fab fa-instagram fa-lg"></i>
                </a>
                <a href="${
                  CONFIG.SOCIAL.YOUTUBE
                }" target="_blank" rel="noopener noreferrer" aria-label="YouTube" title="YouTube">
                  <i class="fab fa-youtube fa-lg"></i>
                </a>
              </div>
            </div>

            <!-- Stream Section -->
            <div class="col-12 col-sm-6 col-md-3">
              <h3 class="mb-3">Stream</h3>
              <ul class="list-unstyled">
                <li>
                  <a href="${
                    CONFIG.SOCIAL.SPOTIFY
                  }" target="_blank" rel="noopener noreferrer" class="text-decoration-none">
                    Spotify
                  </a>
                </li>
                <li>
                  <a href="${
                    CONFIG.SOCIAL.APPLE_MUSIC
                  }" target="_blank" rel="noopener noreferrer" class="text-decoration-none">
                    Apple Music
                  </a>
                </li>
                <li>
                  <a href="${
                    CONFIG.SOCIAL.SOUNDCLOUD
                  }" target="_blank" rel="noopener noreferrer" class="text-decoration-none">
                    SoundCloud
                  </a>
                </li>
              </ul>
            </div>

            <!-- System Section -->
            <div class="col-12 col-sm-6 col-md-3">
              <h3 class="mb-3">System</h3>
              <p class="text-muted">© <span id="current-year">2024</span> ${
                CONFIG.ARTIST.DISPLAY_NAME
              }</p>
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

  /**
   * Load and setup footer
   */
  async load() {
    const container = Utils.getElement("footer-container");
    if (!container) return;

    Utils.setHTML(container, this.generateHTML());

    // Update current year
    const yearSpan = Utils.getElement("current-year");
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    // Setup cache clear button
    this.setupCacheButton();
  },

  /**
   * Setup cache clear button handler
   */
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

// ============================================================================
// HOMEPAGE MODULE - Latest release and video management
// ============================================================================

const HomePage = {
  /**
   * Render latest release card
   */
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
          <p class="fs-5 text-muted mb-4">${Utils.formatDate(
            release.releaseDate,
          )}</p>
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

  /**
   * Load and display latest release
   */
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
          new Date(curr.releaseDate) > new Date(prev.releaseDate) ? curr : prev,
        );

        Utils.setHTML(container, this.renderLatestRelease(latest));
        Utils.removeClass(container, "d-none");
      } catch (err) {
        console.error("Error processing release:", err);
        Utils.removeClass(error, "d-none");
      }
    } else {
      Utils.setHTML(
        container,
        '<p class="text-center text-muted">No releases found.</p>',
      );
      Utils.removeClass(container, "d-none");
    }

    Utils.addClass(loading, "d-none");
  },

  /**
   * Load YouTube video embed
   */
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
      `,
      );
    }
  },

  /**
   * Setup smooth scroll to latest drop section
   */
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

// ============================================================================
// DISCOGRAPHY MODULE - Release management and filtering
// ============================================================================

const Discography = {
  allReleases: [],
  activeFilter: "all",
  activeSort: "date-desc",

  /**
   * Prepare release data
   */
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

  /**
   * Sort releases based on criteria
   */
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

  /**
   * Render discography cards
   */
  renderCards(releases) {
    const grid = Utils.getElement("releases-grid");
    if (!grid) return;

    if (releases.length === 0) {
      Utils.setHTML(
        grid,
        '<p class="text-center text-muted col-12">No releases found.</p>',
      );
      return;
    }

    const html = releases
      .map(
        (r) => `
        <div class="release-card">
          <a href="${r.listenLink}" target="_blank" rel="noopener noreferrer" class="text-decoration-none">
            <span class="release-type-tag">${r.typeTag}</span>
            <div class="position-relative overflow-hidden rounded-top-3" style="aspect-ratio: 1/1;">
              <img src="${r.image}" alt="${r.title}" class="w-100 h-100 object-fit-cover" />
              <div class="position-absolute inset-0 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center opacity-0" style="transition: opacity 0.3s;">
                <i class="fas fa-play-circle fa-3x text-white"></i>
              </div>
            </div>
          </a>
          <div class="p-3">
            <h3 class="release-title text-truncate" title="${r.title}">${r.title}</h3>
            <p class="text-muted small text-truncate">${r.artist}</p>
            <p class="text-secondary small">${r.displayDate}</p>
          </div>
        </div>
      `,
      )
      .join("");

    Utils.setHTML(grid, html);
  },

  /**
   * Update display based on current filters and sort
   */
  updateDisplay() {
    let filtered =
      this.activeFilter === "all"
        ? this.allReleases
        : this.allReleases.filter((r) => r.type === this.activeFilter);

    const sorted = this.sortReleases(filtered, this.activeSort);
    this.renderCards(sorted);
  },

  /**
   * Load discography data
   */
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

  /**
   * Setup filter and sort controls
   */
  async init() {
    const filterBtns = Utils.getElements(".filter-btn");
    const sortDropdown = Utils.getElement("sort-by");

    if (!filterBtns.length || !sortDropdown) return;

    // Setup filter buttons
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

    // Setup sort dropdown
    sortDropdown.addEventListener("change", (e) => {
      this.activeSort = e.target.value;
      this.updateDisplay();
    });

    // Load data
    await this.loadData();
  },
};

// ============================================================================
// DARK MODE MODULE - Handle light/dark mode switching
// ============================================================================

const DarkMode = {
  /**
   * Initialize dark mode based on user preference
   */
  init() {
    const savedPreference = localStorage.getItem(CONFIG.DARK_MODE.STORAGE_KEY);
    const isDark = savedPreference === "true" || CONFIG.DARK_MODE.DEFAULT_DARK;

    if (isDark) {
      document.documentElement.classList.add("dark-mode");
    }

    // Expose toggle to window for navbar buttons
    window.toggleDarkMode = () => this.toggle();
  },

  /**
   * Toggle between light and dark mode
   */
  toggle() {
    const isDark = document.documentElement.classList.toggle("dark-mode");
    localStorage.setItem(CONFIG.DARK_MODE.STORAGE_KEY, isDark);
    return isDark;
  },

  /**
   * Get current mode status
   */
  isDark() {
    return document.documentElement.classList.contains("dark-mode");
  },

  /**
   * Update toggle button icons
   */
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

// ============================================================================
// IMAGE OPTIMIZER MODULE - Automatic WebP Conversion
// ============================================================================

const ImageOptimizer = {
  init() {
    // 1. Target both standard images and our data-src images
    const allImgs = Utils.getElements("img, img[data-src]");
    allImgs.forEach((img) => Utils.optimizeImage(img));

    // 2. Setup Observer for dynamically loaded images
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.tagName === "IMG") {
            Utils.optimizeImage(node);
          } else if (node.querySelectorAll) {
            node
              .querySelectorAll("img")
              .forEach((img) => Utils.optimizeImage(img));
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

// ============================================================================
// APPLICATION INITIALIZATION
// ============================================================================

const App = {
  /**
   * Initialize the application
   */
  async init() {
    try {
      // Initialize dark mode first
      DarkMode.init();

      // Start watching for images immediately
      ImageOptimizer.init();

      // Load navbar and setup offcanvas
      await Navbar.load();

      // Load remaining components in parallel
      await Promise.all([
        Footer.load(),
        HomePage.loadLatestRelease(),
        HomePage.loadYouTubeVideo(),
        HomePage.setupSmoothScroll(),
        Discography.init(),
      ]);

      console.log("Application initialized successfully");
    } catch (err) {
      console.error("Application initialization error:", err);
    }
  },
};

// ============================================================================
// START APPLICATION ON DOM READY
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
