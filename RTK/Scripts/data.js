// This file manages getting and storing our music release data.

// My notes:
// - `TrackMetadata`: info for individual songs (title, link to page).
// - `AlbumCredits`: lists artists and producers for an album.
// - `DiscographyItem`: detailed info for any release (album, single, track).
//   Includes ID, type, title, artist, dates, image URL, description,
//   listen link, page link, and optional track-specific details or album tracks/credits.

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
 * @property {string} id
 * @property {"album"|"album-track"|"single"|"ep"|"collab"} type
 * @property {string} title
 * @property {string} artist
 * @property {string} releaseDate
 * @property {string} displayDate
 * @property {string} image
 * @property {string} description
 * @property {string} listenLink
 * @property {string} pageLink
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

const CACHE_KEY = 'discographyDataCache';
const CACHE_TIMESTAMP_KEY = 'discographyDataTimestamp';
// How long the data stays in local storage before we check for updates.
const CACHE_DURATION_SECONDS = 345600; //4 days in seconds
const CACHE_DURATION_MS = CACHE_DURATION_SECONDS * 1000;

// Note: This function gets the discography data.
// It first tries to load from local storage to be fast.
// If the local storage data is old or missing, it fetches new data from GitHub.
// Then it saves the new data to local storage for next time.
export async function fetchReleasesData()
{
    const now = Date.now();
    const cachedDataString = localStorage.getItem(CACHE_KEY);
    const cachedTimestampString = localStorage.getItem(CACHE_TIMESTAMP_KEY);

    // Try to load from our saved cache first
    if (cachedDataString && cachedTimestampString)
    {
        const cachedTimestamp = parseInt(cachedTimestampString, 10);
        const timeElapsed = now - cachedTimestamp;

        console.log(`[Cache Check] Time since last cache: ${timeElapsed}ms (Cache valid for: ${CACHE_DURATION_MS}ms)`);

        // Check if the cache is still fresh
        if (timeElapsed < CACHE_DURATION_MS)
        {
            try
            {
                const parsedData = JSON.parse(cachedDataString);
                // Make sure the data is actually there and valid
                if (Array.isArray(parsedData) && parsedData.length > 0)
                {
                    releasesData = parsedData; // Use the cached data
                    console.log("%c[Cache Status] ✅ Cache is fresh! Loading from saved data.", "color: green; font-weight: bold;");
                    return releasesData; // All good, use the cache
                }
                
                else
                {
                    console.warn("[Cache Status] ⚠️ Saved data is empty or broken. Getting new data.");
                }
            }
            
            catch (parseError)
            {
                console.error("[Cache Status] ❌ Couldn't read saved data. Getting new data:", parseError);
            }
        }
        
        else
        {
            console.log("%c[Cache Status] ⌛ Saved data is old. Getting new data.", "color: orange; font-weight: bold;");
        }
    }
    
    else
    {
        console.log("[Cache Status] 🆕 No saved data found. Getting data from the internet.");
    }

    // If we didn't use the cache, fetch from the internet
    try
    {
        console.log("[Network Fetch] Trying to get data from:", GIST_RAW_URL);
        const response = await fetch(GIST_RAW_URL);

        if (!response.ok)
        {
            const errorText = await response.text();
            throw new Error(`HTTP error! Status: ${response.status} - ${errorText.substring(0, 100)}...`);
        }

        const data = await response.json(); // Convert the response to JSON
        releasesData = data; // Put the new data into our main variable
        console.log("%c[Network Fetch] 🎉 Got data successfully from Gist!", "color: blue; font-weight: bold;");

        // Save the new data to local storage
        try
        {
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
            localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
            console.log("%c[Cache Update] ✨ New data saved for next time.", "color: purple;");
        } 
        
        catch (storageError)
        {
            console.warn("[Cache Update] ⚠️ Couldn't save data (maybe storage is full?):", storageError);
        }

        return releasesData;
    }
    
    catch (error)
    {
        console.error("[Network Fetch] ❌ Error getting data from Gist:", error);
        // If everything fails, return an empty list so nothing breaks
        return [];
    }
}