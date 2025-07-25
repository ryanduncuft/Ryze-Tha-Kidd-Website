// My notes:
// - Shows a welcome screen when the page first loads.
// - Greets returning visitors differently.
// - Manages dark mode application to the welcome screen.
// - Fades out the welcome screen after a short delay.
// - Enhanced for quicker load visibility.

document.addEventListener('DOMContentLoaded', () =>
{
    const welcomeScreen = document.getElementById('welcome-screen');
    const welcomeMessage = document.getElementById('welcome-message');
    const loadingBar = document.getElementById('loading-bar');

    // Instantly apply dark mode if preferred for a faster visual load
    if (localStorage.getItem('darkMode') === 'enabled')
    {
        document.body.classList.add('dark-mode');
        // Apply to welcome screen if it exists
        welcomeScreen?.classList.add('dark-mode');
    }

    // Greet the user (Welcome Back! or Welcome!)
    const hasVisited = localStorage.getItem('hasVisited');
    welcomeMessage.textContent = hasVisited ? "Welcome Back!" : "Welcome!";
    // Mark that the user has visited for next time
    if (!hasVisited)
    {
        localStorage.setItem('hasVisited', 'true');
    }

    // Set the total time before the welcome screen starts to fade out.
    // This allows the loading bar animation to complete and a brief pause.
    const totalAnimationTime = 3500; // The total duration of the loading bar animation + pause.
    const fadeOutBuffer = 500;       // A little extra time before fading out completely.

    // After the animation and buffer, start fading out the welcome screen.
    setTimeout(() =>
    {
        welcomeScreen?.classList.add('fade-out');
        // Once the fade-out is complete, hide the welcome screen entirely.
        setTimeout
        (() =>
            {
                if (welcomeScreen)
                {
                    welcomeScreen.style.display = 'none';
                }
            },
            500
        );
    },
    
    totalAnimationTime + fadeOutBuffer);
});