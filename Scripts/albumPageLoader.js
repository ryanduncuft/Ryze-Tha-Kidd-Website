import { releasesData, fetchReleasesData } from './data.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Page loaded. Initializing albumPageLoader.js');

    // --- 1. Get Album ID from URL and Validate ---
    const urlParams = new URLSearchParams(window.location.search);
    const albumId = urlParams.get('id');

    if (!albumId) {
        console.error('Missing "id" query parameter in URL. Cannot load album data.');
        displayErrorMessage('Oops! No album ID provided in the URL.');
        hidePageElements();
        return;
    }

    // Basic sanitization/validation: Ensure albumId is alphanumeric (or matches your ID format)
    // This prevents potential injection if the ID were ever used in a more sensitive context directly from the URL.
    if (!/^[a-zA-Z0-9_-]+$/.test(albumId)) {
        console.error(`Invalid album ID format: ${albumId}. Must be alphanumeric.`);
        displayErrorMessage('Invalid album ID format. Please check the URL.');
        hidePageElements();
        return;
    }

    console.log(`Attempting to load album with ID: ${albumId}`);

    // --- 2. Fetch Latest Release Data ---
    try {
        await fetchReleasesData();
    } catch (error) {
        console.error('Failed to fetch release data:', error);
        displayErrorMessage('Failed to load album data. Please try again later.');
        hidePageElements();
        return;
    }

    // --- 3. Find Current Release ---
    const currentRelease = releasesData.find(
        release => release.id === albumId && ['album', 'ep'].includes(release.type)
    );

    // --- 4. Select DOM Elements (Cache for Efficiency) ---
    const selectors = {
        mainContentContainer: '.album-page-content .container',
        albumCoverImg: '.album-cover-tilt-effect img',
        listenNowBtn: '.listen-now-btn',
        albumTitleElem: '.album-title',
        albumArtistElem: '.album-artist',
        tracklistGrid: '.tracklist-grid',
        tracklistSection: '.tracklist-section',
        creditsDiv: '#album-credits-content',
        creditsSection: '.credits-section',
        albumVisuals: '.album-visuals',
        albumDetailsPanel: '.album-details-panel'
    };

    const elements = {};
    for (const key in selectors) {
        elements[key] = document.querySelector(selectors[key]);
    }

    // --- 5. Populate Page with Data or Display Not Found Message ---
    if (currentRelease) {
        updatePageContent(currentRelease, elements);
    } else {
        console.warn(`No album found for ID: ${albumId} or it's not an album/EP type.`);
        displayErrorMessage('Oops! This release could not be found or is not an album/EP.');
        hidePageElements(elements); // Pass elements to avoid re-querying
    }
});

// --- Helper Functions ---

/**
 * Displays an error message in the main content area.
 * @param {string} message - The error message to display.
 */
function displayErrorMessage(message) {
    const mainContentContainer = document.querySelector('.album-page-content .container');
    if (mainContentContainer) {
        // Using textContent for security if message was from untrusted source,
        // but for hardcoded messages, innerHTML is fine for basic styling.
        // For dynamic user-generated content, ALWAYS sanitize before innerHTML.
        mainContentContainer.innerHTML = `<p style="text-align: center; color: var(--text-color-dark); font-size: 1.5rem; padding: 50px;">${message}</p>`;
        // Adjust color for dark mode
        if (document.body.classList.contains('dark-mode')) {
            mainContentContainer.querySelector('p').style.color = 'var(--text-color-light)';
        }
    }
}

/**
 * Hides various elements on the page, typically when an album isn't found.
 * @param {object} [elements] - Optional, cached DOM elements to hide. If not provided, elements will be queried.
 */
function hidePageElements(elements = {}) {
    const { albumVisuals, albumDetailsPanel, albumCoverImg, listenNowBtn, albumTitleElem, albumArtistElem, tracklistSection, creditsSection } = elements;

    // Use optional chaining for robustness, and add 'hidden' class
    albumVisuals?.classList.add('hidden');
    albumDetailsPanel?.classList.add('hidden');

    // Also clear/hide content elements that might remain visible
    if (albumCoverImg) albumCoverImg.src = '';
    listenNowBtn?.classList.add('hidden');
    if (albumTitleElem) albumTitleElem.textContent = 'Album Not Found';
    if (albumArtistElem) albumArtistElem.textContent = '';
    tracklistSection?.classList.add('hidden');
    creditsSection?.classList.add('hidden');
}

/**
 * Updates the page's HTML head meta tags for SEO and social sharing.
 * @param {string} selector - CSS selector for the meta tag.
 * @param {string} content - The content to set for the meta tag.
 */
function updateMetaTag(selector, content) {
    const tag = document.querySelector(selector);
    if (tag) {
        // Ensure content is safely set, especially for user-generated descriptions/titles.
        // For data from a trusted source (`releasesData`), direct assignment is acceptable.
        tag.setAttribute('content', content);
    }
}

/**
 * Populates the page with the found album's data.
 * @param {object} release - The album release data object.
 * @param {object} elements - Cached DOM elements.
 */
