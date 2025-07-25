// Note: This function applies or removes the 'dark-mode' class to elements and updates the toggle icon.
// Call this after dynamic content (like navbar/footer) is loaded.
window.applyDarkModeClasses = function()
{
    const body = document.body;
    const isDarkMode = body.classList.contains('dark-mode');

    // Get the containers for our injected HTML (navbar and footer).
    const navbarContainer = document.getElementById('navbar');
    const footerContainer = document.getElementById('footer');

    // Find the actual navbar and footer elements inside those containers.
    const actualNavbarHeader = navbarContainer ? navbarContainer.querySelector('.navbar') : null;
    const actualFooterElement = footerContainer ? footerContainer.querySelector('.footer') : null;

    // Add or remove the 'dark-mode' class based on the current theme.
    if (actualNavbarHeader)
    {
        if (isDarkMode)
        {
            actualNavbarHeader.classList.add('dark-mode');
        }
         
        else
        {
            actualNavbarHeader.classList.remove('dark-mode');
        }
    }

    if (actualFooterElement)
    {
        if (isDarkMode)
        {
            actualFooterElement.classList.add('dark-mode');
        }

        else
        {
            actualFooterElement.classList.remove('dark-mode');
        }
    }

    // Update the dark mode toggle icon.
    const toggleIcon = document.querySelector('#dark-mode-toggle .fas');
    if (toggleIcon)
    {
        if (isDarkMode)
        {
            // If dark mode is on, show the sun icon.
            toggleIcon.classList.remove('fa-moon');
            toggleIcon.classList.add('fa-sun');
        }
        
        else
        {
            // If light mode is on, show the moon icon.
            toggleIcon.classList.remove('fa-sun');
            toggleIcon.classList.add('fa-moon');
        }
    }
};

// Note: This function toggles dark mode on or off.
// It saves the preference and updates the UI.
window.toggleDarkMode = function()
{
    document.body.classList.toggle('dark-mode');

    // Save the user's preference to local storage.
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode') ? 'enabled' : 'disabled');

    // Apply the changes to all elements right away.
    window.applyDarkModeClasses();
};

// Note: This function checks for a saved dark mode preference when the page loads.
// It sets the initial theme for static content.
window.initializeDarkMode = function()
{
    const darkModeStatus = localStorage.getItem('darkMode');
    if (darkModeStatus === 'enabled')
    {
        document.body.classList.add('dark-mode');
    }
};

// When the page loads, set the initial dark mode based on saved preference.
// Dynamic elements like the navbar and footer will call `applyDarkModeClasses` themselves once they finish loading into the page.
document.addEventListener('DOMContentLoaded', () =>
{
    window.initializeDarkMode();
});