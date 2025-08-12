/**
 * ===================================================================================
 * SCRIPT.JS - Main JavaScript file for the PomPom Boutique Website
 * ===================================================================================
 * This file handles:
 * 1. Firebase Initialization (Authentication and Firestore Database).
 * 2. Central Authentication Control (showing correct links/pages for guests vs. admin).
 * 3. User Interface Logic (Mobile Menu, Logout).
 * 4. Dynamic Content Loading (fetching and displaying dogs on all pages).
 * 5. Admin-Specific Actions (Deleting items).
 * ===================================================================================
 */

// Wait for the entire HTML document to be loaded and parsed before running any JavaScript.
document.addEventListener('DOMContentLoaded', () => {

    // --- SECTION 1: FIREBASE INITIALIZATION ---
    // This object contains your unique Firebase project keys.
    const firebaseConfig = {
        apiKey: "AIzaSyA85L7n2CGKocgWg-Z8TsNlUN9AVVJguBQ",
        authDomain: "cesarkennel.firebaseapp.com",
        projectId: "cesarkennel",
        storageBucket: "cesarkennel.firebasestorage.app",
        messagingSenderId: "512752480416",
        appId: "1:512752480416:web:c71aa9dc281a3932b419c5"
    };

    // Initialize the Firebase app if it hasn't been already.
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    // Create easy-to-use constants for Firebase services.
    const auth = firebase.auth();
    const db = firebase.firestore();

    // --- SECTION 2: CORE APPLICATION LOGIC & EVENT LISTENERS ---

    /**
     * Central Authentication Checker: Runs automatically when the page loads or login state changes.
     */
    auth.onAuthStateChanged(user => {
        const authLink = document.getElementById('auth-link');
        if (user) {
            // If user IS logged in:
            localStorage.setItem('isAdminLoggedIn', 'true');
            if (authLink) {
                authLink.textContent = 'แผงควบคุม';
                authLink.href = 'admin.html';
            }
        } else {
            // If user IS NOT logged in:
            localStorage.removeItem('isAdminLoggedIn');
            if (authLink) {
                authLink.textContent = 'เข้าสู่ระบบผู้ดูแล';
                authLink.href = 'login.html';
            }
            // Page Protection: Redirect non-admins from admin pages.
            const adminPages = ['admin.html', 'add-item.html', 'settings.html'];
            const currentPageName = window.location.pathname.split('/').pop();
            if (adminPages.includes(currentPageName)) {
                window.location.href = 'login.html';
            }
        }
    });

    /**
     * Logout Button Logic
     */
    document.querySelectorAll('.logout-link').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            auth.signOut().then(() => alert('คุณออกจากระบบแล้ว'));
        });
    });

    /**
     * Mobile Menu Toggle
     */
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

    /**
     * **THE FIX**: Navigation Click Handler using Event Delegation
     */
    if (sidebar) {
        sidebar.addEventListener('click', (e) => {
            const navLink = e.target.closest('.sidebar-nav a');
            if (!navLink) return;

            const linkPageName = new URL(navLink.href).pathname.split('/').pop();
            const currentPageName = window.location.pathname.split('/').pop();

            if (linkPageName === currentPageName) {
                e.preventDefault();
                if (currentPageName === 'admin.html') {
                    fetchAndDisplayAdminProducts();
                }
            }
        });
    }

    // --- SECTION 3: PAGE-SPECIFIC CONTENT LOADING (ROUTER) ---

    const currentPageName = window.location.pathname.split('/').pop();
    if (currentPageName === 'index.html' || currentPageName === '') {
        fetchAndDisplayProducts();
    }
    if (currentPageName === 'product-detail.html') {
        fetchProductDetails();
    }
    if (currentPageName === 'admin.html') {
        fetchAndDisplayAdminProducts();
    }

    // --- SECTION 4: DATA FETCHING & DISPLAY FUNCTIONS ---

    /**
     * Fetches all products for the public-facing homepage (index.html).
     */
    async function fetchAndDisplayProducts() {
        if (!db) return;
        const productGrid = document.getElementById('product-grid');
        if (!productGrid) return;
        try {
            const snapshot = await db.collection('products').orderBy('createdAt', 'desc').get();
            productGrid.innerHTML = '';
            if (snapshot.empty) {
                productGrid.innerHTML = '<p>ยังไม่มีน้องหมาในระบบค่ะ</p>';
                return;
            }
            snapshot.forEach(doc => {
                const product = doc.data();
                const productId = doc.id;
                const coverImage = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : 'https://via.placeholder.com/400x250.png?text=No+Image';
                let priceHTML = product.discountPrice ? `<span class="original-price">${product.price.toLocaleString('th-TH')}</span> <span class="discounted-price">${product.discountPrice.toLocaleString('th-TH')} บาท</span>` : `${product.price.toLocaleString('th-TH')} บาท`;
                const card = document.createElement('a');
                card.href = `product-detail.html?id=${productId}`;
                card.className = `product-card ${product.status === 'sold' ? 'sold-item' : ''}`;
                const statusText = { available: 'พร้อมย้ายบ้าน', preordered: 'ติดจอง', sold: 'ขายแล้ว' };
                card.innerHTML = `<div class="card-image-container"><span class="card-status ${product.status}">${statusText[product.status] || ''}</span><img src="${coverImage}" alt="${product.name}"></div><div class="card-content"><h3>${product.name}</h3><div class="card-details"><span>${product.gender}</span><span>${product.age}</span></div><div class="card-price">${priceHTML}</div></div>`;
                productGrid.appendChild(card);
            });
        } catch (error) {
            console.error("Error fetching products for homepage:", error);
            productGrid.innerHTML = '<p>เกิดข้อผิดพลาดในการโหลดข้อมูล</p>';
        }
    }

    /**
     * Fetches all products for the admin panel table (admin.html).
     */
    async function fetchAndDisplayAdminProducts() {
        if (!db) return;
        const tableBody = document.getElementById('product-table-body');
        if (!tableBody) return;
        try {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">กำลังโหลดข้อมูล...</td></tr>`;
            const snapshot = await db.collection('products').orderBy('createdAt', 'desc').get();
            tableBody.innerHTML = '';
            if (snapshot.empty) {
                tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">ยังไม่มีข้อมูลน้องหมาในระบบ</td></tr>`;
                return;
            }
            const statusMap = { available: { text: 'พร้อมขาย', class: 'available' }, preordered: { text: 'ติดจอง', class: 'preordered' }, sold: { text: 'ขายแล้ว', class: 'sold' } };
            snapshot.forEach(doc => {
                const product = doc.data();
                const productId = doc.id;
                const coverImage = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : 'https://via.placeholder.com/100x100.png?text=No+Img';
                const row = document.createElement('tr');
                row.dataset.id = productId;
                row.innerHTML = `<td><span class="drag-handle">☰</span></td><td data-label="ข้อมูล"><div class="product-info-cell"><img src="${coverImage}" alt="${product.name}"><div><div class="name">${product.name}</div><div class="details">${product.breed} (${product.gender}, ${product.color})</div></div></div></td><td data-label="สถานะ"><span class="status-badge ${statusMap[product.status]?.class || ''}">${statusMap[product.status]?.text || product.status}</span></td><td data-label="ราคา">${product.price.toLocaleString('th-TH')} บาท</td><td data-label="การกระทำ"><div class="action-buttons"><a href="add-item.html?edit=${productId}" class="button edit-btn">แก้ไข</a><button class="button delete-btn" data-id="${productId}">ลบ</button></div></td>`;
                tableBody.appendChild(row);
            });
            if (typeof Sortable !== 'undefined') {
                new Sortable(tableBody, { handle: '.drag-handle', animation: 150, ghostClass: 'sortable-ghost' });
            }
        } catch (error) {
            console.error("Error fetching admin products:", error);
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>`;
        }
    }

    /**
     * Fetches the details for a single product (product-detail.html).
     */
    async function fetchProductDetails() {
        if (!db) return;
        const productId = new URLSearchParams(window.location.search).get('id');
        if (!productId) {
            window.location.href = 'index.html';
            return;
        }
        try {
            const doc = await db.collection('products').doc(productId).get();
            if (doc.exists) {
                const product = doc.data();
                document.title = `${product.name} - ปอมปอม บูทีค`;
                document.getElementById('detail-name').textContent = product.name;
                document.getElementById('detail-description').textContent = product.description;
                document.getElementById('detail-price').innerHTML = product.discountPrice ? `<span class="original-price">${product.price.toLocaleString('th-TH')}</span> <span class="discounted-price">${product.discountPrice.toLocaleString('th-TH')} บาท</span>` : `${product.price.toLocaleString('th-TH')} บาท`;
                document.getElementById('detail-breed').textContent = product.breed;
                document.getElementById('detail-age').textContent = product.age;
                document.getElementById('detail-gender').textContent = product.gender;
                document.getElementById('detail-color').textContent = product.color;
                document.getElementById('detail-eye-color').textContent = product.eyeColor;
                document.getElementById('detail-vaccine').textContent = product.vaccine;
                const mainImage = document.getElementById('mainImage');
                const thumbnailsContainer = document.getElementById('detail-thumbnails');
                if (product.imageUrls && product.imageUrls.length > 0) {
                    mainImage.src = product.imageUrls[0];
                    thumbnailsContainer.innerHTML = '';
                    product.imageUrls.forEach((url, index) => {
                        const thumb = document.createElement('img');
                        thumb.src = url;
                        thumb.alt = `รูปย่อ ${index + 1}`;
                        if (index === 0) thumb.classList.add('active');
                        thumb.addEventListener('click', function() {
                            mainImage.src = this.src;
                            thumbnailsContainer.querySelectorAll('img').forEach(t => t.classList.remove('active'));
                            this.classList.add('active');
                        });
                        thumbnailsContainer.appendChild(thumb);
                    });
                } else {
                    mainImage.src = 'https://via.placeholder.com/800x600.png?text=No+Image';
                }
            } else {
                document.querySelector('.product-detail-grid').innerHTML = '<h1>ไม่พบข้อมูลน้องหมา</h1><p>อาจมีการย้ายหรือลบข้อมูลนี้ไปแล้ว</p><a href="index.html">กลับหน้าแรก</a>';
            }
        } catch (error) {
            console.error("Error fetching product details:", error);
            document.querySelector('.product-detail-grid').innerHTML = '<h1>เกิดข้อผิดพลาด</h1><p>ไม่สามารถโหลดข้อมูลได้ในขณะนี้</p>';
        }
    }

    // --- SECTION 5: GLOBAL EVENT LISTENER FOR DYNAMIC CONTENT ---

    /**
     * Delete Button Functionality
     */
    document.body.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const productId = e.target.dataset.id;
            if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?`)) {
                try {
                    await db.collection('products').doc(productId).delete();
                    alert('ลบรายการสำเร็จ!');
                    e.target.closest('tr').remove();
                } catch (error) {
                    console.error("Error removing document: ", error);
                    alert('เกิดข้อผิดพลาดในการลบรายการ');
                }
            }
        }
    });

});