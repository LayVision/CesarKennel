document.addEventListener('DOMContentLoaded', () => {
    // --- Firebase Initialization (for pages that need auth state) ---
    // We initialize Firebase here to make auth services available on all pages.
    // This allows us to have a persistent login state and a working logout button.
    const firebaseConfig = {
        apiKey: "AIzaSyA85L7n2CGKocgWg-Z8TsNlUN9AVVJguBQ",
        authDomain: "cesarkennel.firebaseapp.com",
        projectId: "cesarkennel",
        storageBucket: "cesarkennel.firebasestorage.app",
        messagingSenderId: "512752480416",
        appId: "1:512752480416:web:c71aa9dc281a3932b419c5"
    };

    // Initialize Firebase if it hasn't been initialized yet.
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const auth = firebase.auth();

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

    // --- Admin Login/Logout Links (REVISED) ---
    // Manages the authentication link text and behavior based on login state.
    const authLink = document.getElementById('auth-link');
    const logoutButton = document.getElementById('logout-button');
    // Checks localStorage to see if the user is logged in.
    const isAdmin = localStorage.getItem('isAdminLoggedIn') === 'true';

    // On the public site, changes the login link to a dashboard link if logged in.
    if (authLink) {
        if(isAdmin) {
            authLink.textContent = 'แผงควบคุม';
            authLink.href = 'admin.html';
        } else {
            authLink.textContent = 'เข้าสู่ระบบผู้ดูแล';
            authLink.href = 'login.html';
        }
    }
    
    // In the admin panel, handles the logout functionality.
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            
            // --- REVISED LOGIC ---
            // Signs the user out of their Firebase session.
            auth.signOut().then(() => {
                // This block runs after a successful sign-out.
                // Removes the login flag from localStorage.
                localStorage.removeItem('isAdminLoggedIn');
                alert('คุณออกจากระบบแล้ว');
                // Redirects to the homepage.
                window.location.href = 'index.html';
            }).catch((error) => {
                // This block runs if there's an error during sign-out.
                console.error('Logout failed:', error);
                alert('เกิดข้อผิดพลาดในการออกจากระบบ');
            });
        });
    }

    // --- URL-BASED PAGINATION LOGIC ---
    // Handles pagination on the index.html page.
    const productGrid = document.getElementById('product-grid');
    const paginationContainer = document.getElementById('pagination');

    if (productGrid && paginationContainer) {
        const itemsPerPage = 6;
        const allItems = Array.from(productGrid.getElementsByClassName('product-card'));
        const totalPages = Math.ceil(allItems.length / itemsPerPage);

        // Function to display items for a specific page.
        function displayPage(page) {
            page = Math.max(1, Math.min(page, totalPages)); // Ensure page is within valid range.
            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            // Hide all items, then show only the ones for the current page.
            allItems.forEach(item => item.style.display = 'none');
            allItems.slice(startIndex, endIndex).forEach(item => item.style.display = 'block');
            
            // Re-generate pagination buttons.
            paginationContainer.innerHTML = '';
            if (totalPages <= 1) return; // No pagination if only one page.

            // Create "Previous" button.
            const prevButton = document.createElement('a');
            prevButton.classList.add('page-btn');
            prevButton.textContent = 'ก่อนหน้า';
            prevButton.href = `?page=${page - 1}`;
            if (page === 1) { prevButton.classList.add('disabled'); }
            paginationContainer.appendChild(prevButton);

            // Create page number buttons.
            for (let i = 1; i <= totalPages; i++) {
                const pageButton = document.createElement('a');
                pageButton.classList.add('page-btn');
                pageButton.textContent = i;
                pageButton.href = (i === 1) ? window.location.pathname.split('?')[0] : `?page=${i}`; // Clean URL for page 1.
                if (i === page) { pageButton.classList.add('active'); }
                paginationContainer.appendChild(pageButton);
            }

            // Create "Next" button.
            const nextButton = document.createElement('a');
            nextButton.classList.add('page-btn');
            nextButton.textContent = 'ถัดไป';
            nextButton.href = `?page=${page + 1}`;
             if (page === totalPages) { nextButton.classList.add('disabled'); }
            paginationContainer.appendChild(nextButton);
        }

        // Handles clicks on pagination buttons.
        function handleNavigation(e) {
            const target = e.target.closest('.page-btn');
            if (!target || target.classList.contains('active') || target.classList.contains('disabled')) {
                e.preventDefault(); return;
            }
            e.preventDefault(); // Prevent default link behavior.
            const url = new URL(target.href);
            const page = parseInt(url.searchParams.get('page')) || 1;
            // Update the browser URL without a full page reload.
            history.pushState({page: page}, '', target.href);
            displayPage(page);
        }

        paginationContainer.addEventListener('click', handleNavigation);
        
        // Handles browser back/forward navigation.
        window.addEventListener('popstate', (e) => {
            const urlParams = new URLSearchParams(window.location.search);
            const page = parseInt(urlParams.get('page')) || 1;
            displayPage(page);
        });

        // Get the initial page from the URL on first load.
        const initialUrlParams = new URLSearchParams(window.location.search);
        const initialPage = parseInt(initialUrlParams.get('page')) || 1;
        displayPage(initialPage);
    }

    // --- DRAG & DROP SORTING FOR ADMIN TABLE ---
    // Uses the SortableJS library to enable row sorting.
    const tableBody = document.getElementById('product-table-body');
    if (tableBody) {
        new Sortable(tableBody, {
            handle: '.drag-handle', // Specifies which element triggers the drag.
            animation: 150, // Animation speed in ms.
            ghostClass: 'sortable-ghost', // CSS class for the placeholder element.
        });
    }
});