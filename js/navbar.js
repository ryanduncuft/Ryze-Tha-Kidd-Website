/**
 * js/navbar.js
 * Handles fetching the navbar HTML and setting up mobile menu functionality.
 */

document.addEventListener('DOMContentLoaded', () => {
    const navbarContainer = document.getElementById('navbar-container');
    if (!navbarContainer) {
        console.error('Navbar container element not found. Aborting navbar script.');
        return;
    }

    /**
     * Toggles the mobile menu open/closed state and manages related DOM changes.
     * @param {boolean} open - true to open, false to close.
     * @returns {void}
     */
    const toggleMenu = (open) => {
        const mobileMenu = document.getElementById('mobile-menu');
        const mainContent = document.getElementById('main-content');
        
        if (!mobileMenu || !mainContent) {
            console.warn('Mobile menu elements are missing.');
            return;
        }

        // Toggle mobile menu visibility (using Tailwind's translate-x utility)
        mobileMenu.classList.toggle('-translate-x-full', !open);
        
        // Apply visual and functional effects to the main content
        mainContent.classList.toggle('blur-sm', open);
        mainContent.classList.toggle('scale-95', open);
        mainContent.classList.toggle('pointer-events-none', open);
        
        // Prevent background scrolling when menu is open
        document.body.style.overflow = open ? 'hidden' : 'auto';
    };


    /**
     * Sets up the mobile menu's functionality, including populating links and handling clicks.
     * Assumes the mobile and desktop menu structures are available after HTML injection.
     * @returns {void}
     */
    const setupMobileMenu = () => {
        // --- Get Elements ---
        const desktopMenu = document.querySelector('header nav ul');
        const mobileMenuList = document.getElementById('mobile-menu-links');
        const menuToggleBtn = document.getElementById('menu-toggle-btn');
        const menuCloseBtn = document.getElementById('menu-close-btn');
        const mobileMenu = document.getElementById('mobile-menu');

        // Concise check for required elements
        if (!desktopMenu || !mobileMenuList || !menuToggleBtn || !menuCloseBtn || !mobileMenu) {
            console.warn('Required mobile menu elements were not found after fetching navbar.');
            return;
        }

        // 1. Populate the mobile menu from the desktop links
        // Use a fragment to minimize DOM manipulation reflows
        const fragment = document.createDocumentFragment();
        const menuLinks = Array.from(desktopMenu.querySelectorAll('li'));
        
        menuLinks.forEach(listItem => {
            const clonedListItem = listItem.cloneNode(true);
            const anchor = clonedListItem.querySelector('a');
            if (anchor) {
                // Add necessary mobile styling
                anchor.classList.add('block', 'py-2', 'transition-colors', 'duration-300');
                anchor.classList.remove('duration-500'); // Clean up redundant class
            }
            fragment.appendChild(clonedListItem);
        });
        mobileMenuList.appendChild(fragment);


        // 2. Attach Event Listeners
        menuToggleBtn.addEventListener('click', () => toggleMenu(true));
        menuCloseBtn.addEventListener('click', () => toggleMenu(false));
        
        // Close menu when a link inside the list is clicked
        mobileMenuList.addEventListener('click', (e) => {
            // Only close if an anchor tag was clicked
            if (e.target.tagName === 'A') {
                toggleMenu(false);
            }
        });

        // Close menu when the overlay (mobileMenu background) is clicked
        mobileMenu.addEventListener('click', (e) => {
            if (e.target === mobileMenu) {
                toggleMenu(false);
            }
        });
    };

    /**
     * Fetches the navbar HTML, injects it, and sets up all functionality.
     */
    const loadAndInitializeNavbar = async () => {
        try {
            const response = await fetch('/components/navbar.html');
            if (!response.ok) {
                throw new Error(`Failed to fetch navbar HTML. Status: ${response.status}`);
            }
            const html = await response.text();
            navbarContainer.innerHTML = html;
            
            // Setup the mobile menu after the HTML is successfully in the DOM
            setupMobileMenu();
        } catch (error) {
            console.error('Error loading or initializing navbar:', error);
        }
    };

    loadAndInitializeNavbar();
});