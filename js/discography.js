// js/discography.js
document.addEventListener('DOMContentLoaded', () => {
    // Define the Gist URL for your discography data.
    const GIST_URL = 'https://gist.githubusercontent.com/ryanduncuft/39ade5f46c7b0a11618f5f016606ecc2/raw/rtk_data.json';

    // Get DOM elements. Using 'const' is a good practice for elements that won't be reassigned.
    const releasesGrid = document.getElementById('releases-grid');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const noReleasesMessage = document.getElementById('no-releases-message');

    let allReleases = [];

    // --- Core Functions ---

    /**
     * Renders release cards to the grid based on the provided array.
     * @param {Array} releases - The array of release objects to display.
     */
    const renderReleases = (releases) => {
        releasesGrid.innerHTML = ''; // Clear the grid

        if (releases.length === 0) {
            noReleasesMessage.classList.remove('hidden');
            return;
        }

        noReleasesMessage.classList.add('hidden');

        releases.forEach(release => {
            // Use object destructuring for cleaner access to properties
            const { title, artist, image, listenLink, displayDate, type } = release;

            const releaseCard = document.createElement('div');
            releaseCard.className = 'release-card group';
            releaseCard.setAttribute('data-category', type);

            releaseCard.innerHTML = `
                <div class="relative w-full h-0 pb-[100%] overflow-hidden">
                    <img src="${image}" alt="${title} cover" class="absolute inset-0 w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-110">
                    <a href="${listenLink}" target="_blank" aria-label="Listen to ${title}" class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                        <i class="fas fa-play-circle fa-4x text-white/80 group-hover:text-white transition-colors duration-300"></i>
                    </a>
                </div>
                <div class="release-card-body">
                    <h3 class="release-title" title="${title}">${title}</h3>
                    <p class="release-artist" title="${artist}">${artist}</p>
                    <p class="release-date">${displayDate}</p>
                </div>
            `;
            releasesGrid.appendChild(releaseCard);
        });
    };

    /**
     * Handles the click event for filter buttons, filtering and displaying releases.
     * @param {Event} e - The click event object.
     */
    const handleFilterClick = (e) => {
        const category = e.target.dataset.category;

        // Update active state of buttons
        filterButtons.forEach(btn => {
            const isActive = btn.dataset.category === category;
            btn.classList.toggle('filter-btn-active', isActive);
            btn.classList.toggle('filter-btn-inactive', !isActive);
        });
        
        // Filter and display releases
        const filteredReleases = category === 'all'
            ? allReleases
            : allReleases.filter(release => release.type === category);

        renderReleases(filteredReleases);
    };

    /**
     * Fetches the discography data from the Gist.
     */
    const fetchDiscography = async () => {
        try {
            // Show loading state and hide others
            loadingState.classList.remove('hidden');
            releasesGrid.innerHTML = '';
            errorState.classList.add('hidden');
            noReleasesMessage.classList.add('hidden');

            const response = await fetch(GIST_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allReleases = await response.json();
            
            // Sort releases by date in descending order (newest first)
            allReleases.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));

            loadingState.classList.add('hidden');
            renderReleases(allReleases);

        } catch (error) {
            console.error('Failed to fetch discography:', error);
            loadingState.classList.add('hidden');
            errorState.classList.remove('hidden');
        }
    };

    // --- Event Listeners and Initialization ---

    // Add event listeners to filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', handleFilterClick);
    });

    // Initial data fetch on page load
    fetchDiscography();
});