function updatePageContent(release, elements) {
    const {
        albumCoverImg, listenNowBtn, albumTitleElem, albumArtistElem,
        tracklistGrid, tracklistSection, creditsDiv, creditsSection
    } = elements;

    // Set page title for browser tab and SEO
    document.title = `${release.title} | ${release.artist}`;

    // Update Meta Tags
    const safeDescription = release.description || `Explore ${release.title} by ${release.artist}.`;
    updateMetaTag('meta[name="description"]', safeDescription);
    updateMetaTag('meta[name="keywords"]', `Ryze Tha Kidd, ${release.type}, ${release.title}, music, ${release.artist}, ${release.credits?.artists?.join(', ') || ''}, ${release.credits?.producers?.join(', ') || ''}`);

    const fullImagePath = release.image; // Assume full path is provided from data.js
    updateMetaTag('meta[property="og:title"]', release.title);
    updateMetaTag('meta[property="og:description"]', safeDescription);
    updateMetaTag('meta[property="og:url"]', window.location.href);
    updateMetaTag('meta[property="og:image"]', fullImagePath);
    updateMetaTag('meta[name="twitter:title"]', release.title);
    updateMetaTag('meta[name="twitter:description"]', safeDescription);
    updateMetaTag('meta[name="twitter:image"]', fullImagePath);

    // Update album cover
    if (albumCoverImg) {
        albumCoverImg.src = release.image;
        albumCoverImg.alt = `${release.title} cover art`;
    }

    // Update album title and artist
    if (albumTitleElem) {
        // Use textContent to prevent XSS if release.title could ever come from untrusted source
        albumTitleElem.textContent = release.title;
    } else {
        console.warn('Album title element not found.');
    }

    if (albumArtistElem) {
        albumArtistElem.textContent = release.artist;
    } else {
        console.warn('Album artist element not found.');
    }

    // Update "Listen Now" button
    if (listenNowBtn) {
        if (release.listenLink) {
            // Ensure listenLink is a valid URL to prevent 'javascript:' injection
            try {
                new URL(release.listenLink); // Attempt to construct URL
                listenNowBtn.href = release.listenLink;
                listenNowBtn.classList.remove('hidden');
            } catch (e) {
                console.warn('Invalid listenLink URL:', release.listenLink, e);
                listenNowBtn.classList.add('hidden');
            }
        } else {
            listenNowBtn.classList.add('hidden'); // hide if no link
        }
    }

    // Update tracklist
    if (tracklistGrid && tracklistSection && release.tracks && release.tracks.length > 0) {
        tracklistGrid.innerHTML = ''; // Clear existing buttons
        release.tracks.forEach(track => {
            tracklistGrid.appendChild(createTrackButton(track));
        });
        tracklistSection.classList.remove('hidden'); // Show tracklist
    } else {
        tracklistSection?.classList.add('hidden'); // Hide if no tracks or elements missing
    }

    // Update credits
    if (creditsDiv && creditsSection && release.credits) {
        const artistsHtml = (release.credits.artists && release.credits.artists.length > 0) ?
            `<p><strong>Artist${release.credits.artists.length > 1 ? 's' : ''}:</strong> ${release.credits.artists.map(escapeHtml).join(', ')}</p>` : '';

        const producersHtml = (release.credits.producers && release.credits.producers.length > 0) ?
            `<p><strong>Producer${release.credits.producers.length > 1 ? 's' : ''}:</strong> ${release.credits.producers.map(escapeHtml).join(', ')}</p>` : '';

        const releaseDateHtml = release.displayDate ?
            `<p><strong>Release Date:</strong> ${escapeHtml(release.displayDate)}</p>` : '';

        // Only show credits if there's artists, producers, or a release date
        if (artistsHtml || producersHtml || releaseDateHtml) {
            // IMPORTANT: If `release.credits` or `release.displayDate` ever came from user input or an untrusted API,
            // you MUST sanitize this HTML before injecting with innerHTML to prevent XSS.
            // Example: DOMPurify library (highly recommended for dynamic HTML)
            creditsDiv.innerHTML = `${artistsHtml}${producersHtml}${releaseDateHtml}`;
            creditsSection.classList.remove('hidden'); // Show credits section
        } else {
            creditsSection.classList.add('hidden'); // Hide if no meaningful credits
        }
    } else {
        creditsSection?.classList.add('hidden'); // Hide if no credits data or elements missing
    }
}

/**
 * Creates a track button element.
 * @param {object} track - The track data object.
 * @returns {HTMLAnchorElement} The created track button element.
 */
function createTrackButton(track) {
    const trackButton = document.createElement('a');
    // Security: Ensure track.id is suitable for a URL. If it's a raw string from untrusted source, encode it.
    // Assuming track.id from `data.js` is safe for URL use.
    trackButton.href = `single.html?id=${encodeURIComponent(track.id)}`; // Use encodeURIComponent for safety in URLs
    trackButton.classList.add('track-button');
    // Use textContent for displaying track title to prevent XSS.
    trackButton.textContent = track.title;
    return trackButton;
}

/**
 * Basic HTML escaping function to prevent XSS for text inserted into HTML.
 * Use a robust library like DOMPurify for complex HTML sanitization.
 * @param {string} str - The string to escape.
 * @returns {string} The escaped string.
 */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}