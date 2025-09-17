// js/background.js

document.addEventListener('DOMContentLoaded', () => {

    const canvas = document.getElementById('interactive-bg');
    const ctx = canvas.getContext('2d');

    // Fix: Prevent the "Save Image" context menu on the canvas
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    let width, height;
    let particles = [];
    const numParticles = 80;
    const maxDistance = 120;
    let mouse = { x: null, y: null };
    
    // Set up canvas dimensions
    const resizeCanvas = () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Event listeners for mouse position
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });
    window.addEventListener('mouseout', () => {
        mouse.x = null;
        mouse.y = null;
    });

    // Parallax scroll effect
    const parallaxSpeed = 0.2; // Adjust this value to change the parallax intensity
    
    // Particle class
    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = Math.random() * 0.5 - 0.25;
            this.vy = Math.random() * 0.5 - 0.25;
            this.size = Math.random() * 1.5 + 1;
            this.color = 'rgba(139, 92, 246, 0.8)'; // A semi-transparent violet
        }

        // Update particle position
        update() {
            if (this.x > width || this.x < 0) this.vx = -this.vx;
            if (this.y > height || this.y < 0) this.vy = -this.vy;
            this.x += this.vx;
            this.y += this.vy;
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
        let opacityValue = 1;
        for (let a = 0; a < particles.length; a++) {
            for (let b = a; b < particles.length; b++) {
                // Calculate position with parallax effect
                const parallaxYA = particles[a].y - (window.scrollY * parallaxSpeed);
                const parallaxYB = particles[b].y - (window.scrollY * parallaxSpeed);

                const dx = particles[a].x - particles[b].x;
                const dy = parallaxYA - parallaxYB;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < maxDistance) {
                    opacityValue = 1 - (distance / maxDistance);
                    ctx.strokeStyle = 'rgba(139, 92, 246,' + opacityValue + ')';
                    ctx.lineWidth = 1;
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
        ctx.clearRect(0, 0, width, height); // Clear the canvas

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