/**
 * js/app.js
 * Main application logic for the homepage.
 * Optimized for performance: reduced DOM manipulation, efficient data handling, and lazy loading for media.
 */

// Wrap everything in an IIFE to prevent global scope pollution.
(async () => {
    // --- Configuration Constants ---
    const API_URLS = {
        DISCOGRAPHY: 'https://gist.githubusercontent.com/ryanduncuft/39ade5f46c7b0a11618f5f016606ecc2/raw/rtk_data.json',
        VIDEO: 'https://gist.githubusercontent.com/ryanduncuft/d67c1848410f5d6a77d914794848bc7d/raw/video_link.json'
    };

    /**
     * Helper function to fetch JSON data from a URL with caching headers.
     * @param {string} url - The API endpoint URL.
     * @returns {Promise<any | null>} - The parsed JSON data or null on failure.
     */
    const fetchData = async (url) => {
        try {
            // Use 'no-cache' for development, or a short-lived cache-control
            // In a production environment, you might consider 'force-cache' or a Service Worker.
            const response = await fetch(url, { cache: 'no-cache' }); 
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} from ${url}`);
            }
            return await response.json();
        } catch (error) {
            // Log a warning instead of an error for failed fetches to prevent
            // potential crash/misinterpretation in monitoring tools.
            console.warn(`Failed to fetch data from ${url}:`, error);
            return null;
        }
    };

    /**
     * Renders the latest release section with dynamic data.
     * Uses template literal rendering for clarity, as the content block is substantial.
     * @param {object} latestRelease - The data for the latest release.
     */
    const renderLatestRelease = (latestRelease) => {
        const container = document.getElementById('latest-release-container');
        if (!container) return console.error('Latest release container not found.');

        // Use innerHTML for one-time block insertion, which is acceptable here.
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
                    <p class="text-lg text-gray-400 mb-6">${latestRelease.dateString || latestRelease.displayDate}</p>
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
     * Fetches and loads the latest release data from the Gist, optimizing the sorting step.
     */
    const loadLatestRelease = async () => {
        const container = document.getElementById('latest-release-container');
        const loadingState = document.getElementById('latest-release-loading');
        const errorState = document.getElementById('latest-release-error');

        // Initial DOM check for early exit
        if (!container || !loadingState || !errorState) {
            return console.warn('Missing one or more required elements for latest release loading.');
        }

        // Setup loading state
        loadingState.classList.remove('hidden');
        errorState.classList.add('hidden');
        container.classList.add('hidden');

        const allReleases = await fetchData(API_URLS.DISCOGRAPHY);

        if (allReleases && Array.isArray(allReleases) && allReleases.length > 0) {
            try {
                // *** PERFORMANCE IMPROVEMENT: Sort only what's necessary, find the maximum date in a single pass. ***
                let latestRelease = allReleases.reduce((latest, current) => {
                    const latestDate = new Date(latest.releaseDate);
                    const currentDate = new Date(current.releaseDate);
                    return currentDate > latestDate ? current : latest;
                }, allReleases[0]); // Start comparison with the first element

                // Optional: Pre-format the date string for rendering
                latestRelease.dateString = new Date(latestRelease.releaseDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

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
     * *** PERFORMANCE IMPROVEMENT: Deferred/Lazy loading for YouTube video. ***
     * The video only loads the iframe when the user interacts with a placeholder
     * or when the container scrolls into view (using an IntersectionObserver, which
     * is best practice but more complex). Here, we use a click-to-load mechanism,
     * which is the simplest and most effective for a non-critical resource.
     */
    const loadYouTubeVideoPlaceholder = async () => {
        const videoContainer = document.getElementById('youtube-video-container');
        if (!videoContainer) return console.warn('YouTube video container not found.');
        
        const data = await fetchData(API_URLS.VIDEO);
        
        if (data && data.youtube_embed_url) {
            const videoUrl = data.youtube_embed_url;

            // Simple placeholder with a button to trigger the load
            videoContainer.innerHTML = `
                <div class="youtube-placeholder p-12 text-center bg-gray-900 rounded-xl shadow-2xl cursor-pointer hover:shadow-violet-500/50 transition-shadow duration-300">
                    <i class="fab fa-youtube text-red-500 text-6xl mb-4"></i>
                    <p class="text-xl text-white font-semibold">Click to Load Latest Video</p>
                    <p class="text-sm text-gray-400 mt-2">(Loads high-bandwidth content only upon interaction)</p>
                </div>
            `;
            
            // Add click listener to the placeholder
            videoContainer.querySelector('.youtube-placeholder').addEventListener('click', () => {
                loadYouTubeIframe(videoContainer, videoUrl);
            }, { once: true }); // Use { once: true } to automatically remove the listener after first click

        } else {
            // Handle error/no video case
            videoContainer.innerHTML = '<p class="text-center text-gray-400 p-8">Sorry, the video could not be loaded.</p>';
        }
    };

    /**
     * Creates and loads the YouTube iframe into the container.
     * @param {HTMLElement} container - The element to hold the iframe.
     * @param {string} videoUrl - The embed URL.
     */
    const loadYouTubeIframe = (container, videoUrl) => {
        // Clear placeholder/loading message
        container.innerHTML = ''; 

        const iframe = document.createElement('iframe');
        Object.assign(iframe, {
            src: videoUrl + '?autoplay=1', // Optional: Autoplay after user interaction
            frameborder: '0',
            allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
            allowfullscreen: true,
            // 'loading="lazy"' is not strictly needed here as we are loading it on-demand
            className: 'w-full h-full rounded-xl' 
        });

        container.appendChild(iframe);
        // Add a class to the container to ensure it maintains its aspect ratio
        container.classList.add('video-loaded'); 
    };

    /**
     * Initializes all dynamic content loaders on page load.
     */
    const initializeApp = () => {
        // Execute non-critical fetching/rendering in parallel
        Promise.all([
            loadLatestRelease(),
            loadYouTubeVideoPlaceholder() // Use the placeholder function instead of direct iframe load
        ]).catch(err => {
            console.error('An error occurred during application initialization:', err);
        });
    };

    // Use 'DOMContentLoaded' for execution.
    document.addEventListener('DOMContentLoaded', initializeApp);
})();