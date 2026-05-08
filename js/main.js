"use strict";const CONFIG={artist:{name:"RYZE THA KIDD",display:"Ryze Tha Kidd"},api:{releases:"https://gist.githubusercontent.com/ryanduncuft/39ade5f46c7b0a11618f5f016606ecc2/raw/rtk_data.json",video:"https://gist.githubusercontent.com/ryanduncuft/d67c1848410f5d6a77d914794848bc7d/raw/video_link.json",lyrics:"https://gist.githubusercontent.com/ryanduncuft/f0b1eca5c72c96869645ac18c8ef6c04/raw/rtk-lyrics.json"},nav:[["Home","/"],["About","about"],["Discography","discography"],["FAQ","faq",],["Contact","contact"],],social:{facebook:"https://www.facebook.com/ryzethakidd",instagram:"https://instagram.com/ryzethakidd",youtube:"https://youtube.com/@RyzeThaKidd",spotify:"https://open.spotify.com/artist/2TOX7bcrnVTOe3hbzvdi0H?si=ZGb-8ZhNRsWzyVvsOrJWPQ",apple:"https://music.apple.com/us/artist/ryze-tha-kidd/1737326836",soundcloud:"https://soundcloud.com/ryzethakidd"},cache:{key:"rtk_release_cache",timeKey:"rtk_release_cache_ts",ttl:864e5}},ESC_MAP={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"},ESC_REG=/[&<>"']/g,DATE_FORMATTER=new Intl.DateTimeFormat("en-GB",{year:"numeric",month:"long",day:"numeric"}),DOM={get:e=>document.getElementById(e),qs:(e,t=document)=>t.querySelector(e),qsa:(e,t=document)=>Array.prototype.slice.call(t.querySelectorAll(e)),create:(e,t={})=>Object.assign(document.createElement(e),t),html(e,t){e&&e.innerHTML!==t&&(e.innerHTML=t)},text(e,t){e&&e.textContent!==t&&(e.textContent=t??"")}},Utils={esc:e=>null==e?"":String(e).replace(ESC_REG,e=>ESC_MAP[e]),enc:e=>encodeURIComponent(String(e||"")),safeUrl(e){if(!e)return"#";if(e.startsWith("http")||e.startsWith("/"))return e;try{let t=new URL(e,location.href);return"http:"===t.protocol||"https:"===t.protocol?t.href:"#"}catch{return"#"}},debounce:(e,t)=>{let a;return(...s)=>{clearTimeout(a),a=setTimeout(()=>e.apply(this,s),t)}},displayDate(e){if(!e)return"TBD";let t=new Date(e);return isNaN(t.getTime())?"TBD":DATE_FORMATTER.format(t)},toast(e,t="info",a=3e3){let s=DOM.get("toast-container")||DOM.create("div",{id:"toast-container"});s.parentElement||document.body.appendChild(s);let i=DOM.create("div",{className:`rtk-toast rtk-toast-${t}`,textContent:e});s.appendChild(i),setTimeout(()=>{i.classList.add("is-leaving"),i.addEventListener("animationend",()=>i.remove(),{once:!0})},a)}},GlobalRevealObserver=new IntersectionObserver(e=>{if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){e.forEach(e=>e.target.classList.add("is-visible"));return}for(let t=0,a=e.length;t<a;t++){let s=e[t];s.isIntersecting&&(s.target.classList.add("is-visible"),GlobalRevealObserver.unobserve(s.target))}},{threshold:.01,rootMargin:"0px 0px 150px 0px"}),KEBAB_REG=/([A-Z])/g,AppState={releases:[],favorites:new Set,settings:{reduceMotion:!1,compactUI:!1,minimalCards:!1,lowDataMode:!1,touchFriendly:!1,denseGrid:!1},async init(){try{let e=JSON.parse(localStorage.getItem("rtk-settings"));e&&Object.assign(this.settings,e);let t=JSON.parse(localStorage.getItem("rtk-favorites"));t&&(this.favorites=new Set(t))}catch(a){console.warn("State recovery failed",a)}this.applySettings()},saveSettings(){localStorage.setItem("rtk-settings",JSON.stringify(this.settings)),this.applySettings()},applySettings(){let e=document.documentElement,t=Object.keys(this.settings);for(let a=0,s=t.length;a<s;a++){let i=t[a],l=i.replace(KEBAB_REG,"-$1").toLowerCase();e.classList.toggle(l,!!this.settings[i])}}},Data={async fetchReleases(){if(AppState.releases.length)return AppState.releases;let e=localStorage.getItem(CONFIG.cache.key),t=Number(localStorage.getItem(CONFIG.cache.timeKey)||0);if(e&&Date.now()-t<CONFIG.cache.ttl)try{return AppState.releases=JSON.parse(e),AppState.releases}catch(a){localStorage.removeItem(CONFIG.cache.key)}try{let s=await fetch(CONFIG.api.releases,{cache:"no-cache"}),i=await s.json();return AppState.releases=this.normalize(i),setTimeout(()=>{try{localStorage.setItem(CONFIG.cache.key,JSON.stringify(AppState.releases)),localStorage.setItem(CONFIG.cache.timeKey,Date.now().toString())}catch(e){console.error("Cache save failed",e)}},10),AppState.releases}catch(l){return[]}},normalize(e){let t={album:"Album",ep:"EP",single:"Single",collab:"Collaboration","album-track":"Album Track"},a={},s=e.length;for(let i=0;i<s;i++){let l=e[i];("album"===l.type||"ep"===l.type)&&(a[l.id]=l.image)}let r=Array(s);for(let n=0;n<s;n++){let o=e[n],c=o.albumId;if(!c&&o.id){let d=o.id.lastIndexOf("-");-1!==d&&(c=o.id.substring(0,d))}let g=o.type||"",h=o.title||"",u=o.artist||"",m=t[g]||g;r[n]={...o,image:o.image||a[c]||"",displayDate:Utils.displayDate(o.releaseDate),dateValue:o.releaseDate?new Date(o.releaseDate).getTime():0,typeLabel:m,typeTag:g.toUpperCase(),searchIndex:(h+" "+u+" "+g).toLowerCase()}}return r}},UI={getReleaseUrl(e){let t=e.type;return`/${"album"===t||"ep"===t?"album.html":"single.html"}?id=${Utils.enc(e.id)}`},renderReleaseMini(e,t="Latest Release"){let{esc:a,safeUrl:s}=Utils,i=a(e.title),l=a(e.artist),r=s(e.image),n=UI.getReleaseUrl(e),o=s(e.listenLink);return`
        <div class="release-mini reveal">
            <img src="${r}" alt="${i} cover" loading="lazy">
            <div>
                <p class="eyebrow mb-2">${a(t)} • ${e.typeLabel}</p>
                <h3 class="fs-4 fw-bold mb-2">${i}</h3>
                <p class="text-muted mb-3">${l} • ${e.displayDate}</p>
                <div class="d-flex flex-wrap gap-2">
                    <a href="${o}" target="_blank" class="btn btn-primary btn-sm"><i class="fas fa-play me-2"></i>Listen</a>
                    <a href="${n}" class="btn btn-outline-primary btn-sm">View Details</a>
                </div>
            </div>
        </div>`},renderCard(e){let{esc:t,safeUrl:a}=Utils,s=e.id,i=t(e.title),l=t(e.artist),r=a(e.image),n=UI.getReleaseUrl(e),o=AppState.favorites.has(s);return`
        <div class="col reveal">
            <div class="release-card h-100">
                <div class="release-card-image position-relative overflow-hidden rounded-top-3">
                    <a href="${n}" class="text-decoration-none">
                        <img src="${r}" alt="${i}" class="w-100 h-100 object-fit-cover" loading="lazy">
                        <span class="release-type-tag">${e.typeTag}</span>
                    </a>
                    <button class="favorite-btn ${o?"is-favorite":""}" data-id="${t(s)}">
                        <i class="fas fa-star"></i>
                    </button>
                </div>
                <div class="release-card-content p-3 p-md-4">
                    <h3 class="release-title text-truncate mb-1">${i}</h3>
                    <p class="text-muted small mb-0">${l}</p>
                </div>
            </div>
        </div>`}},Shell={async init(){await AppState.init(),this.cache={root:document.documentElement,navbar:DOM.get("navbar-container"),footer:DOM.get("footer-container")},this.renderNavbar(),this.renderFooter(),this.initSearch(),this.initTheme(),this.initScrollTop();let e=location.pathname.toLowerCase(),t=new URLSearchParams(location.search),a=DOM.get("releases-grid"),s=DOM.get("hero-release-card")||DOM.get("latest-release-container");a?await Pages.discography():s?await Pages.home():e.includes("single.html")?await Pages.detail("single",t.get("id")):e.includes("album.html")?await Pages.detail("album",t.get("id")):e.includes("faq")?await Pages.faq():e.includes("about")&&await Pages.about(),this.initReveal()},renderNavbar(){let e=this.cache.navbar;if(!e)return;let t="",a="";for(let s=0,i=CONFIG.nav.length;s<i;s++){let[l,r]=CONFIG.nav[s];t+=`<a class="nav-link" href="${r}">${l}</a>`,a+=`<a class="dropdown-item" href="${r}">${l}</a>`}let n=["system","light","dark"].reduce((e,t)=>e+`
            <input type="radio" class="btn-check" name="theme-mode" id="th-${t}" value="${t}">
            <label class="btn btn-outline-primary" for="th-${t}">${t}</label>
        `,"");DOM.html(e,`
            <nav class="navbar navbar-expand-lg fixed-top navbar-light" role="banner">
                <div class="container-fluid navbar-container-layout">
                    <a class="navbar-brand" href="/">${CONFIG.artist.name}</a>
                    <div class="navbar-nav d-none d-lg-flex navbar-center">${t}</div>
                    <div class="navbar-controls d-none d-lg-flex">
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-primary dropdown-toggle" data-bs-toggle="dropdown">
                                <i class="fa-solid fa-compass me-2"></i> Tools
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li><button class="dropdown-item" data-bs-toggle="offcanvas" data-bs-target="#quickSearchPanel"><i class="fa-solid fa-magnifying-glass me-2"></i> Search</button></li>
                                <li><button id="global-random" class="dropdown-item"><i class="fa-solid fa-shuffle me-2"></i> Surprise</button></li>
                                <li><button class="dropdown-item" data-bs-toggle="offcanvas" data-bs-target="#settingsPanel"><i class="fa-solid fa-sliders me-2"></i> Settings</button></li>
                            </ul>
                        </div>
                    </div>
                    <button class="navbar-toggler d-lg-none ms-auto" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasNavbar">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="offcanvas offcanvas-end d-lg-none" id="offcanvasNavbar" tabindex="-1">
                        <div class="offcanvas-header">
                            <h5 class="offcanvas-title">Navigation</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
                        </div>
                        <div class="offcanvas-body">
                            <div class="navbar-nav flex-column w-100">
                                ${a}
                                <hr class="my-3">
                                <div class="mt-2 d-flex flex-column gap-2">
                                    <button class="btn btn-sm btn-outline-primary w-100" data-bs-toggle="offcanvas" data-bs-target="#quickSearchPanel"><i class="fa-solid fa-magnifying-glass me-2"></i> Search</button>
                                    <button id="global-random-mobile" class="btn btn-sm btn-outline-primary w-100"><i class="fa-solid fa-shuffle me-2"></i> Surprise</button>
                                    <button class="btn btn-sm btn-outline-primary w-100" data-bs-toggle="offcanvas" data-bs-target="#settingsPanel"><i class="fa-solid fa-sliders me-2"></i> Settings</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
            <aside class="offcanvas offcanvas-end settings-panel" id="settingsPanel" tabindex="-1">
                <div class="offcanvas-header"><h2 class="offcanvas-title">Settings</h2><button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button></div>
                <div class="offcanvas-body">
                    <section class="settings-section">
                        <h3 class="settings-section-title">Theme</h3>
                        <div class="btn-group w-100">${n}</div>
                    </section>
                    <section class="settings-section">
                        <h3 class="settings-section-title">Performance</h3>
                        ${this.renderToggle("setting-reduce-motion","Reduce motion","reduceMotion")}
                        ${this.renderToggle("setting-compact-ui","Compact spacing","compactUI")}
                    </section>
                    <section class="settings-section mobile-only">
                        <h3 class="settings-section-title">Mobile Settings</h3>
                        ${this.renderToggle("setting-low-data-mode","Low data mode","lowDataMode")}
                        ${this.renderToggle("setting-touch-friendly","Touch-friendly UI","touchFriendly")}
                    </section>
                    <section class="settings-section desktop-only">
                        <h3 class="settings-section-title">Desktop Settings</h3>
                        ${this.renderToggle("setting-minimal-cards","Minimal Cards","minimalCards")}
                        ${this.renderToggle("setting-dense-grid","Dense release grid","denseGrid")}
                    </section>
                </div>
            </aside>
            <aside class="offcanvas offcanvas-end search-panel" id="quickSearchPanel" tabindex="-1">
                <div class="offcanvas-header"><h2 class="offcanvas-title">Quick Search</h2><button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button></div>
                <div class="offcanvas-body">
                    <div class="input-group mb-3">
                        <span class="input-group-text"><i class="fas fa-search"></i></span>
                        <input id="quick-search-input" type="search" class="form-control" placeholder="Search music...">
                    </div>
                    <div id="quick-search-results" class="quick-search-results"></div>
                </div>
            </aside>
        `);let o=async()=>{let e=await Data.fetchReleases();if(!e.length)return;let t=e.filter(e=>"album-track"!==e.type);location.href=UI.getReleaseUrl(t[Math.random()*t.length|0])},c=DOM.get("global-random"),d=DOM.get("global-random-mobile");c&&(c.onclick=o),d&&(d.onclick=o);let g=DOM.qsa('.settings-panel input[type="checkbox"]');for(let h=0,u=g.length;h<u;h++){let m=g[h],p=m.dataset.key;m.checked=AppState.settings[p],m.onchange=()=>{AppState.settings[p]=m.checked,AppState.saveSettings()}}},renderToggle:(e,t,a)=>`
        <div class="form-check form-switch mb-2">
            <input class="form-check-input" type="checkbox" id="${e}" data-key="${a}">
            <label class="form-check-label" for="${e}">${t}</label>
        </div>`,renderFooter(){let e=this.cache.footer;if(!e)return;let t=new Date().getFullYear(),a=CONFIG.nav.reduce((e,[t,a])=>e+`<li><a href="${a}" class="text-decoration-none">${t}</a></li>`,"");DOM.html(e,`
            <footer class="py-5">
                <div class="container">
                    <div class="row g-4 justify-content-center text-center">
                        <div class="col-12 col-sm-6 col-md-3"><h3 class="mb-3">Navigation</h3><ul class="list-unstyled">${a}</ul></div>
                        <div class="col-12 col-sm-6 col-md-3"><h3 class="mb-3">Connect</h3>
                            <div class="d-flex gap-3 justify-content-center">
                                <a href="${CONFIG.social.facebook}" target="_blank" aria-label="Facebook"><i class="fab fa-facebook-f fa-lg"></i></a>
                                <a href="${CONFIG.social.instagram}" target="_blank" aria-label="Instagram"><i class="fab fa-instagram fa-lg"></i></a>
                                <a href="${CONFIG.social.youtube}" target="_blank" aria-label="YouTube"><i class="fab fa-youtube fa-lg"></i></a>
                            </div>
                        </div>
                        <div class="col-12 col-sm-6 col-md-3"><h3 class="mb-3">Stream</h3><ul class="list-unstyled">
                            <li><a href="${CONFIG.social.spotify}" target="_blank" class="text-decoration-none">Spotify</a></li>
                            <li><a href="${CONFIG.social.apple}" target="_blank" class="text-decoration-none">Apple Music</a></li>
                            <li><a href="${CONFIG.social.soundcloud}" target="_blank" class="text-decoration-none">SoundCloud</a></li>
                        </ul></div>
                        <div class="col-12 col-sm-6 col-md-3"><h3 class="mb-3">System</h3><p class="text-muted">\xa9 <span>${t}</span> ${CONFIG.artist.display}</p>
                        <div class="d-flex flex-column gap-2 align-items-center">
                            <button class="btn btn-sm btn-outline-primary" data-bs-toggle="offcanvas" data-bs-target="#settingsPanel">Open Settings</button>
                            <button id="clear-cache-btn" class="btn btn-sm btn-outline-secondary">Clear Cache</button>
                        </div></div>
                    </div>
                </div>
            </footer>
        `);let s=DOM.get("clear-cache-btn");s&&(s.onclick=()=>{confirm("Clear cache and reset settings?")&&(localStorage.clear(),sessionStorage.clear(),location.reload())})},initSearch(){let e=DOM.get("quick-search-input"),t=DOM.get("quick-search-results");e&&t&&(e.oninput=Utils.debounce(async e=>{let a=e.target.value.toLowerCase().trim();if(!a){DOM.html(t,"");return}let s=await Data.fetchReleases(),i=[];for(let l=0,r=s.length;l<r&&(-1===s[l].searchIndex.indexOf(a)||(i.push(s[l]),5!==i.length));l++);let n="";for(let o=0,c=i.length;o<c;o++){let d=i[o];n+=`
                <a class="quick-result d-flex align-items-center p-2 text-decoration-none" href="${UI.getReleaseUrl(d)}">
                    <img src="${d.image}" width="40" height="40" class="rounded me-3" alt="">
                    <div>
                        <div class="fw-bold small text-white">${Utils.esc(d.title)}</div>
                        <div class="text-muted smaller">${d.typeTag}</div>
                    </div>
                </a>`}DOM.html(t,n||'<p class="text-muted p-2">No results found.</p>')},200))},initTheme(){let e=localStorage.getItem("theme-mode")||"light",t=this.cache.root,a=e=>{let a="dark"===e||"system"===e&&window.matchMedia("(prefers-color-scheme: dark)").matches;t.dataset.theme=e,t.classList.toggle("dark-mode",a),localStorage.setItem("theme-mode",e);let s=DOM.get(`th-${e}`);s&&(s.checked=!0)},s=DOM.qsa('input[name="theme-mode"]');for(let i=0,l=s.length;i<l;i++)s[i].onchange=e=>a(e.target.value);a(e)},initScrollTop(){let e=DOM.create("button",{id:"scroll-to-top-btn",className:"scroll-to-top-btn",innerHTML:'<i class="fas fa-chevron-up"></i>'});document.body.appendChild(e);let t=DOM.create("div",{style:"position:absolute; top:400px; height:1px; width:1px; pointer-events:none;"});document.body.prepend(t),new IntersectionObserver(([t])=>{e.classList.toggle("is-visible",!t.isIntersecting)},{threshold:0}).observe(t),e.onclick=()=>window.scrollTo({top:0,behavior:"smooth"})},initReveal(){let e=DOM.qsa(".reveal, .card, .release-card, .release-mini, .track-item");for(let t=0,a=e.length;t<a;t++)GlobalRevealObserver.observe(e[t])}},Pages={async home(){let e=await Data.fetchReleases(),t=e.length,a=null,s=[],i=["album","ep","single","collab"];for(let l=0;l<t;l++){let r=e[l],n="album-track"===r.type;!n&&((!a||r.dateValue>a.dateValue)&&(a=r),s.length<3&&-1!==i.indexOf(r.type)&&s.push(r))}if(a){let o=DOM.get("hero-release-card");o&&DOM.html(o,UI.renderReleaseMini(a));let c=DOM.get("latest-release-container");c&&(DOM.html(c,`
                    <div class="row align-items-center reveal">
                        <div class="col-12 col-md-6 mb-4 mb-md-0">
                            <img class="img-fluid rounded-3 shadow-lg" src="${a.image}" alt="${Utils.esc(a.title)}" loading="lazy">
                        </div>
                        <div class="col-12 col-md-6">
                            <h2 class="display-4 fw-bold mb-3">Latest Drop: ${Utils.esc(a.title)}</h2>
                            <p class="fs-5 text-muted mb-4">${a.displayDate}</p>
                            <a href="${Utils.safeUrl(a.listenLink)}" target="_blank" class="btn btn-primary btn-lg"><i class="fas fa-play me-2"></i> Stream Now</a>
                        </div>
                    </div>`),c.classList.remove("d-none"))}DOM.get("latest-release-loading")?.classList.add("d-none");let d=DOM.get("release-radar-grid");if(d&&s.length){let g="";for(let h=0;h<s.length;h++)g+=UI.renderReleaseMini(s[h],s[h].typeTag);DOM.html(d,g)}let u=DOM.get("youtube-video-container");u&&fetch(CONFIG.api.video).then(e=>e.json()).then(e=>{e?.youtube_embed_url&&DOM.html(u,`<iframe width="100%" height="100%" src="${e.youtube_embed_url}?rel=0" frameborder="0" allowfullscreen class="rounded-3"></iframe>`)}).catch(()=>{}),Shell.initReveal()},async discography(){let e=await Data.fetchReleases(),t=DOM.get("releases-grid");if(!t)return;let a=["album","ep","single","collab"],s=e.filter(e=>-1!==a.indexOf(e.type)),i={category:"all",search:"",sort:"date-desc",artist:"all",minYear:2019,maxYear:new Date().getFullYear()},l=new Set,r=9999,n=0;for(let o=0;o<s.length;o++){let c=s[o];if(c.artist&&l.add(c.artist),c.dateValue){let d=new Date(c.dateValue).getFullYear();d<r&&(r=d),d>n&&(n=d)}}9999===r&&(r=2019),0===n&&(n=new Date().getFullYear()),i.minYear=r,i.maxYear=n;let g=DOM.get("artist-filter");if(g){let h='<option value="all">All Artists</option>';Array.from(l).sort().forEach(e=>{h+=`<option value="${Utils.esc(e)}">${Utils.esc(e)}</option>`}),DOM.html(g,h)}let u=DOM.get("year-min"),m=DOM.get("year-max"),p=DOM.get("year-min-label"),f=DOM.get("year-max-label");u&&m&&(u.min=m.min=r,u.max=m.max=n,u.value=r,m.value=n,p&&(p.textContent=r),f&&(f.textContent=n));let b=()=>{let e=s.filter(e=>{if("favorites"===i.category&&!AppState.favorites.has(e.id)||"all"!==i.category&&"favorites"!==i.category&&e.type!==i.category||i.search&&-1===e.searchIndex.indexOf(i.search)||"all"!==i.artist&&e.artist!==i.artist)return!1;if(e.dateValue){let t=new Date(e.dateValue).getFullYear();if(t<i.minYear||t>i.maxYear)return!1}return!0});e.sort((e,t)=>"date-desc"===i.sort?t.dateValue-e.dateValue:"date-asc"===i.sort?e.dateValue-t.dateValue:"title-asc"===i.sort?e.title.localeCompare(t.title):"artist-asc"===i.sort?e.artist.localeCompare(t.artist):0);let a="";for(let l=0;l<e.length;l++)a+=UI.renderCard(e[l]);DOM.html(t,a);let r=e.length,n=0;for(let o=0;o<e.length;o++)"album"===e[o].type&&n++;let c=0;for(let d=0;d<s.length;d++)AppState.favorites.has(s[d].id)&&c++;DOM.text(DOM.get("release-count"),`${r} Releases`),DOM.text(DOM.get("album-count"),`${n} Albums`),DOM.text(DOM.get("favorite-count"),`${c} Favorites`);let g=DOM.get("no-releases-message");g&&(0===e.length?g.classList.remove("d-none"):g.classList.add("d-none")),Shell.initReveal()},v=DOM.qsa(".filter-btn");for(let y=0;y<v.length;y++){let O=v[y];O.onclick=()=>{let e=DOM.qs(".filter-btn-active");e&&(e.classList.remove("filter-btn-active"),e.classList.add("filter-btn-inactive")),O.classList.remove("filter-btn-inactive"),O.classList.add("filter-btn-active"),i.category=O.dataset.category,b()}}let D=DOM.get("discography-search"),$=DOM.get("discography-search-clear");D&&(D.oninput=Utils.debounce(e=>{i.search=e.target.value.toLowerCase().trim(),b()},200)),$&&D&&($.onclick=()=>{D.value="",i.search="",b()});let k=DOM.get("sort-by");if(k&&(k.onchange=e=>{i.sort=e.target.value,b()}),g&&(g.onchange=e=>{i.artist=e.target.value,b()}),u&&m){let w=e=>{let t=parseInt(u.value),a=parseInt(m.value);t>a&&(e&&e.target===u?(u.value=a,t=a):e&&e.target===m&&(m.value=t,a=t)),p&&(p.textContent=t),f&&(f.textContent=a),i.minYear=t,i.maxYear=a,b()};u.oninput=w,m.oninput=w}t.onclick=e=>{let t=e.target.closest(".favorite-btn");if(!t)return;e.preventDefault();let a=t.dataset.id;if(AppState.favorites.has(a)?(AppState.favorites.delete(a),t.classList.remove("is-favorite")):(AppState.favorites.add(a),t.classList.add("is-favorite")),localStorage.setItem("rtk-favorites",JSON.stringify([...AppState.favorites])),"favorites"===i.category)b();else{let l=0;for(let r=0;r<s.length;r++)AppState.favorites.has(s[r].id)&&l++;DOM.text(DOM.get("favorite-count"),`${l} Favorites`)}},b(),DOM.get("loading-state")?.classList.add("d-none")},async detail(e,t){let a=await Data.fetchReleases(),s=a.find(e=>e.id===t);if(!s){DOM.get("error-state")?.classList.remove("d-none"),DOM.get("loading-state")?.classList.add("d-none");return}DOM.get(`${e}-details`)?.classList.remove("d-none"),DOM.get("loading-state")?.classList.add("d-none");let i={title:DOM.get(`${e}-title`),artist:DOM.get(`${e}-artist`),date:DOM.get(`${e}-date`),type:DOM.get(`${e}-type`),typeText:DOM.get(`${e}-type-text`),count:DOM.get("album-track-count"),img:DOM.get(`${e}-image`),listen:DOM.get("listen-btn")};i.title&&(i.title.textContent=s.title),i.artist&&(i.artist.textContent=s.artist),i.date&&(i.date.textContent=s.displayDate),i.type&&(i.type.textContent=s.typeLabel),i.typeText&&(i.typeText.textContent=s.typeLabel),i.count&&(i.count.textContent=s.trackCount||"0"),i.img&&(i.img.src=s.image),i.listen&&(i.listen.href=s.listenLink||"#");let l="",r=a.filter(e=>{let a="album-track"===e.type||"track"===e.type,s=e.albumId===t||t.startsWith(e.albumId)||e.id&&e.id.startsWith(t);return a&&s}).sort((e,t)=>(e.trackNumber||0)-(t.trackNumber||0));if(r.length)for(let n=0;n<r.length;n++){let o=r[n];l+=`
                <div class="track-item d-flex justify-content-between align-items-center p-3 border-bottom" style="opacity:1!important;transform:none!important;">
                    <div class="track-info">
                        <span class="me-3 text-muted">${o.trackNumber||n+1}</span>
                        <strong style="color:#fff!important;">${Utils.esc(o.title)}</strong>
                    </div>
                    <a href="${UI.getReleaseUrl(o)}" class="btn btn-sm btn-outline-primary">Listen</a>
                </div>`}DOM.html(DOM.get("tracklist-container"),l||'<p class="text-muted p-3">Tracklist pending update.</p>'),document.title=`${s.title} | ${CONFIG.artist.display}`,this.fetchLyrics(t)},async fetchLyrics(e){try{let t=await fetch(CONFIG.api.lyrics),a=await t.json(),s=DOM.get("single-description-content");s&&a[e]&&DOM.html(s,`<p style="white-space: pre-line;">${Utils.esc(a[e])}</p>`)}catch(i){}},async faq(){let e=[{videoId:"video-1",title:"How to get an Official Artist Channel on YouTube with DistroKid",thumbnail:"https://i.ytimg.com/vi/8dCv09a0tlM/maxresdefault.jpg",watchUrl:"https://youtube.com/watch?v=8dCv09a0tlM",questions:[["How do I do it?",'Press the "Watch Full Video" button to get a full comprehensive guide. In short, distribute your music via DistroKid, claim your channel through the <a href="https://distrokid.com/YouTubeOfficialArtistChannels/?ref=globalmenu" target="_blank" rel="noopener noreferrer">YouTube Official Artist Channels</a> section, and follow the steps on screen.<br><br> Visit <a href="https://support.google.com/youtube/answer/7336634?hl=en-GB#zippy=%2Cprogramme-criteria-and-eligibility" target="_blank" rel="noopener noreferrer">Google\'s official guide article</a> to make sure you meet the current criteria. Here is DistroKid\'s own <a href="https://support.distrokid.com/hc/en-us/articles/360036924633-Claiming-an-Official-Artist-Channel-on-YouTube" target="_blank" rel="noopener noreferrer">guide</a> <br><br> This guide is only for DistroKid, you can do it with other distributors as well but the process may differ.'],["How long does it take?",'It varies! It can take up to 6 weeks after you initially claim your channel. Be patient and keep an eye on your email for updates from YouTube. If it has not been completed after 6 weeks, consider reaching out to <a href="https://support.distrokid.com/hc/en-us" target="_blank" rel="noopener noreferrer">DistroKid support</a> for assistance. Or, visit <a href="/contact">my Contact page</a> to contact me and I will try to help.'],["Do I have to pay?",'You do have to pay for DistroKid\'s distribution service, but claiming the Official Artist Channel through DistroKid is free of charge. Just make sure you have an active subscription with DistroKid to distribute your music. <br><br> Check DistroKid\'s <a href="https://distrokid.com/pricing/" target="_blank" rel="noopener noreferrer">pricing page</a> for more details on their plans.']]}],t='<div class="accordion accordion-flush" id="faqAccordion">';for(let a=0;a<e.length;a++){let s=e[a],i="";for(let l=0;l<s.questions.length;l++){let r=s.questions[l];i+=`
                <div class="faq-qa-item mb-2">
                    <button class="faq-question-btn w-100 text-start" data-bs-toggle="collapse" data-bs-target="#ans-${s.videoId}-${l}">${r[0]}</button>
                    <div id="ans-${s.videoId}-${l}" class="collapse mt-2 text-muted">${r[1]}</div>
                </div>`}t+=`
            <div class="accordion-item faq-video-item bg-transparent border-0 mb-4 reveal">
                <button class="faq-video-card p-0 border-0 w-100" type="button" data-bs-toggle="collapse" data-bs-target="#vid-${s.videoId}">
                    <div class="row g-0 align-items-center">
                        <div class="col-5 col-md-4"><div class="faq-thumbnail-wrapper"><img src="${s.thumbnail}" class="faq-thumbnail"><div class="play-overlay"><i class="fas fa-play-circle"></i></div></div></div>
                        <div class="col-7 col-md-8 p-3 p-md-4"><h3 class="faq-title fw-bold mb-0">${Utils.esc(s.title)}</h3></div>
                    </div>
                </button>
                <div id="vid-${s.videoId}" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                    <div class="faq-content-wrapper p-3">${i}
                        <a href="${s.watchUrl}" target="_blank" class="btn btn-primary mt-3">Watch Full Video</a>
                    </div>
                </div>
            </div>`}DOM.html(DOM.get("faq-container"),t+"</div>"),DOM.get("faq-loading")?.classList.add("d-none"),Shell.initReveal()},async about(){let e=DOM.qsa("img[data-src]");for(let t=0,a=e.length;t<a;t++)e[t].src=e[t].dataset.src,e[t].removeAttribute("data-src");Shell.initReveal()}};(()=>{let e=()=>{window.requestAnimationFrame(()=>{Shell.init().catch(e=>{console.error("RTK Critical Failure:",e);let t=DOM.get("loading-state")||DOM.get("latest-release-loading");t&&t.classList.add("d-none")})})};"loading"===document.readyState?document.addEventListener("DOMContentLoaded",e,{once:!0}):e()})();