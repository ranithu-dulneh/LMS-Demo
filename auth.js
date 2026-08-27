import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Initialize Supabase Client
const SUPABASE_URL = 'https://bgykguysnjxxfmbhtyal.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJneWtndXlzbmp4eGZtYmh0eWFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4Mjc3OTAsImV4cCI6MjEwMzQwMzc5MH0.14_DAR3xIErHAk-QBaGzL4vFoG5_GH3IDFUVoJCMpCA'
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// DOM Elements
const authSection = document.getElementById('auth-section')
const protectedContent = document.getElementById('protected-content')
const loginForm = document.getElementById('login-form')
const signupForm = document.getElementById('signup-form')
const showSignupBtn = document.getElementById('show-signup')
const showLoginBtn = document.getElementById('show-login')
const logoutBtn = document.getElementById('logout-btn')
const authMessages = document.getElementById('auth-messages')
const authTitle = document.getElementById('auth-title')
const adminPanelLink = document.getElementById('admin-panel-link')
const loginGoogleBtn = document.getElementById('login-google-btn')
const signupGoogleBtn = document.getElementById('signup-google-btn')

const ADMIN_EMAIL = 'testemail@gmail.com'

// Helper function to show messages
function showMessage(message, type = 'error') {
    authMessages.textContent = message;
    authMessages.className = `auth-message ${type}`;
    authMessages.style.display = 'block';

    // Clear message after 5 seconds if it's a success message
    if (type === 'success') {
        setTimeout(() => {
            authMessages.style.display = 'none';
        }, 5000);
    }
}

// Toggle between Login and Signup forms
if (showSignupBtn) {
    showSignupBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        authTitle.textContent = 'Create an Account';
        authMessages.style.display = 'none';
    });
}

if (showLoginBtn) {
    showLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        authTitle.textContent = 'Welcome Back';
        authMessages.style.display = 'none';
    });
}

// Handle Google Login
async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + '/index.html'
        }
    });

    if (error) {
        showMessage(error.message, 'error');
    }
}

if (loginGoogleBtn) {
    loginGoogleBtn.addEventListener('click', signInWithGoogle);
}
if (signupGoogleBtn) {
    signupGoogleBtn.addEventListener('click', signInWithGoogle);
}

// Check Session on Load
async function checkUser() {
    const { data: { session }, error } = await supabase.auth.getSession();
    const isLoginPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
    const isAdminPage = window.location.pathname.endsWith('admin.html');

    if (session) {
        const userEmail = session.user.email;
        const isAdmin = userEmail === ADMIN_EMAIL;

        // Admin Access Logic
        if (isAdminPage && !isAdmin) {
            // Non-admin trying to access admin page -> redirect to index
            window.location.href = 'index.html';
            return;
        }

        if (isLoginPage && isAdmin) {
            // Admin just logged in on index page -> redirect to admin page automatically (optional, based on prompt "make the loggin transfer to the Admin pannel")
            // To prevent infinite loops, we can check if they just logged in, or we just rely on them clicking the button.
            // The prompt says: "If the login is from that account make the loggin transfer to the Admin pannel".
            // Since this runs on page load and auth state change, let's redirect them to admin.html if they are on index.html
            // BUT, the prompt also says "if the admin wanted to peek how the students see the site they can toggle between admin and user interfaces".
            // If we always redirect on index.html, they can never see the student view!
            // Let's rely on the admin panel link being visible instead for toggling.

            // Wait, the prompt specifically says: "If the login is from that account make the loggin transfer to the Admin pannel".
            // Let's set a sessionStorage flag to only redirect once right after login.
            if (sessionStorage.getItem('just_logged_in') === 'true') {
                sessionStorage.removeItem('just_logged_in');
                window.location.href = 'admin.html';
                return;
            }
        }

        // Show protected content
        if (authSection) authSection.classList.add('hidden');
        if (protectedContent) protectedContent.classList.remove('hidden');

        // Toggle Admin Link visibility for the admin user
        if (adminPanelLink) {
            if (isAdmin) {
                adminPanelLink.classList.remove('hidden');
            } else {
                adminPanelLink.classList.add('hidden');
            }
        }

    } else {
        // User is not logged in
        if (isAdminPage) {
            // Not logged in trying to access admin page -> redirect to index
            window.location.href = 'index.html';
            return;
        }

        if (authSection) authSection.classList.remove('hidden');
        if (protectedContent) protectedContent.classList.add('hidden');
    }
}

// Handle Signup
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
        });

        if (error) {
            showMessage(error.message, 'error');
        } else {
            showMessage('Signup successful! Please check your email to verify your account (if email confirmation is enabled), or log in.', 'success');
            signupForm.reset();
            // Switch to login form automatically
            signupForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
            authTitle.textContent = 'Welcome Back';
        }
    });
}

// Handle Login
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            showMessage(error.message, 'error');
        } else {
            loginForm.reset();
            sessionStorage.setItem('just_logged_in', 'true'); // Flag for redirect logic
            checkUser(); // Refresh UI
        }
    });
}

// Handle Logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Logout error:', error);
        } else {
            checkUser(); // Refresh UI
        }
    });
}

// Listen for auth state changes (optional but good practice)
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        // Only set this flag if we are on the login page (likely returning from OAuth)
        const isLoginPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
        if (isLoginPage) {
             // We can't perfectly know if it's a *new* OAuth login vs just refreshing, but setting this
             // means if they *did* just auth and land here, they will redirect to admin if they are admin.
             // But if they just refresh index.html, it will also redirect.
             // Actually, Supabase's `onAuthStateChange` fires 'SIGNED_IN' on initial load if session exists.
             // To prevent redirect loop when admin manually goes to index.html to test, let's only do it
             // if we also detect OAuth redirect params in URL.
             if (window.location.hash.includes('access_token')) {
                 sessionStorage.setItem('just_logged_in', 'true');
             }
        }
        checkUser();
    } else if (event === 'SIGNED_OUT') {
        checkUser();
    }
});

// Initial check
document.addEventListener('DOMContentLoaded', checkUser);
