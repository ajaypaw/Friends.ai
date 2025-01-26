// Hamburger Menu
document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menuBtn');
    const menuContainer = document.querySelector('.menu-container');
    const logoutBtn = document.getElementById('logoutBtn');

    if (menuBtn && menuContainer) {
        // Toggle menu on button click
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event from bubbling up
            menuContainer.classList.toggle('active');
            console.log('Menu clicked', menuContainer.classList.contains('active')); // Debug log
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!menuContainer.contains(e.target)) {
                menuContainer.classList.remove('active');
            }
        });

        // Handle logout
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                // Keep AI name and theme preferences
                const aiName = localStorage.getItem('aiName');
                const theme = localStorage.getItem('theme');
                
                // Clear everything else
                localStorage.clear();
                
                // Restore AI name and theme
                if (aiName) localStorage.setItem('aiName', aiName);
                if (theme) localStorage.setItem('theme', theme);

                // Redirect to login
                window.location.href = 'login.html';
            });
        }
    }

    // Dark Mode Toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        // Check saved theme preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.body.setAttribute('data-theme', savedTheme);
            if (savedTheme === 'dark') {
                darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            }
        }

        // Toggle dark mode
        darkModeToggle.addEventListener('click', () => {
            const currentTheme = document.body.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Update icon
            darkModeToggle.innerHTML = newTheme === 'dark' 
                ? '<i class="fas fa-sun"></i>' 
                : '<i class="fas fa-moon"></i>';
        });
    }
}); 