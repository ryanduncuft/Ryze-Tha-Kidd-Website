/**
 * js/footer.js
 * Optimized handler for fetching the footer HTML, setting the current year,
 * and setting up utility functions.
 */

// Use an IIFE for encapsulation and quick execution
(async () => {
  const footerContainer = document.getElementById("footer-container");
  if (!footerContainer) {
    console.warn("Footer container element not found. Aborting footer script.");
    return;
  }

  // --- Utility Functions (now passed the footer element for local lookup) ---

  /**
   * Sets the current year in the footer's designated span.
   */
  const initializeCurrentYear = (footerEl) => {
    // Use the passed element (footerEl) for quick lookup
    const currentYearSpan = footerEl.querySelector("#current-year");
    if (currentYearSpan) {
      currentYearSpan.textContent = new Date().getFullYear();
    }
  };

  /**
   * Adds functionality to clear local and session storage upon button click.
   */
  const setupCacheClear = (footerEl) => {
    const clearCacheBtn = footerEl.querySelector("#clear-cache-btn");
    clearCacheBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      if (
        confirm(
          "Are you sure you want to clear the local cache? This will reset all site preferences and reload the page."
        )
      ) {
        localStorage.clear();
        sessionStorage.clear();

        // Use window.location.reload() without the 'true' argument (which is deprecated)
        alert("Local cache has been cleared. The page will now reload.");
        window.location.reload();
      }
    });
  };

  /**
   * Toggles the background animations on and off via localStorage and reloads.
   */
  const setupAnimationToggle = (footerEl) => {
    const toggleAnimationBtn = footerEl.querySelector("#toggle-animation-btn");

    if (toggleAnimationBtn) {
      // Check state once
      const animationsEnabled =
        localStorage.getItem("animations") !== "disabled";
      toggleAnimationBtn.textContent = `Toggle Animations: ${
        animationsEnabled ? "On" : "Off"
      }`;

      toggleAnimationBtn.addEventListener("click", (e) => {
        e.preventDefault();

        // Determine new state based on current state (only checking for 'disabled')
        const isCurrentlyDisabled =
          localStorage.getItem("animations") === "disabled";
        const newState = isCurrentlyDisabled ? "enabled" : "disabled";

        localStorage.setItem("animations", newState);

        alert(
          `Animations have been turned ${
            newState === "enabled" ? "on" : "off"
          }. The page will now reload to apply the changes.`
        );
        window.location.reload();
      });
    }
  };

  /**
   * Fetches and injects the footer HTML, then sets up its functionality.
   */
  const loadAndInitializeFooter = async () => {
    const componentPath = "/components/footer.html";
    try {
      // Use cache for static components
      const response = await fetch(componentPath, { cache: "force-cache" });

      if (!response.ok) {
        console.error(`Failed to fetch component from path: ${componentPath}`);
        throw new Error(`Network response was not ok for ${componentPath}`);
      }

      const html = await response.text();
      footerContainer.innerHTML = html;

      // Use the footerContainer element for targeted lookups
      // inside the setup functions (slight performance gain)
      initializeCurrentYear(footerContainer);
      setupCacheClear(footerContainer);
      setupAnimationToggle(footerContainer);
    } catch (error) {
      console.error("Final Error loading or initializing footer:", error);
      // On catastrophic failure, hide the container instead of showing broken content
      footerContainer.classList.add("hidden");
    }
  };

  // Initialize the app when the DOM is fully loaded.
  document.addEventListener("DOMContentLoaded", loadAndInitializeFooter);
})();
