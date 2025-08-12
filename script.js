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
    // Initialize Firestore only if the SDK is loaded
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
            const currentPage = window.location.pathname.split('/').pop();
            if (adminPages.includes(currentPage)) {
                window.location.href = 'login.html';
            }
        }
    });

    // --- Logout Button Logic ---
    const logoutButtons = document.querySelectorAll('.logout-link');
    if (logoutButtons.length) {
        logoutButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                auth.signOut().then(() => alert('คุณออกจากระบบแล้ว'));
            });
        });
    }

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

    // --- DYNAMIC CONTENT LOADER ---
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'index.html' || currentPage === '') {
        fetchAndDisplayProducts();
    }
    
    if (currentPage === 'product-detail.html') {
        fetchProductDetails();
    }

    // --- Function to fetch and display products on the homepage ---
    async function fetchAndDisplayProducts() {
        if (!db) return;
        const productGrid = document.getElementById('product-grid');
        if (!productGrid) return;
        
        try {
            // Fetch products, ordered by creation date descending (newest first)
            const snapshot = await db.collection('products').orderBy('createdAt', 'desc').get();
            productGrid.innerHTML = ''; // Clear existing content

            if (snapshot.empty) {
                productGrid.innerHTML = '<p>ยังไม่มีน้องหมาในระบบค่ะ</p>';
                return;
            }

            snapshot.forEach(doc => {
                const product = doc.data();
                const productId = doc.id;
                const coverImage = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : 'https://via.placeholder.com/400x250.png?text=No+Image';

                let priceHTML = '';
                if (product.discountPrice && product.discountPrice < product.price) {
                    priceHTML = `
                        <span class="original-price">${product.price.toLocaleString('th-TH')}</span>
                        <span class="discounted-price">${product.discountPrice.toLocaleString('th-TH')} บาท</span>
                    `;
                } else {
                    priceHTML = `${product.price.toLocaleString('th-TH')} บาท`;
                }
                
                const card = document.createElement('a');
                card.href = `product-detail.html?id=${productId}`;
                card.className = `product-card ${product.status === 'sold' ? 'sold-item' : ''}`;
                card.innerHTML = `
                    <div class="card-image-container">
                        <span class="card-status ${product.status}">${product.status === 'available' ? 'พร้อมย้ายบ้าน' : (product.status === 'preordered' ? 'ติดจอง' : 'ขายแล้ว')}</span>
                        <img src="${coverImage}" alt="${product.name}">
                    </div>
                    <div class="card-content">
                        <h3>${product.name}</h3>
                        <div class="card-details">
                            <span>${product.gender}</span>
                            <span>${product.age}</span>
                        </div>
                        <div class="card-price">${priceHTML}</div>
                    </div>
                `;
                productGrid.appendChild(card);
            });

        } catch (error) {
            console.error("Error fetching products: ", error);
            productGrid.innerHTML = '<p>เกิดข้อผิดพลาดในการโหลดข้อมูล</p>';
        }
    }

    // --- Function to fetch and display a single product's details ---
    async function fetchProductDetails() {
        if (!db) return;
        const params = new URLSearchParams(window.location.search);
        const productId = params.get('id');

        if (!productId) {
            window.location.href = 'index.html';
            return;
        }

        try {
            const doc = await db.collection('products').doc(productId).get();
            if (doc.exists) {
                const product = doc.data();
                
                // Set page title and main content
                document.title = `${product.name} - ปอมปอม บูทีค`;
                document.getElementById('detail-name').textContent = product.name;
                document.getElementById('detail-description').textContent = product.description;

                // Set Price
                const priceEl = document.getElementById('detail-price');
                if (product.discountPrice && product.discountPrice < product.price) {
                    priceEl.innerHTML = `
                        <span class="original-price">${product.price.toLocaleString('th-TH')}</span>
                        <span class="discounted-price">${product.discountPrice.toLocaleString('th-TH')} บาท</span>
                    `;
                } else {
                    priceEl.innerHTML = `${product.price.toLocaleString('th-TH')} บาท`;
                }

                // Set details list
                document.getElementById('detail-breed').textContent = product.breed;
                document.getElementById('detail-age').textContent = product.age;
                document.getElementById('detail-gender').textContent = product.gender;
                document.getElementById('detail-color').textContent = product.color;
                document.getElementById('detail-eye-color').textContent = product.eyeColor;
                document.getElementById('detail-vaccine').textContent = product.vaccine;

                // Populate image gallery
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
                console.log("No such document!");
                document.querySelector('.product-detail-grid').innerHTML = '<h1>ไม่พบข้อมูลน้องหมา</h1><p>อาจมีการย้ายหรือลบข้อมูลนี้ไปแล้ว</p><a href="index.html">กลับหน้าแรก</a>';
            }
        } catch (error) {
            console.error("Error fetching product details: ", error);
             document.querySelector('.product-detail-grid').innerHTML = '<h1>เกิดข้อผิดพลาด</h1><p>ไม่สามารถโหลดข้อมูลได้ในขณะนี้</p>';
        }
    }
});