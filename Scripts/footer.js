// Scripts/footer.js

// Import cache keys from data.js
import { CACHE_KEY, CACHE_TIMESTAMP_KEY, fetchReleasesData } from './data.js'; // Adjust path if data.js is not in the same directory

// --- Footer Loading Paths ---
const footerPathsToTry =
[
    '/footer.html',       // From the very top of the site
    './footer.html',      // In the same folder as the current page
    '../footer.html',     // One folder up
    '../../footer.html',  // Two folders up
    '../../../footer.html', // Three folders up
];

/**
 * Note: This function finds the 'current-year' element and updates it to the current year.
 */
function updateCurrentYear()
{
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan)
    {
        currentYearSpan.textContent = new Date().getFullYear();
    }
}

/**
 * Sets up the event listener for the Clear Cache button.
 * This button clears the data cache stored in localStorage.
 */
function setupCacheInvalidationButton() {
    // Select the element by its ID
    const clearCacheBtn = document.getElementById('clear-cache-btn');

    if (clearCacheBtn) {
        // Prevent default link behavior if it's an <a> tag
        clearCacheBtn.addEventListener('click', (event) => {
            event.preventDefault(); // Stop the link from jumping to #

            // Confirm with the user before clearing
            if (confirm("Are you sure you want to clear the local data cache? This will reload the page.")) {
                try {
                    // Use the imported cache keys to clear the specific data cache
                    localStorage.removeItem(CACHE_KEY);
                    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
                    console.log("%c[User Action] Local storage data cache cleared successfully.", "color: red; font-weight: bold;");

                    // Force a full page reload to ensure the new data is fetched
                    // and other potential browser-cached assets are re-evaluated.
                    window.location.reload(true);
                } catch (e) {
                    console.error("[User Action] Failed to clear local storage:", e);
                    alert("Failed to clear cache. Please try clearing your browser's cache manually or use Incognito mode.");
                }
            }
        });
    }
}

/**
 * Note: This function tries to load the footer from different paths until it succeeds.
 * After loading, it updates the year, sets dark mode, and initializes the cache invalidation button.
 */
async function loadFooter()
{
    for (const path of footerPathsToTry)
    {
        try
        {
            const response = await fetch(path);

            if (response.ok)
            {
                const footerHtml = await response.text();
                const footerDiv = document.getElementById("footer");
                if (footerDiv) {
                    footerDiv.innerHTML = footerHtml;
                } else {
                    console.error("Footer div with ID 'footer' not found in the document.");
                    return;
                }

                updateCurrentYear();

                if (typeof window.applyDarkModeClasses === 'function')
                {
                    window.applyDarkModeClasses();
                }

                setupCacheInvalidationButton(); // Setup the clear cache button after footer is loaded
                return;
            }
        }

        catch (error)
        {
            console.warn(`Couldn't load footer from ${path}:`, error);
        }
    }

    console.error("Failed to load the footer from any of the specified paths.");
}

// When the entire page is loaded:
// 1. Load the footer HTML and set up its interactive elements.
// 2. Initiate the data fetching process from data.js.
document.addEventListener('DOMContentLoaded', async () => {
    // Load the footer first, as it contains the button.
    await loadFooter();

    // Then, fetch the data. This will either load from fresh cache or network.
    // The data.js module manages its own cache.
    await fetchReleasesData();
});