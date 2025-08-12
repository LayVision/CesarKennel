document.addEventListener('DOMContentLoaded', () => {
    // --- Firebase Initialization ---
    // This configuration and initialization is needed on all pages
    // to access Firebase services like Authentication.
    const firebaseConfig = {
        apiKey: "AIzaSyA85L7n2CGKocgWg-Z8TsNlUN9AVVJguBQ",
        authDomain: "cesarkennel.firebaseapp.com",
        projectId: "cesarkennel",
        storageBucket: "cesarkennel.firebasestorage.app",
        messagingSenderId: "512752480416",
        appId: "1:512752480416:web:c71aa9dc281a3932b419c5"
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const auth = firebase.auth();

    // --- NEW: CENTRAL AUTHENTICATION CHECKER ---
    // This is the core of the fix. It runs on every page and checks the user's real-time login status with Firebase.
    const authLink = document.getElementById('auth-link');
    const logoutButtons = document.querySelectorAll('.logout-link'); // Select all logout links/buttons

    auth.onAuthStateChanged(user => {
        if (user) {
            // --- User is signed in ---
            console.log("User is logged in:", user.email);
            // Set the local storage flag for immediate UI updates on other scripts if needed.
            localStorage.setItem('isAdminLoggedIn', 'true');

            // Update the public-facing "Login" link to be a "Dashboard" link.
            if (authLink) {
                authLink.textContent = 'แผงควบคุม';
                authLink.href = 'admin.html';
            }

        } else {
            // --- User is signed out ---
            console.log("User is logged out.");
            // Clear the local storage flag.
            localStorage.removeItem('isAdminLoggedIn');

            // Update the public-facing "Login" link to its default state.
            if (authLink) {
                authLink.textContent = 'เข้าสู่ระบบผู้ดูแล';
                authLink.href = 'login.html';
            }

            // --- ROUTE GUARD ---
            // If the user is on an admin page but is not logged in, redirect them to the login page.
            const adminPages = ['admin.html', 'add-item.html', 'settings.html'];
            const currentPage = window.location.pathname.split('/').pop();
            if (adminPages.includes(currentPage)) {
                console.log("Access denied. Redirecting to login.");
                window.location.href = 'login.html';
            }
        }
    });

    // --- REVISED: Logout Button Logic ---
    // This listener is now simpler. It just tells Firebase to sign out.
    // The onAuthStateChanged listener above will handle everything else (redirects, UI changes).
    if (logoutButtons.length) {
        logoutButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                auth.signOut().then(() => {
                    alert('คุณออกจากระบบแล้ว');
                }).catch((error) => {
                    console.error('Logout failed:', error);
                });
            });
        });
    }

    // --- Mobile Menu Toggle for BOTH frontend and admin ---
    const menuButton = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');

    if (menuButton && sidebar) {
        menuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('open');
        });
        document.addEventListener('click', (e) => {
            if (sidebar.classList.contains('open') && !sidebar.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
    }

    // --- Product Detail Gallery ---
    const mainImage = document.getElementById('mainImage');
    const thumbnails = document.querySelectorAll('.detail-thumbnails img');
    if (mainImage && thumbnails.length) {
        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', function() {
                const highResSrc = this.src.replace('&w=400', '&w=800');
                mainImage.src = highResSrc;
                thumbnails.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }

    // --- URL-BASED PAGINATION LOGIC ---
    const productGrid = document.getElementById('product-grid');
    const paginationContainer = document.getElementById('pagination');

    if (productGrid && paginationContainer) {
        const itemsPerPage = 6;
        const allItems = Array.from(productGrid.getElementsByClassName('product-card'));
        const totalPages = Math.ceil(allItems.length / itemsPerPage);

        function displayPage(page) {
            page = Math.max(1, Math.min(page, totalPages));
            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            allItems.forEach(item => item.style.display = 'none');
            allItems.slice(startIndex, endIndex).forEach(item => item.style.display = 'block');
            
            paginationContainer.innerHTML = '';
            if (totalPages <= 1) return; 

            const prevButton = document.createElement('a');
            prevButton.classList.add('page-btn');
            prevButton.textContent = 'ก่อนหน้า';
            prevButton.href = `?page=${page - 1}`;
            if (page === 1) { prevButton.classList.add('disabled'); }
            paginationContainer.appendChild(prevButton);

            for (let i = 1; i <= totalPages; i++) {
                const pageButton = document.createElement('a');
                pageButton.classList.add('page-btn');
                pageButton.textContent = i;
                pageButton.href = (i === 1) ? window.location.pathname.split('?')[0] : `?page=${i}`;
                if (i === page) { pageButton.classList.add('active'); }
                paginationContainer.appendChild(pageButton);
            }

            const nextButton = document.createElement('a');
            nextButton.classList.add('page-btn');
            nextButton.textContent = 'ถัดไป';
            nextButton.href = `?page=${page + 1}`;
             if (page === totalPages) { nextButton.classList.add('disabled'); }
            paginationContainer.appendChild(nextButton);
        }

        function handleNavigation(e) {
            const target = e.target.closest('.page-btn');
            if (!target || target.classList.contains('active') || target.classList.contains('disabled')) {
                e.preventDefault(); return;
            }
            e.preventDefault();
            const url = new URL(target.href);
            const page = parseInt(url.searchParams.get('page')) || 1;
            history.pushState({page: page}, '', target.href);
            displayPage(page);
        }

        paginationContainer.addEventListener('click', handleNavigation);
        
        window.addEventListener('popstate', (e) => {
            const urlParams = new URLSearchParams(window.location.search);
            const page = parseInt(urlParams.get('page')) || 1;
            displayPage(page);
        });

        const initialUrlParams = new URLSearchParams(window.location.search);
        const initialPage = parseInt(initialUrlParams.get('page')) || 1;
        displayPage(initialPage);
    }

    // --- DRAG & DROP SORTING FOR ADMIN TABLE ---
    const tableBody = document.getElementById('product-table-body');
    if (tableBody) {
        new Sortable(tableBody, {
            handle: '.drag-handle',
            animation: 150,
            ghostClass: 'sortable-ghost',
        });
    }
});