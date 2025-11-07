/**
 * js/app.js
 * Main application logic for the homepage.
 * Handles dynamic content loading for the latest release and YouTube video.
 */

// Wrap everything in an immediately invoked async function (IIFE) to prevent global scope pollution.
(async () => {
    // --- Configuration Constants ---
    const API_URLS = {
        DISCOGRAPHY: 'https://gist.githubusercontent.com/ryanduncuft/39ade5f46c7b0a11618f5f016606ecc2/raw/rtk_data.json',
        VIDEO: 'https://gist.githubusercontent.com/ryanduncuft/d67c1848410f5d6a77d914794848bc7d/raw/video_link.json'
    };

    /**
     * Helper function to fetch JSON data from a URL.
     * @param {string} url - The API endpoint URL.
     * @returns {Promise<any | null>} - The parsed JSON data or null on failure.
     */
    const fetchData = async (url) => {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                // Throw an error with the status for better debugging
                throw new Error(`HTTP error! status: ${response.status} from ${url}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Failed to fetch data from ${url}:`, error);
            return null;
        }
    };

    /**
     * Renders the latest release section with dynamic data.
     * @param {object} latestRelease - The data for the latest release.
     */
    const renderLatestRelease = (latestRelease) => {
        const container = document.getElementById('latest-release-container');
        if (!container) {
            console.error('Container element with id "latest-release-container" not found.');
            return;
        }

        // Clear existing content and render the new structure using a template literal for clarity.
        container.innerHTML = `
            <div class="flex flex-wrap md:flex-nowrap items-center">
                <div class="w-full md:w-1/2 mb-8 md:mb-0 md:pr-12">
                    <img 
                        class="rounded-2xl shadow-lg w-full transition-all duration-500 hover:shadow-violet-500/50" 
                        src="${latestRelease.image}" 
                        alt="${latestRelease.title} cover"
                        loading="lazy"
                    >
                </div>
                <div class="w-full md:w-1/2 text-center md:text-left">
                    <h2 class="text-4xl font-bold mb-4 text-violet-400 neon-glow-text">Latest Drop: ${latestRelease.title}</h2>
                    <p class="text-lg text-gray-400 mb-6">${latestRelease.displayDate}</p>
                    <div class="flex flex-col sm:flex-row justify-center md:justify-start gap-4">
                        <a 
                            href="${latestRelease.listenLink}" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            class="bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-[1.03] shadow-lg shadow-violet-500/30"
                        >
                            <i class="fas fa-play mr-2"></i> Stream Now
                        </a>
                    </div>
                </div>
            </div>
        `;
    };

    /**
     * Fetches and loads the latest release data from the Gist.
     */
    const loadLatestRelease = async () => {
        const container = document.getElementById('latest-release-container');
        const loadingState = document.getElementById('latest-release-loading');
        const errorState = document.getElementById('latest-release-error');

        // Initial DOM check
        if (!container || !loadingState || !errorState) {
            console.warn('One or more required elements for latest release loading are missing. Skipping.');
            return;
        }

        // Setup loading state
        loadingState.classList.remove('hidden');
        errorState.classList.add('hidden');
        container.classList.add('hidden');

        const allReleases = await fetchData(API_URLS.DISCOGRAPHY);
        
        if (allReleases && Array.isArray(allReleases) && allReleases.length > 0) {
            try {
                // Sort releases by releaseDate in descending order (newest first).
                // Use the Date object directly for sorting comparison.
                allReleases.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
                
                const latestRelease = allReleases[0];
                renderLatestRelease(latestRelease);
                
                // Success: Show the container and hide the loading state.
                container.classList.remove('hidden');
                loadingState.classList.add('hidden');

            } catch (error) {
                console.error('Error processing latest release data:', error);
                errorState.classList.remove('hidden');
                loadingState.classList.add('hidden');
            }
        } else {
            // Handle case where data is empty or invalid
            container.innerHTML = '<p class="text-center w-full text-gray-400">No releases found.</p>';
            container.classList.remove('hidden');
            loadingState.classList.add('hidden');
        }
    };
    
    /**
     * Fetches and loads the latest YouTube video embed link.
     * (Reverted to original simple iframe implementation for compatibility)
     */
    const loadYouTubeVideo = async () => {
        const videoContainer = document.getElementById('youtube-video-container');
        if (!videoContainer) {
            console.warn('Container element with id "youtube-video-container" not found. Skipping.');
            return;
        }
        
        // Use a generic message while loading
        videoContainer.innerHTML = '<div class="text-center text-gray-400 p-8">Loading video...</div>';

        const data = await fetchData(API_URLS.VIDEO);
        
        if (data && data.youtube_embed_url) {
            const videoUrl = data.youtube_embed_url;

            const iframe = document.createElement('iframe');
            Object.assign(iframe, {
                src: videoUrl,
                frameborder: '0',
                allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
                allowfullscreen: true,
                loading: 'lazy', 
                // Using w-full h-full from the original request
                className: 'w-full h-full' 
            });
            
            videoContainer.innerHTML = ''; // Clear loading message
            videoContainer.appendChild(iframe);

        } else {
            // Handle error/no video case
            videoContainer.innerHTML = '<p class="text-center text-gray-400 p-8">Sorry, the video could not be loaded.</p>';
        }
    };

    /**
     * Initializes all dynamic content loaders on page load.
     */
    const initializeApp = () => {
        // Execute the main dynamic loaders
        loadLatestRelease();
        loadYouTubeVideo();
    };

    // Initialize the app when the DOM is fully loaded.
    document.addEventListener('DOMContentLoaded', initializeApp);
})();