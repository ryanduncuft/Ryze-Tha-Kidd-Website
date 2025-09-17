// js/navbar.js
document.addEventListener('DOMContentLoaded', () => {
    const navbarContainer = document.getElementById('navbar-container');
    if (navbarContainer) {
        // Use async/await for cleaner code
        const loadNavbar = async () => {
            try {
                const response = await fetch('/components/navbar.html');
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const html = await response.text();
                navbarContainer.innerHTML = html;

                // --- Mobile Menu Setup Logic ---
                const setupMobileMenu = () => {
                    const desktopMenu = document.querySelector('header nav ul');
                    const mobileMenuList = document.getElementById('mobile-menu-links');
                    const menuToggleBtn = document.getElementById('menu-toggle-btn');
                    const menuCloseBtn = document.getElementById('menu-close-btn');
                    const mobileMenu = document.getElementById('mobile-menu');
                    const mainContent = document.getElementById('main-content');

                    if (desktopMenu && mobileMenuList && menuToggleBtn && menuCloseBtn && mobileMenu && mainContent) {
                        // 1. Populate the mobile menu from the desktop links
                        desktopMenu.querySelectorAll('li').forEach(listItem => {
                            const clonedListItem = listItem.cloneNode(true);
                            const anchor = clonedListItem.querySelector('a');
                            if (anchor) {
                                // Add classes for mobile styling
                                anchor.classList.add('block', 'py-2');
                                anchor.classList.remove('transition-colors', 'duration-500');
                                anchor.classList.add('transition-colors', 'duration-300');
                            }
                            mobileMenuList.appendChild(clonedListItem);
                        });

                        // 2. Define toggle functions
                        const openMenu = () => {
                            mobileMenu.classList.remove('-translate-x-full');
                            mainContent.classList.add('blur-sm', 'scale-95', 'pointer-events-none');
                            document.body.style.overflow = 'hidden';
                        };

                        const closeMenu = () => {
                            mobileMenu.classList.add('-translate-x-full');
                            mainContent.classList.remove('blur-sm', 'scale-95', 'pointer-events-none');
                            document.body.style.overflow = 'auto';
                        };

                        // 3. Attach event listeners
                        menuToggleBtn.addEventListener('click', openMenu);
                        menuCloseBtn.addEventListener('click', closeMenu);
                        
                        // Close menu when a link is clicked
                        mobileMenuList.querySelectorAll('a').forEach(link => {
                            link.addEventListener('click', closeMenu);
                        });

                        // Close menu when clicking outside the menu panel
                        mobileMenu.addEventListener('click', (e) => {
                            if (e.target === mobileMenu) {
                                closeMenu();
                            }
                        });
                    } else {
                        console.error('Mobile menu elements not found after fetching navbar.');
                    }
                };
                
                // Call the setup function after the HTML is in the DOM
                setupMobileMenu();

            } catch (error) {
                console.error('Error loading navbar:', error);
            }
        };

        loadNavbar();
    }
});