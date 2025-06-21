// My notes:
// - Imports `releasesData` and `fetchReleasesData` from `data.js`.
// - `releasesData` will hold all our music info once fetched.

import { releasesData, fetchReleasesData } from './data.js';

const releasesGrid = document.getElementById('releases-grid');
const navButtons = document.querySelectorAll('.nav-btn');
const noReleasesMessage = document.querySelector('.no-releases-message');

// Store the height of each column to decide where to place the next card
let columnHeights = [];
let numColumns = 0; // Will be determined by screen width

/**
 * Note: This function makes an HTML card for each release.
 * It includes the cover, title, date, type, description, and some cool sparkles.
 */
function createReleaseCard(release) {
    const releaseItem = document.createElement('div');
    releaseItem.classList.add('release-item');
    releaseItem.setAttribute('data-id', release.id);

    const numSparkles = 5;
    let sparklesHTML = '';
    for (let i = 0; i < numSparkles; i++) {
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const size = Math.random() * 8 + 4;
        const delay = Math.random() * 0.5;
        sparklesHTML += `<span class="sparkle" style="left:${x}%; top:${y}%; width:${size}px; height:${size}px; animation-delay: ${delay}s;"></span>`;
    }

    let pageUrl;
    // Determine the correct page to link to based on the release type
    if (release.type === 'album' || release.type === 'ep') {
        // Link to the generic album.html for albums and EPs
        pageUrl = `album.html?id=${release.id}`;
    } else {
        // Link to the generic single.html for singles, album-tracks, and collaborations
        pageUrl = `single.html?id=${release.id}`;
    }

    // IMPORTANT: Double-check your file paths.
    // If 'album.html' and 'single.html' are in a subfolder (e.g., 'pages/'),
    // you would need to adjust the `pageUrl` construction accordingly:
    // pageUrl = `pages/album.html?id=${release.id}`;
    // pageUrl = `pages/single.html?id=${release.id}`;
    // Assuming discography.html is at the root and these are also at the root or a direct subfolder.

    releaseItem.innerHTML = `
        <a href="${pageUrl}" aria-label="Learn more about ${release.title}">
            <div class="release-image-wrapper">
                <img src="${release.image}" alt="${release.title} cover art">
                ${sparklesHTML}
            </div>
            <div class="release-info">
                <h3>${release.title}</h3>
                <p class="release-date">Released: ${release.displayDate}</p>
                <p class="release-type">${release.type.charAt(0).toUpperCase() + release.type.slice(1)}</p>
                <p>${release.description}</p>
            </div>
        </a>
    `;

    return releaseItem;
}

/**
 * Calculates the number of columns based on current screen width.
 */
function getNumberOfColumns() {
    if (window.innerWidth <= 768) { // Unified mobile/tablet to 1 column for horizontal layout
        return 1;
    } else if (window.innerWidth <= 1024) {
        return 2;
    } else {
        return 3;
    }
}

/**
 * Initializes or resets the column heights for the masonry layout.
 * This also sets up the releasesGrid as a flex container to hold the columns.
 */
function initializeMasonryGrid() {
    numColumns = getNumberOfColumns();
    columnHeights = Array(numColumns).fill(0); // All columns start at 0 height

    releasesGrid.innerHTML = ''; // Clear previous columns
    releasesGrid.style.display = 'flex'; // Use flexbox for the main container
    releasesGrid.style.flexWrap = 'wrap'; // Allow columns to wrap if needed (though we'll control width)
    releasesGrid.style.alignItems = 'flex-start'; // Align columns to the top
    releasesGrid.style.gap = '0'; // We'll manage gaps between items within columns

    // Create column containers
    for (let i = 0; i < numColumns; i++) {
        const column = document.createElement('div');
        column.classList.add('masonry-column');
        column.style.flex = '1'; // Allows columns to share space
        column.style.minWidth = `calc((100% / ${numColumns}) - var(--spacing-xl) * ${(numColumns - 1) / numColumns})`; // Calculates column width with gap
        // Add horizontal gap between columns
        if (i > 0) {
            column.style.marginLeft = 'var(--spacing-xl)';
        }
        releasesGrid.appendChild(column);
    }
    releasesGrid.style.maxWidth = '1300px'; // Reset max-width
    releasesGrid.style.margin = 'auto'; // Center the grid
}

/**
 * Note: This function shows releases based on the selected category (e.g., "singles," "albums").
 * It sorts them by date (newest first) and handles showing a "no releases" message if needed.
 */
