/// Site configuration values
const CONFIG = {

  ARTIST: {

    NAME: "RYZE THA KIDD",
    DISPLAY_NAME: "Ryze Tha Kidd"

  }
  ,
  API: {

    DISCOGRAPHY: "https://gist.githubusercontent.com/ryanduncuft/39ade5f46c7b0a11618f5f016606ecc2/raw/rtk_data.json",
    VIDEO: "https://gist.githubusercontent.com/ryanduncuft/d67c1848410f5d6a77d914794848bc7d/raw/video_link.json"

  }
  ,
  DISCOGRAPHY: {

    PRIMARY_TYPES: ["album", "ep", "single", "collab"]

  }
  ,
  SOCIAL: {

    FACEBOOK: "https://www.facebook.com/ryzethakidd",
    INSTAGRAM: "https://instagram.com/ryzethakidd",
    YOUTUBE: "https://youtube.com/@RyzeThaKidd",
    SPOTIFY: "https://open.spotify.com",
    APPLE_MUSIC: "https://music.apple.com",
    SOUNDCLOUD: "https://soundcloud.com"

  }
  ,
  NAVIGATION: [{

    label: "Home",
    href: "/"

  }
  , {

    label: "About",
    href: "about"

  }
  , {

    label: "Discography",
    href: "discography"

  }
  , {

    label: "FAQ",
    href: "faq",
    isNew: !0

  }
  , {

    label: "Contact",
    href: "contact"

  }
  ],
  THEME: {

    STORAGE_KEY: "theme-mode",
    DEFAULT_MODE: "system",
    MODES: ["system", "light", "dark"]

  }
  ,
  CACHE: {

    DURATION_MS: 6e5,
    RELEASES_KEY: "rtk_release_cache",
    RELEASES_TS_KEY: "rtk_release_cache_ts"

  }
  ,
  SETTINGS: {

    STORAGE_KEY: "rtk-settings",
    DEFAULTS: {

      reduceMotion: !1,
      largeText: !1,
      compactUI: !1,
      cleanView: !0

    }


  }
  ,
  DATE_FORMAT: {

    YEAR: "numeric",
    MONTH: "long",
    DAY: "numeric"

  }


}
;


/// Utility helpers for URL handling and DOM operations
const Utils = {

  sanitizeHTML(e) {

    return e == null ? "" : String(e)

  }
  ,
  isValidURL(e) {

    if (!e) return !1;

    try {

      let t = new URL(e, window.location.href);

      return ["http:", "https:"].includes(t.protocol)

    }
    catch {

      return !1

    }


  }
  ,
  safeURL(e) {

    if (!e) return "#";

    try {

      let t = new URL(e, window.location.href);

      return ["http:", "https:"].includes(t.protocol) ? t.href : "#"

    }
    catch {

      return "#"

    }


  }
  ,
  encodeURLParam(e) {

    return encodeURIComponent(String(e || ""))

  }
  ,
  normalizeReleases(e, t = {

  }
  ) {

    let a = !0 === t.includeAll;

    let s = e.filter(e => ["album", "ep"].includes(e.type));

    let i = s.reduce((e, t) => {

      e[t.id] = t.image;

      return e;


    }
    , {

    }
    );

    let n = s.map(e => e.id);

    return e.filter(e => a || CONFIG.DISCOGRAPHY.PRIMARY_TYPES.includes(e.type)).map(e => {

      let t = e.albumId || "";

      if ("album-track" === e.type) {

        if (!t && e.id && e.id.includes("-")) {

          t = e.id.split("-").slice(0, -1).join("-");


        }

        if (!t || !i[t]) {

          let a = n.filter(t => e.id && e.id.startsWith(`${t}-`)).sort((e, t) => t.length - e.length)[0];

          t = a || t;


        }


      }
      else if (!t && e.trackNumber && e.id) {

        let a = n.filter(t => e.id.startsWith(`${t}-`)).sort((e, t) => t.length - e.length)[0];

        t = a || "";


      }

      let a = e.image || (t && i[t]) || "";

      let r = Utils.formatDate(e.releaseDate);

      let o = new Date(e.releaseDate);

      let s = o.getTime() || 0;

      let u = o.getFullYear() || 0;

      return {

        ...e,
        albumId: t || void 0,
        image: a,
        displayDate: r,
        typeTag: e.type ? e.type.toUpperCase() : "",
        dateValue: s,
        titleLower: (e.title || "").toLowerCase(),
        artistLower: (e.artist || "").toLowerCase(),
        yearValue: u,
        yearText: `${u}`,
        searchText: [e.title, e.artist, e.type, e.id, t, e.releaseDate].filter(Boolean).join(" ").toLowerCase()

      }


    }
    )

  }
  ,
  releaseCache: null,
  async getReleaseData() {

    if (this.releaseCache) {

      return this.releaseCache;


    }

    try {

      let e = sessionStorage.getItem(CONFIG.CACHE.RELEASES_KEY);

      let t = Number(sessionStorage.getItem(CONFIG.CACHE.RELEASES_TS_KEY) || 0);

      if (e && Date.now() - t < CONFIG.CACHE.DURATION_MS) {

        let t = JSON.parse(e);

        if (Array.isArray(t)) {

          this.releaseCache = t;

          return t;


        }


      }


    }
    catch {

    }

    let e = await this.fetchData(CONFIG.API.DISCOGRAPHY);

    this.releaseCache = Array.isArray(e) ? this.normalizeReleases(e, {

      includeAll: !0

    }
    ) : [];

    try {

      sessionStorage.setItem(CONFIG.CACHE.RELEASES_KEY, JSON.stringify(this.releaseCache));

      sessionStorage.setItem(CONFIG.CACHE.RELEASES_TS_KEY, `${Date.now()}`);


    }
    catch {

    }

    return this.releaseCache;


  }
  ,
  showNotification(e, t = "info", a = 3e3) {

    let s = "toast-" + Date.now();

    let i = document.createElement("div");

    i.id = s;

    i.style.cssText = `\n            position: fixed;\n            top: 20px;\n            right: 20px;\n            background: ${{success:"#28a745",error:"#dc3545",warning:"#ffc107",info:"#17a2b8"}[t]||"#17a2b8"};\n            color: white;\n            padding: 12px 20px;\n            border-radius: 6px;\n            box-shadow: 0 4px 12px rgba(0,0,0,0.15);\n            z-index: 9999;\n            animation: slideIn 0.3s ease;\n            font-weight: 600;\n            max-width: 300px;\n        `;

    i.textContent = e;

    i.setAttribute("role", "error" === t ? "alert" : "status");

    i.setAttribute("aria-live", "error" === t ? "assertive" : "polite");


    if (!document.getElementById("toast-container")) {

      let container = document.createElement("div");

      container.id = "toast-container";

      document.body.appendChild(container);


    }

    let container = document.getElementById("toast-container");


    if (container) {

      container.appendChild(i);


    }


    if (a > 0) {

      setTimeout(() => {

        i.style.animation = "slideOut 0.3s ease";

        setTimeout(() => {

          i.remove();


        }
        , 300);


      }
      , a);


    }


  }
  ,
  async fetchData(e) {

    try {

      if (!this.isValidURL(e)) {

        throw Error("Invalid or untrusted URL");


      }

      let t;

      let a = new AbortController();

      let s = setTimeout(() => a.abort(), 8e3);

      t = await fetch(e, {

        cache: "no-cache",
        credentials: "omit",
        referrerPolicy: "no-referrer",
        signal: a.signal,
        headers: {

          Accept: "application/json"

        }


      }
      );

      clearTimeout(s);

      if (!t.ok) {

        throw Error(`HTTP ${t.status}`);


      }

      let i = await t.json();

      if ("object" != typeof i || null === i) {

        throw Error("Invalid JSON response");


      }

      return i;


    }
    catch (t) {

      this.showNotification("Failed to load data. Please try again.", "error");

      return null;


    }


  }
  ,
  optimizeImage(e) {

    if (!e) {

      return;


    }

    let t = e.dataset.src || e.src;

    if (!t) {

      return;


    }

    if (["i.ytimg.com", "youtube.com", "ytimg"].some(host => t.includes(host))) {

      return;


    }

    let a = /\.(jpg|jpeg|png)$/i.test(t);

    let s = "true" === e.dataset.optimized;

    if (a && !s) {

      let a = t.replace(/\.(jpg|jpeg|png)$/i, "");

      let s = [`${a}.avif`, `${a}.webp`, t];

      let i = 0;

      let n = () => {

        if (i < s.length) {

          e.src = s[i];

          i += 1;


        }
        else {

          e.onerror = null;


        }


      }
      ;

      e.dataset.optimized = "true";

      e.onerror = n;

      n();


    }
    else if (e.dataset.src) {

      e.src = e.dataset.src;


    }


  }
  ,
  formatDate(e) {

    if (!e) return "TBD";

    try {

      let t = new Date(e);

      return isNaN(t) ? "TBD" : t.toLocaleDateString("en-US", CONFIG.DATE_FORMAT)

    }
    catch {

      return "TBD"

    }


  }
  ,
  getElement: e => document.getElementById(e),
  getElements: e => document.querySelectorAll(e),
  setHTML(e, t) {

    e && (e.innerHTML = t)

  }
  ,
  setText(e, t) {

    e && (e.textContent = t ?? "")

  }
  ,
  addClass(e, t) {

    e && e.classList.add(t)

  }
  ,
  removeClass(e, t) {

    e && e.classList.remove(t)

  }
  ,
  addScrollToTopButton() {

    let e = document.createElement("button");

    e.innerHTML = '<i class="fas fa-chevron-up"></i>';

    e.className = "scroll-to-top-btn";

    e.setAttribute("aria-label", "Scroll to top");

    e.style.cssText = "\n            position: fixed;\n            bottom: 20px;\n            right: 20px;\n            width: 40px;\n            height: 40px;\n            border: none;\n            background: var(--accent);\n            color: white;\n            border-radius: 50%;\n            cursor: pointer;\n            opacity: 0;\n            visibility: hidden;\n            transition: all 0.3s ease;\n            z-index: 999;\n            font-size: 18px;\n        ";

    window.addEventListener("scroll", () => {

      if (window.pageYOffset > 300) {

        e.style.opacity = "1";

        e.style.visibility = "visible";


      }
      else {

        e.style.opacity = "0";

        e.style.visibility = "hidden";


      }


    }
    );

    e.addEventListener("click", () => {

      window.scrollTo({

        top: 0,
        behavior: "smooth"

      }
      );


    }
    );

    document.body.appendChild(e);


  }


}
;


