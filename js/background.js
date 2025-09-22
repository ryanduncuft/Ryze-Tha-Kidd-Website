// js/background.js
document.addEventListener('DOMContentLoaded', () => {
    // Check if animations are disabled via localStorage setting
    if (localStorage.getItem('animations') === 'disabled') {
        console.log('Animations are disabled by user preference.');
        return; // Exit the script to prevent animation from running
    }

    const canvas = document.getElementById('interactive-bg');
    if (!canvas) {
        console.error('Canvas element with id "interactive-bg" not found.');
        return;
    }
    const ctx = canvas.getContext('2d');

    // Fix: Prevent the "Save Image" context menu on the canvas
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    let width, height;
    const particles = [];
    const numParticles = 80;
    const maxDistance = 120;
    let mouse = { x: null, y: null };
    
    // Set up canvas dimensions to cover the entire document height
    const resizeCanvas = () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = document.body.scrollHeight;
        
        // This is a crucial fix: ensure the background wrapper also has this height
        const wrapper = document.getElementById('interactive-bg-wrapper');
        if (wrapper) {
            wrapper.style.height = `${height}px`;
        }
    };
    window.addEventListener('resize', resizeCanvas);
    
    // Add a listener for when content changes (e.g., dynamic loading)
    // This is more of a safety measure for single-page applications.
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(document.body);
    
    resizeCanvas();

    // Event listeners for mouse position
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY + window.scrollY; // Adjust for scroll position
    });
    window.addEventListener('mouseout', () => {
        mouse.x = null;
        mouse.y = null;
    });

    // Parallax scroll effect speed
    const parallaxSpeed = 0.2; 
    
    // Particle class
    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = Math.random() * 0.5 - 0.25;
            this.vy = Math.random() * 0.5 - 0.25;
            this.size = Math.random() * 1.5 + 1;
            this.color = 'rgba(139, 92, 246, 0.8)';
        }

        // Update particle position
        update() {
            // Adjust particle movement for larger canvas
            this.x += this.vx;
            this.y += this.vy;

            // Bounce particles off the new, larger canvas boundaries
            if (this.x > width || this.x < 0) this.vx = -this.vx;
            if (this.y > height || this.y < 0) this.vy = -this.vy;
        }

        // Draw particle with parallax effect
        draw() {
            // Apply the parallax scroll effect directly to the particle's y-coordinate
            const parallaxY = this.y - (window.scrollY * parallaxSpeed);

            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, parallaxY, this.size, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
        }
    }

    // Function to create particles
    const createParticles = () => {
        for (let i = 0; i < numParticles; i++) {
            particles.push(new Particle());
        }
    };

    // Function to connect particles with lines
    const connectParticles = () => {
        ctx.lineWidth = 1;
        for (let a = 0; a < particles.length; a++) {
            for (let b = a + 1; b < particles.length; b++) { // Optimized loop to avoid double-checking pairs
                // Calculate position with parallax effect
                const parallaxYA = particles[a].y - (window.scrollY * parallaxSpeed);
                const parallaxYB = particles[b].y - (window.scrollY * parallaxSpeed);

                const dx = particles[a].x - particles[b].x;
                const dy = parallaxYA - parallaxYB;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < maxDistance) {
                    const opacityValue = 1 - (distance / maxDistance);
                    ctx.strokeStyle = `rgba(139, 92, 246, ${opacityValue})`;
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, parallaxYA);
                    ctx.lineTo(particles[b].x, parallaxYB);
                    ctx.stroke();
                }
            }
        }
    };

    // Main animation loop
    const animate = () => {
        ctx.clearRect(0, 0, width, window.innerHeight); // Only clear the visible canvas area

        particles.forEach(p => {
            p.update();
            p.draw();
        });

        connectParticles();
        requestAnimationFrame(animate);
    };

    // Start the animation
    createParticles();
    animate();
});