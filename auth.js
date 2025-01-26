// Client-side storage for demo purposes
const users = JSON.parse(localStorage.getItem('users')) || [];

// Signup functionality
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const user = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            age: document.getElementById('age').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            joinDate: new Date().toISOString()
        };

        // Validate age
        if (user.age < 13) {
            alert('You must be at least 13 years old to use this service.');
            return;
        }

        // Check if user already exists
        if (users.find(u => u.email === user.email)) {
            alert('An account with this email already exists.');
            return;
        }

        // Add user to storage
        users.push(user);
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(user));

        // Redirect to chat
        window.location.href = 'chat.html';
    });
}

// Login functionality
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        // Find user
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            window.location.href = 'chat.html';
        } else {
            alert('Invalid email or password.');
        }
    });
}

// Check authentication status
function checkAuth() {
    const currentUser = localStorage.getItem('currentUser');
    const isAuthPage = window.location.href.includes('login.html') || 
                      window.location.href.includes('signup.html') ||
                      window.location.href.includes('index.html')||
                      window.location.href.includes('moodtracker.html');

    if (!currentUser && !isAuthPage) {
        window.location.href = 'login.html';
    } else if (currentUser && isAuthPage) {
        window.location.href = 'chat.html';
    }

    // Update user name in chat if on chat page
    const userNameElement = document.getElementById('userName');
    if (userNameElement && currentUser) {
        const user = JSON.parse(currentUser);
        userNameElement.textContent = `${user.firstName} ${user.lastName}`;
    }
}

// Logout functionality
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    });
}

// Run authentication check
checkAuth();
