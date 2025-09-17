// js/footer.js
document.addEventListener('DOMContentLoaded', () => {
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
        fetch('/components/footer.html')
            .then(response => response.text())
            .then(html => {
                footerContainer.innerHTML = html;

                // --- FOOTER-SPECIFIC LOGIC ---
                // This code runs AFTER the footer HTML has been injected.

                // 1. Set the current year
                const currentYearSpan = document.getElementById('current-year');
                if (currentYearSpan) {
                    currentYearSpan.textContent = new Date().getFullYear();
                } else {
                    console.warn('Footer year span element not found.');
                }

                // 2. Add the cache clear functionality
                const clearCacheBtn = document.getElementById('clear-cache-btn');
                if (clearCacheBtn) {
                    clearCacheBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        if (confirm('Are you sure you want to clear the local cache? This will reset all site preferences and reload the page.')) {
                            
                            // Clear all client-side storage
                            localStorage.clear();
                            sessionStorage.clear();
                            
                            alert('Local cache has been cleared. The page will now reload.');
                            
                            // Force a hard reload to bust the browser's cache for all assets
                            window.location.reload(true);
                        }
                    });
                } else {
                    console.warn('Clear cache button not found.');
                }

            })
            .catch(error => console.error('Error loading footer:', error));
    }
});