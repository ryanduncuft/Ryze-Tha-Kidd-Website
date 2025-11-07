/**
 * js/footer.js
 * Handles fetching the footer HTML, setting the current year, 
 * and setting up utility functions like cache clear and animation toggle.
 */

document.addEventListener('DOMContentLoaded', () => {
    // A single, top-level check for the container.
    const footerContainer = document.getElementById('footer-container');
    if (!footerContainer) {
        console.error('Footer container element not found. Aborting footer script.');
        return;
    }

    // --- Utility Functions ---

    /**
     * Sets the current year in the footer's designated span.
     */
    const initializeCurrentYear = () => {
        const currentYearSpan = document.getElementById('current-year');
        // FIX: Using standard if-check to avoid Uncaught SyntaxError (line 22 was likely here)
        if (currentYearSpan) { 
            currentYearSpan.textContent = new Date().getFullYear();
        }
    };

    /**
     * Adds functionality to clear local and session storage upon button click.
     */
    const setupCacheClear = () => {
        const clearCacheBtn = document.getElementById('clear-cache-btn');
        clearCacheBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to clear the local cache? This will reset all site preferences and reload the page.')) {
                localStorage.clear();
                sessionStorage.clear();
                
                alert('Local cache has been cleared. The page will now reload.');
                window.location.reload(true);
            }
        });
    };

    /**
     * Toggles the background animations on and off via localStorage and reloads.
     */
    const setupAnimationToggle = () => {
        const toggleAnimationBtn = document.getElementById('toggle-animation-btn');
        
        if (toggleAnimationBtn) {
            const animationsEnabled = localStorage.getItem('animations') !== 'disabled';
            toggleAnimationBtn.textContent = `Toggle Animations: ${animationsEnabled ? 'On' : 'Off'}`;

            toggleAnimationBtn.addEventListener('click', (e) => {
                e.preventDefault();
                
                const currentState = localStorage.getItem('animations') === 'disabled';
                const newState = currentState ? 'enabled' : 'disabled';
                
                localStorage.setItem('animations', newState);

                alert(`Animations have been turned ${newState === 'enabled' ? 'on' : 'off'}. The page will now reload to apply the changes.`);
                window.location.reload();
            });
        }
    };

    /**
     * Fetches and injects the footer HTML, then sets up its functionality.
     */
    const loadAndInitializeFooter = async () => {
        // Path confirmed to be '/components/footer.html' based on working navbar
        const componentPath = '/components/footer.html'; 
        try {
            const response = await fetch(componentPath);
            
            if (!response.ok) {
                console.error(`Failed to fetch component from path: ${componentPath}`);
                console.error(`HTTP Status: ${response.status} (${response.statusText})`);
                throw new Error(`Network response was not ok for ${componentPath}`);
            }
            
            const html = await response.text();
            footerContainer.innerHTML = html;

            // Run the setup functions after the HTML is loaded
            initializeCurrentYear();
            setupCacheClear();
            setupAnimationToggle();
        } catch (error) {
            console.error('Final Error loading or initializing footer:', error);
            footerContainer.classList.add('hidden'); 
        }
    };

    loadAndInitializeFooter();
});