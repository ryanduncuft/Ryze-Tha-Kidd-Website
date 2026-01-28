const CONFIG = {
    ARTIST: {
      NAME: "RYZE THA KIDD",
      DISPLAY_NAME: "Ryze Tha Kidd"
    },
    API: {
      DISCOGRAPHY: "https://gist.githubusercontent.com/ryanduncuft/39ade5f46c7b0a11618f5f016606ecc2/raw/rtk_data.json",
      VIDEO: "https://gist.githubusercontent.com/ryanduncuft/d67c1848410f5d6a77d914794848bc7d/raw/video_link.json"
    },
    DISCOGRAPHY: {
      PRIMARY_TYPES: ["album", "ep", "single", "collab"],
      CACHE_KEY: "discography-data"
    },
    SOCIAL: {
      TWITTER: "https://twitter.com/ryzethakidd",
      INSTAGRAM: "https://instagram.com/ryzethakidd",
      YOUTUBE: "https://youtube.com/@RyzeThaKidd",
      SPOTIFY: "https://open.spotify.com",
      APPLE_MUSIC: "https://music.apple.com",
      SOUNDCLOUD: "https://soundcloud.com"
    },
    NAVIGATION: [{
      label: "Home",
      href: "/"
    }, {
      label: "About",
      href: "about"
    }, {
      label: "Discography",
      href: "discography"
    }, {
      label: "Faq",
      href: "faq",
      isNew: !0
    }, {
      label: "Contact",
      href: "contact"
    }, ],
    DARK_MODE: {
      STORAGE_KEY: "dark-mode",
      DEFAULT_DARK: !1
    },
    CACHE: {
      DURATION_MS: 36e5,
      STORAGE_PREFIX: "rtk_"
    },
    DATE_FORMAT: {
      YEAR: "numeric",
      MONTH: "long",
      DAY: "numeric"
    }
  },
  Utils = {
    sanitizeHTML(e) {
      let t = document.createElement("div");
      return t.textContent = e, t.innerHTML
    },
    isValidURL(e) {
      try {
        let t = new URL(e, window.location.href);
        return !(t.origin !== window.location.origin) || ["gist.githubusercontent.com", "youtube.com", "twitter.com", "instagram.com"].some(e => t.hostname.includes(e))
      } catch {
        return !1
      }
    },
    showLoading(e) {
      e && (e.innerHTML = '<div class="spinner-border spinner-border-sm text-primary" role="status"><span class="visually-hidden">Loading...</span></div>')
    },
    showNotification(e, t = "info", a = 3e3) {
      let i = "toast-" + Date.now(),
        s = document.createElement("div");
      if (s.id = i, s.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${({success:"#28a745",error:"#dc3545",warning:"#ffc107",info:"#17a2b8"})[t]||"#17a2b8"};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            animation: slideIn 0.3s ease;
            font-weight: 600;
            max-width: 300px;
        `, s.textContent = e, !document.getElementById("toast-container")) {
        let l = document.createElement("div");
        l.id = "toast-container", document.body.appendChild(l)
      }
      document.getElementById("toast-container")
        .appendChild(s), a > 0 && setTimeout(() => {
          s.style.animation = "slideOut 0.3s ease", setTimeout(() => s.remove(), 300)
        }, a)
    },
    async fetchData(e) {
      try {
        if (!this.isValidURL(e)) throw Error("Invalid or untrusted URL");
        let t = await fetch(e, {
          cache: "no-cache",
          credentials: "omit",
          headers: {
            Accept: "application/json"
          }
        });
        if (!t.ok) throw Error(`HTTP ${t.status}`);
        let a = await t.json();
        if ("object" != typeof a || null === a) throw Error("Invalid JSON response");
        return a
      } catch (i) {
        return console.warn(`Failed to fetch from ${e}:`, i), this.showNotification("Failed to load data. Please try again.", "error"), null
      }
    },
    optimizeImage(e) {
      if (!e) return;
      let t = e.dataset.src || e.src;
      if (!t) return;
      if (["i.ytimg.com", "youtube.com", "ytimg"].some(e => t.includes(e))) return;
      let a = /\.(jpg|jpeg|png)$/i.test(t),
        i = "true" === e.dataset.optimized;
      if (a && !i) {
        let s = t.replace(/\.(jpg|jpeg|png)$/i, ".webp");
        e.dataset.optimized = "true", e.onerror = () => {
          console.warn(`WebP not found, falling back to: ${t}`), e.src = t
        }, e.src = s
      } else e.dataset.src && (e.src = e.dataset.src)
    },
    formatDate(e) {
      if (!e) return "TBD";
      try {
        let t = new Date(e);
        if (isNaN(t)) return "TBD";
        return t.toLocaleDateString("en-US", CONFIG.DATE_FORMAT)
      } catch {
        return "TBD"
      }
    },
    getElement: e => document.getElementById(e),
    getElements: e => document.querySelectorAll(e),
    setHTML(e, t) {
      e && (e.innerHTML = t)
    },
    toggleClass(e, t) {
      e && e.classList.toggle(t)
    },
    addClass(e, t) {
      e && e.classList.add(t)
    },
    removeClass(e, t) {
      e && e.classList.remove(t)
    },
    debounce(e, t) {
      let a;
      return function(...i) {
        clearTimeout(a), a = setTimeout(() => e(...i), t)
      }
    },
    scrollToElement(e, t = !0) {
      let a = document.querySelector(e);
      return !!a && (a.scrollIntoView({
        behavior: t ? "smooth" : "auto"
      }), !0)
    },
    addScrollToTopButton() {
      let e = document.createElement("button");
      e.innerHTML = '<i class="fas fa-chevron-up"></i>', e.className = "scroll-to-top-btn", e.setAttribute("aria-label", "Scroll to top"), e.style.cssText = `
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
        `, window.addEventListener("scroll", () => {
        window.pageYOffset > 300 ? (e.style.opacity = "1", e.style.visibility = "visible") : (e.style.opacity = "0", e.style.visibility = "hidden")
      }), e.addEventListener("click", () => {
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        })
      }), document.body.appendChild(e)
    }
  },
  FormValidator = {
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
      return a.required && !t.trim() ? {
        valid: !1,
        error: `${e} is required`
      } : a.minLength && t.length < a.minLength ? {
        valid: !1,
        error: `${e} is too short (min ${a.minLength})`
      } : a.maxLength && t.length > a.maxLength ? {
        valid: !1,
        error: `${e} is too long (max ${a.maxLength})`
      } : a.pattern && !a.pattern.test(t) ? {
        valid: !1,
        error: a.message
      } : {
        valid: !0
      }
    },
    validateForm(e) {
      if (!e) return {
        valid: !0,
        errors: {}
      };
      let t = {};
      return e.querySelectorAll("input[name], textarea[name]")
        .forEach(e => {
          let a = e.name;
          if (a && "form-name" !== a && "bot-field" !== a) {
            let i = this.validateField(a, e.value);
            i.valid ? e.classList.remove("is-invalid") : (t[a] = i.error, e.classList.add("is-invalid"))
          }
        }), {
          valid: 0 === Object.keys(t)
            .length,
          errors: t
        }
    },
    initForm() {
      document.querySelectorAll('form[name="contact"]')
        .forEach(e => {
          e.addEventListener("submit", t => {
              let a = this.validateForm(e);
              a.valid ? Utils.showNotification("Form submitted successfully!", "success", 2e3) : (t.preventDefault(), Object.entries(a.errors)
                .forEach(([e, t]) => {
                  Utils.showNotification(t, "warning", 4e3)
                }))
            }), e.querySelectorAll("input[name], textarea[name]")
            .forEach(e => {
              e.addEventListener("blur", () => {
                let t = e.name;
                t && "form-name" !== t && "bot-field" !== t && (this.validateField(t, e.value)
                  .valid ? e.classList.remove("is-invalid") : e.classList.add("is-invalid"))
              })
            })
        })
    }
  },
  Navbar = {
    generateHTML() {
      let e;
      return `
            <nav class="navbar navbar-expand-lg sticky-top navbar-light" role="banner">
                <div class="container-fluid navbar-container-layout">
                    <a class="navbar-brand" href="/" aria-label="Home - ${CONFIG.ARTIST.NAME}">
                        ${CONFIG.ARTIST.NAME}
                    </a>

                    <div class="navbar-nav d-none d-lg-flex navbar-center">
                        ${CONFIG.NAVIGATION.map(e=>`
            <a class="nav-link ${e.isNew?"nav-link-new":""}" href="${e.href}" aria-label="${e.label}">
                ${e.label}
                ${e.isNew?'<span class="nav-badge-new">NEW</span>':""}
            </a>
        `).join("")}
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
                                ${CONFIG.NAVIGATION.map(e=>`
            <a class="dropdown-item ${e.isNew?"dropdown-item-new":""}" href="${e.href}">
                ${e.label}
                ${e.isNew?'<span class="nav-badge-new">NEW</span>':""}
            </a>
        `).join("")}
                                <hr class="my-3">
                                <button id="dark-mode-toggle-mobile" class="btn btn-sm btn-outline-primary w-100" aria-label="Toggle Dark Mode" title="Toggle Dark Mode">
                                    <i class="fa-solid fa-moon"></i> Dark Mode
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        `
    },
    async load() {
      let e = Utils.getElement("navbar-container");
      if (!e) return;
      Utils.setHTML(e, this.generateHTML());
      let t = Utils.getElement("dark-mode-toggle-desktop"),
        a = Utils.getElement("dark-mode-toggle-mobile"),
        i = () => {
          DarkMode.toggle(), DarkMode.updateToggleIcons(t, a)
        };
      t && t.addEventListener("click", i), a && a.addEventListener("click", i);
      let s = document.querySelectorAll(".offcanvas-body .dropdown-item"),
        l = Utils.getElement("offcanvasNavbar");
      if (l && s.length > 0) {
        let r = bootstrap.Offcanvas.getInstance(l) || new bootstrap.Offcanvas(l);
        s.forEach(e => {
          e.addEventListener("click", e => {
            setTimeout(() => {
              r.hide()
            }, 50)
          })
        })
      }
      DarkMode.updateToggleIcons(t, a)
    }
  },
  Footer = {
    generateHTML: () => `
            <footer class="py-5">
                <div class="container">
                    <div class="row g-4 justify-content-center text-center">
                        <div class="col-12 col-sm-6 col-md-3">
                            <h3 class="mb-3">Navigation</h3>
                            <ul class="list-unstyled">
                                ${CONFIG.NAVIGATION.map(e=>`
                                    <li>
                                        <a href="${e.href}" class="text-decoration-none">
                                            ${e.label}
                                        </a>
                                    </li>
                                `).join("")}
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
                            <p class="text-muted">\xa9 <span id="current-year">2024</span> ${CONFIG.ARTIST.DISPLAY_NAME}</p>
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
        `,
    async load() {
      let e = Utils.getElement("footer-container");
      if (!e) return;
      Utils.setHTML(e, this.generateHTML());
      let t = Utils.getElement("current-year");
      t && (t.textContent = new Date()
        .getFullYear()), this.setupCacheButton()
    },
    setupCacheButton() {
      let e = Utils.getElement("clear-cache-btn");
      e && e.addEventListener("click", () => {
        confirm("Clear cache and reload?") && (localStorage.clear(), sessionStorage.clear(), location.reload())
      })
    }
  },
  HomePage = {
    renderLatestRelease: e => `
            <div class="row align-items-center">
                <div class="col-12 col-md-6 mb-4 mb-md-0">
                    <img
                        class="img-fluid rounded-3 shadow-lg"
                        src="${e.image}"
                        alt="${e.title} cover"
                        loading="lazy"
                    />
                </div>
                <div class="col-12 col-md-6">
                    <h2 class="display-4 fw-bold mb-3">Latest Drop: ${e.title}</h2>
                    <p class="fs-5 text-muted mb-4">${Utils.formatDate(e.releaseDate)}</p>
                    <a
                        href="${e.listenLink}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="btn btn-primary btn-lg"
                    >
                        <i class="fas fa-play me-2"></i> Stream Now
                    </a>
                </div>
            </div>
        `,
    async loadLatestRelease() {
      let e = Utils.getElement("latest-release-container"),
        t = Utils.getElement("latest-release-loading"),
        a = Utils.getElement("latest-release-error");
      if (!e || !t || !a) return;
      Utils.removeClass(t, "d-none"), Utils.addClass(a, "d-none"), Utils.addClass(e, "d-none");
      let i = await Utils.fetchData(CONFIG.API.DISCOGRAPHY);
      if (i && Array.isArray(i) && i.length > 0) try {
        let s = i.reduce((e, t) => new Date(t.releaseDate) > new Date(e.releaseDate) ? t : e);
        Utils.setHTML(e, this.renderLatestRelease(s)), Utils.removeClass(e, "d-none"), Utils.addClass(e, "fade-in")
      } catch (l) {
        console.error("Error processing release:", l), Utils.removeClass(a, "d-none")
      } else Utils.setHTML(e, '<p class="text-center text-muted">No releases found.</p>'), Utils.removeClass(e, "d-none");
      Utils.addClass(t, "d-none")
    },
    async loadYouTubeVideo() {
      let e = Utils.getElement("youtube-video-container");
      if (!e) return;
      let t = await Utils.fetchData(CONFIG.API.VIDEO);
      t && t.youtube_embed_url && Utils.setHTML(e, `
                <div class="position-relative w-100 h-100">
                    <iframe
                        width="100%"
                        height="100%"
                        src="${t.youtube_embed_url}?autoplay=1"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen
                        class="rounded-3"
                    ></iframe>
                </div>
            `)
    },
    setupSmoothScroll() {
      let e = Utils.getElement("latest-drop-button");
      e && e.addEventListener("click", t => {
        t.preventDefault();
        let a = e.getAttribute("href");
        Utils.scrollToElement(a, !0)
      })
    }
  },
  Discography = {
    allReleases: [],
    activeFilter: "all",
    activeSort: "date-desc",
    prepareReleases: e => e.filter(e => CONFIG.DISCOGRAPHY.PRIMARY_TYPES.includes(e.type))
      .map(e => ({
        ...e,
        displayDate: Utils.formatDate(e.releaseDate),
        typeTag: e.type ? e.type.toUpperCase() : "",
        dateValue: new Date(e.releaseDate)
          .getTime() || 0,
        titleLower: (e.title || "")
          .toLowerCase(),
        artistLower: (e.artist || "")
          .toLowerCase()
      })),
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
      if (0 === e.length) {
        Utils.setHTML(t, '<div class="col-12"><p class="text-center text-muted">No releases found.</p></div>');
        return
      }
      let a = e.map(e => {
          let t = ["album", "ep"].includes(e.type) ? "album.html" : "single.html";
          return `
                <div class="col">
                    <div class="release-card h-100">
                        <a href="/${t}?id=${e.id}" class="text-decoration-none">
                            <div class="release-card-image position-relative overflow-hidden rounded-top-3">
                                <img src="${e.image}" alt="${e.title}" class="w-100 h-100 object-fit-cover" loading="lazy" />
                                <span class="release-type-tag">${e.typeTag}</span>
                                <div class="release-card-overlay position-absolute inset-0 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center opacity-0">
                                    <i class="fas fa-play-circle fa-3x text-white"></i>
                                </div>
                            </div>
                        </a>
                        <div class="release-card-content p-3 p-md-4">
                            <h3 class="release-title text-truncate mb-2" title="${e.title}">${e.title}</h3>
                            <p class="text-muted small text-truncate mb-2">${e.artist}</p>
                            <p class="text-secondary small mb-0">${e.displayDate}</p>
                        </div>
                    </div>
                </div>
            `
        })
        .join("");
      Utils.setHTML(t, a)
    },
    updateDisplay() {
      let e = "all" === this.activeFilter ? this.allReleases : this.allReleases.filter(e => e.type === this.activeFilter),
        t = this.sortReleases(e, this.activeSort);
      this.renderCards(t)
    },
    async loadData() {
      let e = Utils.getElement("loading-state"),
        t = Utils.getElement("error-state"),
        a = Utils.getElement("no-releases-message");
      e && Utils.removeClass(e, "d-none"), t && Utils.addClass(t, "d-none"), a && Utils.addClass(a, "d-none");
      try {
        let i = await Utils.fetchData(CONFIG.API.DISCOGRAPHY);
        i && Array.isArray(i) && i.length > 0 ? (this.allReleases = this.prepareReleases(i), this.updateDisplay()) : a && Utils.removeClass(a, "d-none")
      } catch (s) {
        console.error("Error loading discography:", s), t && Utils.removeClass(t, "d-none")
      } finally {
        e && Utils.addClass(e, "d-none")
      }
    },
    async init() {
      let e = Utils.getElements(".filter-btn"),
        t = Utils.getElement("sort-by");
      e.length && t && (e.forEach(t => {
        t.addEventListener("click", () => {
          e.forEach(e => {
            Utils.removeClass(e, "filter-btn-active"), Utils.addClass(e, "filter-btn-inactive")
          }), Utils.addClass(t, "filter-btn-active"), Utils.removeClass(t, "filter-btn-inactive"), this.activeFilter = t.dataset.category || "all", this.updateDisplay()
        })
      }), t.addEventListener("change", e => {
        this.activeSort = e.target.value, this.updateDisplay()
      }), await this.loadData())
    }
  },
  DarkMode = {
    init() {
      ("true" === localStorage.getItem(CONFIG.DARK_MODE.STORAGE_KEY) || CONFIG.DARK_MODE.DEFAULT_DARK) && document.documentElement.classList.add("dark-mode"), window.toggleDarkMode = () => this.toggle()
    },
    toggle() {
      let e = document.documentElement.classList.toggle("dark-mode");
      return localStorage.setItem(CONFIG.DARK_MODE.STORAGE_KEY, e), e
    },
    isDark: () => document.documentElement.classList.contains("dark-mode"),
    updateToggleIcons(e, t) {
      let a = this.isDark(),
        i = a ? "fa-sun" : "fa-moon";
      e && (e.innerHTML = `<i class="fa-solid ${i}"></i>`), t && (t.innerHTML = `<i class="fa-solid ${i}"></i> ${a?"Light Mode":"Dark Mode"}`)
    }
  },
  ImageOptimizer = {
    init() {
      Utils.getElements("img, img[data-src]")
        .forEach(e => Utils.optimizeImage(e));
      new MutationObserver(e => {
          e.forEach(e => {
            e.addedNodes.forEach(e => {
              "IMG" === e.tagName ? Utils.optimizeImage(e) : e.querySelectorAll && e.querySelectorAll("img")
                .forEach(e => Utils.optimizeImage(e))
            })
          })
        })
        .observe(document.body, {
          childList: !0,
          subtree: !0
        })
    }
  },
  DetailPage = {
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
        let a = await Utils.fetchData(CONFIG.API.DISCOGRAPHY);
        this.allReleases = a;
        let i = this.typeMap[t].types;
        return a.find(t => t.id === e && i.includes(t.type))
      } catch (s) {
        return console.error(`Error loading ${t} data:`, s), null
      }
    },
    getTypeDisplay: e => ({
      single: "Single",
      collab: "Collaboration",
      "album-track": "Album Track",
      album: "Album",
      ep: "EP"
    })[e] || e,
    renderTracks(e) {
      let t = Utils.getElement("tracklist-container");
      if (!t) return;
      let a = e.split("-")
        .slice(0, -1)
        .join("-") || e,
        i = this.allReleases.filter(e => "album-track" === e.type && e.id.startsWith(a));
      if (!i.length) return;
      let s = i.map((e, t) => `
            <div class="track-item">
                <div class="track-number">${t+1}</div>
                <div class="track-info"><div class="track-title">${e.title}</div><div class="track-artist">${e.artist}</div></div>
                <div class="track-actions">
                    <a href="/single.html?id=${e.id}" class="track-btn"><i class="fas fa-play"></i>Listen</a>
                </div>
            </div>`)
        .join("");
      Utils.setHTML(t, s)
    },
    async display(e, t) {
      let a = Utils.getElement("loading-state"),
        i = Utils.getElement("error-state"),
        s = Utils.getElement(`${t}-details`);
      a && Utils.removeClass(a, "d-none"), i && Utils.addClass(i, "d-none"), s && Utils.addClass(s, "d-none");
      let l = await this.loadData(e, t);
      if (!l) {
        a && Utils.addClass(a, "d-none"), i && Utils.removeClass(i, "d-none");
        return
      }
      let r = Utils.getElement(`${t}-image`);
      r && (r.src = l.image, r.alt = l.title), Utils.setHTML(Utils.getElement(`${t}-title`), l.title), Utils.setHTML(Utils.getElement(`${t}-artist`), l.artist), Utils.setHTML(Utils.getElement(`${t}-date`), Utils.formatDate(l.releaseDate)), Utils.setHTML(Utils.getElement(`${t}-type`), this.getTypeDisplay(l.type)), Utils.setHTML(Utils.getElement(`${t}-type-text`), this.getTypeDisplay(l.type)), "album" === t && (Utils.setHTML(Utils.getElement("album-track-count"), this.allReleases.filter(t => "album-track" === t.type && t.id.startsWith(e.split("-")
          .slice(0, -1)
          .join("-")))
        .length), this.renderTracks(e));
      let n = Utils.getElement("listen-btn");
      n && (n.href = l.listenLink), a && Utils.addClass(a, "d-none"), s && (Utils.removeClass(s, "d-none"), Utils.addClass(s, "fade-in")), document.title = `${l.title} | Ryze Tha Kidd`
    },
    extractId() {
      let e = new URLSearchParams(window.location.search),
        t = window.location.pathname.split("/")
        .filter(e => e && !e.includes(".html"));
      return e.has("id") ? e.get("id") : e.has("slug") ? e.get("slug") : t.length > 0 ? t[t.length - 1] : null
    },
    async init(e) {
      let t = this.extractId();
      if (!t) {
        let a = Utils.getElement("error-state"),
          i = Utils.getElement("loading-state");
        i && Utils.addClass(i, "d-none"), a && Utils.removeClass(a, "d-none");
        return
      }
      await this.display(t, e)
    }
  },
  VideoFAQ = {
    data: [{
      videoId: "video-1",
      title: "How to get an Official Artist Channel on YouTube with DistroKid",
      thumbnail: "https://i.ytimg.com/vi/8dCv09a0tlM/maxresdefault.jpg",
      watchUrl: "https://youtube.com/watch?v=8dCv09a0tlM",
      questions: [{
        question: "How do I do it?",
        answer: 'Press the "Watch Full Video" button to get a full comprehensive guide. In short, distribute your music via DistroKid, claim your channel through the <a href="https://distrokid.com/YouTubeOfficialArtistChannels/?ref=globalmenu" target="_blank">YouTube Official Artist Channels</a> section, and follow the steps on screen.<br><br> Visit <a href="https://support.google.com/youtube/answer/7336634?hl=en-GB#zippy=%2Cprogramme-criteria-and-eligibility" target="_blank">Google\'s official guide article</a> to make sure you meet the current criteria. Here is DistroKid\'s own <a href="https://support.distrokid.com/hc/en-us/articles/360036924633-Claiming-an-Official-Artist-Channel-on-YouTube" target="_blank">guide</a> <br><br> This guide is only for DistroKid, you can do it with other distributors as well but the process may differ.'
      }, {
        question: "How long does it take to recieve the Official Artist Channel?",
        answer: 'It varies! It can take up to 6 weeks after you initially claim your channel. Be patient and keep an eye on your email for updates from YouTube. If it has not been completed after 6 weeks, consider reaching out to <a href="https://support.distrokid.com/hc/en-us" target="_blank">DistroKid support</a> for assistance. Or, visit <a href="/contact">my Contact page</a> to contact me and I will try to help.'
      }, {
        question: "Do I have to pay?",
        answer: 'You do have to pay for DistroKid\'s distribution service, but claiming the Official Artist Channel through DistroKid is free of charge. Just make sure you have an active subscription with DistroKid to distribute your music. <br><br> Check DistroKid\'s <a href="https://distrokid.com/pricing/" target="_blank">pricing page</a> for more details on their plans.'
      }]
    }],
    renderAccordion() {
      let e = Utils.getElement("faq-container");
      if (!e) return;
      if (0 === this.data.length) {
        Utils.setHTML(e, '<p class="text-center text-muted">No FAQs available yet.</p>');
        return
      }
      let t = '<div class="accordion accordion-flush" id="faqAccordion">';
      this.data.forEach((e, a) => {
        let i = `faq-video-${e.videoId}`;
        t += `
                <div class="accordion-item faq-video-item bg-transparent border-0 mb-4">
                    <div class="accordion-header">
                        <button class="faq-video-card p-0 border-0 w-100" type="button" data-bs-toggle="collapse" data-bs-target="#${i}" aria-expanded="false" aria-controls="${i}">
                            <div class="row g-0 align-items-center">
                                <div class="col-5 col-md-4">
                                    <div class="faq-thumbnail-wrapper">
                                        <img src="${e.thumbnail}" class="faq-thumbnail" alt="${e.title}" loading="lazy">
                                        <div class="play-overlay"><i class="fas fa-play-circle"></i></div>
                                    </div>
                                </div>
                                <div class="col-7 col-md-8 p-3 p-md-4">
                                    <h3 class="faq-title fw-bold mb-0">${e.title}</h3>
                                    <small class="faq-questions-count d-block mt-2"><i class="fas fa-chevron-down"></i> ${e.questions.length} questions</small>
                                </div>
                            </div>
                        </button>
                    </div>
                    <div id="${i}" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                        <div class="faq-content-wrapper">
                            <div class="faq-questions-list">`, e.questions.forEach((e, a) => {
          let s = `${i}-qa-${a}`;
          t += `
                                <div class="faq-qa-item">
                                    <button class="faq-question-btn" type="button" data-bs-toggle="collapse" data-bs-target="#${s}" aria-expanded="false" aria-controls="${s}">
                                        <div class="faq-question-content">
                                            <i class="fas fa-question-circle faq-question-icon"></i>
                                            <span class="faq-question-text">${e.question}</span>
                                        </div>
                                        <i class="fas fa-chevron-down faq-chevron"></i>
                                    </button>
                                    <div id="${s}" class="collapse faq-answer-collapse">
                                        <div class="faq-answer-content">
                                            <i class="fas fa-lightbulb faq-answer-icon"></i>
                                            <p class="faq-answer-text">${e.answer}</p>
                                        </div>
                                    </div>
                                </div>`
        }), t += `
                            </div>
                            <div class="faq-video-link">
                                <a href="${e.watchUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
                                    <i class="fas fa-play me-2"></i> Watch Full Video
                                </a>
                            </div>
                        </div>
                    </div>
                </div>`
      }), t += "</div>", Utils.setHTML(e, t)
    },
    async init() {
      let e = Utils.getElement("faq-container"),
        t = Utils.getElement("faq-loading"),
        a = Utils.getElement("faq-error");
      if (!e) {
        console.error("VideoFAQ.init() - No container found!");
        return
      }
      try {
        t && Utils.removeClass(t, "d-none"), a && Utils.addClass(a, "d-none"), await new Promise(e => setTimeout(e, 300)), this.renderAccordion(), t && Utils.addClass(t, "d-none")
      } catch (i) {
        console.error("Error initializing FAQ:", i), t && Utils.addClass(t, "d-none"), a && Utils.removeClass(a, "d-none")
      }
    }
  },
  SinglePage = {
    init: () => DetailPage.init("single")
  },
  AlbumPage = {
    init: () => DetailPage.init("album")
  },
  App = {
    async init() {
      try {
        let e = window.location.pathname.toLowerCase(),
          t = e.split("/")
          .filter(e => e && !e.includes(".html"));
        if (t.length >= 2) {
          let a = t[t.length - 2],
            i = t[t.length - 1];
          if (["single", "album", "ep", "collab"].includes(a)) {
            let s = ["album", "ep"].includes(a) ? "album.html" : "single.html";
            window.location.href = `/${s}?id=${i}`;
            return
          }
        }
        Utils.addScrollToTopButton(), this.injectAnimationStyles(), FormValidator.initForm(), DarkMode.init(), ImageOptimizer.init(), await Navbar.load();
        let l = e.includes("single.html") || t.includes("single") || t.includes("collab"),
          r = e.includes("album.html") || t.includes("album") || t.includes("ep"),
          n = e.includes("faq.html") || e.includes("/faq") || t.includes("faq");
        l ? (await Footer.load(), await SinglePage.init()) : r ? (await Footer.load(), await AlbumPage.init()) : n ? (await Footer.load(), await VideoFAQ.init()) : await Promise.all([Footer.load(), HomePage.loadLatestRelease(), HomePage.loadYouTubeVideo(), HomePage.setupSmoothScroll(), Discography.init(), ])
      } catch (o) {
        console.error("Application initialization error:", o), Utils.showNotification("An error occurred. Please refresh the page.", "error", 5e3)
      }
    },
    injectAnimationStyles() {
      if (document.getElementById("rtk-animations")) return;
      let e = document.createElement("style");
      e.id = "rtk-animations", e.textContent = `
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
        `, document.head.appendChild(e)
    }
  };
document.addEventListener("DOMContentLoaded", () => {
  App.init()
});