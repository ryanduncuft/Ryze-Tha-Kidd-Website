// js/app.js
/**
 * Main application logic for the homepage.
 * Handles dynamic content loading for the latest release and YouTube video.
 */
(async () => {
    // --- Configuration Constants ---
    // Using an object for API URLs makes them easy to manage and update.
    const API_URLS = {
        DISCOGRAPHY: 'https://gist.githubusercontent.com/ryanduncuft/39ade5f46c7b0a11618f5f016606ecc2/raw/rtk_data.json',
        VIDEO: 'https://gist.githubusercontent.com/ryanduncuft/d67c1848410f5d6a77d914794848bc7d/raw/video_link.json'
    };

    /**
     * Renders the latest release section with dynamic data.
     * @param {object} latestRelease - The data for the latest release.
     * @returns {void}
     */
    const renderLatestRelease = (latestRelease) => {
        const container = document.getElementById('latest-release-container');
        if (!container) {
            console.error('Container element with id "latest-release-container" not found.');
            return;
        }

        // Use a more robust way to clear the container before adding content.
        container.innerHTML = '';
        
        const releaseContent = document.createElement('div');
        releaseContent.className = "flex flex-wrap md:flex-nowrap items-center";
        
        releaseContent.innerHTML = `
            <div class="w-full md:w-1/2 mb-8 md:mb-0 md:pr-12">
                <img class="rounded-2xl shadow-lg w-full" src="${latestRelease.image}" alt="${latestRelease.title} cover">
            </div>
            <div class="w-full md:w-1/2 text-center md:text-left">
                <h2 class="text-4xl font-bold mb-4 text-violet-500">Latest Release: ${latestRelease.title}</h2>
                <p class="text-lg text-gray-400 mb-6">${latestRelease.displayDate}</p>
                <div class="flex flex-col sm:flex-row justify-center md:justify-start gap-4">
                    <a href="${latestRelease.listenLink}" target="_blank" class="bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 px-6 rounded-full transition-colors duration-300">
                        <i class="fas fa-play mr-2"></i> Listen Now
                    </a>
                </div>
            </div>
        `;
        container.appendChild(releaseContent);
    };

    /**
     * Fetches and loads the latest release data from the Gist.
     * @returns {Promise<void>}
     */
    const loadLatestRelease = async () => {
        const container = document.getElementById('latest-release-container');
        const loadingState = document.getElementById('latest-release-loading');
        const errorState = document.getElementById('latest-release-error');

        // Check if all necessary elements exist before proceeding.
        if (!container || !loadingState || !errorState) {
            console.error('One or more required elements for latest release loading are missing.');
            return;
        }

        // Initially show the loading state.
        loadingState.classList.remove('hidden');
        errorState.classList.add('hidden');
        container.classList.add('hidden');

        try {
            const response = await fetch(API_URLS.DISCOGRAPHY);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const allReleases = await response.json();
            
            if (allReleases && Array.isArray(allReleases) && allReleases.length > 0) {
                // Sort releases by date in descending order (newest first).
                // Use a more robust date parsing method to ensure consistency.
                allReleases.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
                
                const latestRelease = allReleases[0];
                renderLatestRelease(latestRelease);
                
                // Show the container and hide the loading state.
                container.classList.remove('hidden');
                loadingState.classList.add('hidden');

            } else {
                container.innerHTML = '<p class="text-center w-full text-gray-400">No releases found.</p>';
                container.classList.remove('hidden');
                loadingState.classList.add('hidden');
            }
        } catch (error) {
            console.error('Failed to load latest release:', error);
            errorState.classList.remove('hidden');
            loadingState.classList.add('hidden');
        }
    };
    
    /**
     * Fetches and loads the latest YouTube video.
     * @returns {Promise<void>}
     */
    const loadYouTubeVideo = async () => {
        const videoContainer = document.getElementById('youtube-video-container');
        if (!videoContainer) {
            console.error('Container element with id "youtube-video-container" not found.');
            return;
        }
        
        // Initial loading state for the video container (optional but good practice)
        videoContainer.innerHTML = '<p class="text-center text-gray-400">Loading video...</p>';

        try {
            const response = await fetch(API_URLS.VIDEO);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const videoUrl = data.youtube_embed_url;

            if (videoUrl) {
                const iframe = document.createElement('iframe');
                Object.assign(iframe, {
                    src: videoUrl,
                    frameborder: '0',
                    allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
                    allowfullscreen: '',
                    loading: 'lazy', // Good practice for lazy loading
                    className: 'w-full h-full' // Add utility classes for styling
                });
                
                videoContainer.innerHTML = '';
                videoContainer.appendChild(iframe);
            } else {
                console.error('Video URL not found in the JSON data.');
                videoContainer.innerHTML = '<p class="text-center text-gray-400">Sorry, the video could not be loaded.</p>';
            }
        } catch (error) {
            console.error('Could not load the YouTube video:', error);
            videoContainer.innerHTML = '<p class="text-center text-gray-400">Sorry, the video could not be loaded.</p>';
        }
    };

    /**
     * Initializes all dynamic content loaders on page load.
     * @returns {void}
     */
    const initializeApp = () => {
        loadLatestRelease();
        loadYouTubeVideo();
    };

    // Initialize the app when the DOM is fully loaded.
    document.addEventListener('DOMContentLoaded', initializeApp);
})();