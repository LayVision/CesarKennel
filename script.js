document.addEventListener('DOMContentLoaded', () => {
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

    // --- Admin Login/Logout Links ---
    const authLink = document.getElementById('auth-link');
    const logoutButton = document.getElementById('logout-button');
    const isAdmin = localStorage.getItem('isAdminLoggedIn') === 'true';

    if (authLink) {
        if(isAdmin) {
            authLink.textContent = 'แผงควบคุม';
            authLink.href = 'admin.html';
        } else {
            authLink.textContent = 'เข้าสู่ระบบผู้ดูแล';
            authLink.href = 'login.html';
        }
    }
    
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('isAdminLoggedIn');
            alert('คุณออกจากระบบแล้ว');
            window.location.href = 'index.html';
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