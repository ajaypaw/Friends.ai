// Simulated token generation (for development)
function generateToken() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Signup functionality
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const userData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            age: document.getElementById('age').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            joinDate: new Date().toISOString()
        };

        try {
            // Validate age
            if (userData.age < 13) {
                throw new Error('You must be at least 13 years old to use this service.');
            }

            // Get existing users or initialize empty array
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            
            // Check if email already exists
            if (users.some(user => user.email === userData.email)) {
                throw new Error('An account with this email already exists.');
            }

            // Store user without password in users array
            const { password, ...userWithoutPassword } = userData;
            users.push(userWithoutPassword);
            localStorage.setItem('users', JSON.stringify(users));

            // Generate and store token
            const token = generateToken();
            localStorage.setItem('token', token);
            localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));

            // Redirect to chat
            window.location.href = 'chat.html';
        } catch (error) {
            alert(error.message);
        }
    });
}

// Login functionality
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            // Get users from storage
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            
            // Find user
            const user = users.find(u => u.email === email);
            if (!user) {
                throw new Error('Invalid login credentials');
            }

            // Generate and store token
            const token = generateToken();
            localStorage.setItem('token', token);
            localStorage.setItem('currentUser', JSON.stringify(user));

            // Redirect to chat
            window.location.href = 'chat.html';
        } catch (error) {
            alert(error.message);
        }
    });
}

// Check authentication status
function checkAuth() {
    const token = localStorage.getItem('token');
    const currentUser = localStorage.getItem('currentUser');
    
    if (!token || !currentUser) {
        if (!window.location.pathname.includes('login.html') && 
            !window.location.pathname.includes('signup.html') &&
            !window.location.pathname.includes('index.html')) {
            window.location.href = 'login.html';
        }
    }
}

// Get current user
function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

// Logout functionality
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        
        // Redirect to login
        window.location.href = 'login.html';
    });
}

// Initialize auth check
checkAuth();

// Export functions for use in other files
window.auth = {
    getCurrentUser,
    checkAuth,
    isAuthenticated: () => !!localStorage.getItem('token')
};