function displayReleases(category) {
    // Temporarily hide grid items for a smooth re-layout during filtering
    releasesGrid.style.opacity = 0;

    initializeMasonryGrid(); // Initialize and clear grid, set up columns

    // Only show these types of releases on the main discography page
    const allowedTypes = ['single', 'ep', 'album', 'collab'];

    // Filter releases by type and category, then sort by date
    const filteredReleases = releasesData
        .filter(release =>
            allowedTypes.includes(release.type) && // Make sure it's an allowed type
            (category === 'all' || release.type === category) // Apply category filter
        )
        .sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate)); // Newest first

    // Show/hide the "No Releases" message
    if (filteredReleases.length === 0) {
        noReleasesMessage.style.display = 'block';
        releasesGrid.style.display = 'none'; // Hide grid if no releases
    } else {
        noReleasesMessage.style.display = 'none';
        releasesGrid.style.display = 'flex'; // Show grid

        const columns = Array.from(releasesGrid.children); // Get the newly created column divs

        // Add each release card to the page, appending to the shortest column
        // We use a promise to ensure image loading finishes before calculating height
        const cardPromises = filteredReleases.map((release, index) => {
            return new Promise(resolve => {
                const card = createReleaseCard(release);
                card.style.animationDelay = `${index * 0.08}s`; // Staggered fade-in

                // Append card to a temporary invisible container to get its height
                // without affecting current layout or user seeing it
                const tempDiv = document.createElement('div');
                tempDiv.style.visibility = 'hidden';
                tempDiv.style.position = 'absolute';
                tempDiv.appendChild(card);
                document.body.appendChild(tempDiv);

                // Wait for images inside the card to load for accurate height calculation
                const img = card.querySelector('img');
                if (img && !img.complete) {
                    img.onload = () => {
                        resolve(card);
                        document.body.removeChild(tempDiv);
                    };
                    img.onerror = () => { // Handle broken images too
                        resolve(card);
                        document.body.removeChild(tempDiv);
                    };
                } else {
                    resolve(card);
                    document.body.removeChild(tempDiv);
                }
            });
        });

        Promise.all(cardPromises).then(loadedCards => {
            loadedCards.forEach(card => {
                // Find the shortest column
                const minHeight = Math.min(...columnHeights);
                const shortestColumnIndex = columnHeights.indexOf(minHeight);
                const targetColumn = columns[shortestColumnIndex];

                targetColumn.appendChild(card); // Append the card to the shortest column
                // Add margin-bottom directly to the card within the column
                card.style.marginBottom = 'var(--spacing-xl)';

                // Update the height of the column
                // Use getBoundingClientRect().height for accurate rendered height
                columnHeights[shortestColumnIndex] += card.getBoundingClientRect().height + parseFloat(getComputedStyle(card).marginBottom);
            });

            releasesGrid.style.opacity = 1; // Fade in the grid after layout is complete
        });
    }

    // Handle single item centering (optional for masonry, but keeps previous behavior)
    if (filteredReleases.length === 1) {
        releasesGrid.style.justifyContent = 'center'; // Center the single column
        releasesGrid.style.maxWidth = '450px'; // Constrain width for single item
    } else {
        releasesGrid.style.justifyContent = 'flex-start'; // Reset for multiple columns
        releasesGrid.style.maxWidth = '1300px'; // Reset max-width
    }
}


// Listen for clicks on our navigation buttons
navButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove 'active' class from all buttons, then add it to the clicked one
        navButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const category = button.getAttribute('data-category');

        // No need for fade-out class on the main grid, as we're managing opacity directly
        // releasesGrid.classList.add('fade-out'); // Remove this line

        // After the fade-out (simulated by opacity transition), update content
        setTimeout(() => {
            displayReleases(category);

            // No need for fade-in class on the main grid, as we're managing opacity directly
            // releasesGrid.classList.remove('fade-out'); // Remove this line
            // releasesGrid.classList.add('fade-in'); // Remove this line

            // No need for this timeout anymore
            // setTimeout(() => {
            //     releasesGrid.classList.remove('fade-in');
            // }, 500); // Matches CSS fade-in duration
        }, 300); // This delay now acts as the visual "fade-out" time before new content appears
    });
});

// Re-layout on window resize to adjust column count
window.addEventListener('resize', () => {
    const newNumColumns = getNumberOfColumns();
    if (newNumColumns !== numColumns) {
        const currentCategory = document.querySelector('.nav-btn.active')?.getAttribute('data-category') || 'all';
        displayReleases(currentCategory);
    }
});


// When the page loads, first get the data, then show all releases.
document.addEventListener('DOMContentLoaded', async () => {
    await fetchReleasesData(); // Wait for data to be ready

    // Set the initial active button
    const initialCategory = 'all'; // Or whatever your default category should be
    const initialButton = document.querySelector(`.nav-btn[data-category="${initialCategory}"]`);
    if (initialButton) {
        initialButton.classList.add('active');
    }

    displayReleases(initialCategory); // Then show everything
});