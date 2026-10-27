# Ryze Tha Kidd Official Platform

[![Status](https://img.shields.io/badge/Status-Live-brightgreen)](https://ryzethakidd.com)
[![Version](https://img.shields.io/badge/Version-3.4.1-blue)](https://github.com/ryanduncuft/Ryze-Tha-Kidd-Website/releases/tag/v3.4.1)

The official source code for the **Ryze Tha Kidd** ecosystem. This platform serves as a centralized hub for music releases, project archives, and artist updates. Engineered for high performance, accessibility, and a modern cinematic aesthetic.

---

## 🚀 Tech Stack

Designed with a focus on lightweight architecture and maintainability:

*   **Frontend:** HTML5, CSS3, ES6+ JavaScript.
*   **Framework:** [Bootstrap 5](https://getbootstrap.com/).
*   **Data Architecture:** JSON-driven dynamic rendering for automated discography management.
*   **Infrastructure:** Version control via **Git**; continuous deployment via **Netlify**.

---

## 💎 Core Features

*   **Dynamic Discography:** A data-driven catalog featuring advanced filtering by release date, title, and artist.
*   **Cross-Platform Optimization:** Fully responsive UI/UX tailored for mobile, tablet, and desktop environments.
*   **User Personalization:** Integrated global theme engine supporting Light, Dark, and System-preferred modes.
*   **Store:** Public storefront allowing fans to purcase CD's, Vinyl's and merchandise.

---

## 🛠️ Getting Started

### Prerequisites
*   **Editor:** [Visual Studio Code](https://code.visualstudio.com/) recommended.
*   **Environment:** A local development server (e.g., VS Code "Live Server" extension).

### Installation
1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/ryanduncuft/Ryze-Tha-Kidd-Website.git](https://github.com/ryanduncuft/Ryze-Tha-Kidd-Website.git)
    ```
2.  **Navigate to the directory:**
    ```bash
    cd Ryze-Tha-Kidd-Website
    ```
3.  **Launch:** Open `index.html` via your local server.

## Shared frontend and store deployment

The artist sites load their shared shell from Cloudflare. Keep the HTML references pointed at
`https://cdn.ryzethakidd.com/shared/main.js`; do not change them to a local `main.js` path.

1. Update the shared asset origin with `../shared/main.js`, `../shared/site.css`, and `../shared/ui.html`,
   preserving the `/shared/` paths. Confirm the Cloudflare URL returns the updated files, then
   purge or refresh the corresponding cache if it serves an older version.
2. Deploy `ryzethakidd.com/store/config.js` to
   `https://cdn.ryzethakidd.com/ryzethakidd/store/config.js`. Ryze's store, album, and single
   pages load this configuration from Cloudflare for Stripe initialization, checkout, and
   optional store links.
3. Keep the Netlify routes in `netlify.toml` pointed to the existing `products` and
   `create-checkout-session` functions. The browser requests the public product endpoint and
   asks the checkout function to create a Checkout Session; Stripe's secret key must remain in
   the Netlify `STRIPE_SECRET_KEY` environment variable and must never be added to `config.js`.
   The publishable key is configured in `config.js`; hosted checkout sessions are still created
   by the server endpoint.
4. Verify Ryze's store listing, a product detail URL, and the checkout redirect. Confirm a
   LostGem page still loads the same shared Cloudflare assets with `window.ARTIST_ID = "lostgem"`
   and does not load Ryze's store configuration; its artist-specific configuration and data remain
   selected by the shared script using that artist ID. A future LostGem store can use a copy of
   `config.js` at `https://cdn.ryzethakidd.com/lostgem/store/config.js` with her own publishable key and endpoints.