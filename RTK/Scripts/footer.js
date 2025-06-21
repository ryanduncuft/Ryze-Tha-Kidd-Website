// My notes:
// - Tries to load the footer HTML from a few possible locations.
// - Once loaded, it puts the HTML into the 'footer' div.
// - It also updates the copyright year and applies dark mode if needed.

const footerPathsToTry =
[
    '/footer.html',       // From the very top of the site
    './footer.html',      // In the same folder as the current page
    '../footer.html',     // One folder up
    '../../footer.html',  // Two folders up
    '../../../footer.html', // Three folders up
];

/**
 * Note: This function tries to load the footer from different paths until it succeeds.
 * After loading, it updates the year and sets the dark mode.
 */
async function loadFooter()
{
    for (const path of footerPathsToTry)
    {
        try
        {
            const response = await fetch(path);

            // If we found the footer HTML
            if (response.ok)
            {
                const footerHtml = await response.text();
                // Put the footer HTML into the 'footer' div
                document.getElementById("footer").innerHTML = footerHtml;

                // Update the copyright year
                updateCurrentYear();

                // If dark mode is active, apply its styles to the new footer
                if (typeof window.applyDarkModeClasses === 'function')
                {
                    window.applyDarkModeClasses();
                }
                return; // Stop trying paths, we found it!
            }
        }
        
        catch (error)
        {
            // Log if a path fails, but keep trying others
            console.warn(`Couldn't load footer from ${path}:`, error);
        }
    }

    // If we tried all paths and failed
    console.error("Failed to load the footer from any of the specified paths.");
}

/**
 * Note: This function finds the 'current-year' element and updates it to the current year.
 */
function updateCurrentYear()
{
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan)
    {
        currentYearSpan.textContent = new Date().getFullYear();
    }
}

// When the entire page is loaded, start loading the footer.
document.addEventListener('DOMContentLoaded', loadFooter);