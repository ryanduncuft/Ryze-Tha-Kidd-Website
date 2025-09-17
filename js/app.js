// js/app.js
document.addEventListener('DOMContentLoaded', () => {
    // --- Dynamic YouTube Video Loader ---
    const loadYouTubeVideo = async () => {
        const videoContainer = document.getElementById('youtube-video-container');
        if (!videoContainer) {
            return; // Exit if the container isn't on the current page
        }

        const gistUrl = 'https://gist.githubusercontent.com/ryanduncuft/d67c1848410f5d6a77d914794848bc7d/raw/video_link.json';

        try {
            const response = await fetch(gistUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const videoUrl = data.youtube_embed_url;

            if (videoUrl) {
                const iframe = document.createElement('iframe');
                iframe.setAttribute('src', videoUrl);
                iframe.setAttribute('frameborder', '0');
                iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
                iframe.setAttribute('allowfullscreen', '');
                iframe.setAttribute('loading', 'lazy'); // Recommended for performance

                // Clear any existing content and append the new iframe
                videoContainer.innerHTML = '';
                videoContainer.appendChild(iframe);
            } else {
                console.error('Video URL not found in the JSON data.');
            }
        } catch (error) {
            console.error('Could not load the YouTube video:', error);
            // Optionally, display a fallback message or video
            videoContainer.innerHTML = '<p class="text-center text-gray-400">Sorry, the video could not be loaded.</p>';
        }
    };

    // Only attempt to load the video if the container exists on the page
    if (document.getElementById('youtube-video-container')) {
        loadYouTubeVideo();
    }
});