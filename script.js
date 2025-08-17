document.addEventListener('DOMContentLoaded', () => {
    // --- Mobile Menu Toggle for BOTH frontend and admin ---
    // This script handles the slide-in sidebar for mobile views.
    const menuButton = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');

    if (menuButton && sidebar) {
        // Toggles the 'open' class on the sidebar when the menu button is clicked.
        menuButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevents the click from closing the menu immediately.
            sidebar.classList.toggle('open');
        });
        // Adds an event listener to the whole document to close the menu when clicking outside of it.
        document.addEventListener('click', (e) => {
            if (sidebar.classList.contains('open') && !sidebar.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
    }

    // --- Intersection Observer for Animations (NEW) ---
    // This beautiful effect makes sections fade and slide up as they enter the viewport.
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1 // Animate when 10% of the element is visible
    };

    const animationObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all static elements that have the .fade-in-up class
    const staticElements = document.querySelectorAll('.fade-in-up');
    staticElements.forEach(el => animationObserver.observe(el));
    
    // Create a function on the window object to observe dynamically added content (like product cards)
    window.observeDynamicContent = (selector) => {
        const dynamicElements = document.querySelectorAll(selector);
        dynamicElements.forEach((el, index) => {
            // Add a staggered delay to each item for a nice flowing effect
            el.style.transitionDelay = `${index * 75}ms`;
            animationObserver.observe(el);
        });
    }


    // --- Product Detail Gallery ---
    // This logic is now correctly handled in the product-detail.html file's module script 
    // to ensure it runs only after the dynamic gallery has been created.
    // The code here is being left as a fallback but is technically redundant.
    const mainImage = document.getElementById('mainImage');
    const thumbnails = document.querySelectorAll('.detail-thumbnails img');
    if (mainImage && thumbnails.length) {
        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', function() {
                // Gets a higher resolution version of the thumbnail source for the main image.
                const highResSrc = this.src.replace('&w=400', '&w=800');
                mainImage.src = highResSrc;
                // Updates the 'active' class to highlight the selected thumbnail.
                thumbnails.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }

    // NOTE: All login/logout logic has been removed from this file.
    // It is now handled directly on the relevant pages (login.html, add-item.html, etc.)
    // using Firebase Authentication SDKs.

    // --- PAGINATION LOGIC REMOVED ---
    // The URL-based pagination logic has been removed from this global script.
    // The correct, functioning pagination logic is now exclusively located inside the 
    // <script type="module"> tag in 'index.html'. This ensures that pagination is 
    // only initialized *after* the product data has been fetched from Firebase, 
    // preventing conflicts and ensuring the correct number of pages is always calculated.

    // NOTE: The drag-and-drop sorting logic for the admin table has also been removed.
    // It is now correctly handled exclusively within admin.html to prevent conflicts.
});