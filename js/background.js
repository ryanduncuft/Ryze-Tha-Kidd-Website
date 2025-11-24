/**
 * js/background.js
 * Creates a subtle, interactive particle background animation with parallax.
 * Optimized for performance: fixed canvas size, reduced layout thrashing, and efficient rendering.
 */

// Use an IIFE for better variable encapsulation.
(() => {
  // --- Configuration Constants ---
  const NUM_NODES = 40;
  const PARALLAX_SPEED = 0.1;
  const GLOW_COLOR = "rgba(139, 92, 246, 0.4)";

  // Early exit if animations are disabled
  if (localStorage.getItem("animations") === "disabled") {
    console.info("Background animations disabled by user preference.");
    return;
  }

  // Wait for the DOM to be ready
  document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("interactive-bg");
    // NOTE: The 'interactive-bg-wrapper' is no longer strictly needed
    // if we use a fixed canvas that only covers the viewport.
    const wrapper = document.getElementById("interactive-bg-wrapper");

    if (!canvas || !wrapper) {
      console.error(
        'Required elements ("interactive-bg" or "interactive-bg-wrapper") for background animation not found.'
      );
      return;
    }

    const ctx = canvas.getContext("2d");
    let width = window.innerWidth;
    let height = window.innerHeight; // *** Optimization: Use innerHeight, not document.body.scrollHeight ***
    const nodes = [];

    // Variable to store the last scroll position, updated outside the animation loop
    let lastScrollY = window.scrollY;

    // Prevent the "Save Image" context menu on the canvas
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    // --- Canvas Setup & Resizing ---
    const resizeCanvas = () => {
      // Optimization: The canvas is now fixed/positioned to cover the viewport only.
      // This prevents the expensive need to constantly check and update the body's scroll height.
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;

      // Re-center all existing nodes when the viewport size changes
      // A more complex re-initialization can be done here if needed.
      // For now, we only need to reposition.
      nodes.forEach((node) => {
        node.x = Math.random() * width;
        node.y = Math.random() * height;
      });

      // Ensure the fixed wrapper is set to 100% viewport height and width
      wrapper.style.height = "100vh";
      wrapper.style.width = "100vw";
    };

    // Initial setup and event listeners
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // *** REMOVED: ResizeObserver for document.body.scrollHeight is removed. ***
    // It was computationally heavy. The canvas is now fixed to the viewport (100vh/100vw).

    // *** Optimization: Separate scroll position updates from the animation loop. ***
    // Use requestAnimationFrame for scroll reading to batch reads and prevent layout thrashing (jank).
    const updateScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY !== lastScrollY) {
        lastScrollY = currentScrollY;
      }
      requestAnimationFrame(updateScroll);
    };
    requestAnimationFrame(updateScroll); // Start the scroll position polling

    // --- Node Class ---
    class Node {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = Math.random() * 0.2 - 0.1;
        this.vy = Math.random() * 0.2 - 0.1;
        // Pre-calculate size and color to avoid repeated computation in the loop
        this.size = Math.random() * 0.8 + 0.5;
        this.color = `rgba(139, 92, 246, ${Math.random() * 0.4 + 0.2})`;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Toroidal wrapping logic based on current canvas size (viewport)
        if (this.x > width) this.x = 0;
        if (this.x < 0) this.x = width;
        if (this.y > height) this.y = 0;
        if (this.y < 0) this.y = height;
      }

      draw() {
        // *** PERFORMANCE IMPROVEMENT: Use the pre-calculated lastScrollY. ***
        // This ensures the animation loop reads a non-changing value within the frame.
        // The parallax offset should be based on the total scroll distance.
        // Note: Since the canvas is fixed to the viewport, the node Y position
        // should be relative to the viewport top, and the parallax only affects the offset.
        const parallaxY = this.y + lastScrollY * PARALLAX_SPEED;

        // --- Simple and fast drawing ---
        // Avoid repeated ctx property setting where possible (shadow settings are OK).
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 5;
        ctx.shadowColor = GLOW_COLOR;

        ctx.beginPath();
        // Ensure nodes are drawn within the bounds of the viewport/canvas height
        ctx.arc(this.x, parallaxY % (height + 200), this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Initialize nodes
    const createNodes = () => {
      for (let i = 0; i < NUM_NODES; i++) {
        nodes.push(new Node());
      }
    };

    // --- Main Animation Loop ---
    const animate = () => {
      // Clear the canvas only up to the viewport height (which is the canvas height)
      ctx.clearRect(0, 0, width, height);

      // Simple loop for updates and draws
      for (let i = 0; i < NUM_NODES; i++) {
        nodes[i].update();
        nodes[i].draw();
      }

      requestAnimationFrame(animate);
    };

    // Start the animation
    createNodes();
    animate();
  });
})();
