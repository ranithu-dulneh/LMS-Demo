import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Initialize Supabase Client
const SUPABASE_URL = 'https://bgykguysnjxxfmbhtyal.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJneWtndXlzbmp4eGZtYmh0eWFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4Mjc3OTAsImV4cCI6MjEwMzQwMzc5MH0.14_DAR3xIErHAk-QBaGzL4vFoG5_GH3IDFUVoJCMpCA'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

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
showSignupBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    authTitle.textContent = 'Create an Account';
    authMessages.style.display = 'none';
});

showLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    authTitle.textContent = 'Welcome Back';
    authMessages.style.display = 'none';
});

// Check Session on Load
async function checkUser() {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (session) {
        // User is logged in
        authSection.classList.add('hidden');
        protectedContent.classList.remove('hidden');
    } else {
        // User is not logged in
        authSection.classList.remove('hidden');
        protectedContent.classList.add('hidden');
    }
}

// Handle Signup
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

// Handle Login
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
        checkUser(); // Refresh UI
    }
});

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
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        checkUser();
    }
});

// Initial check
document.addEventListener('DOMContentLoaded', checkUser);
