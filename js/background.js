/**
 * js/background.js
 * Creates a subtle, interactive particle background animation with parallax.
 */

// Use an IIFE for better variable encapsulation, though the original document.addEventListener is also fine.
(() => {
    // --- Configuration Constants ---
    const NUM_NODES = 40; 
    const PARALLAX_SPEED = 0.1; // Very subtle depth effect
    const GLOW_COLOR = 'rgba(139, 92, 246, 0.4)'; // Violet glow color

    // Check for user preference to disable animations globally
    if (localStorage.getItem('animations') === 'disabled') {
        console.info('Background animations disabled by user preference.');
        return;
    }

    // Wait for the DOM to be ready
    document.addEventListener('DOMContentLoaded', () => {
        const canvas = document.getElementById('interactive-bg');
        const wrapper = document.getElementById('interactive-bg-wrapper');
        
        if (!canvas || !wrapper) {
            // Check for both the canvas and its fixed wrapper
            console.error('Required elements ("interactive-bg" or "interactive-bg-wrapper") for background animation not found.');
            return;
        }

        const ctx = canvas.getContext('2d');
        let width = window.innerWidth;
        let height = document.body.scrollHeight;
        const nodes = [];

        // Prevent the "Save Image" context menu on the canvas
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // --- Canvas Setup & Resizing ---
        const resizeCanvas = () => {
            // Update dimensions
            width = canvas.width = window.innerWidth;
            height = canvas.height = document.body.scrollHeight;
            
            // Ensure the fixed wrapper matches the body's full scroll height
            wrapper.style.height = `${height}px`; 
        };
        
        // Initial setup and event listeners
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // Observe body for height changes (e.g., content loading, DOM manipulation)
        // This is necessary because canvas needs to cover the full scrollable area.
        const resizeObserver = new ResizeObserver(resizeCanvas);
        resizeObserver.observe(document.body);
        
        // --- Node Class ---
        class Node {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                // Very slow, subtle drift: -0.1 to 0.1
                this.vx = Math.random() * 0.2 - 0.1; 
                this.vy = Math.random() * 0.2 - 0.1;
                // Very small size: 0.5 to 1.3
                this.size = Math.random() * 0.8 + 0.5; 
                // Reduced opacity for a subdued look: 0.2 to 0.6
                this.color = `rgba(139, 92, 246, ${Math.random() * 0.4 + 0.2})`; 
            }

            update() {
                // Simple toroidal wrapping movement
                this.x += this.vx;
                this.y += this.vy;

                if (this.x > width) this.x = 0;
                if (this.x < 0) this.x = width;
                if (this.y > height) this.y = 0;
                if (this.y < 0) this.y = height;
            }

            draw() {
                // Apply the parallax scroll effect relative to the fixed canvas position
                const parallaxY = this.y - (window.scrollY * PARALLAX_SPEED);
                
                // Set drawing styles
                ctx.fillStyle = this.color;
                ctx.shadowBlur = 5;
                ctx.shadowColor = GLOW_COLOR; 

                // Draw the node
                ctx.beginPath();
                ctx.arc(this.x, parallaxY, this.size, 0, Math.PI * 2); 
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
            // Clear the canvas, clearing only the current visible viewport height for performance
            ctx.clearRect(0, 0, width, window.innerHeight); 

            nodes.forEach(p => {
                p.update();
                p.draw();
            });

            requestAnimationFrame(animate);
        };

        // Start the animation
        createNodes();
        animate();
    });
})();