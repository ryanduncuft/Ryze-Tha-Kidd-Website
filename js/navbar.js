// js/navbar.js
document.addEventListener('DOMContentLoaded', () => {
    const navbarContainer = document.getElementById('navbar-container');
    if (!navbarContainer) {
        console.error('Navbar container element not found.');
        return;
    }

    /**
     * Fetches the navbar HTML and injects it into the page.
     * @returns {Promise<void>}
     */
    const loadNavbar = async () => {
        try {
            const response = await fetch('/components/navbar.html');
            if (!response.ok) {
                throw new Error('Network response was not ok.');
            }
            const html = await response.text();
            navbarContainer.innerHTML = html;
            
            // Setup the mobile menu after the HTML is in the DOM
            setupMobileMenu();
        } catch (error) {
            console.error('Error loading navbar:', error);
        }
    };

    /**
     * Sets up the mobile menu's functionality, including populating links and handling clicks.
     * @returns {void}
     */
    const setupMobileMenu = () => {
        const desktopMenu = document.querySelector('header nav ul');
        const mobileMenuList = document.getElementById('mobile-menu-links');
        const menuToggleBtn = document.getElementById('menu-toggle-btn');
        const menuCloseBtn = document.getElementById('menu-close-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        const mainContent = document.getElementById('main-content');

        // Check if all necessary elements exist before proceeding
        if (!desktopMenu || !mobileMenuList || !menuToggleBtn || !menuCloseBtn || !mobileMenu || !mainContent) {
            console.error('One or more mobile menu elements not found after fetching navbar.');
            return;
        }

        // 1. Populate the mobile menu from the desktop links
        const menuLinks = Array.from(desktopMenu.querySelectorAll('li'));
        menuLinks.forEach(listItem => {
            const clonedListItem = listItem.cloneNode(true);
            const anchor = clonedListItem.querySelector('a');
            if (anchor) {
                anchor.classList.add('block', 'py-2', 'transition-colors', 'duration-300');
                anchor.classList.remove('duration-500'); // Clean up redundant class
            }
            mobileMenuList.appendChild(clonedListItem);
        });

        // 2. Define toggle functions
        const toggleMenu = (open = false) => {
            mobileMenu.classList.toggle('-translate-x-full', !open);
            mainContent.classList.toggle('blur-sm', open);
            mainContent.classList.toggle('scale-95', open);
            mainContent.classList.toggle('pointer-events-none', open);
            document.body.style.overflow = open ? 'hidden' : 'auto';
        };

        // 3. Attach event listeners
        menuToggleBtn.addEventListener('click', () => toggleMenu(true));
        menuCloseBtn.addEventListener('click', () => toggleMenu(false));
        
        // Close menu when a link or the overlay is clicked
        mobileMenuList.addEventListener('click', () => toggleMenu(false));
        mobileMenu.addEventListener('click', (e) => {
            if (e.target === mobileMenu) {
                toggleMenu(false);
            }
        });
    };

    loadNavbar();
});