// js/footer.js
document.addEventListener('DOMContentLoaded', () => {
    const footerContainer = document.getElementById('footer-container');
    if (!footerContainer) {
        console.error('Footer container element not found.');
        return;
    }

    /**
     * Sets the current year in the footer.
     * @returns {void}
     */
    const setCurrentYear = () => {
        const currentYearSpan = document.getElementById('current-year');
        if (currentYearSpan) {
            currentYearSpan.textContent = new Date().getFullYear();
        } else {
            console.warn('Footer year span element not found.');
        }
    };

    /**
     * Adds functionality to clear local and session storage.
     * @returns {void}
     */
    const setupCacheClear = () => {
        const clearCacheBtn = document.getElementById('clear-cache-btn');
        if (clearCacheBtn) {
            clearCacheBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Are you sure you want to clear the local cache? This will reset all site preferences and reload the page.')) {
                    localStorage.clear();
                    sessionStorage.clear();
                    alert('Local cache has been cleared. The page will now reload.');
                    window.location.reload(true);
                }
            });
        } else {
            console.warn('Clear cache button not found.');
        }
    };

    /**
     * Toggles the background animations on and off via localStorage.
     * @returns {void}
     */
    const setupAnimationToggle = () => {
        const toggleAnimationBtn = document.getElementById('toggle-animation-btn');
        if (toggleAnimationBtn) {
            // Get initial state
            const animationsEnabled = localStorage.getItem('animations') !== 'disabled';
            toggleAnimationBtn.textContent = `Toggle Animations: ${animationsEnabled ? 'On' : 'Off'}`;

            toggleAnimationBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const currentState = localStorage.getItem('animations');
                const newState = currentState === 'disabled' ? 'enabled' : 'disabled';
                localStorage.setItem('animations', newState);

                alert(`Animations have been turned ${newState === 'enabled' ? 'on' : 'off'}. The page will now reload to apply the changes.`);
                window.location.reload();
            });
        } else {
            console.warn('Toggle animation button not found.');
        }
    };

    /**
     * Loads the footer HTML and sets up its functionality.
     * @returns {Promise<void>}
     */
    const loadFooter = async () => {
        try {
            const response = await fetch('/components/footer.html');
            if (!response.ok) {
                throw new Error('Network response was not ok.');
            }
            const html = await response.text();
            footerContainer.innerHTML = html;

            // Run the setup functions after the HTML is loaded
            setCurrentYear();
            setupCacheClear();
            setupAnimationToggle();
        } catch (error) {
            console.error('Error loading footer:', error);
        }
    };

    loadFooter();
});