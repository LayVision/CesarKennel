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
            console.log('Image uploaded successfully:', data.data.url);
            return data.data.url; // Return the image URL
        } else {
            throw new Error(`ImgBB upload failed: ${data.error?.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error uploading to ImgBB:', error);
        throw error; // Re-throw the error to be handled by the caller
    }
}

// Function to upload multiple image files by calling the single upload function for each
async function uploadMultipleImages(imageFiles) {
    // Create an array of promises, where each promise is an upload task
    const uploadPromises = Array.from(imageFiles).map(file => uploadImageToImgBB(file));
    
    // Use Promise.all to wait for all uploads to complete
    const imageUrls = await Promise.all(uploadPromises);
    
    return imageUrls; // Returns an array of successfully uploaded image URLs
}