/// Form validation rules and contact form handling
const FormValidator = {

  rules: {

    name: {

      required: !0,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-Z\s'-]+$/,
      message: "Name must be 2-100 characters and contain only letters"
    },
    email: {
      required: !0,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Please enter a valid email address"
    },
    message: {
      required: !0,
      minLength: 10,
      maxLength: 5e3,
      message: "Message must be 10-5000 characters"
    }
  },
  validateField(e, t) {
    if (!this.rules[e]) return {
      valid: !0
    };
    let a = this.rules[e];

    if (a.required && !t.trim()) {
      return {
        valid: false,
        error: `${e} is required`
      };
    }

    if (a.minLength && t.length < a.minLength) {
      return {
        valid: false,
        error: `${e} is too short (min ${a.minLength})`
      };
    }

    if (a.maxLength && t.length > a.maxLength) {
      return {
        valid: false,
        error: `${e} is too long (max ${a.maxLength})`
      };
    }

    if (a.pattern && !a.pattern.test(t)) {
      return {
        valid: false,
        error: a.message
      };
    }

    return {
      valid: true
    };
  },
  validateForm(form) {
    if (!form) {
      return {
        valid: true,
        errors: {}
      };
    }

    let errors = {};

    form.querySelectorAll("input[name], textarea[name]").forEach(field => {
      let name = field.name;

      if (name && name !== "form-name" && name !== "bot-field") {
        let validation = this.validateField(name, field.value);

        if (validation.valid) {
          field.classList.remove("is-invalid");
        } else {
          errors[name] = validation.error;
          field.classList.add("is-invalid");
        }
      }
    });

    return {
      valid: Object.keys(errors).length === 0,
      errors: errors
    };
  },
  initForm() {
    document.querySelectorAll('form[name="contact"]').forEach(form => {
      form.addEventListener("submit", event => {
        let result = this.validateForm(form);

        if (result.valid) {
          Utils.showNotification("Form submitted successfully!", "success", 2000);
        } else {
          event.preventDefault();

          Object.entries(result.errors).forEach(([field, message]) => {
            Utils.showNotification(message, "warning", 4000);
          });
        }
      });

      form.querySelectorAll("input[name], textarea[name]").forEach(field => {
        field.addEventListener("blur", () => {
          let fieldName = field.name;

          if (fieldName && fieldName !== "form-name" && fieldName !== "bot-field") {
            let validation = this.validateField(fieldName, field.value);

            if (validation.valid) {
              field.classList.remove("is-invalid");
            } else {
              field.classList.add("is-invalid");
            }
          }
        });
      });
    });
  }
};


