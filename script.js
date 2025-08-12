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
// This prevents errors from trying to find elements that don't exist yet.
document.addEventListener('DOMContentLoaded', () => {

    // --- SECTION 1: FIREBASE INITIALIZATION ---
    // =================================================================================

    // This object contains your unique Firebase project keys.
    // It's how the website connects to your specific Firebase backend.
    const firebaseConfig = {
        apiKey: "AIzaSyA85L7n2CGKocgWg-Z8TsNlUN9AVVJguBQ",
        authDomain: "cesarkennel.firebaseapp.com",
        projectId: "cesarkennel",
        storageBucket: "cesarkennel.firebasestorage.app",
        messagingSenderId: "512752480416",
        appId: "1:512752480416:web:c71aa9dc281a3932b419c5"
    };

    // Initialize the Firebase app if it hasn't been already.
    // This check prevents errors if the script were to run multiple times.
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    // Create easy-to-use constants for Firebase services we will need.
    const auth = firebase.auth();        // For handling user login, logout, and status.
    const db = firebase.firestore();     // For interacting with the Firestore database.


    // --- SECTION 2: CORE APPLICATION LOGIC & EVENT LISTENERS ---
    // =================================================================================

    /**
     * Central Authentication Checker
     * This is the most important authentication function. It automatically runs
     * whenever the page loads or the user's login state changes.
     */
    auth.onAuthStateChanged(user => {
        // Find the login/logout link in the sidebar.
        const authLink = document.getElementById('auth-link');

        // --- If a user IS logged in ---
        if (user) {
            // Set a flag in the browser's local storage for other pages to see.
            localStorage.setItem('isAdminLoggedIn', 'true');
            // If the auth link exists, change its text and destination to the admin panel.
            if (authLink) {
                authLink.textContent = 'แผงควบคุม'; // "Control Panel"
                authLink.href = 'admin.html';
            }
        // --- If a user IS NOT logged in ---
        } else {
            // Remove the admin flag from local storage.
            localStorage.removeItem('isAdminLoggedIn');
            // If the auth link exists, change it back to the "Admin Login" state.
            if (authLink) {
                authLink.textContent = 'เข้าสู่ระบบผู้ดูแล'; // "Admin Login"
                authLink.href = 'login.html';
            }

            // --- Page Protection ---
            // Define which pages are for admins only.
            const adminPages = ['admin.html', 'add-item.html', 'settings.html'];
            // Get the filename of the current page.
            const currentPageName = window.location.pathname.split('/').pop();
            // If the user is on an admin page but is not logged in, redirect them to the login page.
            if (adminPages.includes(currentPageName)) {
                window.location.href = 'login.html';
            }
        }
    });

    /**
     * Logout Button Logic
     * Finds all elements with the class 'logout-link' and attaches the logout function.
     */
    document.querySelectorAll('.logout-link').forEach(button => {
        button.addEventListener('click', (e) => {
            // Prevent the link from trying to navigate to a new page.
            e.preventDefault();
            // Use Firebase to sign the user out.
            auth.signOut().then(() => {
                // Show a confirmation message to the user.
                alert('คุณออกจากระบบแล้ว'); // "You have been logged out."
                // The onAuthStateChanged listener above will automatically handle the redirect.
            });
        });
    });

    /**
     * Mobile Menu Toggle
     * Handles the opening and closing of the sidebar on mobile devices.
     */
    const menuButton = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    if (menuButton && sidebar) {
        // When the hamburger button is clicked...
        menuButton.addEventListener('click', (e) => {
            // Stop the click from bubbling up to the document listener below.
            e.stopPropagation();
            // Add or remove the 'open' class to show/hide the sidebar.
            sidebar.classList.toggle('open');
        });
        // Add a listener to the entire document.
        document.addEventListener('click', (e) => {
            // If the sidebar is open and the click was *outside* the sidebar...
            if (sidebar.classList.contains('open') && !sidebar.contains(e.target)) {
                // ...remove the 'open' class to close it.
                sidebar.classList.remove('open');
            }
        });
    }

    /**
     * **THE FIX**: Navigation Click Handler using Event Delegation
     * This single listener handles the original problem elegantly without needing extra IDs.
     */
    if (sidebar) {
        // Attach one listener to the entire sidebar.
        sidebar.addEventListener('click', (e) => {
            // Check if the actual element that was clicked is a navigation link (an <a> tag inside .sidebar-nav).
            const navLink = e.target.closest('.sidebar-nav a');

            // If the click was not on a navigation link, do nothing.
            if (!navLink) {
                return;
            }

            // Get the filename from the link's href (e.g., "admin.html").
            const linkPageName = new URL(navLink.href).pathname.split('/').pop();
            // Get the filename of the page we are currently on.
            const currentPageName = window.location.pathname.split('/').pop();

            // Check if the user is clicking the link for the page they are already on.
            if (linkPageName === currentPageName) {
                // Prevent the browser's default behavior (which was causing the bug).
                e.preventDefault();

                // If they are on admin.html and click the "จัดการน้องหมา" link again,
                // manually re-run the function to fetch the product list.
                if (currentPageName === 'admin.html') {
                    fetchAndDisplayAdminProducts();
                }
            }
        });
    }


    // --- SECTION 3: PAGE-SPECIFIC CONTENT LOADING (ROUTER) ---
    // =================================================================================

    // Get the current page's filename to decide which data to load.
    const currentPageName = window.location.pathname.split('/').pop();

    // Based on the page name, call the appropriate function to fetch and display data.
    if (currentPageName === 'index.html' || currentPageName === '') {
        fetchAndDisplayProducts(); // For the homepage.
    }
    if (currentPageName === 'product-detail.html') {
        fetchProductDetails(); // For the product detail page.
    }
    if (currentPageName === 'admin.html') {
        fetchAndDisplayAdminProducts(); // For the main admin page.
    }


    // --- SECTION 4: DATA FETCHING & DISPLAY FUNCTIONS ---
    // =================================================================================

    /**
     * Fetches all products for the public-facing homepage (index.html).
     */
    async function fetchAndDisplayProducts() {
        if (!db) return; // Safety check
        const productGrid = document.getElementById('product-grid');
        if (!productGrid) return; // Safety check

        try {
            // Get all documents from the 'products' collection, sorted by newest first.
            const snapshot = await db.collection('products').orderBy('createdAt', 'desc').get();

            productGrid.innerHTML = ''; // Clear any existing content.

            // If the database returns no documents, show a message.
            if (snapshot.empty) {
                productGrid.innerHTML = '<p>ยังไม่มีน้องหมาในระบบค่ะ</p>'; // "No dogs in the system yet."
                return;
            }

            // Loop through each document found.
            snapshot.forEach(doc => {
                const product = doc.data(); // The data fields (name, price, etc.)
                const productId = doc.id; // The unique ID of the document.
                const coverImage = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : 'https://via.placeholder.com/400x250.png?text=No+Image';

                // Handle regular price vs. discount price.
                let priceHTML = product.discountPrice ?
                    `<span class="original-price">${product.price.toLocaleString('th-TH')}</span> <span class="discounted-price">${product.discountPrice.toLocaleString('th-TH')} บาท</span>` :
                    `${product.price.toLocaleString('th-TH')} บาท`;

                // Create the product card element.
                const card = document.createElement('a');
                card.href = `product-detail.html?id=${productId}`;
                card.className = `product-card ${product.status === 'sold' ? 'sold-item' : ''}`;
                const statusText = { available: 'พร้อมย้ายบ้าน', preordered: 'ติดจอง', sold: 'ขายแล้ว' };
                card.innerHTML = `
                    <div class="card-image-container">
                        <span class="card-status ${product.status}">${statusText[product.status] || ''}</span>
                        <img src="${coverImage}" alt="${product.name}">
                    </div>
                    <div class="card-content">
                        <h3>${product.name}</h3>
                        <div class="card-details">
                            <span>${product.gender}</span>
                            <span>${product.age}</span>
                        </div>
                        <div class="card-price">${priceHTML}</div>
                    </div>`;

                // Add the newly created card to the grid.
                productGrid.appendChild(card);
            });
        } catch (error) {
            console.error("Error fetching products for homepage:", error);
            productGrid.innerHTML = '<p>เกิดข้อผิดพลาดในการโหลดข้อมูล</p>'; // "Error loading data."
        }
    }

    /**
     * Fetches all products for the admin panel table (admin.html).
     */
    async function fetchAndDisplayAdminProducts() {
        if (!db) return; // Safety check
        const tableBody = document.getElementById('product-table-body');
        if (!tableBody) return; // Safety check

        try {
            // Show a "loading" message while fetching.
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">กำลังโหลดข้อมูล...</td></tr>`;

            // Get all documents from 'products', sorted by newest first.
            const snapshot = await db.collection('products').orderBy('createdAt', 'desc').get();
            tableBody.innerHTML = ''; // Clear the loading message.

            // If no documents are found, display a message in the table.
            if (snapshot.empty) {
                tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">ยังไม่มีข้อมูลน้องหมาในระบบ</td></tr>`; // "No dog data in the system."
                return;
            }

            // Map status values to text and CSS classes for the status badge.
            const statusMap = {
                available: { text: 'พร้อมขาย', class: 'available' },
                preordered: { text: 'ติดจอง', class: 'preordered' },
                sold: { text: 'ขายแล้ว', class: 'sold' }
            };

            // Loop through each document.
            snapshot.forEach(doc => {
                const product = doc.data();
                const productId = doc.id;
                const coverImage = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : 'https://via.placeholder.com/100x100.png?text=No+Img';
                
                // Create a new table row.
                const row = document.createElement('tr');
                row.dataset.id = productId; // Store the ID on the row for the delete function.
                
                // Populate the row with HTML. The `data-label` is for mobile view.
                row.innerHTML = `
                    <td><span class="drag-handle">☰</span></td>
                    <td data-label="ข้อมูล">
                        <div class="product-info-cell">
                            <img src="${coverImage}" alt="${product.name}">
                            <div>
                                <div class="name">${product.name}</div>
                                <div class="details">${product.breed} (${product.gender}, ${product.color})</div>
                            </div>
                        </div>
                    </td>
                    <td data-label="สถานะ"><span class="status-badge ${statusMap[product.status]?.class || ''}">${statusMap[product.status]?.text || product.status}</span></td>
                    <td data-label="ราคา">${product.price.toLocaleString('th-TH')} บาท</td>
                    <td data-label="การกระทำ">
                        <div class="action-buttons">
                            <a href="add-item.html?edit=${productId}" class="button edit-btn">แก้ไข</a>
                            <button class="button delete-btn" data-id="${productId}">ลบ</button>
                        </div>
                    </td>`;
                
                // Add the new row to the table body.
                tableBody.appendChild(row);
            });
            
            // If the SortableJS library is loaded, re-initialize it for drag-and-drop.
            if (typeof Sortable !== 'undefined') {
                 new Sortable(tableBody, { handle: '.drag-handle', animation: 150, ghostClass: 'sortable-ghost' });
            }

        } catch (error) {
            console.error("Error fetching admin products:", error);
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>`; // "Error loading data."
        }
    }

    /**
     * Fetches the details for a single product (product-detail.html).
     */
    async function fetchProductDetails() {
        if (!db) return; // Safety check
        
        // Get the product ID from the URL (e.g., "?id=ABC123").
        const productId = new URLSearchParams(window.location.search).get('id');
        if (!productId) {
            window.location.href = 'index.html'; // If no ID, go back to the homepage.
            return;
        }

        try {
            // Fetch the specific document from the 'products' collection using its ID.
            const doc = await db.collection('products').doc(productId).get();

            // Check if the document actually exists.
            if (doc.exists) {
                const product = doc.data();
                // Populate all the elements on the page with the data.
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

                // --- Image Gallery Logic ---
                const mainImage = document.getElementById('mainImage');
                const thumbnailsContainer = document.getElementById('detail-thumbnails');
                if (product.imageUrls && product.imageUrls.length > 0) {
                    mainImage.src = product.imageUrls[0]; // Set the first image as the main one.
                    thumbnailsContainer.innerHTML = ''; // Clear old thumbnails.
                    // Create a thumbnail for each image URL.
                    product.imageUrls.forEach((url, index) => {
                        const thumb = document.createElement('img');
                        thumb.src = url;
                        thumb.alt = `รูปย่อ ${index + 1}`;
                        if (index === 0) thumb.classList.add('active'); // Highlight the first one.
                        // Add a click listener to change the main image.
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
                // If the document ID is not found in the database.
                document.querySelector('.product-detail-grid').innerHTML = '<h1>ไม่พบข้อมูลน้องหมา</h1><p>อาจมีการย้ายหรือลบข้อมูลนี้ไปแล้ว</p><a href="index.html">กลับหน้าแรก</a>';
            }
        } catch (error) {
            console.error("Error fetching product details:", error);
            document.querySelector('.product-detail-grid').innerHTML = '<h1>เกิดข้อผิดพลาด</h1><p>ไม่สามารถโหลดข้อมูลได้ในขณะนี้</p>';
        }
    }


    // --- SECTION 5: GLOBAL EVENT LISTENER FOR DYNAMIC CONTENT ---
    // =================================================================================

    /**
     * Delete Button Functionality
     * Uses event delegation to handle clicks on delete buttons that are added dynamically.
     */
    document.body.addEventListener('click', async (e) => {
        // If the clicked element has the 'delete-btn' class...
        if (e.target.classList.contains('delete-btn')) {
            // Get the product ID stored in the button's 'data-id' attribute.
            const productId = e.target.dataset.id;
            // Show a native browser confirmation dialog.
            if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?`)) { // "Are you sure you want to delete this item?"
                try {
                    // Tell Firestore to delete the document with this ID.
                    await db.collection('products').doc(productId).delete();
                    alert('ลบรายการสำเร็จ!'); // "Item deleted successfully!"
                    // Remove the corresponding table row from the page without needing a reload.
                    e.target.closest('tr').remove();
                } catch (error) {
                    console.error("Error removing document: ", error);
                    alert('เกิดข้อผิดพลาดในการลบรายการ'); // "Error deleting item."
                }
            }
        }
    });

}); // --- End of DOMContentLoaded ---