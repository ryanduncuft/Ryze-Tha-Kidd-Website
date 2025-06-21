// My notes:
// - Waits for the page to load.
// - Fetches a YouTube embed URL from a GitHub Gist.
// - Inserts the video into the `video-embed-container` element.
// - Adds a cache-buster to the Gist URL to always get the latest link.

document.addEventListener('DOMContentLoaded', async function()
{
    const gistUrlBase = 'https://gist.githubusercontent.com/ryanduncuft/d67c1848410f5d6a77d914794848bc7d/raw/video_link.json';
    const videoEmbedContainer = document.getElementById('video-embed-container');

    // Add a unique timestamp to the URL to make sure we always get the freshest data.
    const cacheBuster = new Date().getTime();
    const gistUrl = `${gistUrlBase}?${cacheBuster}`;

    try
    {
        // Try to fetch the video link.
        const response = await fetch(gistUrl);

        // If the request wasn't successful, throw an error.
        if (!response.ok)
        {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Parse the data we got back.
        const data = await response.json();
        const videoUrl = data.youtube_embed_url; // Looking for the YouTube URL here.

        // If we found a video URL, embed it!
        if (videoUrl)
        {
            videoEmbedContainer.innerHTML = `
                <iframe
                    src="${videoUrl}"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                ></iframe>
            `;
        }
        
        else
        {
            // If the URL wasn't in the data, tell the user.
            videoEmbedContainer.innerHTML = "<p>Couldn't find the video URL in the data. Maybe the Gist content changed?</p>";
        }
    }
    
    catch (error)
    {
        // If anything goes wrong, show an error message.
        console.error('Failed to load video from Gist:', error);
        videoEmbedContainer.innerHTML = "<p>Sorry, the video couldn't be loaded right now. Please try again later.</p>";
    }
});