// Navigation bar and offcanvas controls for mobile and desktop
const Navbar = {
  generateHTML: () => `\n            <a class="skip-link" href="#main-content">Skip to main content</a>\n            <nav class="navbar navbar-expand-lg sticky-top navbar-light" role="banner">\n                <div class="container-fluid navbar-container-layout">\n                    <a class="navbar-brand" href="/" aria-label="Home - ${CONFIG.ARTIST.NAME}">\n                        ${CONFIG.ARTIST.NAME}\n                    </a>\n\n                    <div class="navbar-nav d-none d-lg-flex navbar-center">\n                        ${CONFIG.NAVIGATION.map(e=>`\n            <a class="nav-link ${e.isNew?"nav-link-new":""}" href="${e.href}" aria-label="${e.label}">\n                ${e.label}\n                ${e.isNew?'<span class="nav-badge-new">NEW</span>':""}\n            </a>\n        `).join("")}\n                    </div>\n\n                    <div class="navbar-controls d-none d-lg-flex">\n                        <div class="dropdown">\n                            <button class="btn btn-sm btn-outline-primary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">\n                                <i class="fa-solid fa-compass me-2"></i> Tools\n                            </button>\n                            <ul class="dropdown-menu dropdown-menu-end">\n                                <li>\n                                    <button class="dropdown-item" data-bs-toggle="offcanvas" data-bs-target="#quickSearchPanel" aria-controls="quickSearchPanel">\n                                        <i class="fa-solid fa-magnifying-glass me-2"></i> Search\n                                    </button>\n                                </li>\n                                <li>\n                                    <button id="global-random" class="dropdown-item">\n                                        <i class="fa-solid fa-shuffle me-2"></i> Surprise\n                                    </button>\n                                </li>\n                                <li>\n                                    <button class="dropdown-item" data-bs-toggle="offcanvas" data-bs-target="#settingsPanel" aria-controls="settingsPanel">\n                                        <i class="fa-solid fa-sliders me-2"></i> Settings\n                                    </button>\n                                </li>\n                            </ul>\n                        </div>\n                    </div>\n\n                    <button class="navbar-toggler d-lg-none ms-auto" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasNavbar" aria-label="Toggle navigation" aria-controls="offcanvasNavbar">\n                        <span class="navbar-toggler-icon"></span>\n                    </button>\n\n                    <div class="offcanvas offcanvas-end d-lg-none" id="offcanvasNavbar" tabindex="-1" aria-labelledby="offcanvasNavbarLabel">\n                        <div class="offcanvas-header">\n                            <h5 class="offcanvas-title" id="offcanvasNavbarLabel">Navigation</h5>\n                            <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>\n                        </div>\n                        <div class="offcanvas-body">\n                            <div class="navbar-nav flex-column w-100">\n                                ${CONFIG.NAVIGATION.map(e=>`\n            <a class="dropdown-item ${e.isNew?"dropdown-item-new":""}" href="${e.href}">\n                ${e.label}\n                ${e.isNew?'<span class="nav-badge-new">NEW</span>':""}\n            </a>\n        `).join("")}\n                                <hr class="my-3">\n                                <button\n                                    id="open-settings-mobile"\n                                    class="btn btn-sm btn-outline-primary w-100 mt-3"\n                                    data-bs-toggle="offcanvas"\n                                    data-bs-target="#settingsPanel"\n                                    aria-controls="settingsPanel"\n                                >\n                                    <i class="fa-solid fa-sliders me-2"></i> Settings\n                                </button>\n                                <div class="mt-2 d-flex flex-column gap-2">\n                                    <button\n                                        id="open-search-mobile"\n                                        class="btn btn-sm btn-outline-primary w-100"\n                                        data-bs-toggle="offcanvas"\n                                        data-bs-target="#quickSearchPanel"\n                                        aria-controls="quickSearchPanel"\n                                    >\n                                        <i class="fa-solid fa-magnifying-glass me-2"></i> Search\n                                    </button>\n                                    <button\n                                        id="global-random-mobile"\n                                        class="btn btn-sm btn-outline-primary w-100"\n                                        aria-label="Surprise me"\n                                    >\n                                        <i class="fa-solid fa-shuffle me-2"></i> Surprise\n                                    </button>\n                                    <button\n                                        class="btn btn-sm btn-outline-primary w-100"\n                                        data-bs-toggle="offcanvas"\n                                        data-bs-target="#settingsPanel"\n                                        aria-controls="settingsPanel"\n                                    >\n                                        <i class="fa-solid fa-sliders me-2"></i> Settings\n                                    </button>\n                                </div>\n                            </div>\n                        </div>\n                    </div>\n                </div>\n            </nav>\n            <aside class="offcanvas offcanvas-end settings-panel" id="settingsPanel" data-bs-backdrop="false" data-bs-scroll="true" tabindex="-1" aria-labelledby="settingsPanelLabel">\n                <div class="offcanvas-header">\n                    <h2 class="offcanvas-title" id="settingsPanelLabel">Settings</h2>\n                    <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>\n                </div>\n                <div class="offcanvas-body">\n                    <section class="settings-section">\n                        <h3 class="settings-section-title">Theme</h3>\n                        <fieldset class="settings-group" aria-label="Theme selection">\n                            <div class="form-check">\n                                <input class="form-check-input" type="radio" name="theme-mode" id="theme-system" value="system">\n                                <label class="form-check-label" for="theme-system">System</label>\n                            </div>\n                            <div class="form-check">\n                                <input class="form-check-input" type="radio" name="theme-mode" id="theme-light" value="light">\n                                <label class="form-check-label" for="theme-light">Light</label>\n                            </div>\n                            <div class="form-check">\n                                <input class="form-check-input" type="radio" name="theme-mode" id="theme-dark" value="dark">\n                                <label class="form-check-label" for="theme-dark">Dark</label>\n                            </div>\n                        </fieldset>\n                    </section>\n\n                    <section class="settings-section">\n                        <h3 class="settings-section-title">Accessibility</h3>\n                        <div class="form-check form-switch">\n                            <input class="form-check-input" type="checkbox" id="setting-reduce-motion">\n                            <label class="form-check-label" for="setting-reduce-motion">Reduce motion</label>\n                        </div>\n                        <div class="form-check form-switch">\n                            <input class="form-check-input" type="checkbox" id="setting-large-text">\n                            <label class="form-check-label" for="setting-large-text">Larger text</label>\n                        </div>\n                    </section>\n\n                    <section class="settings-section">\n                        <h3 class="settings-section-title">Display</h3>\n                        <div class="form-check form-switch">\n                            <input class="form-check-input" type="checkbox" id="setting-compact-ui">\n                            <label class="form-check-label" for="setting-compact-ui">Compact spacing</label>\n                        </div>\n                        <div class="form-check form-switch">\n                            <input class="form-check-input" type="checkbox" id="setting-clean-view">\n                            <label class="form-check-label" for="setting-clean-view">Clean view (essential only)</label>\n                        </div>\n                    </section>\n                </div>\n                <div class="offcanvas-footer p-3 d-flex gap-2">\n                    <button type="button" id="settings-reset" class="btn btn-outline-primary w-100">Reset</button>\n                    <button type="button" class="btn btn-primary w-100" data-bs-dismiss="offcanvas">Done</button>\n                </div>\n            </aside>\n            <aside class="offcanvas offcanvas-end search-panel" id="quickSearchPanel" data-bs-backdrop="false" data-bs-scroll="true" tabindex="-1" aria-labelledby="quickSearchLabel">\n                <div class="offcanvas-header">\n                    <h2 class="offcanvas-title" id="quickSearchLabel">Quick Search</h2>\n                    <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>\n                </div>\n                <div class="offcanvas-body">\n                    <div class="input-group search-bar mb-3">\n                        <span class="input-group-text"><i class="fas fa-search"></i></span>\n                        <input id="quick-search-input" type="search" class="form-control" placeholder="Search releases..." />\n                        <button id="quick-search-clear" class="btn btn-outline-secondary" type="button">Clear</button>\n                    </div>\n                    <div id="quick-search-results" class="quick-search-results"></div>\n                    <p class="small text-muted mt-3 mb-0">Tip: press “/” to open search.</p>\n                </div>\n            </aside>\n        `,
  async load() {
    let e = Utils.getElement("navbar-container");
    if (!e) return;
    Utils.setHTML(e, this.generateHTML());
    let settingsButton = Utils.getElement("open-settings-mobile");
    let searchButton = Utils.getElement("open-search-mobile");
    let offcanvasNavbar = Utils.getElement("offcanvasNavbar");

    if (offcanvasNavbar && (settingsButton || searchButton)) {
      let offcanvasInstance = bootstrap.Offcanvas.getInstance(offcanvasNavbar) || new bootstrap.Offcanvas(offcanvasNavbar);

      let hideOffcanvas = () => {
        setTimeout(() => {
          offcanvasInstance.hide();
        }, 50);
      };

      if (settingsButton) {
        settingsButton.addEventListener("click", hideOffcanvas);
      }

      if (searchButton) {
        searchButton.addEventListener("click", hideOffcanvas);
      }
    }
    let randomButton = Utils.getElement("global-random");
    let randomButtonMobile = Utils.getElement("global-random-mobile");

    let navigateToRandomRelease = async () => {
      let releases = await Utils.getReleaseData();

      if (!releases.length) {
        return;
      }

      let chosenRelease = releases[Math.floor(Math.random() * releases.length)];
      let targetPage = ["album", "ep"].includes(chosenRelease.type) ? "album.html" : "single.html";

      window.location.href = `/${targetPage}?id=${Utils.encodeURLParam(chosenRelease.id)}`;
    };

    if (randomButton) {
      randomButton.addEventListener("click", navigateToRandomRelease);
    }

    if (randomButtonMobile) {
      randomButtonMobile.addEventListener("click", navigateToRandomRelease);
    }

    let dropdownItems = document.querySelectorAll(".offcanvas-body .dropdown-item");
    let offcanvasNavbarElement = Utils.getElement("offcanvasNavbar");

    if (offcanvasNavbarElement && dropdownItems.length > 0) {
      let offcanvasInstance = bootstrap.Offcanvas.getInstance(offcanvasNavbarElement) || new bootstrap.Offcanvas(offcanvasNavbarElement);

      dropdownItems.forEach(menuItem => {
        menuItem.addEventListener("click", () => {
          setTimeout(() => {
            offcanvasInstance.hide();
          }, 50);
        });
      });
    }

    Theme.updateUI();
  }
};


// Favorites storage helper for saving user picks locally
const Favorites = {
  STORAGE_KEY: "rtk-favorites",
  get() {
    let e = localStorage.getItem(this.STORAGE_KEY);
    if (!e) return new Set;
    try {
      let t = JSON.parse(e);
      return new Set(Array.isArray(t) ? t : [])
    } catch {
      return new Set
    }
  },
  save(e) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify([...e]))
  },
  has(e) {
    return this.get().has(e)
  },
  toggle(e) {
    let favorites = this.get();

    if (favorites.has(e)) {
      favorites.delete(e);
    } else {
      favorites.add(e);
    }

    this.save(favorites);
    return favorites.has(e);
  },
  count() {
    return this.get().size
  }
};


// Quick search panel behavior and instant filtering
const QuickSearch = {
  data: [],
  loaded: !1,
  async load() {
    if (this.loaded) {
      return;
    }

    let data = await Utils.getReleaseData();
    this.data = Array.isArray(data) ? data : [];
    this.loaded = true;
  },
  renderResults(e) {
    let t = Utils.getElement("quick-search-results");
    if (!t) return;
    if (!e.length) return void Utils.setHTML(t, '<p class="text-muted small mb-0">No results yet.</p>');
    let a = e.map(e => `\n            <a class="quick-result" href="/${["album","ep"].includes(e.type)?"album.html":"single.html"}?id=${Utils.encodeURLParam(e.id)}">\n              <img src="${Utils.safeURL(e.image)}" alt="${Utils.sanitizeHTML(e.title)}">\n              <div>\n                <div class="fw-semibold">${Utils.sanitizeHTML(e.title)}</div>\n                <div class="small text-muted">${Utils.sanitizeHTML(e.artist||"")}</div>\n              </div>\n            </a>\n          `).join("");
    Utils.setHTML(t, a)
  },
  async init() {
    let e = Utils.getElement("quick-search-input"),
    t = Utils.getElement("quick-search-clear");
    if (!e) return;
    await this.load();
    e.addEventListener("input", () => {
      let t = (e => (e || "").trim().toLowerCase())(e.value);
      if (!t) return void this.renderResults([]);
      let a = this.data.filter(e => e.searchText.includes(t)).slice(0, 8);
      this.renderResults(a)
    }), t && t.addEventListener("click", () => {
      e.value = "", e.focus(), this.renderResults([])
    }), document.addEventListener("keydown", t => {
      if ("/" === t.key && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
        t.preventDefault();
        let a = Utils.getElement("quickSearchPanel");
        if (a) {
          (bootstrap.Offcanvas.getInstance(a) || new bootstrap.Offcanvas(a)).show(), setTimeout(() => e.focus(), 150)
        }
      }
    })
  }
};


