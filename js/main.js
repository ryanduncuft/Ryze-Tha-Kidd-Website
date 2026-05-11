
"use strict";
const CONFIG =
{
    artist:
    {
        name: "RYZE THA KIDD",
        display: "Ryze Tha Kidd",
    },
    api:
    {
        releases: "https://gist.githubusercontent.com/ryanduncuft/39ade5f46c7b0a11618f5f016606ecc2/raw/rtk_data.json",
        video: "https://gist.githubusercontent.com/ryanduncuft/d67c1848410f5d6a77d914794848bc7d/raw/video_link.json",
        lyrics: "https://gist.githubusercontent.com/ryanduncuft/f0b1eca5c72c96869645ac18c8ef6c04/raw/rtk-lyrics.json",
    },
    nav:
    [
        ["Home", "/"],
        ["About", "about"],
        ["Discography", "discography"],
        ["FAQ", "faq", ],
        ["Contact", "contact"],
    ],
    social:
    {
        facebook: "https://www.facebook.com/ryzethakidd",
        instagram: "https://instagram.com/ryzethakidd",
        youtube: "https://youtube.com/@RyzeThaKidd",
        spotify: "https://open.spotify.com/artist/2TOX7bcrnVTOe3hbzvdi0H?si=ZGb-8ZhNRsWzyVvsOrJWPQ",
        apple: "https://music.apple.com/us/artist/ryze-tha-kidd/1737326836",
        soundcloud: "https://soundcloud.com/ryzethakidd",
    },
    cache:
    {
        key: "rtk_release_cache",
        timeKey: "rtk_release_cache_ts",
        ttl: 86400000,
    }
};
const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const ESC_REG = /[&<>"']/g;
const DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "long", day: "numeric" });
const DOM = {
    get: (id) => document.getElementById(id),
    qs: (selector, scope = document) => scope.querySelector(selector),
    qsa: (selector, scope = document) => Array.prototype.slice.call(scope.querySelectorAll(selector)),
    create: (tag, props = {}) => Object.assign(document.createElement(tag), props),
    html: (node, val) => { 
        if (node && node.innerHTML !== val) node.innerHTML = val; 
    },
    text: (node, val) => { 
        if (node && node.textContent !== val) node.textContent = val ?? ""; 
    }
};
const Utils = {
    esc: (val) => val == null ? "" : String(val).replace(ESC_REG, m => ESC_MAP[m]),
    enc: (val) => encodeURIComponent(String(val || "")),
    safeUrl: (val) => {
        if (!val) return "#";
        if (val.startsWith('http') || val.startsWith('/')) return val;
        try {
            const url = new URL(val, location.href);
            return (url.protocol === "http:" || url.protocol === "https:") ? url.href : "#";
        } catch { return "#"; }
    },
    debounce: (fn, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn.apply(this, args), delay);
        };
    },
    displayDate: (val) => {
        if (!val) return "TBD";
        const date = new Date(val);
        return isNaN(date.getTime()) ? "TBD" : DATE_FORMATTER.format(date);
    },
    toast: (message, type = "info", duration = 3000) => {
        let container = DOM.get("toast-container") || DOM.create("div", { id: "toast-container" });
        if (!container.parentElement) document.body.appendChild(container);
        const item = DOM.create("div", { 
            className: `rtk-toast rtk-toast-${type}`, 
            textContent: message 
        });
        container.appendChild(item);
        setTimeout(() => {
            item.classList.add("is-leaving");
            item.addEventListener('animationend', () => item.remove(), { once: true });
        }, duration);
    },
    renderItems(items, renderer) {
        let html = "";
        for (let i = 0, len = items.length; i < len; i++) html += renderer(items[i], i);
        return html;
    },
    setOptions(select, values, firstLabel = "All") {
        if (!select) return;
        select.replaceChildren();
        select.add(new Option(firstLabel, "all"));
        values.forEach(value => select.add(new Option(value, value)));
    }
};
const Components = {
    cache: Object.create(null),
    async load() {
        if (Object.keys(this.cache).length) return;
        const res = await fetch("/components/ui.html", { cache: "force-cache" });
        if (!res.ok) throw new Error("Component module load failed: ui.html");
        const doc = new DOMParser().parseFromString(await res.text(), "text/html");
        DOM.qsa("template[id]", doc).forEach(template => {
            this.cache[template.id] = template.innerHTML.trim();
        });
    },
    render(name, data = {}) {
        const template = this.cache[name] || "";
        return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? "");
    }
};
const GlobalRevealObserver = new IntersectionObserver((entries) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        entries.forEach(en => en.target.classList.add("is-visible"));
        return;
    }
    for (let i = 0, len = entries.length; i < len; i++) {
        const en = entries[i];
        if (en.isIntersecting) { 
            en.target.classList.add("is-visible"); 
            GlobalRevealObserver.unobserve(en.target); 
        }
    }
}, { 
    threshold: 0.01, 
    rootMargin: "0px 0px 150px 0px" 
});
const KEBAB_REG = /([A-Z])/g;
const AppState = {
    releases: [],
    favorites: new Set(),
    settings: { reduceMotion: false, compactUI: false, minimalCards: false, lowDataMode: false, touchFriendly: false, denseGrid: false },
    async init() {
        try {
            const saved = JSON.parse(localStorage.getItem("rtk-settings"));
            if (saved) Object.assign(this.settings, saved);
            const favs = JSON.parse(localStorage.getItem("rtk-favorites"));
            if (favs) this.favorites = new Set(favs);
        } catch (e) {
            console.warn("State recovery failed", e);
        }
        this.applySettings();
    },
    saveSettings() {
        localStorage.setItem("rtk-settings", JSON.stringify(this.settings));
        this.applySettings();
    },
    applySettings() {
        const root = document.documentElement;
        const keys = Object.keys(this.settings);
        for (let i = 0, len = keys.length; i < len; i++) {
            const key = keys[i];
            const className = key.replace(KEBAB_REG, "-$1").toLowerCase();
            root.classList.toggle(className, !!this.settings[key]);
            if (key === "lowDataMode") root.classList.toggle("low-data", !!this.settings[key]);
        }
    }
};
const Data = {
    async fetchReleases() {
        if (AppState.releases.length) return AppState.releases;
        const cached = localStorage.getItem(CONFIG.cache.key);
        const cachedAt = Number(localStorage.getItem(CONFIG.cache.timeKey) || 0);
        if (cached && (Date.now() - cachedAt < CONFIG.cache.ttl)) {
            try {
                AppState.releases = JSON.parse(cached);
                return AppState.releases;
            } catch (e) { 
                localStorage.removeItem(CONFIG.cache.key); 
            }
        }
        try {
            const res = await fetch(CONFIG.api.releases, { cache: "no-cache" });
            const rawData = await res.json();
            AppState.releases = this.normalize(rawData);
            setTimeout(() => {
                try {
                    localStorage.setItem(CONFIG.cache.key, JSON.stringify(AppState.releases));
                    localStorage.setItem(CONFIG.cache.timeKey, Date.now().toString());
                } catch (e) { console.error("Cache save failed", e); }
            }, 10);
            return AppState.releases;
        } catch (err) {
            return [];
        }
    },
    normalize(items) {
        const typeLabels = {
            album: "Album",
            ep: "EP",
            single: "Single",
            collab: "Collaboration",
            "album-track": "Album Track"
        };
        const albumMap = {};
        const len = items.length;
        for (let i = 0; i < len; i++) {
            const it = items[i];
            if (it.type === "album" || it.type === "ep") {
                albumMap[it.id] = it.image;
            }
        }
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
const UI = {
    getReleaseUrl: (item) => {
        const type = item.type;
        const page = (type === "album" || type === "ep") ? "album.html" : "single.html";
        return `/${page}?id=${Utils.enc(item.id)}`;
    },
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
    navLink: ([label, href], mobile = false) =>
        `<a class="${mobile ? "dropdown-item" : "nav-link"}" href="${Utils.esc(href)}">${Utils.esc(label)}</a>`,
    footerNavItem: ([label, href]) =>
        `<li><a href="${Utils.esc(href)}" class="text-decoration-none">${Utils.esc(label)}</a></li>`,
    toggle: (id, label, key) => `
        <div class="form-check form-switch mb-2">
            <input class="form-check-input" type="checkbox" id="${Utils.esc(id)}" data-key="${Utils.esc(key)}">
            <label class="form-check-label" for="${Utils.esc(id)}">${Utils.esc(label)}</label>
        </div>`,
    themeOption: (mode) => `
        <input type="radio" class="btn-check" name="theme-mode" id="th-${mode}" value="${mode}">
        <label class="btn btn-outline-primary" for="th-${mode}">${mode}</label>`,
    emptyMessage: (message, className = "") =>
        `<p class="text-muted ${Utils.esc(className)}">${Utils.esc(message)}</p>`,
    videoFrame: (url) =>
        `<iframe width="100%" height="100%" src="${Utils.safeUrl(url)}?rel=0" frameborder="0" allowfullscreen class="rounded-3"></iframe>`,
    lyrics: (text) => `<p>${Utils.esc(text)}</p>`
};
const Shell = {
    async init() {
        await AppState.init();
        await Components.load();
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
        const path = location.pathname.toLowerCase();
        const params = new URLSearchParams(location.search);
        const hasGrid = DOM.get("releases-grid");
        const hasHero = DOM.get("hero-release-card") || DOM.get("latest-release-container");
        if (hasGrid) await Pages.discography();
        else if (hasHero) await Pages.home();
        else if (path.includes("single.html")) await Pages.detail("single", params.get("id"));
        else if (path.includes("album.html")) await Pages.detail("album", params.get("id"));
        else if (path.includes("faq")) await Pages.faq();
        else if (path.includes("about")) await Pages.about();
        this.initReveal();
    },
    renderNavbar() {
        const container = this.cache.navbar;
        if (!container) return;
        const navLinks = Utils.renderItems(CONFIG.nav, item => UI.navLink(item));
        const mobileNavLinks = Utils.renderItems(CONFIG.nav, item => UI.navLink(item, true));
        const themeOptions = Utils.renderItems(["system", "light", "dark"], UI.themeOption);
        const toggles = (...items) => Utils.renderItems(items, ([id, label, key]) =>
            this.renderToggle(id, label, key)
        );
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
    renderToggle: UI.toggle,
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
        const clearBtn = DOM.get("clear-cache-btn");
        if (clearBtn) {
            clearBtn.onclick = () => { 
                if(confirm("Clear cache and reset settings?")) { 
                    localStorage.clear(); 
                    sessionStorage.clear(); 
                    location.reload(); 
                }
            };
        }
    },
    initSearch() {
        const input = DOM.get("quick-search-input");
        const resultsBox = DOM.get("quick-search-results");
        if (!input || !resultsBox) return;
        input.oninput = Utils.debounce(async (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (!query) { DOM.html(resultsBox, ""); return; }
            const releases = await Data.fetchReleases();
            const results = [];
            for (let i = 0, len = releases.length; i < len; i++) {
                if (releases[i].searchIndex.indexOf(query) !== -1) {
                    results.push(releases[i]);
                    if (results.length === 5) break;
                }
            }
            const html = Utils.renderItems(results, r => Components.render("quick-result", {
                detailUrl: UI.getReleaseUrl(r),
                image: Utils.safeUrl(r.image),
                title: Utils.esc(r.title),
                typeTag: Utils.esc(r.typeTag)
            }));
            DOM.html(resultsBox, html || UI.emptyMessage("No results found.", "p-2"));
        }, 200);
    },
    initTheme() {
        const saved = localStorage.getItem("theme-mode") || "light";
        const root = this.cache.root;
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        const apply = (m) => {
            const isDark = m === "dark" || (m === "system" && media.matches);
            root.dataset.theme = m;
            root.classList.toggle("dark-mode", isDark);
            localStorage.setItem("theme-mode", m);
            const radio = DOM.get(`th-${m}`);
            if (radio) radio.checked = true;
        };
        const radios = DOM.qsa('input[name="theme-mode"]');
        for (let i = 0, len = radios.length; i < len; i++) {
            radios[i].onchange = (e) => apply(e.target.value);
        }
        media.addEventListener?.("change", () => {
            if ((localStorage.getItem("theme-mode") || "light") === "system") apply("system");
        });
        apply(saved);
    },
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
    initReveal() {
        const els = DOM.qsa(".reveal, .card, .release-card, .release-mini, .track-item");
        for (let i = 0, len = els.length; i < len; i++) {
            GlobalRevealObserver.observe(els[i]);
        }
    }
};
const Pages = {
    async home() {
        const items = await Data.fetchReleases();
        const len = items.length;
        let latest = null;
        const radarItems = [];
        const radarTypes = ["album", "ep", "single", "collab"];
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
        const radarGrid = DOM.get("release-radar-grid");
        if (radarGrid && radarItems.length) {
            DOM.html(radarGrid, Utils.renderItems(radarItems, item => UI.renderReleaseMini(item, item.typeTag)));
        }
        const vidContainer = DOM.get("youtube-video-container");
        if (vidContainer) {
            fetch(CONFIG.api.video).then(res => res.json()).then(data => {
                if (data?.youtube_embed_url) {
                    DOM.html(vidContainer, UI.videoFrame(data.youtube_embed_url));
                }
            }).catch(() => {});
        }
        Shell.initReveal();
    },
    async discography() {
        const allItems = await Data.fetchReleases();
        const grid = DOM.get("releases-grid");
        if (!grid) return;
        const mainTypes = ["album", "ep", "single", "collab"];
        const items = allItems.filter(r => mainTypes.indexOf(r.type) !== -1);
        const state = {
            category: "all",
            search: "",
            sort: "date-desc",
            artist: "all",
            minYear: 2019,
            maxYear: new Date().getFullYear()
        };
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
        const artistSelect = DOM.get("artist-filter");
        Utils.setOptions(artistSelect, Array.from(artists).sort(), "All Artists");
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
            filtered.sort((a, b) => {
                if (state.sort === "date-desc") return b.dateValue - a.dateValue;
                if (state.sort === "date-asc") return a.dateValue - b.dateValue;
                if (state.sort === "title-asc") return a.title.localeCompare(b.title);
                if (state.sort === "artist-asc") return a.artist.localeCompare(b.artist);
                return 0;
            });
            DOM.html(grid, Utils.renderItems(filtered, UI.renderCard));
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
            const emptyMsg = DOM.get("no-releases-message");
            if (emptyMsg) {
                if (filtered.length === 0) emptyMsg.classList.remove("d-none");
                else emptyMsg.classList.add("d-none");
            }
            Shell.initReveal();
        };
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
        const sortSelect = DOM.get("sort-by");
        if (sortSelect) {
            sortSelect.onchange = (e) => {
                state.sort = e.target.value;
                render();
            };
        }
        if (artistSelect) {
            artistSelect.onchange = (e) => {
                state.artist = e.target.value;
                render();
            };
        }
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
            localStorage.setItem("rtk-favorites", JSON.stringify([...AppState.favorites]));
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
        if (elements.title) elements.title.textContent = item.title;
        if (elements.artist) elements.artist.textContent = item.artist;
        if (elements.date) elements.date.textContent = item.displayDate;
        if (elements.type) elements.type.textContent = item.typeLabel;
        if (elements.typeText) elements.typeText.textContent = item.typeLabel;
        if (elements.count) elements.count.textContent = item.trackCount || "0";
        if (elements.img) elements.img.src = item.image;
        if (elements.listen) elements.listen.href = item.listenLink || "#";
        const tracks = releases.filter(r => {
            const isTrack = r.type === 'album-track' || r.type === 'track';
            const match = r.albumId === id || id.startsWith(r.albumId) || (r.id && r.id.startsWith(id));
            return isTrack && match;
        }).sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0));
        const trackHtml = Utils.renderItems(tracks, (t, i) => Components.render("track-item", {
            trackNumber: t.trackNumber || i + 1,
            title: Utils.esc(t.title),
            detailUrl: UI.getReleaseUrl(t)
        }));
        DOM.html(DOM.get("tracklist-container"), trackHtml || UI.emptyMessage("Tracklist pending update.", "p-3"));
        document.title = `${item.title} | ${CONFIG.artist.display}`;
        this.fetchLyrics(id);
    },
    async fetchLyrics(id) {
        try {
            const res = await fetch(CONFIG.api.lyrics);
            const lyrics = await res.json();
            const box = DOM.get("single-description-content");
            if (box && lyrics[id]) {
                DOM.html(box, UI.lyrics(lyrics[id]));
            }
        } catch (e) {}
    },
    async faq()
    {
        const faqUrl = "https://gist.githubusercontent.com/ryanduncuft/5e9489b0c1c00f479335247c494760eb/raw/faq.json";
        const res = await fetch(faqUrl, { cache: "no-cache" });
        const faqData = await res.json();
        const items = Utils.renderItems(faqData, v => {
            const questions = Utils.renderItems(v.questions, (q, index) => Components.render("faq-qa-item", {
                videoId: Utils.esc(v.videoId),
                index,
                question: Utils.esc(q.question),
                answer: q.answer
            }));
            return Components.render("faq-video-item", {
                videoId: Utils.esc(v.videoId),
                title: Utils.esc(v.title),
                thumbnail: Utils.safeUrl(v.thumbnail),
                watchUrl: Utils.safeUrl(v.watchUrl),
                questions
            });
        });
        DOM.html(DOM.get("faq-container"), Components.render("faq-accordion", { items }));
        DOM.get("faq-loading")?.classList.add("d-none");
        Shell.initReveal();
    },
    async about() {
        this.updateAge();
        const images = DOM.qsa("img[data-src]");
        for (let i = 0, len = images.length; i < len; i++) {
            images[i].src = images[i].dataset.src;
            images[i].removeAttribute("data-src");
        }
        Shell.initReveal();
    },
    updateAge() {
        const ageEl = DOM.get("current-age");
        if (!ageEl) return;
        const birthDate = new Date("2007-09-15T00:00:00");
        const now = new Date();
        let age = now.getFullYear() - birthDate.getFullYear();
        const monthDelta = now.getMonth() - birthDate.getMonth();
        if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birthDate.getDate())) age--;
        ageEl.textContent = `age ${age} years`;
    }
};
(() => {
        const boot = () => {
        window.requestAnimationFrame(() => {
            Shell.init().catch(err => {
                console.error("RTK Critical Failure:", err);
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
