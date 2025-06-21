// My notes:
// - This script loads the navbar HTML from different possible locations.
// - Once the navbar is on the page, it sets up the dark mode toggle and the mobile menu.

const navbarPathsToTry = [
    '/navbar.html',       // From the very top of the site
    './navbar.html',      // In the same folder as the current page
    '../navbar.html',     // One folder up
    '../../navbar.html',  // Two folders up
    '../../../navbar.html', // Three folders up
];

/**
 * Note: This function tries to load the navbar HTML from our list of paths.
 * If successful, it injects the HTML and then sets up dark mode and the mobile menu functionality.
 */
async function loadNavbarAndInitializeMobileMenu()
{
    for (const path of navbarPathsToTry)
    {
        try
        {
            const response = await fetch(path);

            // If we successfully fetched the navbar HTML
            if (response.ok)
            {
                const navbarHtml = await response.text();
                // Put the navbar HTML into the 'navbar' div
                document.getElementById("navbar").innerHTML = navbarHtml;

                // --- Dark Mode Setup ---
                // After the navbar loads, apply dark mode styles if needed.
                // This makes sure the dark mode icon and colors are correct.
                if (typeof window.applyDarkModeClasses === 'function')
                {
                    window.applyDarkModeClasses();
                }

                const darkModeToggleBtn = document.getElementById('dark-mode-toggle');

                if (darkModeToggleBtn && typeof window.toggleDarkMode === 'function')
                {
                    // Add the click listener for the dark mode button.
                    // We do this here because the button is part of the loaded navbar.
                    darkModeToggleBtn.addEventListener('click', window.toggleDarkMode);
                }
                
                else
                {
                    console.warn("Couldn't find the dark mode toggle button or the 'toggleDarkMode' function after loading the navbar.");
                }

                // --- Mobile Menu Setup ---
                // Get the mobile menu elements now that they're on the page.
                const menuBtn = document.getElementById('menu-toggle-btn');
                const navMenu = document.getElementById('main-nav');
                const body = document.body;

                if (menuBtn && navMenu && body)
                {
                    // When the menu button is clicked, open/close the mobile menu.
                    menuBtn.addEventListener('click', () =>
                    {
                        toggleMobileMenu(menuBtn, navMenu, body);
                    });

                    // If you click outside the open mobile menu, close it.
                    document.addEventListener('click', (event) =>
                    {
                        if (navMenu.classList.contains('active') && !navMenu.contains(event.target) && !menuBtn.contains(event.target))
                        {
                            closeMobileMenu(menuBtn, navMenu, body);
                        }
                    });

                    // If you click a link inside the mobile menu, close the menu.
                    const navLinks = document.querySelectorAll('#main-nav .nav-links a');
                    navLinks.forEach(link =>
                    {
                        link.addEventListener('click', () => {
                            closeMobileMenu(menuBtn, navMenu, body);
                        });
                    });

                    // Also close the mobile menu if the dark mode button is clicked while the menu is open.
                    if (darkModeToggleBtn)
                    {
                        darkModeToggleBtn.addEventListener('click', () =>
                        {
                            closeMobileMenu(menuBtn, navMenu, body);
                        });
                    }
                }

                // --- End Mobile Menu Setup ---
                return; // Stop here, we've loaded the navbar.
            }
        }
        
        catch (error)
        {
            // Log a warning if a path fails, but keep trying others.
            console.warn(`Failed to fetch navbar from ${path}:`, error);
        }
    }

    // If none of the paths worked, show an error.
    console.error("Couldn't load the navbar from any of the specified paths.");
}

/**
 * Note: This function opens or closes the mobile menu.
 * It also handles preventing scrolling on the main page when the menu is open.
 */
function toggleMobileMenu(menuBtn, navMenu, body)
{
    menuBtn.classList.toggle('active');
    navMenu.classList.toggle('active');
    const isExpanded = navMenu.classList.contains('active');
    menuBtn.setAttribute('aria-expanded', isExpanded); // Update for accessibility

    // Stop scrolling on the main page if the menu is open.
    body.style.overflow = isExpanded ? 'hidden' : '';
}

/**
 * Note: This function closes the mobile menu if it's currently open.
 */
function closeMobileMenu(menuBtn, navMenu, body)
{
    if (menuBtn && navMenu && navMenu.classList.contains('active'))
    {
        menuBtn.classList.remove('active');
        navMenu.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', false); // Reset accessibility attribute
        body.style.overflow = ''; // Allow body scrolling again
    }
}

// When the page finishes loading, start the process of loading the navbar and setting up the menu.
document.addEventListener('DOMContentLoaded', loadNavbarAndInitializeMobileMenu);