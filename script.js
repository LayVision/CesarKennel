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

        // 1. Logo Text
        const isUserOnAdminPage = window.location.pathname.includes('admin') || window.location.pathname.includes('settings') || window.location.pathname.includes('add-item');
        const defaultLogo = isUserOnAdminPage ? 'Admin' : 'PomPom';
        const logoText = settings.logoText || defaultLogo;
        document.querySelectorAll('.logo-text-placeholder').forEach(el => {
            el.textContent = logoText;
        });
        
        // 2. Copyright Text
        const copyrightElements = document.querySelectorAll('.copyright-text');
        if (copyrightElements.length > 0) {
            const year = settings.copyrightYear || new Date().getFullYear();
            const name = settings.shopName || 'ปอมปอม บูทีค';
            copyrightElements.forEach(el => {
                el.innerHTML = `&copy; ${year} ${name}`;
            });
        }
        
        // 3. Public Page Headers & Footers
        const shopDesc = document.getElementById('shop-description');
        if (shopDesc && settings.shopDescription) shopDesc.textContent = settings.shopDescription;

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

        // 4. Social Media Links
        const socialLinks = {
            'social-fb': settings.footerFacebook,
            'social-ig': settings.footerInstagram,
            'social-line': settings.footerLine
        };
        for(const [id, url] of Object.entries(socialLinks)) {
            const linkEl = document.getElementById(id);
            if(linkEl) {
                if(url) {
                    linkEl.href = url;
                    linkEl.classList.remove('hidden');
                } else {
                    linkEl.classList.add('hidden');
                }
            }
        }

        // 5. Homepage Specifics
        const heroImage = document.getElementById('hero-image');
        if (heroImage && settings.coverImageUrl) {
            heroImage.src = settings.coverImageUrl;
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
    // Mobile Menu Toggle
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

    // Admin Logout Button
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

    // Apply global settings on all pages
    if (typeof firebase !== 'undefined') {
        firebase.auth().onAuthStateChanged(() => {
             applyGlobalSettings();
        });
    }
});

// --- ImgBB IMAGE UPLOAD HELPER FUNCTIONS ---
async function uploadImageToImgBB(imageFile) {
    const apiKey = '2c1b183962c1d06f8aecea08cbc78d11'; // ImgBB API Key
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: 'POST',
            body: formData,
        });
        const data = await response.json();
        if (data.success) {
            // Return the URL for the medium-sized, web-friendly version
            return data.data.medium?.url || data.data.url;
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
    // Use Promise.allSettled to continue even if one upload fails
    const results = await Promise.allSettled(uploadPromises);
    const successfulUrls = results
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);
    
    if (results.some(r => r.status === 'rejected')) {
        console.warn("Some images failed to upload.");
    }

    return successfulUrls;
}```