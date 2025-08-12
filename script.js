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
            if (sidebar.classList.contains('open') && !sidebar.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
    }

    // --- Admin Logout Button ---
    const logoutButton = document.getElementById('logout-button');
    
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Firebase must be initialized on the page to use auth
            const auth = firebase.auth();
            auth.signOut().then(() => {
                alert('คุณออกจากระบบแล้ว');
                window.location.href = 'index.html';
            }).catch((error) => {
                console.error("Logout Error:", error);
                alert('เกิดข้อผิดพลาดในการออกจากระบบ');
            });
        });
    }
});


// --- ImgBB IMAGE UPLOAD FUNCTIONS ---

// Function to upload a single image file to ImgBB
async function uploadImageToImgBB(imageFile) {
    const apiKey = '2c1b183962c1d06f8aecea08cbc78d11';
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

// Function to upload multiple image files
async function uploadMultipleImages(imageFiles) {
    const uploadPromises = Array.from(imageFiles).map(file => uploadImageToImgBB(file));
    const imageUrls = await Promise.all(uploadPromises);
    return imageUrls;
}