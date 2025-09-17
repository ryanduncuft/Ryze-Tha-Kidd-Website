// js/discography.js

document.addEventListener('DOMContentLoaded', () => {

    // Define the Gist URL for your discography data.
    const GIST_URL = 'https://gist.githubusercontent.com/ryanduncuft/39ade5f46c7b0a11618f5f016606ecc2/raw/rtk_data.json';

    // Get DOM elements
    const releasesGrid = document.getElementById('releases-grid');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const noReleasesMessage = document.getElementById('no-releases-message');

    let allReleases = [];

    // Function to fetch data from the Gist
    const fetchDiscography = async () => {
        try {
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
            displayReleases(allReleases);

        } catch (error) {
            console.error('Failed to fetch discography:', error);
            loadingState.classList.add('hidden');
            errorState.classList.remove('hidden');
        }
    };

    // Function to create and display release cards
    const displayReleases = (releases) => {
        releasesGrid.innerHTML = '';
        if (releases.length === 0) {
            noReleasesMessage.classList.remove('hidden');
            return;
        }
        noReleasesMessage.classList.add('hidden');

        releases.forEach(release => {
            const releaseCard = document.createElement('div');
            releaseCard.className = 'release-card';
            releaseCard.setAttribute('data-category', release.type);

            releaseCard.innerHTML = `
                <img src="${release.image}" alt="${release.title} cover" class="w-full h-auto object-cover aspect-square">
                <div class="release-card-body">
                    <h3 class="release-title" title="${release.title}">${release.title}</h3>
                    <p class="release-artist" title="${release.artist}">${release.artist}</p>
                    <p class="release-date">${release.displayDate}</p>
                    <div class="stream-links">
                        <a href="${release.listenLink}" target="_blank" aria-label="Listen to ${release.title}" class="stream-link">
                            <i class="fas fa-play-circle fa-2x"></i>
                        </a>
                    </div>
                </div>
            `;
            releasesGrid.appendChild(releaseCard);
        });
    };

    // Add event listeners to filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const category = e.target.dataset.category;

            // Update active state of buttons
            filterButtons.forEach(btn => {
                btn.classList.remove('filter-btn-active');
                btn.classList.add('filter-btn-inactive');
            });
            e.target.classList.remove('filter-btn-inactive');
            e.target.classList.add('filter-btn-active');
            
            // Filter and display releases
            if (category === 'all') {
                displayReleases(allReleases);
            } else {
                const filteredReleases = allReleases.filter(release => release.type === category);
                displayReleases(filteredReleases);
            }
        });
    });

    // Initial data fetch on page load
    fetchDiscography();
});