// Footer content, social links, and cache reset support
const Footer = {
  generateHTML: () => `\n            <footer class="py-5">\n                <div class="container">\n                    <div class="row g-4 justify-content-center text-center">\n                        <div class="col-12 col-sm-6 col-md-3">\n                            <h3 class="mb-3">Navigation</h3>\n                            <ul class="list-unstyled">\n                                ${CONFIG.NAVIGATION.map(e=>`\n                                    <li>\n                                        <a href="${e.href}" class="text-decoration-none">\n                                            ${e.label}\n                                        </a>\n                                    </li>\n                                `).join("")}\n                            </ul>\n                        </div>\n\n                        <div class="col-12 col-sm-6 col-md-3">\n                            <h3 class="mb-3">Connect</h3>\n                            <div class="d-flex gap-3 justify-content-center">\n                                <a href="${CONFIG.SOCIAL.FACEBOOK}" target="_blank" rel="noopener noreferrer" aria-label="Facebook" title="Facebook">\n                                    <i class="fab fa-facebook-f fa-lg"></i>\n                                </a>\n                                <a href="${CONFIG.SOCIAL.INSTAGRAM}" target="_blank" rel="noopener noreferrer" aria-label="Instagram" title="Instagram">\n                                    <i class="fab fa-instagram fa-lg"></i>\n                                </a>\n                                <a href="${CONFIG.SOCIAL.YOUTUBE}" target="_blank" rel="noopener noreferrer" aria-label="YouTube" title="YouTube">\n                                    <i class="fab fa-youtube fa-lg"></i>\n                                </a>\n                            </div>\n                        </div>\n\n                        <div class="col-12 col-sm-6 col-md-3">\n                            <h3 class="mb-3">Stream</h3>\n                            <ul class="list-unstyled">\n                                <li>\n                                    <a href="${CONFIG.SOCIAL.SPOTIFY}" target="_blank" rel="noopener noreferrer" class="text-decoration-none">\n                                        Spotify\n                                    </a>\n                                </li>\n                                <li>\n                                    <a href="${CONFIG.SOCIAL.APPLE_MUSIC}" target="_blank" rel="noopener noreferrer" class="text-decoration-none">\n                                        Apple Music\n                                    </a>\n                                </li>\n                                <li>\n                                    <a href="${CONFIG.SOCIAL.SOUNDCLOUD}" target="_blank" rel="noopener noreferrer" class="text-decoration-none">\n                                        SoundCloud\n                                    </a>\n                                </li>\n                            </ul>\n                        </div>\n\n                        <div class="col-12 col-sm-6 col-md-3">\n                            <h3 class="mb-3">System</h3>\n                            <p class="text-muted">© <span id="current-year">2024</span> ${CONFIG.ARTIST.DISPLAY_NAME}</p>\n                            <div class="d-flex flex-column gap-2 align-items-center">\n                                <button id="open-settings-footer" class="btn btn-sm btn-outline-primary" data-bs-toggle="offcanvas" data-bs-target="#settingsPanel" aria-controls="settingsPanel">\n                                    Open Settings\n                                </button>\n                                <button id="clear-cache-btn" class="btn btn-sm btn-outline-secondary">\n                                    Clear Cache\n                                </button>\n                            </div>\n                        </div>\n                    </div>\n                    <div class="footer-bottom">\n                        <p class="mb-0">Made with <i class="fas fa-heart"></i> for the music</p>\n                    </div>\n                </div>\n            </footer>\n        `,
  async load() {
    let e = Utils.getElement("footer-container");
    if (!e) return;
    Utils.setHTML(e, this.generateHTML());
    let yearElement = Utils.getElement("current-year");

    if (yearElement) {
      yearElement.textContent = (new Date()).getFullYear();
    }

    this.setupCacheButton();
  },
  setupCacheButton() {
    let clearCacheButton = Utils.getElement("clear-cache-btn");

    if (!clearCacheButton) {
      return;
    }

    clearCacheButton.addEventListener("click", () => {
      let confirmed = confirm("Clear cached data and restore settings to default?");

      if (!confirmed) {
        return;
      }

      let storageKeys = [
      CONFIG.THEME.STORAGE_KEY,
      CONFIG.SETTINGS.STORAGE_KEY,
      Favorites.STORAGE_KEY,
      "dark-mode"
      ];

      storageKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      sessionStorage.clear();
      location.reload();
    });
  }
};


// Home page release widgets and featured content
const HomePage = {
  async loadHeroRelease() {
    let heroReleaseCard = Utils.getElement("hero-release-card");
    if (!heroReleaseCard) {
      return;
    }

    let releaseData = await Utils.getReleaseData();
    if (!Array.isArray(releaseData) || !releaseData.length) {
      return;
    }

    let filteredReleases = releaseData.filter(release => release.type !== "album-track");
    if (!filteredReleases.length) {
      return;
    }

    let latestRelease = filteredReleases.reduce((current, next) => {
      return next.dateValue > current.dateValue ? next : current;
    });

    let detailsPage = ["album", "ep"].includes(latestRelease.type) ? "album.html" : "single.html";

    Utils.setHTML(heroReleaseCard, `\n            <div class="release-mini">\n                <img src="${Utils.safeURL(latestRelease.image)}" alt="${Utils.sanitizeHTML(latestRelease.title)} cover" loading="lazy" />\n                <div>\n                    <p class="eyebrow mb-2">Latest Release</p>\n                    <h3 class="fs-4 fw-bold mb-2">${Utils.sanitizeHTML(latestRelease.title)}</h3>\n                    <p class="text-muted mb-3">${Utils.sanitizeHTML(latestRelease.artist || "")} • ${Utils.sanitizeHTML(latestRelease.displayDate || "")}</p>\n                    <div class="d-flex flex-wrap gap-2">\n                        <a href="${Utils.safeURL(latestRelease.listenLink)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" data-release-id="${Utils.sanitizeHTML(latestRelease.id)}">\n                            <i class="fas fa-play me-2"></i>Listen\n                        </a>\n                        <a href="/${detailsPage}?id=${Utils.encodeURLParam(latestRelease.id)}" class="btn btn-outline-primary btn-sm" data-release-id="${Utils.sanitizeHTML(latestRelease.id)}">\n                            View Details\n                        </a>\n                    </div>\n                </div>\n            </div>\n        `);
  },
  async loadReleaseRadar() {
    let e = Utils.getElement("release-radar-grid");
    if (!e) return;
    let t = await Utils.getReleaseData();
    if (!Array.isArray(t) || !t.length) return;
    let a = t.filter(e => "album-track" !== e.type).sort((e, t) => t.dateValue - e.dateValue).slice(0, 3);
    Utils.setHTML(e, a.map(e => `\n          <a class="release-mini" href="/${["album","ep"].includes(e.type)?"album.html":"single.html"}?id=${Utils.encodeURLParam(e.id)}" data-release-id="${Utils.sanitizeHTML(e.id)}">\n            <img src="${Utils.safeURL(e.image)}" alt="${Utils.sanitizeHTML(e.title)} cover" loading="lazy" />\n            <div>\n              <p class="eyebrow mb-2">${Utils.sanitizeHTML(e.typeTag||"")}</p>\n              <div class="fw-bold">${Utils.sanitizeHTML(e.title)}</div>\n              <div class="small text-muted">${Utils.sanitizeHTML(e.artist||"")}</div>\n              <div class="small text-muted">${Utils.sanitizeHTML(e.displayDate||"")}</div>\n            </div>\n          </a>\n        `).join(""))
  },
  renderLatestRelease: e => `\n            <div class="row align-items-center">\n                <div class="col-12 col-md-6 mb-4 mb-md-0">\n                    <img\n                        class="img-fluid rounded-3 shadow-lg"\n                        src="${Utils.safeURL(e.image)}"\n                        alt="${Utils.sanitizeHTML(e.title)} cover"\n                        loading="lazy"\n                    />\n                </div>\n                <div class="col-12 col-md-6">\n                    <h2 class="display-4 fw-bold mb-3">Latest Drop: ${Utils.sanitizeHTML(e.title)}</h2>\n                    <p class="fs-5 text-muted mb-4">${Utils.sanitizeHTML(Utils.formatDate(e.releaseDate))}</p>\n                    <a\n                        href="${Utils.safeURL(e.listenLink)}"\n                        target="_blank"\n                        rel="noopener noreferrer"\n                        class="btn btn-primary btn-lg"\n                        data-release-id="${Utils.sanitizeHTML(e.id)}"\n                    >\n                        <i class="fas fa-play me-2"></i> Stream Now\n                    </a>\n                </div>\n            </div>\n        `,
  async loadLatestRelease() {
    let latestReleaseContainer = Utils.getElement("latest-release-container");
    let latestReleaseLoading = Utils.getElement("latest-release-loading");
    let latestReleaseError = Utils.getElement("latest-release-error");

    if (!latestReleaseContainer || !latestReleaseLoading || !latestReleaseError) {
      return;
    }

    Utils.removeClass(latestReleaseLoading, "d-none");
    Utils.addClass(latestReleaseError, "d-none");
    Utils.addClass(latestReleaseContainer, "d-none");

    let releaseData = await Utils.getReleaseData();

    if (releaseData && Array.isArray(releaseData) && releaseData.length > 0) {
      try {
        let availableReleases = releaseData.filter(release => release.type !== "album-track");
        let latestRelease = availableReleases.reduce((current, next) => {
          return next.dateValue > current.dateValue ? next : current;
        });

        Utils.setHTML(latestReleaseContainer, this.renderLatestRelease(latestRelease));
        Utils.removeClass(latestReleaseContainer, "d-none");
        Utils.addClass(latestReleaseContainer, "fade-in");
      } catch (error) {
        console.error("Error processing release:", error);
        Utils.removeClass(latestReleaseError, "d-none");
      }
    } else {
      Utils.setHTML(latestReleaseContainer, '<p class="text-center text-muted">No releases found.</p>');
      Utils.removeClass(latestReleaseContainer, "d-none");
    }

    Utils.addClass(latestReleaseLoading, "d-none");
  },
  async loadYouTubeVideo() {
    let e = Utils.getElement("youtube-video-container");
    if (!e) return;
    let t = await Utils.fetchData(CONFIG.API.VIDEO);
    if (!t || !t.youtube_embed_url) return;
    let a = Utils.safeURL(t.youtube_embed_url);
    "#" !== a && Utils.setHTML(e, `\n                <div class="position-relative w-100 h-100">\n                    <iframe\n                        width="100%"\n                        height="100%"\n                        src="${a}?rel=0"\n                        frameborder="0"\n                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"\n                        title="Featured video"\n                        loading="lazy"\n                        referrerpolicy="strict-origin-when-cross-origin"\n                        allowfullscreen\n                        class="rounded-3"\n                    ></iframe>\n                </div>\n            `)
  }
};


