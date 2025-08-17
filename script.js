// This is a global script file used across multiple pages (frontend and admin).
document.addEventListener('DOMContentLoaded', () => {

    // --- Mobile Menu Toggle ---
    // This script handles the slide-in sidebar for mobile views on all pages.
    const menuButton = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');

    if (menuButton && sidebar) {
        // Toggles the 'open' class on the sidebar when the menu button is clicked.
        menuButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevents the click from immediately closing the menu.
            sidebar.classList.toggle('open');
        });

        // Adds an event listener to the whole document to close the menu when clicking outside of it.
        document.addEventListener('click', (e) => {
            // Close the sidebar if it's open and the click target is not the sidebar itself or a child of it.
            if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== menuButton) {
                sidebar.classList.remove('open');
            }
        });
    }

    // --- Intersection Observer for Fade-In Animations ---
    // This creates a "fade and slide up" effect for elements as they enter the viewport.
    const observerOptions = {
        root: null, // observes intersections relative to the viewport
        rootMargin: '0px',
        threshold: 0.1 // Triggers when 10% of the element is visible
    };

    // The callback function to execute when an element is observed
    const animationObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            // If the element is intersecting the viewport
            if (entry.isIntersecting) {
                entry.target.classList.add('visible'); // Add the class that triggers the animation
                observer.unobserve(entry.target); // Stop observing the element once it's visible
            }
        });
    }, observerOptions);

    // Observe all static elements that have the .fade-in-up class on page load
    const staticElements = document.querySelectorAll('.fade-in-up');
    staticElements.forEach(el => animationObserver.observe(el));

    // Create a global function to observe dynamically added content (like product cards from Firebase)
    // This allows the index.html page to call this after it has loaded its products.
    window.observeDynamicContent = (selector) => {
        const dynamicElements = document.querySelectorAll(selector);
        dynamicElements.forEach((el, index) => {
            // Add a staggered delay to each item for a nice flowing effect
            el.style.transitionDelay = `${index * 75}ms`;
            animationObserver.observe(el);
        });
    }

    // NOTE: All other logic (Firebase auth, data fetching, pagination, sorting, etc.)
    // has been moved to page-specific <script type="module"> tags. This improves
    // performance and prevents script conflicts by only loading the necessary
    // code for each page. This file is now only for globally shared UI enhancements.
});