// --- FUNCTION TO APPLY GLOBAL SETTINGS FROM FIRESTORE ---
async function applyGlobalSettings() {
    if (typeof firebase === 'undefined' || typeof firebase.firestore === 'undefined') {
        console.warn("Firebase not ready for applyGlobalSettings.");
        return;
    }
    const db = firebase.firestore();
    const settingsRef = db.collection('settings').doc('main_config');

    try {
        const docSnap = await settingsRef.get();
        if (!docSnap.exists) {
            console.log("Settings document not found. Using default values.");
            return;
        }
        const settings = docSnap.data();

        // 1. Logo Text (All pages)
        const isUserOnAdminPage = window.location.pathname.includes('admin') || window.location.pathname.includes('settings') || window.location.pathname.includes('add-item');
        const defaultLogo = isUserOnAdminPage ? 'Admin' : 'PomPom';
        const logoText = settings.logoText || defaultLogo;
        document.querySelectorAll('.logo-text-placeholder').forEach(el => {
            el.textContent = logoText;
        });
        
        // 2. Copyright Text (Public pages)
        const copyrightElements = document.querySelectorAll('.copyright-text');
        if (copyrightElements.length > 0) {
            const year = settings.copyrightYear || new Date().getFullYear();
            const name = settings.shopName || 'ปอมปอม บูทีค';
            copyrightElements.forEach(el => {
                el.innerHTML = `&copy; ${year} ${name}`;
            });
        }
        
        // 3. Main Site Footer (Public pages)
        const footerShopName = document.getElementById('footer-shop-name');
        if (footerShopName && settings.shopName) footerShopName.textContent = settings.shopName;

        const footerDesc = document.getElementById('footer-description');
        if (footerDesc && settings.footerDescription) footerDesc.textContent = settings.footerDescription;

        const footerContact = document.getElementById('footer-contact-details');
        if (footerContact) {
            let contactHTML = '';
            if (settings.footerPhone) contactHTML += `<span>โทร: ${settings.footerPhone}</span>`;
            if (settings.footerPhone && settings.contactEmail) contactHTML += ' | ';
            if (settings.contactEmail) contactHTML += `<span>อีเมล: ${settings.contactEmail}</span>`;
            footerContact.innerHTML = contactHTML;
        }

        // 4. Social Media Links (Public pages)
        const fbLink = document.getElementById('social-fb');
        if (fbLink) {
            settings.footerFacebook ? (fbLink.href = settings.footerFacebook, fbLink.classList.remove('hidden')) : fbLink.classList.add('hidden');
        }

        const igLink = document.getElementById('social-ig');
        if (igLink) {
            settings.footerInstagram ? (igLink.href = settings.footerInstagram, igLink.classList.remove('hidden')) : igLink.classList.add('hidden');
        }
        
        const lineLink = document.getElementById('social-line');
        if (lineLink) {
             settings.footerLine ? (lineLink.href = settings.footerLine, lineLink.classList.remove('hidden')) : lineLink.classList.add('hidden');
        }

        // 5. Homepage specifics (index.html only)
        const coverImage = document.getElementById('hero-image');
        if (coverImage && settings.coverImageUrl) {
            coverImage.src = settings.coverImageUrl;
        }

        const marqueeText = document.getElementById('marquee-text');
        if (marqueeText && settings.marqueeText) {
            marqueeText.textContent = settings.marqueeText;
        }

    } catch (error) {
        console.error("Error applying global settings:", error);
    }
}

// --- SHARED UTILITY FUNCTIONS ---
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
            if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && !menuButton.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
    }

    // --- Admin Logout Button ---
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof firebase !== 'undefined') {
                firebase.auth().signOut().then(() => {
                    alert('คุณออกจากระบบแล้ว');
                    window.location.href = 'index.html';
                }).catch((error) => {
                    console.error("Logout Error:", error);
                    alert('เกิดข้อผิดพลาดในการออกจากระบบ');
                });
            }
        });
    }

    // --- Apply settings after page load ---
    if (typeof firebase !== 'undefined') {
        applyGlobalSettings();
    } else {
        setTimeout(applyGlobalSettings, 500);
    }
});

// --- ImgBB IMAGE UPLOAD FUNCTIONS ---
async function uploadImageToImgBB(imageFile) {
    const apiKey = '2c1b183962c1d06f8aecea08cbc78d11'; // Your ImgBB API key
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: 'POST',
            body: formData,
        });
        const data = await response.json();
        if (data.success) {
            return data.data.url;
        } else {
            throw new Error(`ImgBB upload failed: ${data.error?.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error uploading to ImgBB:', error);
        throw error;
    }
}

async function uploadMultipleImages(imageFiles) {
    const uploadPromises = Array.from(imageFiles).map(file => uploadImageToImgBB(file));
    const imageUrls = await Promise.all(uploadPromises);
    return imageUrls;
}