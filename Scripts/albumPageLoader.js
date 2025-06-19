import { releasesData, fetchReleasesData } from './data.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Page loaded. Running albumPageLoader.js');

    // *** IMPORTANT CHANGE HERE ***
    // Get the ID from the URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const albumId = urlParams.get('id'); // Get the value of the 'id' parameter

    if (!albumId) {
        console.error('Missing "id" query parameter in URL for album. Cannot load data.');
        const mainContentContainer = document.querySelector('.album-page-content .container');
        if (mainContentContainer) {
            mainContentContainer.innerHTML = '<p style="text-align: center; color: var(--text-color-dark); font-size: 1.5rem; padding: 50px;">Oops! No album ID provided in the URL.</p>';
            if (document.body.classList.contains('dark-mode')) {
                mainContentContainer.querySelector('p').style.color = 'var(--text-color-light)';
            }
        }
        // Also hide other elements that might be visible by default
        document.querySelector('.album-visuals')?.classList.add('hidden');
        document.querySelector('.album-details-panel')?.classList.add('hidden');
        return;
    }

    console.log(`Trying to load album ID from URL: ${albumId}`);

    // grab the latest album data
    await fetchReleasesData();

    // find the current album in our data
    const currentRelease = releasesData.find(
        release => release.id === albumId && ['album', 'ep'].includes(release.type)
    );

    // get all the elements we'll be updating
    const albumCoverImg = document.querySelector('.album-cover-tilt-effect img');
    const listenNowBtn = document.querySelector('.listen-now-btn');
    const albumTitleElem = document.querySelector('.album-title');
    const albumArtistElem = document.querySelector('.album-artist');
    const tracklistGrid = document.querySelector('.tracklist-grid');
    const tracklistSection = document.querySelector('.tracklist-section');
    const creditsDiv = document.querySelector('#album-credits-content');
    const creditsSection = document.querySelector('.credits-section');
    const mainContentContainer = document.querySelector('.album-page-content .container');

    if (currentRelease) {
        // update the page's HTML head for SEO and browser tab title
        document.title = `${currentRelease.title} | ${currentRelease.artist}`;
        
        const setMeta = (selector, content) => {
            const tag = document.querySelector(selector);
            if (tag) tag.setAttribute('content', content);
        };

        setMeta('meta[name="description"]', currentRelease.description || `Explore ${currentRelease.title} by ${currentRelease.artist}.`);
        setMeta('meta[name="keywords"]', `Ryze Tha Kidd, ${currentRelease.type}, ${currentRelease.title}, music, ${currentRelease.artist}, ${currentRelease.credits?.artists?.join(', ') || ''}, ${currentRelease.credits?.producers?.join(', ') || ''}`);

        // set Open Graph and Twitter card meta tags for social sharing
        const fullImagePath = currentRelease.image;
        setMeta('meta[property="og:title"]', currentRelease.title);
        setMeta('meta[property="og:description"]', currentRelease.description || `Listen to ${currentRelease.title} by ${currentRelease.artist}.`);
        setMeta('meta[property="og:url"]', window.location.href);
        setMeta('meta[property="og:image"]', fullImagePath);
        setMeta('meta[name="twitter:title"]', currentRelease.title);
        setMeta('meta[name="twitter:description"]', currentRelease.description || `Check out ${currentRelease.title} by ${currentRelease.artist}.`);
        setMeta('meta[name="twitter:image"]', fullImagePath);

        // update album cover
        if (albumCoverImg) {
            albumCoverImg.src = currentRelease.image;
            albumCoverImg.alt = `${currentRelease.title} cover art`;
        }

        // update album title and artist
        if (albumTitleElem) {
            albumTitleElem.textContent = currentRelease.title;
        } else {
            console.warn('Album title element not found.');
        }
        
        if (albumArtistElem) {
            albumArtistElem.textContent = currentRelease.artist;
        } else {
            console.warn('Album artist element not found.');
        }

        // update "Listen Now" button
        if (listenNowBtn && currentRelease.listenLink) {
            listenNowBtn.href = currentRelease.listenLink;
            listenNowBtn.classList.remove('hidden');
        } else if (listenNowBtn) {
            listenNowBtn.classList.add('hidden'); // hide if no link
        }

        // update tracklist
        if (tracklistGrid && tracklistSection && currentRelease.tracks && currentRelease.tracks.length > 0) {
            tracklistGrid.innerHTML = ''; // clear existing buttons

            // --- THIS IS THE SECTION TO UPDATE ---
            currentRelease.tracks.forEach((track) => {
                const trackButton = document.createElement('a');
                
                // *** OLD LINE (likely causing the issue): ***
                // trackButton.href = `${trackDirectory}/${track.link}`; 
                // OR
                // trackButton.href = `single.html?id=${track.id || track.link}`; // This was better, but assumes track.link IS the ID or a path to old HTML

                // *** NEW CORRECTED LINE: ***
                // It's crucial that `track.id` is present in your `releasesData` for each individual track
                // within an album's `tracks` array. This `id` should match the `id` of that
                // specific track if it were listed as a standalone 'single' or 'album-track' type.
                trackButton.href = `single.html?id=${track.id}`; // Assumes track.id exists for each track

                trackButton.classList.add('track-button');
                trackButton.textContent = track.title;
                tracklistGrid.appendChild(trackButton);
            });
            tracklistSection.classList.remove('hidden'); // show tracklist
        } else if (tracklistSection) {
            tracklistSection.classList.add('hidden'); // hide if no tracks
        }

        // update credits
        if (creditsDiv && creditsSection && currentRelease.credits) {
            let artistsHtml = '';
            if (currentRelease.credits.artists && currentRelease.credits.artists.length > 0) {
                artistsHtml = `<p><strong>Artist${currentRelease.credits.artists.length > 1 ? 's' : ''}:</strong> ${currentRelease.credits.artists.join(', ')}</p>`;
            }

            let producersHtml = '';
            if (currentRelease.credits.producers && currentRelease.credits.producers.length > 0) {
                producersHtml = `<p><strong>Producer${currentRelease.credits.producers.length > 1 ? 's' : ''}:</strong> ${currentRelease.credits.producers.join(', ')}</p>`;
            }

            // only show credits if there's artists, producers, or a release date
            if (artistsHtml || producersHtml || currentRelease.displayDate) {
                creditsDiv.innerHTML = `
                    ${artistsHtml}
                    ${producersHtml}
                    ${currentRelease.displayDate ? `<p><strong>Release Date:</strong> ${currentRelease.displayDate}</p>` : ''}
                `;
                creditsSection.classList.remove('hidden'); // show credits section
            } else {
                creditsSection.classList.add('hidden'); // hide if no meaningful credits
            }
        } else if (creditsSection) {
            creditsSection.classList.add('hidden'); // hide if no credits data
        }

    } else {
        // if no album data is found, show a message
        if (mainContentContainer) {
            mainContentContainer.innerHTML = '<p style="text-align: center; color: var(--text-color-dark); font-size: 1.5rem; padding: 50px;">Oops! This release could not be found or is not an album/EP.</p>';
            // adjust color for dark mode if needed
            if (document.body.classList.contains('dark-mode')) {
                mainContentContainer.querySelector('p').style.color = 'var(--text-color-light)';
            }
        }

        // also hide other elements to prevent them from showing empty
        if (albumCoverImg) albumCoverImg.src = '';
        if (listenNowBtn) listenNowBtn.classList.add('hidden');
        if (albumTitleElem) albumTitleElem.textContent = 'Album Not Found';
        if (albumArtistElem) albumArtistElem.textContent = '';
        if (tracklistSection) tracklistSection.classList.add('hidden');
        if (creditsSection) creditsSection.classList.add('hidden');
    }
});