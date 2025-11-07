/**
 * js/discography.js
 * Handles fetching, filtering, and rendering the full discography from a remote JSON source.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Define the Gist URL for discography data.
    const GIST_URL = 'https://gist.githubusercontent.com/ryanduncuft/39ade5f46c7b0a11618f5f016606ecc2/raw/rtk_data.json';

    // List of types you want to display on the discography page.
    const PRIMARY_RELEASE_TYPES = ['album', 'ep', 'single', 'collab'];

    // Get DOM elements.
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
    let activeSort = 'date-desc'; // Matches the default selected option in HTML

    // --- Helper Functions ---

    const formatTypeTag = (type) => {
        if (!type) return '';
        return type.toUpperCase(); 
    };

    const updateStateUI = (state) => {
        loadingState?.classList.toggle('hidden', state !== 'loading');
        errorState?.classList.toggle('hidden', state !== 'error');
        noReleasesMessage?.classList.toggle('hidden', state !== 'no_releases');
        releasesGrid?.classList.toggle('hidden', state === 'loading' || state === 'error');
    };
    
    /**
     * Sorts an array of releases based on a specific criteria.
     * @param {Array} releases - The array of release objects to sort.
     * @param {string} sortValue - The sorting method (e.g., 'date-desc', 'title-asc').
     * @returns {Array} The sorted array of releases.
     */
    const sortReleases = (releases, sortValue) => {
        // Clone the array to sort non-destructively
        let sorted = [...releases]; 
        
        switch (sortValue) {
            case 'title-asc':
                // Alphabetical by title
                sorted.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'artist-asc':
                // Alphabetical by artist
                sorted.sort((a, b) => a.artist.localeCompare(b.artist));
                break;
            case 'date-asc':
                // Date: Oldest first
                sorted.sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));
                break;
            case 'date-desc':
            default:
                // Date: Newest first
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
            console.error('Releases grid element not found.');
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

        finalReleases.forEach(release => {
            const { title, artist, image, listenLink, displayDate, type } = release;

            const releaseCard = document.createElement('div');
            releaseCard.className = 'release-card group'; 
            releaseCard.setAttribute('data-category', type);

            releaseCard.innerHTML = `
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
            `;
            releasesGrid.appendChild(releaseCard);
        });
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
     * Handles the click event for filter buttons.
     */
    const handleFilterClick = (e) => {
        const target = e.target.closest('.filter-btn');
        if (!target) return;
        
        const category = target.dataset.category;
        activeCategory = category; // Update global state

        // Update active state of buttons
        filterButtons.forEach(btn => {
            const isActive = btn.dataset.category === category;
            btn.classList.toggle('filter-btn-active', isActive);
            btn.classList.toggle('filter-btn-inactive', !isActive);
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
        try {
            updateStateUI('loading');

            const response = await fetch(GIST_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            if (!Array.isArray(data)) {
                 throw new Error('Fetched data is not an array.');
            }

            // Filter: Keep only primary release types
            allReleases = data.filter(release => 
                PRIMARY_RELEASE_TYPES.includes(release.type)
            );
            
            // Initial render
            filterAndRender(); 

        } catch (error) {
            console.error('Failed to fetch discography:', error);
            updateStateUI('error');
        }
    };

    // --- Event Listeners and Initialization ---

    // Filter button event delegation
    if (filterContainer) {
        filterContainer.addEventListener('click', handleFilterClick);
    } else {
        console.error('Filter container not found.');
    }
    
    // Sort dropdown change listener
    if (sortDropdown) {
        sortDropdown.addEventListener('change', handleSortChange);
    } else {
        console.error('Sort dropdown not found.');
    }

    // Initial data fetch on page load
    fetchDiscography();
});