// Discography filtering, sorting, and display logic
const Discography = {
  allReleases: [],
  allItems: [],
  activeFilter: "all",
  activeSort: "date-desc",
  searchQuery: "",
  activeArtist: "all",
  yearMin: null,
  yearMax: null,
  prepareReleases: e => Utils.normalizeReleases(e, {
    includeAll: !1
  }),
  sortReleases(e, t) {
    let a = [...e];
    switch (t) {
      case "title-asc":
      a.sort((e, t) => e.titleLower.localeCompare(t.titleLower));
      break;
      case "artist-asc":
      a.sort((e, t) => e.artistLower.localeCompare(t.artistLower));
      break;
      case "date-asc":
      a.sort((e, t) => e.dateValue - t.dateValue);
      break;
      default:
      a.sort((e, t) => t.dateValue - e.dateValue)
    }
    return a
  },
  renderCards(e) {
    let t = Utils.getElement("releases-grid");
    if (!t) return;
    if (0 === e.length) return void Utils.setHTML(t, '<div class="col-12"><p class="text-center text-muted">No releases found.</p></div>');
    let a = e.map(e => {
      let r = Favorites.has(e.id);
      return `\n                <div class="col">\n                    <div class="release-card h-100">\n                        <div class="release-card-image position-relative overflow-hidden rounded-top-3">\n                            <a href="/${["album","ep"].includes(e.type)?"album.html":"single.html"}?id=${Utils.encodeURLParam(e.id)}" class="text-decoration-none" data-release-id="${Utils.sanitizeHTML(e.id)}">\n                                <img src="${Utils.safeURL(e.image)}" alt="${Utils.sanitizeHTML(e.title)}" class="w-100 h-100 object-fit-cover" loading="lazy" />\n                                <span class="release-type-tag">${Utils.sanitizeHTML(e.typeTag)}</span>\n                                <div class="release-card-overlay position-absolute inset-0 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center opacity-0">\n                                    <i class="fas fa-play-circle fa-3x text-white"></i>\n                                </div>\n                            </a>\n                            <button class="favorite-btn ${r?"is-favorite":""}" data-id="${Utils.sanitizeHTML(e.id)}" aria-pressed="${r?"true":"false"}" aria-label="${r?"Remove from favorites":"Add to favorites"}">\n                                <i class="fas fa-star"></i>\n                            </button>\n                        </div>\n                        <div class="release-card-content p-3 p-md-4">\n                            <h3 class="release-title text-truncate mb-2" title="${Utils.sanitizeHTML(e.title)}">${Utils.sanitizeHTML(e.title)}</h3>\n                            <p class="text-muted small text-truncate mb-2">${Utils.sanitizeHTML(e.artist)}</p>\n                            <p class="text-secondary small mb-0">${Utils.sanitizeHTML(e.displayDate)}</p>\n                        </div>\n                    </div>\n                </div>\n            `
    });
    Utils.setHTML(t, a)
  },
  updateDisplay() {
    let items = this.searchQuery ? this.allItems : this.allReleases;

    if (this.activeFilter === "favorites") {
      items = items.filter(release => Favorites.has(release.id));
    } else if (this.activeFilter !== "all") {
      items = items.filter(release => release.type === this.activeFilter);
    }

    if (this.activeArtist !== "all") {
      items = items.filter(release => release.artistLower === this.activeArtist);
    }

    if (this.yearMin !== null) {
      items = items.filter(release => release.yearValue >= this.yearMin);
    }

    if (this.yearMax !== null) {
      items = items.filter(release => release.yearValue <= this.yearMax);
    }

    if (this.searchQuery) {
      let query = this.searchQuery;
      items = items.filter(release => release.searchText.includes(query));
    }

    let sortedItems = this.sortReleases(items, this.activeSort);
    this.renderCards(sortedItems);
    this.updateSearchFeedback(sortedItems.length);
  },
  updateStats() {
    let releaseCountElement = Utils.getElement("release-count");
    let albumCountElement = Utils.getElement("album-count");
    let favoriteCountElement = Utils.getElement("favorite-count");
    let totalReleases = this.allReleases.length;
    let albumCount = this.allReleases.filter(release => release.type === "album" || release.type === "ep").length;
    let favoriteCount = Favorites.count();

    if (releaseCountElement) {
      releaseCountElement.textContent = `${totalReleases} Releases`;
    }

    if (albumCountElement) {
      albumCountElement.textContent = `${albumCount} Albums/EPs`;
    }

    if (favoriteCountElement) {
      favoriteCountElement.textContent = `${favoriteCount} Favorites`;
    }
  },
  updateSearchFeedback(count) {
    let feedbackElement = Utils.getElement("discography-search-feedback");

    if (!feedbackElement) {
      return;
    }

    let totalReleases = this.allReleases.length;
    feedbackElement.textContent = this.searchQuery ? `Showing ${count} of ${totalReleases} releases` : `Showing ${totalReleases} releases`;
  },
  populateArtists() {
    let artistFilterElement = Utils.getElement("artist-filter");

    if (!artistFilterElement) {
      return;
    }

    let artistList = [...new Set(this.allReleases.map(release => (release.artist || "").toLowerCase()).filter(Boolean))].sort();
    let optionsHTML = artistList.map(artist => {
      let label = artist.replace(/\b\w/g, part => part.toUpperCase());
      return `<option value="${artist}">${label}</option>`;
    }).join("");

    Utils.setHTML(artistFilterElement, '<option value="all">All Artists</option>' + optionsHTML);
  },
  initYearRange() {
    let yearMinInput = Utils.getElement("year-min");
    let yearMaxInput = Utils.getElement("year-max");
    let yearMinLabel = Utils.getElement("year-min-label");
    let yearMaxLabel = Utils.getElement("year-max-label");

    if (!(yearMinInput && yearMaxInput && yearMinLabel && yearMaxLabel)) {
      return;
    }

    let yearValues = this.allReleases.map(release => release.yearValue).filter(Boolean);

    if (!yearValues.length) {
      return;
    }

    let minYear = Math.min(...yearValues);
    let maxYear = Math.max(...yearValues);

    yearMinInput.min = minYear;
    yearMinInput.max = maxYear;
    yearMaxInput.min = minYear;
    yearMaxInput.max = maxYear;
    yearMinInput.value = minYear;
    yearMaxInput.value = maxYear;
    yearMinLabel.textContent = `${minYear}`;
    yearMaxLabel.textContent = `${maxYear}`;
    this.yearMin = minYear;
    this.yearMax = maxYear;

    let updateYearRange = () => {
      let selectedMin = Number(yearMinInput.value);
      let selectedMax = Number(yearMaxInput.value);

      if (selectedMin > selectedMax) {
        yearMinInput.value = selectedMax;
        selectedMin = selectedMax;
      }

      this.yearMin = selectedMin;
      this.yearMax = selectedMax;
      yearMinLabel.textContent = `${selectedMin}`;
      yearMaxLabel.textContent = `${selectedMax}`;

      this.updateDisplay();
    };

    yearMinInput.addEventListener("input", updateYearRange);
    yearMaxInput.addEventListener("input", updateYearRange);
  },
  async loadData() {
    let loadingElement = Utils.getElement("loading-state");
    let errorElement = Utils.getElement("error-state");
    let noReleasesElement = Utils.getElement("no-releases-message");

    if (loadingElement) {
      Utils.removeClass(loadingElement, "d-none");
    }

    if (errorElement) {
      Utils.addClass(errorElement, "d-none");
    }

    if (noReleasesElement) {
      Utils.addClass(noReleasesElement, "d-none");
    }

    try {
      let releaseData = await Utils.getReleaseData();

      if (releaseData && Array.isArray(releaseData) && releaseData.length > 0) {
        this.allItems = releaseData;
        this.allReleases = this.prepareReleases(releaseData);
        this.populateArtists();
        this.initYearRange();
        this.updateDisplay();
        this.updateStats();
      } else {
        if (noReleasesElement) {
          Utils.removeClass(noReleasesElement, "d-none");
        }
      }
    } catch (error) {
      console.error("Error loading discography:", error);

      if (errorElement) {
        Utils.removeClass(errorElement, "d-none");
      }
    } finally {
      if (loadingElement) {
        Utils.addClass(loadingElement, "d-none");
      }
    }
  },
  async init() {
    let filterButtons = Utils.getElements(".filter-btn");
    let sortByElement = Utils.getElement("sort-by");
    let searchInput = Utils.getElement("discography-search");
    let searchClearButton = Utils.getElement("discography-search-clear");
    let releasesGrid = Utils.getElement("releases-grid");
    let artistFilter = Utils.getElement("artist-filter");
    let randomReleaseButton = Utils.getElement("random-release");

    if (filterButtons.length && sortByElement) {
      filterButtons.forEach(button => {
        button.addEventListener("click", () => {
          filterButtons.forEach(item => {
            Utils.removeClass(item, "filter-btn-active");
            Utils.addClass(item, "filter-btn-inactive");
            item.setAttribute("aria-pressed", "false");
          });

          Utils.addClass(button, "filter-btn-active");
          Utils.removeClass(button, "filter-btn-inactive");
          button.setAttribute("aria-pressed", "true");
          this.activeFilter = button.dataset.category || "all";
          this.updateDisplay();
        });
      });

      sortByElement.addEventListener("change", event => {
        this.activeSort = event.target.value;
        this.updateDisplay();
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", event => {
        this.searchQuery = (event.target.value || "").trim().toLowerCase();
        this.updateDisplay();
      });
    }

    if (searchClearButton) {
      searchClearButton.addEventListener("click", () => {
        if (searchInput) {
          searchInput.value = "";
          searchInput.focus();
        }

        this.searchQuery = "";
        this.updateDisplay();
      });
    }

    if (artistFilter) {
      artistFilter.addEventListener("change", event => {
        this.activeArtist = event.target.value || "all";
        this.updateDisplay();
      });
    }

    if (randomReleaseButton) {
      randomReleaseButton.addEventListener("click", () => {
        if (!this.allItems.length) {
          return;
        }

        let randomRelease = this.allItems[Math.floor(Math.random() * this.allItems.length)];
        let targetPage = ["album", "ep"].includes(randomRelease.type) ? "album.html" : "single.html";

        window.location.href = `/${targetPage}?id=${Utils.encodeURLParam(randomRelease.id)}`;
      });
    }

    if (releasesGrid) {
      releasesGrid.addEventListener("click", event => {
        let favoriteButton = event.target.closest(".favorite-btn");

        if (!favoriteButton) {
          return;
        }

        event.preventDefault();

        let releaseId = favoriteButton.dataset.id;

        if (releaseId) {
          Favorites.toggle(releaseId);
        }

        this.updateDisplay();
        this.updateStats();
      });
    }

    await this.loadData();
  }
};


