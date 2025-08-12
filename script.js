document.addEventListener('DOMContentLoaded', () => {
    // --- Firebase Initialization ---
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
    const db = firebase.firestore ? firebase.firestore() : null;

    // --- Central Authentication Checker ---
    auth.onAuthStateChanged(user => {
        const authLink = document.getElementById('auth-link');
        if (user) {
            localStorage.setItem('isAdminLoggedIn', 'true');
            if (authLink) {
                authLink.textContent = 'แผงควบคุม';
                authLink.href = 'admin.html';
            }
        } else {
            localStorage.removeItem('isAdminLoggedIn');
            if (authLink) {
                authLink.textContent = 'เข้าสู่ระบบผู้ดูแล';
                authLink.href = 'login.html';
            }
            const adminPages = ['admin.html', 'add-item.html', 'settings.html'];
            const currentPageName = window.location.pathname.split('/').pop();
            if (adminPages.includes(currentPageName)) {
                window.location.href = 'login.html';
            }
        }
    });

    // --- Logout Button Logic ---
    document.querySelectorAll('.logout-link').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            auth.signOut().then(() => alert('คุณออกจากระบบแล้ว'));
        });
    });

    // --- Mobile Menu Toggle ---
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

    // --- NEW, ALTERNATIVE SOLUTION USING EVENT DELEGATION ---
    // This listener is attached to the whole sidebar.
    if (sidebar) {
        sidebar.addEventListener('click', (e) => {
            // Check if the clicked element is a navigation link.
            const navLink = e.target.closest('.sidebar-nav a');
            if (!navLink) {
                return; // If not a nav link, do nothing.
            }

            const linkPageName = new URL(navLink.href).pathname.split('/').pop();
            const currentPageName = window.location.pathname.split('/').pop();

            // If the link is for the page we are already on...
            if (linkPageName === currentPageName) {
                e.preventDefault(); // ...stop the default navigation.

                // And if that page is admin.html, refresh the data.
                if (currentPageName === 'admin.html') {
                    fetchAndDisplayAdminProducts();
                }
                // This could be expanded for other pages if needed.
            }
        });
    }
    // --- END OF NEW, ALTERNATIVE SOLUTION ---


    // --- DYNAMIC CONTENT LOADER ---
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
    
    // --- Homepage Product Display Function ---
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
            console.error("Error fetching products:", error);
            productGrid.innerHTML = '<p>เกิดข้อผิดพลาดในการโหลดข้อมูล</p>';
        }
    }

    // --- Admin Page Product Table Display Function ---
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
                row.dataset.id = productId; // Add product ID to the row
                row.innerHTML = `<td><span class="drag-handle">☰</span></td><td data-label="ข้อมูล"><div class="product-info-cell"><img src="${coverImage}" alt="${product.name}"><div><div class="name">${product.name}</div><div class="details">${product.breed} (${product.gender}, ${product.color})</div></div></div></td><td data-label="สถานะ"><span class="status-badge ${statusMap[product.status]?.class || ''}">${statusMap[product.status]?.text || product.status}</span></td><td data-label="ราคา">${product.price.toLocaleString('th-TH')} บาท</td><td data-label="การกระทำ"><div class="action-buttons"><a href="add-item.html?edit=${productId}" class="button edit-btn">แก้ไข</a><button class="button delete-btn" data-id="${productId}">ลบ</button></div></td>`;
                tableBody.appendChild(row);
            });
            
            // Re-initialize SortableJS for drag-and-drop
            if (typeof Sortable !== 'undefined') {
                 new Sortable(tableBody, { handle: '.drag-handle', animation: 150, ghostClass: 'sortable-ghost' });
            }

        } catch (error) {
            console.error("Error fetching admin products:", error);
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>`;
        }
    }

    // --- Product Detail Page Display Function ---
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

    // --- ADDED: Delete Button Functionality ---
    document.body.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const productId = e.target.dataset.id;
            if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?`)) {
                try {
                    await db.collection('products').doc(productId).delete();
                    alert('ลบรายการสำเร็จ!');
                    e.target.closest('tr').remove(); // Remove the row from the table
                } catch (error) {
                    console.error("Error removing document: ", error);
                    alert('เกิดข้อผิดพลาดในการลบรายการ');
                }
            }
        }
    });
});