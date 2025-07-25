// data.js
// This file manages getting and storing our music release data.

/**
 * @typedef {Object} TrackMetadata
 * @property {string} title
 * @property {string} link
 */

/**
 * @typedef {Object} AlbumCredits
 * @property {string[]} artists
 * @property {string[]} producers
 */

/**
 * @typedef {Object} DiscographyItem
 * @property {"album"|"album-track"|"single"|"ep"|"collab"} type
 * @property {string} title
 * @property {string} artist
 * @property {string} releaseDate
 * @property {string} displayDate
 * @property {string} image
 * @property {string} description
 * @property {string} listenLink
 * @property {string} pageLink
 * @property {string} [id] // Added id here as it was missing from the type definition
 * @property {string} [genre]
 * @property {string} [duration]
 * @property {string} [writer]
 * @property {string} [producer]
 * @property {string} [lyrics]
 * @property {string} [descriptionHtml]
 * @property {TrackMetadata[]} [tracks]
 * @property {AlbumCredits} [credits]
 */

export let releasesData = []; // This will hold all our music data.

// --- Settings for Data Fetching ---
// IMPORTANT: This is the direct link to the raw JSON data on my GitHub Gist.
const GIST_RAW_URL = 'https://gist.githubusercontent.com/ryanduncuft/39ade5f46c7b0a11618f5f016606ecc2/raw/rtk_data.json';

// Export these constants so they can be identified, though footer.js no longer directly uses them for clearing
export const CACHE_KEY = 'discographyDataCache';
export const CACHE_TIMESTAMP_KEY = 'discographyDataTimestamp';

// How long the data stays in local storage before we check for updates.
// 2 days in seconds: 2 days * 24 hours/day * 60 minutes/hour * 60 seconds/minute = 172800 seconds
const CACHE_DURATION_SECONDS = 172800;
const CACHE_DURATION_MS = CACHE_DURATION_SECONDS * 1000;

/**
 * Fetches music release data, prioritizing a fresh local storage cache.
 * Falls back to fetching from GitHub Gist if cache is missing, expired, or invalid.
 * This function only concerns itself with the discography cache.
 * @returns {Promise<DiscographyItem[]>} A promise that resolves with the releases data.
 */
export async function fetchReleasesData() {
    const now = Date.now();
    const cachedDataString = localStorage.getItem(CACHE_KEY);
    const cachedTimestampString = localStorage.getItem(CACHE_TIMESTAMP_KEY);

    let shouldFetchNewData = true; // Assume we need to fetch new data by default

    if (cachedDataString && cachedTimestampString) {
        try {
            const cachedTimestamp = parseInt(cachedTimestampString, 10);
            const timeElapsed = now - cachedTimestamp;

            console.log(`[Cache Check] Time since last cache: ${timeElapsed}ms (Max valid: ${CACHE_DURATION_MS}ms)`);

            if (timeElapsed < CACHE_DURATION_MS) {
                const parsedData = JSON.parse(cachedDataString);
                if (Array.isArray(parsedData) && parsedData.length > 0) {
                    releasesData = parsedData; // Use the cached data
                    shouldFetchNewData = false; // Cache is valid, no need to fetch
                    console.log("%c[Data Cache Status] ✅ Cache is fresh and valid. Loading from saved data.", "color: green; font-weight: bold;");
                } else {
                    console.warn("[Data Cache Status] ⚠️ Saved data is empty or malformed. Forcing new data fetch.");
                }
            } else {
                console.log("%c[Data Cache Status] ⌛ Saved data is old. Forcing new data fetch.", "color: orange; font-weight: bold;");
                // Explicitly remove expired cache to ensure a clean fetch
                localStorage.removeItem(CACHE_KEY);
                localStorage.removeItem(CACHE_TIMESTAMP_KEY);
                console.log("[Data Cache Status] Expired discography cache removed.");
            }
        } catch (parseError) {
            console.error("[Data Cache Status] ❌ Error parsing cached data. Forcing new data fetch:", parseError);
            // In case of parsing error, remove the problematic cache
            localStorage.removeItem(CACHE_KEY);
            localStorage.removeItem(CACHE_TIMESTAMP_KEY);
        }
    } else {
        console.log("[Data Cache Status] 🆕 No saved data found. Forcing new data fetch from network.");
    }

    if (shouldFetchNewData) {
        console.log("[Network Fetch] Attempting to retrieve data from:", GIST_RAW_URL);
        try {
            const response = await fetch(GIST_RAW_URL, { cache: "no-cache" }); // Add no-cache header for good measure

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! Status: ${response.status} - ${errorText.substring(0, 200)}...`);
            }

            const data = await response.json();
            releasesData = data;
            console.log("%c[Network Fetch] 🎉 Data successfully retrieved from Gist!", "color: blue; font-weight: bold;");

            // Save the newly fetched data to local storage
            try {
                localStorage.setItem(CACHE_KEY, JSON.stringify(data));
                localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
                console.log("%c[Data Cache Update] ✨ New data saved to local storage.", "color: purple;");
            } catch (storageError) {
                console.warn("[Data Cache Update] ⚠️ Failed to save data to local storage (quota exceeded or other error):", storageError);
            }
        } catch (error) {
            console.error("[Network Fetch] ❌ Error fetching data from Gist:", error);
            // Fallback: If network fails, try to use any existing, even if old, cached data
            if (cachedDataString) {
                try {
                    const parsedData = JSON.parse(cachedDataString);
                    if (Array.isArray(parsedData) && parsedData.length > 0) {
                        releasesData = parsedData;
                        console.warn("%c[Fallback] ⚠️ Network failed, falling back to potentially old cached data.", "color: red; font-weight: bold;");
                    } else {
                        releasesData = []; // Cache was invalid even if present
                        console.error("%c[Fallback] ❌ Network failed, and cached data was invalid/empty. No data loaded.", "color: red; font-weight: bold;");
                    }
                } catch (e) {
                    releasesData = []; // Cache was unparseable
                    console.error("%c[Fallback] ❌ Network failed, and cached data was unparseable. No data loaded.", "color: red; font-weight: bold;");
                }
            } else {
                releasesData = []; // No cache and network failed
                console.error("%c[Fallback] ❌ No network connection and no cached data. Cannot load releases.", "color: red; font-weight: bold;");
            }
        }
    }
    return releasesData; // Always return the current state of releasesData
}