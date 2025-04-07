document.addEventListener('DOMContentLoaded', () => {
    // Références globales Supabase (initialisées dans auth.js)
    let supabase;

    // Éléments DOM
    const authScreen = document.getElementById('auth-screen');
    const appScreen = document.getElementById('app-screen');
    const mainContent = document.getElementById('main-content');
    const bottomNav = document.getElementById('bottom-nav');
    const navTabs = document.querySelectorAll('.nav-tab');
    const views = document.querySelectorAll('.app-view');
    const currentViewId = 'planification-view'; // Vue initiale

    // --- Initialisation ---
    function initializeApp(supabaseClient) {
        supabase = supabaseClient; // Récupère le client Supabase initialisé depuis auth.js

        // Vérifier l'état de connexion au chargement
        checkAuthState();

        // Gestionnaires d'événements
        setupEventListeners();

        // Charger la vue initiale si l'utilisateur est connecté
        if (appScreen.classList.contains('active')) {
            switchView(currentViewId);
            loadInitialData(); // Charger les données pour la vue initiale
        }
    }

    // --- Gestion de l'état d'authentification ---
    async function checkAuthState() {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            showAppScreen();
            loadUserProfile(session.user);
            // Charger les données de la vue active
             const activeTab = document.querySelector('.nav-tab.active');
             if (activeTab) {
                 const viewId = activeTab.getAttribute('data-view');
                 loadDataForView(viewId); // Charger les données spécifiques
             } else {
                // Si aucune tabulation n'est active (cas improbable), charger la vue par défaut
                loadDataForView(currentViewId);
             }
        } else {
            showAuthScreen();
        }
    }

    function showAuthScreen() {
        authScreen.classList.add('active');
        appScreen.classList.remove('active');
    }

    function showAppScreen() {
        authScreen.classList.remove('active');
        appScreen.classList.add('active');
         // Afficher la vue par défaut ou la dernière vue active
         const activeTab = document.querySelector('.nav-tab.active');
         switchView(activeTab ? activeTab.getAttribute('data-view') : currentViewId);
    }

    function loadUserProfile(user) {
        const userEmailDisplay = document.getElementById('user-email-display');
        if (userEmailDisplay && user) {
            userEmailDisplay.textContent = `Connecté en tant que : ${user.email}`;
        }
        // Vous pouvez charger d'autres infos du profil ici si nécessaire
    }

    // --- Navigation ---
    function setupEventListeners() {
        // Navigation par onglets
        bottomNav.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-tab')) {
                const viewId = e.target.getAttribute('data-view');
                switchView(viewId);
                loadDataForView(viewId); // Charger les données quand on change de vue
            }
        });

        // Boutons "Ajouter" (rediriger vers les modales)
        document.getElementById('add-plan-btn')?.addEventListener('click', () => openModal('add-plan-modal')); // Assurez-vous que la modale existe
        document.getElementById('add-journal-btn')?.addEventListener('click', () => openModal('add-journal-modal')); // Assurez-vous que la modale existe
        document.getElementById('add-piece-btn')?.addEventListener('click', () => openModal('add-piece-modal'));

        // Fermeture des modales
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = e.target.getAttribute('data-modal-id');
                closeModal(modalId);
            });
        });
        // Fermeture en cliquant hors de la modale
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) { // Si le clic est sur le fond de la modale
                    closeModal(modal.id);
                }
            });
        });

        // Déconnexion (dans auth.js) -> Appelée depuis auth.js après succès

        // Soumission des formulaires (dans app_logic.js)
    }

    function switchView(viewId) {
        let currentActiveView = document.querySelector('.app-view.active');
        if (currentActiveView && currentActiveView.id !== viewId) {
            // Optionnel: Ajouter une classe pour l'animation de sortie
            currentActiveView.classList.add('exiting');
            currentActiveView.classList.remove('active');
            // Attendre la fin de l'animation avant de cacher complètement si nécessaire
            // setTimeout(() => { currentActiveView.classList.remove('exiting'); }, 400); // 400ms = durée de l'animation
        } else if (currentActiveView && currentActiveView.id === viewId) {
            return; // Ne rien faire si on clique sur l'onglet déjà actif
        }


        views.forEach(view => {
            // Retirer la classe 'exiting' si elle existe encore
             view.classList.remove('exiting');
            if (view.id === viewId) {
                view.classList.add('active');
            } else {
                 // S'assurer que les autres vues sont bien cachées (au cas où l'animation de sortie n'est pas gérée)
                if (view.id !== currentActiveView?.id) { // Ne pas re-cacher celle qui vient d'être désactivée pendant l'animation
                     view.classList.remove('active');
                }
            }
        });

        navTabs.forEach(tab => {
            if (tab.getAttribute('data-view') === viewId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        console.log(`Switched to view: ${viewId}`);
    }

    // --- Chargement des Données ---
    function loadInitialData() {
        // Charger les données pour la vue par défaut (Planification)
        loadDataForView(currentViewId);
    }

    function loadDataForView(viewId) {
         // Vider les listes précédentes pour éviter les doublons lors du rechargement
         clearLists();

        console.log(`Loading data for view: ${viewId}`);
        // Appeler la fonction de chargement appropriée depuis app_logic.js
        switch (viewId) {
            case 'planification-view':
                if (window.loadPlans) window.loadPlans(); else console.error("loadPlans function not found");
                break;
            case 'journal-view':
                if (window.loadJournalEntries) window.loadJournalEntries(); else console.error("loadJournalEntries function not found");
                break;
            case 'repertoire-view':
                if (window.loadRepertoire) window.loadRepertoire(); else console.error("loadRepertoire function not found");
                break;
            case 'profil-view':
                // Les infos profil sont déjà chargées par checkAuthState
                break;
        }
    }

     function clearLists() {
        const lists = ['plans-list', 'journal-list', 'repertoire-list'];
        lists.forEach(listId => {
            const listElement = document.getElementById(listId);
            if (listElement) {
                listElement.innerHTML = ''; // Vide le contenu de la liste
            }
        });
    }


    // --- Gestion des Modales ---
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            // Optionnel: Réinitialiser les champs du formulaire dans la modale
            const form = modal.querySelector('form');
            form?.reset();
            const errorMessage = modal.querySelector('.error-message');
             if (errorMessage) errorMessage.textContent = '';

            modal.classList.add('active');
            // Ajouter un petit délai pour que l'animation CSS se déclenche correctement après display: flex
             setTimeout(() => { modal.style.opacity = 1; }, 10);
        } else {
            console.error(`Modal with id ${modalId} not found.`);
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            modal.style.opacity = 0; // Pour l'animation de sortie si nécessaire
        }
    }

    // --- Service Worker ---
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js') // Assurez-vous que le chemin est correct
                .then(registration => {
                    console.log('Service Worker registered with scope:', registration.scope);
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        }
    }

    // Exposer des fonctions globales si nécessaire (ex: pour auth.js)
    window.initializeApp = initializeApp;
    window.showAppScreen = showAppScreen;
    window.showAuthScreen = showAuthScreen;
    window.loadUserProfile = loadUserProfile;
    window.closeModal = closeModal; // Rendre closeModal accessible globalement
    window.loadDataForView = loadDataForView; // Rendre accessible pour rechargement après ajout/modif

    // Démarrer l'enregistrement du SW
    registerServiceWorker();

    // L'initialisation réelle de l'app se fait dans auth.js après l'init de Supabase
});
