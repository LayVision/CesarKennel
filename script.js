// --- FUNCTION TO APPLY GLOBAL SETTINGS FROM FIRESTORE ---
async function applyGlobalSettings() {
    // This function needs firebase to be initialized on the page.
    if (typeof firebase === 'undefined') {
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

        // 1. Cover Image (index.html only)
        const coverImage = document.getElementById('hero-image');
        if (coverImage && settings.coverImageUrl) {
            coverImage.src = settings.coverImageUrl;
        }

        // 2. Marquee Text (index.html only)
        const marqueeText = document.getElementById('marquee-text');
        if (marqueeText && settings.marqueeText) {
            marqueeText.textContent = settings.marqueeText;
        }

        // 3. Logo Text (all pages)
        document.querySelectorAll('.logo-text-placeholder').forEach(el => {
            if (settings.logoText) {
                el.textContent = settings.logoText;
            }
        });
        
        // 4. Footer & Copyright Text (public pages)
        const copyrightElements = document.querySelectorAll('.copyright-text');
        if (copyrightElements.length > 0 && settings.copyrightYear && settings.shopName) {
            copyrightElements.forEach(el => {
                el.innerHTML = `&copy; ${settings.copyrightYear} ${settings.shopName}`;
            });
        }
        
        const footerLogo = document.getElementById('footer-logo');
        if(footerLogo && settings.shopName) {
            footerLogo.textContent = settings.shopName;
        }
        
        const footerDesc = document.getElementById('footer-description');
        if(footerDesc && settings.footerDescription) {
            footerDesc.textContent = settings.footerDescription;
        }

        const footerContact = document.getElementById('footer-contact-details');
        if(footerContact && settings.footerPhone && settings.contactEmail) {
            footerContact.innerHTML = `<span>โทร: ${settings.footerPhone}</span> | <span>อีเมล: ${settings.contactEmail}</span>`;
        }

        // 5. Social Media Links (public pages)
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
    // We check for firebase because this script might load before the SDKs on some pages
    // and Firebase needs to be initialized.
    if (typeof firebase !== 'undefined') {
        applyGlobalSettings();
    } else {
        // If firebase isn't ready, wait a bit and try again.
        setTimeout(applyGlobalSettings, 500);
    }
});


// --- ImgBB IMAGE UPLOAD FUNCTIONS ---
// This function uploads a single image file and returns the URL.
async function uploadImageToImgBB(imageFile) {
    const apiKey = '2c1b183962c1d06f8aecea08cbc78d11'; // Replace with your ImgBB API key
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: 'POST',
            body: formData,
        });
        const data = await response.json();
        if (data.success) {
            // Returns the URL of the medium-sized thumbnail for faster loading
            return data.data.medium?.url || data.data.url;
        } else {
            throw new Error(`ImgBB upload failed: ${data.error?.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error uploading to ImgBB:', error);
        throw error; // Re-throw the error to be caught by the calling function
    }
}

// This function takes an array of files and uploads all of them.
async function uploadMultipleImages(imageFiles) {
    // Create an array of upload promises
    const uploadPromises = Array.from(imageFiles).map(file => uploadImageToImgBB(file));
    // Wait for all promises to resolve
    const imageUrls = await Promise.all(uploadPromises);
    return imageUrls;
}