/**
 * js/navbar.js
 * Optimized handler for fetching the navbar HTML and setting up mobile menu functionality.
 */

// Use an IIFE for encapsulation and quick execution
(async () => {
  const navbarContainer = document.getElementById("navbar-container");
  if (!navbarContainer) {
    console.warn("Navbar container element not found. Aborting navbar script.");
    return;
  }

  // --- Core UI Elements (cached after loading) ---
  let mobileMenu;
  let mainContent;
  let desktopMenu;
  let mobileMenuList;

  /**
   * Toggles the mobile menu open/closed state efficiently.
   * Caches element lookups after initial load.
   */
  // This is the RECOMMENDED replacement for your toggleMenu function in js/navbar.js

  const toggleMenu = (open) => {
    const mobileMenu = document.getElementById("mobile-menu");
    const mainContent = document.getElementById("main-content");

    if (!mobileMenu || !mainContent) {
      console.warn("Mobile menu elements are missing.");
      return;
    }

    // Toggle mobile menu visibility
    mobileMenu.classList.toggle("-translate-x-full", !open);

    // *** FIX: REMOVE THESE LINES TO STOP BLURRING AND JANK ***
    /*
    mainContent.classList.toggle('blur-sm', open);
    mainContent.classList.toggle('scale-95', open);
    mainContent.classList.toggle('pointer-events-none', open);
    */

    // Set aria-expanded state for accessibility
    document
      .getElementById("menu-toggle-btn")
      .setAttribute("aria-expanded", open);

    // Prevent background scrolling when menu is open (CRITICAL)
    document.body.style.overflow = open ? "hidden" : "";

    // Optionally, if you still want to dim the content slightly:
    mainContent.classList.toggle("is-dimmed", open);
  };

  /**
   * Sets up the mobile menu's functionality after the HTML is loaded.
   */
  const setupMobileMenu = () => {
    // --- Cache Elements Locally ---
    desktopMenu = navbarContainer.querySelector("header nav ul");
    mobileMenuList = document.getElementById("mobile-menu-links");
    const menuToggleBtn = document.getElementById("menu-toggle-btn");
    const menuCloseBtn = document.getElementById("menu-close-btn");
    mobileMenu = document.getElementById("mobile-menu"); // Cache mobile menu
    mainContent = document.getElementById("main-content"); // Cache main content

    if (
      !desktopMenu ||
      !mobileMenuList ||
      !menuToggleBtn ||
      !menuCloseBtn ||
      !mobileMenu ||
      !mainContent
    ) {
      console.warn(
        "Required mobile menu elements were not found after fetching navbar."
      );
      return;
    }

    // 1. Populate the mobile menu from the desktop links
    const fragment = document.createDocumentFragment();
    // Use querySelectorAll which returns a static NodeList, slightly cleaner
    const menuLinks = desktopMenu.querySelectorAll("li a");

    menuLinks.forEach((anchor) => {
      const clonedAnchor = anchor.cloneNode(true);
      const listItem = document.createElement("li"); // Create the necessary wrapper

      // Add necessary mobile styling directly to the anchor
      clonedAnchor.classList.add(
        "block",
        "py-2",
        "transition-colors",
        "duration-300"
      );
      clonedAnchor.classList.remove("duration-500"); // Clean up redundant class

      listItem.appendChild(clonedAnchor);
      fragment.appendChild(listItem);
    });

    // Single DOM write
    mobileMenuList.appendChild(fragment);

    // 2. Attach Event Listeners
    menuToggleBtn.addEventListener("click", () => toggleMenu(true));
    menuCloseBtn.addEventListener("click", () => toggleMenu(false));

    // Use single delegation on the mobile menu list
    mobileMenuList.addEventListener("click", (e) => {
      if (e.target.closest("a")) {
        toggleMenu(false);
      }
    });

    // Close menu when the overlay is clicked
    mobileMenu.addEventListener("click", (e) => {
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
      const response = await fetch("/components/navbar.html", {
        cache: "force-cache",
      }); // Use cache if possible
      if (!response.ok) {
        throw new Error(
          `Failed to fetch navbar HTML. Status: ${response.status}`
        );
      }
      const html = await response.text();
      navbarContainer.innerHTML = html;

      setupMobileMenu();
    } catch (error) {
      console.error("Error loading or initializing navbar:", error);
      // Optionally hide the container or show a fallback message
    }
  };

  // Initialize the app when the DOM is fully loaded.
  document.addEventListener("DOMContentLoaded", loadAndInitializeNavbar);
})();