// Theme mode handling
const Theme = {
  getSavedMode() {
    let e = localStorage.getItem(CONFIG.THEME.STORAGE_KEY);
    if (CONFIG.THEME.MODES.includes(e)) return e;
    let t = localStorage.getItem("dark-mode");
    return "true" === t ? "dark" : "false" === t ? "light" : CONFIG.THEME.DEFAULT_MODE
  },
  apply(mode, options = {}) {
    let activeMode = CONFIG.THEME.MODES.includes(mode) ? mode : CONFIG.THEME.DEFAULT_MODE;
    let prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
    let isDark = activeMode === "dark" || (activeMode === "system" && prefersDark.matches);

    document.documentElement.dataset.theme = activeMode;
    document.documentElement.classList.toggle("dark-mode", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";

    if (!options.skipSave) {
      localStorage.setItem(CONFIG.THEME.STORAGE_KEY, activeMode);
    }

    this.updateUI();
    return activeMode;
  },
  init() {
    this.apply(this.getSavedMode(), {
      skipSave: true
    });

    let colorSchemeMedia = window.matchMedia("(prefers-color-scheme: dark)");
    colorSchemeMedia.addEventListener("change", () => {
      if (this.getSavedMode() === "system") {
        this.apply("system", {
          skipSave: true
        });
      }
    });

    window.setThemeMode = mode => {
      this.apply(mode);
    };
  },
  updateUI() {
    let currentMode = this.getSavedMode();
    let themeInputs = document.querySelectorAll('input[name="theme-mode"]');

    themeInputs.forEach(input => {
      input.checked = input.value === currentMode;
    });
  }
};


// Settings storage and UI sync
const Settings = {
  getSaved() {
    let e = localStorage.getItem(CONFIG.SETTINGS.STORAGE_KEY);
    if (!e) return {
      ...CONFIG.SETTINGS.DEFAULTS,
      reduceMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches
    };
    try {
      let t = JSON.parse(e);
      return {
        ...CONFIG.SETTINGS.DEFAULTS,
        ...t
      }
    } catch {
      return {
        ...CONFIG.SETTINGS.DEFAULTS
      }
    }
  },
  save(e) {
    localStorage.setItem(CONFIG.SETTINGS.STORAGE_KEY, JSON.stringify(e))
  },
  apply(settings) {
    document.documentElement.classList.toggle("reduce-motion", !!settings.reduceMotion);
    document.documentElement.dataset.font = settings.largeText ? "large" : "normal";
    document.documentElement.classList.toggle("compact-ui", !!settings.compactUI);
    document.documentElement.classList.toggle("clean-view", !!settings.cleanView);
  },
  syncUI(settings) {
    let reduceMotionInput = Utils.getElement("setting-reduce-motion");
    let largeTextInput = Utils.getElement("setting-large-text");
    let compactUIInput = Utils.getElement("setting-compact-ui");
    let cleanViewInput = Utils.getElement("setting-clean-view");

    if (reduceMotionInput) {
      reduceMotionInput.checked = !!settings.reduceMotion;
    }

    if (largeTextInput) {
      largeTextInput.checked = !!settings.largeText;
    }

    if (compactUIInput) {
      compactUIInput.checked = !!settings.compactUI;
    }

    if (cleanViewInput) {
      cleanViewInput.checked = !!settings.cleanView;
    }

    Theme.updateUI();
  },
  init() {
    let settings = this.getSaved();

    this.apply(settings);
    this.syncUI(settings);

    let themeModeInputs = document.querySelectorAll('input[name="theme-mode"]');
    themeModeInputs.forEach(input => {
      input.addEventListener("change", () => {
        if (input.checked) {
          Theme.apply(input.value);
        }
      });
    });

    let reduceMotionInput = Utils.getElement("setting-reduce-motion");
    let largeTextInput = Utils.getElement("setting-large-text");
    let compactUIInput = Utils.getElement("setting-compact-ui");
    let cleanViewInput = Utils.getElement("setting-clean-view");
    let resetButton = Utils.getElement("settings-reset");

    let updateSettings = () => {
      let updatedSettings = {
        reduceMotion: reduceMotionInput && reduceMotionInput.checked,
        largeText: largeTextInput && largeTextInput.checked,
        compactUI: compactUIInput && compactUIInput.checked,
        cleanView: cleanViewInput && cleanViewInput.checked
      };

      this.apply(updatedSettings);
      this.save(updatedSettings);
    };

    if (reduceMotionInput) {
      reduceMotionInput.addEventListener("change", updateSettings);
    }

    if (largeTextInput) {
      largeTextInput.addEventListener("change", updateSettings);
    }

    if (compactUIInput) {
      compactUIInput.addEventListener("change", updateSettings);
    }

    if (cleanViewInput) {
      cleanViewInput.addEventListener("change", updateSettings);
    }

    if (resetButton) {
      resetButton.addEventListener("click", () => {
        let defaultSettings = {
          ...CONFIG.SETTINGS.DEFAULTS
        };

        this.apply(defaultSettings);
        this.save(defaultSettings);
        this.syncUI(defaultSettings);
        Theme.apply(CONFIG.THEME.DEFAULT_MODE);
      });
    }
  }
};


// Lazy image optimization for supported formats
const ImageOptimizer = {
  init() {
    Utils.getElements("img, img[data-src]").forEach(img => {
      Utils.optimizeImage(img);
    });

    let observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.tagName === "IMG") {
            Utils.optimizeImage(node);
            return;
          }

          if (node.querySelectorAll) {
            node.querySelectorAll("img").forEach(img => {
              Utils.optimizeImage(img);
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
};


// Reveal animation initialization
const Reveal = {
  init() {
    let elements = document.querySelectorAll(
    ".card, .release-card, .music-card, .faq-video-card, .track-item, .hero-copy, .hero-panel, .release-mini, .story-panel, .discography-controls, .discography-stats, .single-cover-container, .album-cover-container, .video-aspect-ratio"
    );

    if (!elements.length) {
      return;
    }

    elements.forEach((element, index) => {
      element.classList.add("reveal");
      element.style.setProperty("--reveal-delay", `${Math.min(45 * index, 400)}ms`);
    });

    if (document.documentElement.classList.contains("reduce-motion")) {
      elements.forEach(element => {
        element.classList.add("is-visible");
      });
      return;
    }

    if (!("IntersectionObserver" in window)) {
      elements.forEach(element => {
        element.classList.add("is-visible");
      });
      return;
    }

    let observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          entry.target.style.willChange = "auto";
        }
      });
    }, {
      rootMargin: "0px 0px -10% 0px",
      threshold: 0.1
    });

    elements.forEach(element => {
      observer.observe(element);
    });
  }
};


