// ================================================
// AUTHENTICATION & USER MANAGEMENT
// ================================================
// Demo: Handles user registration, login, logout
// Stores JWT token in localStorage for API requests
// Role-based access control (user vs owner)

const Auth = {
    // Login user
    // Validates credentials, verifies role, stores token
    async login(email, password, role) {
        console.log(`🔓 Login attempt: ${email} as ${role}`);
        
        try {
            console.log('📡 Sending login request to server...');
            const result = await API.login(email, password);
            console.log('📨 Login response received:', result);

            // Check for errors
            if (result.error || result.offline) {
                console.error('❌ Login error:', result.error || 'Server connection failed');
                alert('❌ Login error: ' + (result.error || 'Server connection failed') + '\n\nPlease try again.');
                return;
            }

            // API returns { token, user, message } on success
            // Treat missing token as failure
            if (!result.token) {
                const errorMsg = result.message || 'No token received';
                console.error('❌ Login failed:', errorMsg);
                alert('❌ Login failed: ' + errorMsg + '\n\nTip: Check your email and password.');
                return;
            }

            // Verify role matches the login portal
            if (result.user && result.user.role !== role) {
                console.warn(`⚠️ Role mismatch. User is ${result.user.role}, tried ${role}`);
                alert(`❌ Wrong login portal!\n\nYou are a ${result.user.role}.\nPlease use the ${result.user.role} login page.`);
                return;
            }

            // Store auth token and user data
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            console.log(`✅ Login successful: ${result.user.name}`);

            // Redirect to appropriate dashboard
            const dashboard = result.user.role === 'owner' ? 'owner-dashboard.html' : 'dashboard.html';
            console.log(`📍 Redirecting to ${dashboard}`);
            window.location.href = dashboard;
        } catch (err) {
            console.error('❌ Login error:', err);
            alert('❌ Login error: ' + err.message);
        }
    },

    // Register new user
    // Creates account, stores auth token, redirects to dashboard
    async register(name, email, password, role) {
        console.log(`📝 Registration attempt: ${email} as ${role}`);
        
        try {
            console.log('📡 Sending registration request to server...');
            const result = await API.register(name, email, password, role);
            console.log('📨 Registration response received:', result);

            // Check for errors
            if (result.error || result.offline) {
                console.error('❌ Registration error:', result.error || 'Server connection failed');
                alert('❌ Registration error: ' + (result.error || 'Server connection failed') + '\n\nPlease try again.');
                return;
            }

            // Expect a token on success
            if (!result.token) {
                const errorMsg = result.message || 'No token received';
                console.error('❌ Registration failed:', errorMsg);
                alert('❌ Registration failed: ' + errorMsg + '\n\nPlease check all fields and try again.');
                return;
            }

            // Store auth token and user data
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            console.log(`✅ Registration successful: ${result.user.name}`);

            // Redirect to dashboard
            const dashboard = result.user.role === 'owner' ? 'owner-dashboard.html' : 'dashboard.html';
            console.log(`📍 Redirecting to ${dashboard}`);
            window.location.href = dashboard;
        } catch (err) {
            console.error('❌ Registration error:', err);
            alert('❌ Registration error: ' + err.message);
        }
    },

    // Logout user
    // Clears token and user data, redirects to home
    logout() {
        console.log('🚪 Logging out');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    },

    // Check if user is logged in
    isAuthenticated() {
        return !!localStorage.getItem('token');
    },

    // Get current user data from localStorage
    getCurrentUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    // Require authentication - redirect if not logged in
    // Used on dashboard pages to protect routes
    requireAuth() {
        if (!this.isAuthenticated()) {
            console.warn('⚠️ Unauthorized access - redirecting to home');
            window.location.href = 'index.html';
            return false;
        }
        console.log('✅ User authenticated');
        return true;
    }
};

// Setup authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 Page loaded - checking authentication');
    
    // Setup logout button if present
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            Auth.logout();
        });
    }

    // Protect dashboard pages
    // Check if this is a dashboard page (has map or owner list)
    const isMapPage = !!document.getElementById('map');
    const isOwnerPage = !!document.getElementById('myChargersList');
    
    if (isMapPage || isOwnerPage) {
        console.log('🔒 Dashboard page - checking authorization');
        
        if (!Auth.requireAuth()) return;
        
        const user = Auth.getCurrentUser();
        const expectedRole = isMapPage ? 'user' : 'owner';
        
        if (!user || user.role !== expectedRole) {
            console.error(`❌ Access denied. Expected ${expectedRole}, got ${user?.role}`);
            alert('❌ Access denied. Wrong user type.');
            Auth.logout();
            return;
        }
        
        console.log(`✅ Access granted to ${expectedRole} dashboard`);
    }
});
