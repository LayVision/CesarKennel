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

    // --- Product Detail Gallery ---
    // Manages the image gallery on the product-detail.html page.
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

    // --- DRAG & DROP SORTING FOR ADMIN TABLE ---
    // Note: This requires the SortableJS library to be loaded on the page.
    const tableBody = document.getElementById('product-table-body');
    if (tableBody && typeof Sortable !== 'undefined') {
        new Sortable(tableBody, {
            handle: '.drag-handle', // Specifies which element triggers the drag.
            animation: 150, // Animation speed in ms.
            ghostClass: 'sortable-ghost', // CSS class for the placeholder element.
        });
    }

    // NOTE: Pagination logic has been moved to index.html to work with dynamic content.
    // NOTE: All login/logout logic is handled directly on the relevant pages using Firebase SDKs.
});