// Detail page handling for album and single details
const DetailPage = {
  allReleases: [],
  typeMap: {
    single: {
      display: "Single",
      types: ["single", "collab", "album-track"]
    },
    album: {
      display: "Album",
      types: ["album", "ep"]
    }
  },
  async loadData(e, t) {
    try {
      let a = await Utils.getReleaseData();
      this.allReleases = Array.isArray(a) ? a : [];
      let s = this.typeMap[t].types;
      return this.allReleases.find(t => t.id === e && s.includes(t.type))
    } catch (e) {
      return console.error(`Error loading ${t} data:`, e), null
    }
  },
  getTypeDisplay: e => ({
    single: "Single",
    collab: "Collaboration",
    "album-track": "Album Track",
    album: "Album",
    ep: "EP"
  } [e] || e),
  renderTracks(e) {
    let container = Utils.getElement("tracklist-container");
    if (!container) {
      return;
    }

    let releaseId = e;
    let trackCandidates = this.allReleases.filter(release => {
      let isTrackType = release.type === "album-track" || (release.type === "single" && release.albumId);
      let matchesRelease = release.albumId === releaseId || (release.id && release.id.startsWith(`${releaseId}-`));
      return isTrackType && matchesRelease;
    });

    let uniqueTracks = Array.from(new Map(trackCandidates.map(track => [track.id, track])).values());

    if (!uniqueTracks.length) {
      Utils.setHTML(container, '<div class="text-center text-muted py-3">Tracklist coming soon.</div>');
      return;
    }

    uniqueTracks.sort((left, right) => {
      let leftNumber = left.trackNumber || 0;
      let rightNumber = right.trackNumber || 0;

      if (leftNumber && rightNumber) {
        return leftNumber - rightNumber;
      }

      if (leftNumber) {
        return -1;
      }

      if (rightNumber) {
        return 1;
      }

      return (left.title || "").localeCompare(right.title || "");
    });

    let trackListHTML = uniqueTracks
    .map((track, index) => {
      let trackNumber = track.trackNumber || index + 1;
      return `\n            <div class="track-item">\n                <div class="track-number">${trackNumber}</div>\n                <div class="track-info">\n                    <div class="track-title">${Utils.sanitizeHTML(track.title)}</div>\n                    <div class="track-artist">${Utils.sanitizeHTML(track.artist)}</div>\n                </div>\n                <div class="track-actions">\n                    <a href="/single.html?id=${Utils.encodeURLParam(track.id)}" class="track-btn"><i class="fas fa-play"></i>Listen</a>\n                </div>\n            </div>`;
    })
    .join("");

    Utils.setHTML(container, trackListHTML);
  },
  async display(e, t) {
    let loadingState = Utils.getElement("loading-state");
    let errorState = Utils.getElement("error-state");
    let detailsSection = Utils.getElement(`${t}-details`);

    if (loadingState) {
      Utils.removeClass(loadingState, "d-none");
    }

    if (errorState) {
      Utils.addClass(errorState, "d-none");
    }

    if (detailsSection) {
      Utils.addClass(detailsSection, "d-none");
    }

    let release = await this.loadData(e, t);

    if (!release) {
      if (loadingState) {
        Utils.addClass(loadingState, "d-none");
      }
      if (errorState) {
        Utils.removeClass(errorState, "d-none");
      }
      return;
    }

    let imageElement = Utils.getElement(`${t}-image`);
    if (imageElement) {
      imageElement.src = Utils.safeURL(release.image);
      imageElement.alt = Utils.sanitizeHTML(release.title);
    }

    Utils.setText(Utils.getElement(`${t}-title`), release.title);
    Utils.setText(Utils.getElement(`${t}-artist`), release.artist);
    Utils.setText(Utils.getElement(`${t}-date`), Utils.formatDate(release.releaseDate));
    Utils.setText(Utils.getElement(`${t}-type`), this.getTypeDisplay(release.type));
    Utils.setText(Utils.getElement(`${t}-type-text`), this.getTypeDisplay(release.type));

    if (t === "album") {
      let trackCountElement = Utils.getElement("album-track-count");
      if (trackCountElement) {
        let albumTrackCount = release.trackCount || this.allReleases.filter(releaseItem => {
          let isAlbumTrackOrSingle =
          releaseItem.type === "album-track" ||
          (releaseItem.type === "single" && releaseItem.albumId);

          let matchesAlbum =
          releaseItem.albumId === e ||
          (releaseItem.id && releaseItem.id.startsWith(`${e}-`));

          return isAlbumTrackOrSingle && matchesAlbum;
        }).length;

        Utils.setText(trackCountElement, albumTrackCount);
      }
    }

    this.renderTracks(e);

    let listenButton = Utils.getElement("listen-btn");
    if (listenButton) {
      listenButton.href = Utils.safeURL(release.listenLink);
    }

    if (loadingState) {
      Utils.addClass(loadingState, "d-none");
    }

    if (detailsSection) {
      Utils.removeClass(detailsSection, "d-none");
      Utils.addClass(detailsSection, "fade-in");
    }

    document.title = `${Utils.sanitizeHTML(release.title)} | Ryze Tha Kidd`;
  },
  extractId() {
    let e = new URLSearchParams(window.location.search),
    t = window.location.pathname.split("/").filter(e => e && !e.includes(".html"));
    return e.has("id") ? e.get("id") : e.has("slug") ? e.get("slug") : t.length > 0 ? t[t.length - 1] : null
  },
  async init(e) {
    let t = this.extractId();
    if (!t) {
      let e = Utils.getElement("error-state"),
      t = Utils.getElement("loading-state");
      return t && Utils.addClass(t, "d-none"), void(e && Utils.removeClass(e, "d-none"))
    }
    await this.display(t, e)
  }
};


