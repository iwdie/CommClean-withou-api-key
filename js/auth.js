
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    updateProfile, 
    GoogleAuthProvider, 
    signInWithPopup 
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import { auth, db } from './firebase-config.js';
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";


const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        try {
            await signInWithEmailAndPassword(auth, email, password);
            showSuccess('login', 'Login successful! Redirecting...');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } catch (error) {
            showError('login', error.message);
        }
    });
}


const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessages();

        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();

        if (!name || !email || !password || !confirmPassword) {
            showError('signup', 'Please fill in all fields.');
            return;
        }

        if (password !== confirmPassword) {
            showError('signup', 'Passwords do not match.');
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            
            await updateProfile(user, { displayName: name });

            
            await setDoc(doc(db, "users", user.uid), {
                displayName: name,
                email: email,
                createdAt: serverTimestamp()
            });

            showSuccess('signup', 'Account created! Redirecting...');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } catch (error) {
            showError('signup', error.message);
        }
    });
}


window.signInWithGoogle = async function() {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        
        if (result._tokenResponse.isNewUser) {
            await setDoc(doc(db, "users", user.uid), {
                displayName: user.displayName,
                email: user.email,
                createdAt: serverTimestamp()
            });
        }

        showSuccess('login', 'Google login successful! Redirecting...');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    } catch (error) {
        console.error("Google sign-in error:", error);
        showError('login', 'Google sign-in failed: ' + error.message);
    }
};


function clearMessages() {
    document.querySelectorAll('.error-message, .success-message').forEach(el => {
        el.style.display = 'none';
        el.textContent = '';
    });
}

function showError(formType, message) {
    const errorEl = document.getElementById(formType + 'Error');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

function showSuccess(formType, message) {
    const successEl = document.getElementById(formType + 'Success');
    if (successEl) {
        successEl.textContent = message;
        successEl.style.display = 'block';
    }
}
