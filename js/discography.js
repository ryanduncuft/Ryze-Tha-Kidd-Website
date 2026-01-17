/**
 * js/discography.js
 * Optimized handler for fetching, filtering, and rendering the full discography.
 * Focuses on pre-processing data to minimize repeated calculations during rendering.
 */

document.addEventListener("DOMContentLoaded", () => {
  // --- Constants and DOM Elements ---

  const GIST_URL =
    "https://gist.githubusercontent.com/ryanduncuft/39ade5f46c7b0a11618f5f016606ecc2/raw/rtk_data.json";
  const PRIMARY_RELEASE_TYPES = ["album", "ep", "single", "collab"];

  // DOM Elements - Using querySelector for robustness
  const releasesGrid = document.getElementById("releases-grid");
  const filterContainer = document.getElementById("filter-container");
  const sortDropdown = document.getElementById("sort-by");
  const loadingState = document.getElementById("loading-state");
  const errorState = document.getElementById("error-state");
  const noReleasesMessage = document.getElementById("no-releases-message");

  // Global state - Stores the pre-processed, filterable data
  let processedReleases = [];
  let activeCategory = "all";
  let activeSort = "date-desc";

  // --- Helper Functions ---

  /**
   * Converts a standard date string (YYYY-MM-DD) to a human-readable format.
   * This function is now used ONLY ONCE during data preparation.
   */
  const formatDisplayDate = (dateString) => {
    if (!dateString) return "TBD";

    const date = new Date(dateString);

    if (isNaN(date)) {
      console.warn(`Invalid date string encountered: ${dateString}`);
      return "TBD";
    }

    const options = { year: "numeric", month: "long", day: "numeric" };

    try {
      let formattedDate = date.toLocaleDateString("en-GB", options);
      let day = date.getDate();

      const suffix =
        day % 10 === 1 && day % 100 !== 11
          ? "st"
          : day % 10 === 2 && day % 100 !== 12
          ? "nd"
          : day % 10 === 3 && day % 100 !== 13
          ? "rd"
          : "th";

      // Find the day number (which is first in en-GB) and replace it with the suffixed version
      return formattedDate.replace(day, day + suffix);
    } catch (e) {
      // Fallback for non-standard environments
      return date.toLocaleDateString("en-US", options);
    }
  };

  /**
   * *** PERFORMANCE IMPROVEMENT: Data Pre-processing. ***
   * Converts raw data into a usable format, performing expensive calculations (like date formatting) only once.
   * Also attaches pre-calculated sort keys.
   * @param {Array} rawData - The raw JSON data.
   * @returns {Array} The optimized array of release objects.
   */
  const prepareReleases = (rawData) => {
    // Filter out non-primary types first
    const filtered = rawData.filter((release) =>
      PRIMARY_RELEASE_TYPES.includes(release.type)
    );

    // Map and pre-calculate all derived properties
    return filtered.map((release) => ({
      ...release,
      // Pre-calculate the expensive date string
      displayDate: formatDisplayDate(release.releaseDate),
      // Pre-calculate the capitalized type tag
      typeTag: release.type ? release.type.toUpperCase() : "",
      // Pre-calculate a numeric date for faster sorting later
      dateValue: new Date(release.releaseDate).getTime() || 0,
      // Pre-calculate lowercase titles for faster string comparison sorting
      titleLower: (release.title || "").toLowerCase(),
      artistLower: (release.artist || "").toLowerCase(),
    }));
  };

  const updateStateUI = (state) => {
    // Toggle visibility based on the state
    releasesGrid?.classList.toggle(
      "hidden",
      state === "loading" || state === "error" || state === "no_releases"
    );
    loadingState?.classList.toggle("hidden", state !== "loading");
    errorState?.classList.toggle("hidden", state !== "error");
    noReleasesMessage?.classList.toggle("hidden", state !== "no_releases");
  };

  /**
   * *** PERFORMANCE IMPROVEMENT: Optimized Sort Function. ***
   * Uses pre-calculated numeric and lowercase properties for faster sorting comparisons.
   */
  const sortReleases = (releases, sortValue) => {
    // Return a fresh clone to ensure the sort doesn't mutate the original filtered array
    let sorted = [...releases];

    switch (sortValue) {
      case "title-asc":
        // Use pre-calculated lowercase titles
        sorted.sort((a, b) => a.titleLower.localeCompare(b.titleLower));
        break;
      case "artist-asc":
        // Use pre-calculated lowercase artists
        sorted.sort((a, b) => a.artistLower.localeCompare(b.artistLower));
        break;
      case "date-asc":
        // Use numeric timestamp comparison (faster than creating Date objects repeatedly)
        sorted.sort((a, b) => a.dateValue - b.dateValue);
        break;
      case "date-desc":
      default:
        // Use numeric timestamp comparison (faster than creating Date objects repeatedly)
        sorted.sort((a, b) => b.dateValue - a.dateValue);
        break;
    }
    return sorted;
  };

  // --- Core Functions ---

  /**
   * Renders release cards to the grid. Uses the final sorted array.
   * The logic here is much simpler as the data is already formatted.
   */
  const renderCards = (releases) => {
    if (!releasesGrid) return;

    if (releases.length === 0) {
      updateStateUI("no_releases");
      releasesGrid.innerHTML = "";
      return;
    }

    updateStateUI("success");

    // Use map/join for efficient single DOM write.
    const html = releases
      .map((release) => {
        // Destructure pre-calculated properties
        const { title, artist, image, listenLink, type, displayDate, typeTag } =
          release;

        return `
                <div class="release-card group" data-category="${type}">
                    <a 
                        href="${listenLink}" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        aria-label="Listen to ${title} on streaming platforms" 
                        class="block"
                    >
                        <span class="release-type-tag">${typeTag}</span>

                        <div class="relative w-full aspect-square overflow-hidden rounded-t-xl">
                            <img 
                                src="${image}" 
                                alt="${title} cover" 
                                loading="lazy"
                                class="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-[1.03] rounded-t-xl"
                            >
                            <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <i class="fas fa-play-circle fa-3x text-white/90"></i>
                            </div>
                        </div>
                    </a>

                    <div class="p-4 text-center">
                        <h3 class="release-title truncate" title="${title}">${title}</h3>
                        <p class="text-xs text-gray-400 mb-2 truncate">${artist}</p> 
                        <p class="text-xs text-gray-500 font-medium">${displayDate}</p>
                    </div>
                </div>
            `;
      })
      .join("");

    // Only one DOM write operation
    releasesGrid.innerHTML = html;
  };

  /**
   * Applies the current filter, sorts the result, and then renders.
   */
  const filterSortAndRender = () => {
    // 1. Filter: Use the pre-processed list
    const filteredReleases =
      activeCategory === "all"
        ? processedReleases
        : processedReleases.filter(
            (release) => release.type === activeCategory
          );

    // 2. Sort: Use the optimized sort function
    const finalReleases = sortReleases(filteredReleases, activeSort);

    // 3. Render: Display the final result
    renderCards(finalReleases);
  };

  /**
   * Handles the click event for filter buttons.
   */
  const handleFilterClick = (e) => {
    const target = e.target.closest(".filter-btn");
    if (!target) return;

    const category = target.dataset.category;

    if (activeCategory === category) return;

    activeCategory = category; // Update global state

    // Update active state of buttons using event delegation
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      const isActive = btn.dataset.category === category;
      btn.classList.toggle("filter-btn-active", isActive);
      // Assuming 'filter-btn-inactive' is the complement of 'filter-btn-active'
      // and relying on CSS to handle the default state if neither is present.
    });

    // Only one function call to handle filtering, sorting, and rendering
    filterSortAndRender();
  };

  /**
   * Handles the change event for the sort dropdown.
   */
  const handleSortChange = (e) => {
    activeSort = e.target.value;
    // Only one function call to handle filtering, sorting, and rendering
    filterSortAndRender();
  };

  /**
   * Fetches the discography data, prepares it once, and initializes the page.
   */
  const fetchDiscography = async () => {
    if (!releasesGrid) {
      console.error("Initialization failed: Target grid element missing.");
      return;
    }

    try {
      updateStateUI("loading");

      const response = await fetch(GIST_URL);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch discography data. HTTP status: ${response.status}`
        );
      }
      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Fetched data is not a valid array.");
      }

      // *** CRITICAL OPTIMIZATION STEP: Prepare data once! ***
      processedReleases = prepareReleases(data);

      // Initial render
      filterSortAndRender();
    } catch (error) {
      console.error("Critical error during discography fetch:", error.message);
      updateStateUI("error");
    }
  };

  // --- Event Listeners and Initialization ---

  filterContainer?.addEventListener("click", handleFilterClick);
  sortDropdown?.addEventListener("change", handleSortChange);

  // Initial data fetch on page load
  fetchDiscography();
});