// FAQ content and accordion rendering
const VideoFAQ = {
  data: [{
    videoId: "video-1",
    title: "How to get an Official Artist Channel on YouTube with DistroKid",
    thumbnail: "https://i.ytimg.com/vi/8dCv09a0tlM/maxresdefault.jpg",
    watchUrl: "https://youtube.com/watch?v=8dCv09a0tlM",
    questions: [{
      question: "How do I do it?",
      answer: 'Press the "Watch Full Video" button to get a full comprehensive guide. In short, distribute your music via DistroKid, claim your channel through the <a href="https://distrokid.com/YouTubeOfficialArtistChannels/?ref=globalmenu" target="_blank" rel="noopener noreferrer">YouTube Official Artist Channels</a> section, and follow the steps on screen.<br><br> Visit <a href="https://support.google.com/youtube/answer/7336634?hl=en-GB#zippy=%2Cprogramme-criteria-and-eligibility" target="_blank" rel="noopener noreferrer">Google\'s official guide article</a> to make sure you meet the current criteria. Here is DistroKid\'s own <a href="https://support.distrokid.com/hc/en-us/articles/360036924633-Claiming-an-Official-Artist-Channel-on-YouTube" target="_blank" rel="noopener noreferrer">guide</a> <br><br> This guide is only for DistroKid, you can do it with other distributors as well but the process may differ.'
    }, {
      question: "How long does it take to recieve the Official Artist Channel?",
      answer: 'It varies! It can take up to 6 weeks after you initially claim your channel. Be patient and keep an eye on your email for updates from YouTube. If it has not been completed after 6 weeks, consider reaching out to <a href="https://support.distrokid.com/hc/en-us" target="_blank" rel="noopener noreferrer">DistroKid support</a> for assistance. Or, visit <a href="/contact">my Contact page</a> to contact me and I will try to help.'
    }, {
      question: "Do I have to pay?",
      answer: 'You do have to pay for DistroKid\'s distribution service, but claiming the Official Artist Channel through DistroKid is free of charge. Just make sure you have an active subscription with DistroKid to distribute your music. <br><br> Check DistroKid\'s <a href="https://distrokid.com/pricing/" target="_blank" rel="noopener noreferrer">pricing page</a> for more details on their plans.'
    }]
  }],
  renderAccordion() {
    let e = Utils.getElement("faq-container");
    if (!e) return;
    if (0 === this.data.length) return void Utils.setHTML(e, '<p class="text-center text-muted">No FAQs available yet.</p>');
    let t = '<div class="accordion accordion-flush" id="faqAccordion">';
    this.data.forEach((e, a) => {
      let s = `faq-video-${e.videoId}`;
      t += `\n                <div class="accordion-item faq-video-item bg-transparent border-0 mb-4">\n                    <div class="accordion-header">\n                        <button class="faq-video-card p-0 border-0 w-100" type="button" data-bs-toggle="collapse" data-bs-target="#${s}" aria-expanded="false" aria-controls="${s}">\n                            <div class="row g-0 align-items-center">\n                                <div class="col-5 col-md-4">\n                                    <div class="faq-thumbnail-wrapper">\n                                        <img src="${Utils.safeURL(e.thumbnail)}" class="faq-thumbnail" alt="${Utils.sanitizeHTML(e.title)}" loading="lazy">\n                                        <div class="play-overlay"><i class="fas fa-play-circle"></i></div>\n                                    </div>\n                                </div>\n                                <div class="col-7 col-md-8 p-3 p-md-4">\n                                    <h3 class="faq-title fw-bold mb-0">${Utils.sanitizeHTML(e.title)}</h3>\n                                    <small class="faq-questions-count d-block mt-2"><i class="fas fa-chevron-down"></i> ${e.questions.length} questions</small>\n                                </div>\n                            </div>\n                        </button>\n                    </div>\n                    <div id="${s}" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">\n                        <div class="faq-content-wrapper">\n                            <div class="faq-questions-list">`, e.questions.forEach((e, a) => {
        let i = `${s}-qa-${a}`;
        t += `\n                                <div class="faq-qa-item">\n                                    <button class="faq-question-btn" type="button" data-bs-toggle="collapse" data-bs-target="#${i}" aria-expanded="false" aria-controls="${i}">\n                                        <div class="faq-question-content">\n                                            <i class="fas fa-question-circle faq-question-icon"></i>\n                                            <span class="faq-question-text">${e.question}</span>\n                                        </div>\n                                        <i class="fas fa-chevron-down faq-chevron"></i>\n                                    </button>\n                                    <div id="${i}" class="collapse faq-answer-collapse">\n                                        <div class="faq-answer-content">\n                                            <i class="fas fa-lightbulb faq-answer-icon"></i>\n                                            <p class="faq-answer-text">${e.answer}</p>\n                                        </div>\n                                    </div>\n                                </div>`
      }), t += `\n                            </div>\n                            <div class="faq-video-link">\n                                <a href="${Utils.safeURL(e.watchUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">\n                                    <i class="fas fa-play me-2"></i> Watch Full Video\n                                </a>\n                            </div>\n                        </div>\n                    </div>\n                </div>`
    }), t += "</div>", Utils.setHTML(e, t)
  },
  async init() {
    let e = Utils.getElement("faq-container"),
    t = Utils.getElement("faq-loading"),
    a = Utils.getElement("faq-error");
    if (e) try {
      t && Utils.removeClass(t, "d-none"), a && Utils.addClass(a, "d-none"), await new Promise(e => setTimeout(e, 300)), this.renderAccordion(), t && Utils.addClass(t, "d-none")
    } catch (e) {
      console.error("Error initializing FAQ:", e), t && Utils.addClass(t, "d-none"), a && Utils.removeClass(a, "d-none")
    } else console.error("VideoFAQ.init() - No container found!")
  }
};


// Single page initializer
const SinglePage = {
  init: () => DetailPage.init("single")
};


// Album page initializer
const AlbumPage = {
  init: () => DetailPage.init("album")
};


// Application startup and page routing
const App = {
  async init() {
    try {
      let path = window.location.pathname.toLowerCase(),
      segments = path.split("/").filter(segment => segment && !segment.includes(".html"));
      if (segments.length >= 2) {
        let parentSegment = segments[segments.length - 2],
        lastSegment = segments[segments.length - 1];
        if (["single", "album", "ep", "collab"].includes(parentSegment)) {
          let redirectPage = ["album", "ep"].includes(parentSegment) ? "album.html" : "single.html";
          return void(window.location.href = `/${redirectPage}?id=${Utils.encodeURLParam(lastSegment)}`)
        }
      }
      Utils.addScrollToTopButton(), this.injectAnimationStyles(), FormValidator.initForm(), Theme.init(), ImageOptimizer.init(), await Navbar.load(), Settings.init(), QuickSearch.init(), Reveal.init();
      let hasSinglePath = path.includes("single.html") || segments.includes("single") || segments.includes("collab"),
      hasAlbumPath = path.includes("album.html") || segments.includes("album") || segments.includes("ep"),
      hasFAQPath = path.includes("faq.html") || path.includes("/faq") || segments.includes("faq");
      hasSinglePath ? (await Footer.load(), await SinglePage.init()) : hasAlbumPath ? (await Footer.load(), await AlbumPage.init()) : hasFAQPath ? (await Footer.load(), await VideoFAQ.init()) : await Promise.all([Footer.load(), HomePage.loadHeroRelease(), HomePage.loadReleaseRadar(), HomePage.loadLatestRelease(), HomePage.loadYouTubeVideo(), Discography.init()])
    } catch (e) {
      console.error("Application initialization error:", e), Utils.showNotification("An error occurred. Please refresh the page.", "error", 5e3)
    }
  },
  injectAnimationStyles() {
    if (document.getElementById("rtk-animations")) return;
    let e = document.createElement("style");
    e.id = "rtk-animations", e.textContent = "\n            @keyframes slideIn {\n                from { transform: translateX(400px); opacity: 0; }\n                to { transform: translateX(0); opacity: 1; }\n            }\n            @keyframes slideOut {\n                from { transform: translateX(0); opacity: 1; }\n                to { transform: translateX(400px); opacity: 0; }\n            }\n            @keyframes fadeIn {\n                from { opacity: 0; }\n                to { opacity: 1; }\n            }\n            .scroll-to-top-btn:hover {\n                transform: scale(1.1);\n                box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4);\n            }\n        ", document.head.appendChild(e)
  }
};
document.addEventListener("DOMContentLoaded", () => {
  App.init()
});
