// --- Configuration Supabase ---
const SUPABASE_URL = 'https://hunbfztfmqtfxrckrchc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1bmJmenRmbXF0ZnhyY2tyY2hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMzg0NjQsImV4cCI6MjA1OTYxNDQ2NH0.PCLon6XtzPNlqLCXT4427gAXO5aJVrwiLYzZrxvS0DQ';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Exposer le client Supabase pour les autres scripts
window.supabase = supabase; // Rendre accessible globalement

document.addEventListener('DOMContentLoaded', () => {
    // Éléments DOM Auth
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginEmailInput = document.getElementById('login-email');
    const loginPasswordInput = document.getElementById('login-password');
    const signupEmailInput = document.getElementById('signup-email');
    const signupPasswordInput = document.getElementById('signup-password');
    const showSignupLink = document.getElementById('show-signup');
    const showLoginLink = document.getElementById('show-login');
    const logoutButton = document.getElementById('logout-button');
    const authErrorLogin = document.getElementById('auth-error-login');
    const authErrorSignup = document.getElementById('auth-error-signup');

    // --- Initialisation de l'application principale ---
    // Appeler initializeApp de script.js une fois Supabase chargé
    if (window.initializeApp) {
        window.initializeApp(supabase);
    } else {
        console.error("initializeApp function not found in script.js");
    }

    // --- Gestionnaires d'Événements Auth ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAuthErrors();
            const email = loginEmailInput.value.trim();
            const password = loginPasswordInput.value.trim();

            if (!email || !password) {
                displayAuthError('Veuillez remplir tous les champs.', 'login');
                return;
            }

            setLoadingState(loginForm.querySelector('button'), true);
            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password,
                });

                if (error) throw error;

                // Connexion réussie (l'état sera géré par onAuthStateChange)
                console.log('Login successful:', data);
                // window.showAppScreen(); // Déclenché par onAuthStateChange
                // window.loadUserProfile(data.user);

            } catch (error) {
                console.error('Login error:', error);
                displayAuthError(mapAuthError(error.message), 'login');
            } finally {
                setLoadingState(loginForm.querySelector('button'), false);
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAuthErrors();
            const email = signupEmailInput.value.trim();
            const password = signupPasswordInput.value.trim();

            if (!email || !password) {
                displayAuthError('Veuillez remplir tous les champs.', 'signup');
                return;
            }
             // Validation basique du mot de passe (exemple)
             if (password.length < 6) {
                 displayAuthError('Le mot de passe doit contenir au moins 6 caractères.', 'signup');
                 return;
             }

            setLoadingState(signupForm.querySelector('button'), true);
            try {
                const { data, error } = await supabase.auth.signUp({
                    email: email,
                    password: password,
                    // options: { emailRedirectTo: 'VOTRE_URL_DE_CONFIRMATION' } // Important si la confirmation email est activée
                });

                if (error) throw error;

                // Inscription réussie
                console.log('Signup successful:', data);
                // Si la confirmation email est désactivée, l'utilisateur est connecté.
                // Si elle est activée, afficher un message demandant de vérifier les emails.
                 alert('Inscription réussie ! Vous pouvez maintenant vous connecter.'); // Ou message de confirmation email
                 // Basculer vers le formulaire de connexion après inscription
                 toggleAuthForms();
                 loginEmailInput.value = email; // Pré-remplir l'email
                 loginPasswordInput.value = '';
                 loginPasswordInput.focus();


            } catch (error) {
                console.error('Signup error:', error);
                displayAuthError(mapAuthError(error.message), 'signup');
            } finally {
                setLoadingState(signupForm.querySelector('button'), false);
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            setLoadingState(logoutButton, true);
            try {
                const { error } = await supabase.auth.signOut();
                if (error) throw error;
                // La déconnexion déclenchera onAuthStateChange
                console.log('Logout successful');
                // window.showAuthScreen(); // Déclenché par onAuthStateChange
            } catch (error) {
                console.error('Logout error:', error);
                alert('Erreur lors de la déconnexion.'); // Message utilisateur simple
            } finally {
                 setLoadingState(logoutButton, false);
            }
        });
    }

    // --- Basculer entre Connexion et Inscription ---
    if (showSignupLink) {
        showSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleAuthForms();
        });
    }
    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleAuthForms();
        });
    }

    function toggleAuthForms() {
        clearAuthErrors();
        const isLoginVisible = loginForm.style.display !== 'none';
        loginForm.style.display = isLoginVisible ? 'none' : 'block';
        signupForm.style.display = isLoginVisible ? 'block' : 'none';
    }

    // --- Gestion des Erreurs Auth ---
    function clearAuthErrors() {
        if (authErrorLogin) authErrorLogin.textContent = '';
        if (authErrorSignup) authErrorSignup.textContent = '';
    }

    function displayAuthError(message, formType) {
        const errorElement = formType === 'login' ? authErrorLogin : authErrorSignup;
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

     // Mapper les erreurs Supabase en messages plus conviviaux
     function mapAuthError(errorMessage) {
        if (errorMessage.includes('Invalid login credentials')) {
            return 'Email ou mot de passe incorrect.';
        } else if (errorMessage.includes('User already registered')) {
            return 'Cet email est déjà utilisé.';
        } else if (errorMessage.includes('Password should be at least 6 characters')) {
             return 'Le mot de passe doit contenir au moins 6 caractères.';
         } else if (errorMessage.includes('Unable to validate email address: invalid format')) {
             return 'Format d\'email invalide.';
         }
        // Message générique
        return 'Une erreur est survenue. Veuillez réessayer.';
    }


    // --- État de chargement des boutons ---
    function setLoadingState(button, isLoading) {
        if (!button) return;
        if (isLoading) {
            button.disabled = true;
            button.textContent = 'Chargement...'; // Ou une icône spinner
        } else {
            button.disabled = false;
             // Rétablir le texte original (peut nécessiter de stocker le texte initial)
             if (button.closest('form') === loginForm) button.textContent = 'Se connecter';
             else if (button.closest('form') === signupForm) button.textContent = 'S\'inscrire';
             else if (button === logoutButton) button.textContent = 'Déconnexion';
             // Ajoutez d'autres cas si nécessaire
        }
    }


    // --- Écouter les changements d'état d'authentification ---
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session);
        if (event === 'SIGNED_IN') {
            window.showAppScreen();
            window.loadUserProfile(session.user);
            // Charger les données de la vue actuellement active après connexion
            const activeTab = document.querySelector('.nav-tab.active');
            const viewId = activeTab ? activeTab.getAttribute('data-view') : 'planification-view';
            window.loadDataForView(viewId);
        } else if (event === 'SIGNED_OUT') {
            window.showAuthScreen();
             // Optionnel: Vider les données affichées
             const lists = ['plans-list', 'journal-list', 'repertoire-list', 'user-email-display'];
             lists.forEach(id => {
                 const elem = document.getElementById(id);
                 if(elem) elem.innerHTML = '';
             });
        }
         // Gérer d'autres événements comme PASSWORD_RECOVERY, USER_UPDATED si nécessaire
    });

});
