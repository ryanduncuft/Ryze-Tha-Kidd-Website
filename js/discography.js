/**
 * js/discography.js
 * Handles fetching, filtering, and rendering the full discography from a remote JSON source.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Constants and DOM Elements ---
    
    // Define the Gist URL for discography data.
    const GIST_URL = 'https://gist.githubusercontent.com/ryanduncuft/39ade5f46c7b0a11618f5f016606ecc2/raw/rtk_data.json';

    // List of types you want to display on the discography page.
    const PRIMARY_RELEASE_TYPES = ['album', 'ep', 'single', 'collab'];

    // Use querySelector for all elements and ensure they exist where needed.
    const releasesGrid = document.getElementById('releases-grid');
    const filterContainer = document.getElementById('filter-container'); 
    const filterButtons = document.querySelectorAll('.filter-btn'); 
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const noReleasesMessage = document.getElementById('no-releases-message');
    const sortDropdown = document.getElementById('sort-by');
    
    // Global state
    let allReleases = [];
    let activeCategory = 'all'; 
    let activeSort = 'date-desc';

    // --- Helper Functions ---

    const formatTypeTag = (type) => {
        // Return an empty string if type is null, undefined, or empty
        return type ? type.toUpperCase() : ''; 
    };

    /**
     * Converts a standard date string (YYYY-MM-DD) to a human-readable format (e.g., 25th July 2025).
     * Uses a more robust method to handle date formatting and ensure validity.
     * @param {string} dateString - The date string from the JSON.
     * @returns {string} The formatted date string or 'TBD' if invalid.
     */
    const formatDisplayDate = (dateString) => {
        if (!dateString) return 'TBD';

        const date = new Date(dateString);
        
        // Check for 'Invalid Date' object 
        if (isNaN(date)) {
             // Log the bad date for easier debugging of the JSON source
            console.warn(`Invalid date string encountered: ${dateString}`);
            return 'TBD';
        }

        const options = { year: 'numeric', month: 'long', day: 'numeric' };

        // Use 'en-GB' locale for built-in day-month-year order if possible
        // Fallback to manual manipulation for widest compatibility
        try {
            // Attempt to get the British format directly
            let formattedDate = date.toLocaleDateString('en-GB', options); 
            let day = date.getDate();
            
            // Re-apply the suffix logic since en-GB locale doesn't include it
            const suffix = day % 10 === 1 && day % 100 !== 11 
                ? 'st' 
                : day % 10 === 2 && day % 100 !== 12 
                ? 'nd' 
                : day % 10 === 3 && day % 100 !== 13 
                ? 'rd' 
                : 'th';

            // Find the day number (which is first in en-GB) and replace it with the suffixed version
            return formattedDate.replace(day, day + suffix);
            
        } catch (e) {
            // Fallback to the original, more manual method if locale fails
            return date.toLocaleDateString('en-US', options); 
        }
    };

    const updateStateUI = (state) => {
        // Use a consistent, simple check for element existence before modifying
        releasesGrid?.classList.toggle('hidden', state === 'loading' || state === 'error');
        loadingState?.classList.toggle('hidden', state !== 'loading');
        errorState?.classList.toggle('hidden', state !== 'error');
        noReleasesMessage?.classList.toggle('hidden', state !== 'no_releases');
    };
    
    /**
     * Sorts an array of releases based on a specific criteria.
     * @param {Array} releases - The array of release objects to sort.
     * @param {string} sortValue - The sorting method (e.g., 'date-desc', 'title-asc').
     * @returns {Array} The sorted array of releases.
     */
    const sortReleases = (releases, sortValue) => {
        // Clone the array using structuredClone for deep copy reliability, 
        // though spread operator is fine here since it's an array of primitives/simple objects
        let sorted = [...releases]; 
        
        switch (sortValue) {
            case 'title-asc':
                // Handles missing titles gracefully by sorting empty strings first
                sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
                break;
            case 'artist-asc':
                sorted.sort((a, b) => (a.artist || '').localeCompare(b.artist || ''));
                break;
            case 'date-asc':
                // Date comparison (Oldest first)
                sorted.sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));
                break;
            case 'date-desc':
            default:
                // Date comparison (Newest first) - Default
                sorted.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
                break;
        }
        return sorted;
    };


    // --- Core Functions ---

    /**
     * Renders release cards to the grid after applying the current sort.
     * @param {Array} releases - The array of release objects to display.
     */
    const renderReleases = (releases) => {
        if (!releasesGrid) {
            console.error('Releases grid element not found. Cannot render.');
            return;
        }

        releasesGrid.innerHTML = ''; // Clear the grid

        if (releases.length === 0) {
            updateStateUI('no_releases');
            return;
        }

        updateStateUI('success'); // Hide all special states

        // Apply the current sort before rendering
        const finalReleases = sortReleases(releases, activeSort); 

        // Use map/join for slightly cleaner DOM manipulation (avoids repeated appendChild calls)
        const html = finalReleases.map(release => {
            // Destructure the raw date and calculate the display date
            const { title, artist, image, listenLink, releaseDate, type } = release;
            const displayDate = formatDisplayDate(releaseDate);

            // Added comments and cleaned template literal for clarity
            return `
                <div class="release-card group" data-category="${type}">
                    <a 
                        href="${listenLink}" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        aria-label="Listen to ${title} on streaming platforms" 
                        class="block"
                    >
                        <span class="release-type-tag">${formatTypeTag(type)}</span>

                        <div class="relative w-full aspect-square overflow-hidden rounded-t-xl">
                            <img 
                                src="${image}" 
                                alt="${title} cover" 
                                loading="lazy"
                                class="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-[1.03] rounded-t-xl"
                            >
                            <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <i class="fas fa-play-circle fa-3x text-white/90"></i>
                            </div>
                        </div>
                    </a>

                    <div class="p-4 text-center">
                        <h3 class="release-title truncate" title="${title}">${title}</h3>
                        <p class="text-xs text-gray-400 mb-2 truncate">${artist}</p> 
                        <p class="text-xs text-gray-500 font-medium">${displayDate}</p>
                    </div>
                </div>
            `;
        }).join(''); // Join the array of HTML strings into one big string

        releasesGrid.innerHTML = html; // Set innerHTML once
    };
    
    /**
     * Applies the current filter and then triggers the rendering/sorting process.
     */
    const filterAndRender = () => {
        // 1. Filter the releases based on the active category
        const filteredReleases = activeCategory === 'all'
            ? allReleases
            : allReleases.filter(release => release.type === activeCategory);
        
        // 2. Render the filtered and sorted list
        renderReleases(filteredReleases);
    }


    /**
     * Handles the click event for filter buttons using event delegation.
     */
    const handleFilterClick = (e) => {
        const target = e.target.closest('.filter-btn');
        if (!target) return;
        
        const category = target.dataset.category;
        
        // Only re-render if the category actually changed
        if (activeCategory === category) return; 

        activeCategory = category; // Update global state

        // Update active state of buttons
        filterButtons.forEach(btn => {
            const isActive = btn.dataset.category === category;
            btn.classList.toggle('filter-btn-active', isActive);
            // Replaced 'filter-btn-inactive' toggle with simpler logic if using a single class for 'active'
            // Keep original logic if Tailwind/CSS relies on both classes being present/absent
            if (btn.classList.contains('filter-btn-inactive')) {
                 btn.classList.toggle('filter-btn-inactive', !isActive);
            }
        });
        
        filterAndRender(); // Re-filter and re-render
    };
    
    /**
     * Handles the change event for the sort dropdown.
     */
    const handleSortChange = (e) => {
        activeSort = e.target.value; // Update global state
        filterAndRender(); // Re-render the currently filtered list with the new sort
    };


    /**
     * Fetches the discography data from the Gist and initializes the page.
     */
    const fetchDiscography = async () => {
        // Essential check: If the grid element is missing, stop.
        if (!releasesGrid) {
            console.error('Initialization failed: Target grid element missing.');
            return;
        }

        try {
            updateStateUI('loading');

            const response = await fetch(GIST_URL);
            if (!response.ok) {
                // Better error message includes the status code
                throw new Error(`Failed to fetch discography data. HTTP status: ${response.status}`);
            }
            const data = await response.json();
            
            if (!Array.isArray(data)) {
                throw new Error('Fetched data is not a valid array.');
            }

            // Filter: Keep only primary release types
            allReleases = data.filter(release => 
                PRIMARY_RELEASE_TYPES.includes(release.type)
            );
            
            // Initial render
            filterAndRender(); 

        } catch (error) {
            console.error('Critical error during discography fetch:', error.message);
            updateStateUI('error');
        }
    };

    // --- Event Listeners and Initialization ---

    // Set up event listeners only if the elements exist (using optional chaining)
    filterContainer?.addEventListener('click', handleFilterClick);
    sortDropdown?.addEventListener('change', handleSortChange);

    // Initial data fetch on page load
    fetchDiscography();
});