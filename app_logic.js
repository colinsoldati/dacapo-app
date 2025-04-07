// Ce fichier contient la logique pour interagir avec Supabase
// pour les fonctionnalités principales (Planification, Journal, Répertoire)

document.addEventListener('DOMContentLoaded', () => {
    // Assurez-vous que Supabase est accessible globalement
    if (!window.supabase) {
        console.error("Supabase client not found. Make sure auth.js runs first.");
        return;
    }
    const supabase = window.supabase;

    // Références aux éléments de liste et formulaires (modales)
    const repertoireList = document.getElementById('repertoire-list');
    const plansList = document.getElementById('plans-list');
    const journalList = document.getElementById('journal-list');

    const addPieceForm = document.getElementById('add-piece-form');
    const pieceTitleInput = document.getElementById('piece-title');
    const pieceComposerInput = document.getElementById('piece-composer');
    const pieceStatusInput = document.getElementById('piece-status');
    const addPieceError = document.getElementById('add-piece-error');

    // Ajouter les références pour les formulaires/modales de Plan et Journal ici

    // --- FONCTIONS DE CHARGEMENT ---

    // Charger et afficher le Répertoire
    async function loadRepertoire() {
        if (!repertoireList) return;
        repertoireList.innerHTML = '<p>Chargement du répertoire...</p>'; // Indicateur de chargement

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Utilisateur non connecté");

            const { data: pieces, error } = await supabase
                .from('repertoire_pieces')
                .select('id, title, composer, status')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            displayRepertoire(pieces);

        } catch (error) {
            console.error('Error loading repertoire:', error);
            repertoireList.innerHTML = '<p class="error-message">Impossible de charger le répertoire.</p>';
        }
    }
    window.loadRepertoire = loadRepertoire; // Exposer globalement

    // Charger et afficher les Plans
    async function loadPlans() {
        if (!plansList) return;
        plansList.innerHTML = '<p>Chargement des plans...</p>';

        try {
             const { data: { user } } = await supabase.auth.getUser();
             if (!user) throw new Error("Utilisateur non connecté");

            const { data: plans, error } = await supabase
                .from('practice_plans')
                .select('id, plan_date, duration_minutes, goals')
                .eq('user_id', user.id)
                .order('plan_date', { ascending: false }); // Ou par date de création

            if (error) throw error;

            displayPlans(plans);

        } catch (error) {
            console.error('Error loading plans:', error);
            plansList.innerHTML = '<p class="error-message">Impossible de charger les plans.</p>';
        }
    }
    window.loadPlans = loadPlans; // Exposer globalement

    // Charger et afficher le Journal
    async function loadJournalEntries() {
        if (!journalList) return;
        journalList.innerHTML = '<p>Chargement du journal...</p>';

        try {
             const { data: { user } } = await supabase.auth.getUser();
             if (!user) throw new Error("Utilisateur non connecté");

            const { data: entries, error } = await supabase
                .from('journal_entries')
                .select('id, entry_date, duration_minutes, pieces_practiced, reflections')
                .eq('user_id', user.id)
                .order('entry_date', { ascending: false }); // Ou par created_at

            if (error) throw error;

            displayJournalEntries(entries);

        } catch (error) {
            console.error('Error loading journal entries:', error);
            journalList.innerHTML = '<p class="error-message">Impossible de charger le journal.</p>';
        }
    }
    window.loadJournalEntries = loadJournalEntries; // Exposer globalement


    // --- FONCTIONS D'AFFICHAGE ---

    function displayRepertoire(pieces) {
        if (!repertoireList) return;
        repertoireList.innerHTML = ''; // Vider la liste

        if (!pieces || pieces.length === 0) {
            repertoireList.innerHTML = '<p>Votre répertoire est vide. Ajoutez votre première pièce !</p>';
            return;
        }

        pieces.forEach(piece => {
            const item = document.createElement('div');
            item.classList.add('list-item');
            item.innerHTML = `
                <div class="item-title">${escapeHtml(piece.title)}</div>
                <div class="item-details">
                    ${piece.composer ? `Compositeur: ${escapeHtml(piece.composer)}<br>` : ''}
                    ${piece.status ? `Statut: ${escapeHtml(piece.status)}` : ''}
                </div>
                `;
            repertoireList.appendChild(item);
        });
    }

    function displayPlans(plans) {
         if (!plansList) return;
         plansList.innerHTML = '';

         if (!plans || plans.length === 0) {
             plansList.innerHTML = '<p>Aucun plan de répétition créé.</p>';
             return;
         }

         plans.forEach(plan => {
             const item = document.createElement('div');
             item.classList.add('list-item');
             item.innerHTML = `
                 <div class="item-title">Plan du ${formatDate(plan.plan_date)}</div>
                 <div class="item-details">
                     ${plan.duration_minutes ? `Durée prévue: ${plan.duration_minutes} min<br>` : ''}
                     Objectifs: ${escapeHtml(plan.goals || 'Non spécifiés')}
                 </div>
                 `;
             plansList.appendChild(item);
         });
    }

    function displayJournalEntries(entries) {
        if (!journalList) return;
        journalList.innerHTML = '';

        if (!entries || entries.length === 0) {
            journalList.innerHTML = '<p>Aucune entrée dans le journal.</p>';
            return;
        }

        entries.forEach(entry => {
            const item = document.createElement('div');
            item.classList.add('list-item');
            item.innerHTML = `
                <div class="item-title">Entrée du ${formatDate(entry.entry_date)}</div>
                <div class="item-details">
                     ${entry.duration_minutes ? `Durée: ${entry.duration_minutes} min<br>` : ''}
                     Pièces travaillées: ${escapeHtml(entry.pieces_practiced || 'Non spécifié')}<br>
                     Réflexions: ${escapeHtml(entry.reflections || 'Aucune')}
                </div>
                `;
            journalList.appendChild(item);
        });
    }


    // --- FONCTIONS D'AJOUT ---

    // Ajouter une pièce au répertoire
    if (addPieceForm) {
        addPieceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (addPieceError) addPieceError.textContent = ''; // Clear previous error

            const title = pieceTitleInput.value.trim();
            const composer = pieceComposerInput.value.trim();
            const status = pieceStatusInput.value.trim();

            if (!title) {
                 if (addPieceError) addPieceError.textContent = 'Le titre est obligatoire.';
                return;
            }

            const addButton = addPieceForm.querySelector('button[type="submit"]');
            setLoadingState(addButton, true);

            try {
                 const { data: { user } } = await supabase.auth.getUser();
                 if (!user) throw new Error("Utilisateur non connecté pour ajouter une pièce.");

                const { data, error } = await supabase
                    .from('repertoire_pieces')
                    .insert([
                        {
                            user_id: user.id,
                            title: title,
                            composer: composer || null, // Envoyer null si vide
                            status: status || null
                        }
                    ])
                    .select(); // Pour obtenir les données insérées

                if (error) throw error;

                console.log('Piece added:', data);
                addPieceForm.reset(); // Réinitialiser le formulaire
                window.closeModal('add-piece-modal'); // Fermer la modale
                loadRepertoire(); // Recharger la liste

            } catch (error) {
                console.error('Error adding piece:', error);
                 if (addPieceError) addPieceError.textContent = 'Erreur lors de l\'ajout de la pièce.';
            } finally {
                 setLoadingState(addButton, false);
            }
        });
    }

    // Ajouter les gestionnaires pour les formulaires d'ajout de Plan et Journal ici...
    // - Récupérer les valeurs des inputs
    // - Valider les données
    // - Appeler supabase.from(...).insert(...)
    // - Gérer succès/erreur
    // - Fermer modale et recharger la liste correspondante (loadPlans() ou loadJournalEntries())


    // --- UTILITAIRES ---

    // Fonction simple pour échapper le HTML et éviter les injections XSS basiques
    function escapeHtml(unsafe) {
        if (unsafe === null || typeof unsafe === 'undefined') {
            return '';
        }
        return unsafe
             .toString()
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

     // Formater une date (YYYY-MM-DD) en format plus lisible (JJ/MM/AAAA)
     function formatDate(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            // Ajouter gestion timezone si nécessaire (ici on prend la date locale)
             const day = String(date.getDate()).padStart(2, '0');
             const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
             const year = date.getFullYear();
             return `${day}/${month}/${year}`;
        } catch (e) {
             return dateString; // Retourner la chaine originale en cas d'erreur
        }
     }

     // Fonction utilitaire pour gérer l'état de chargement des boutons (copiée de auth.js ou factorisée)
     function setLoadingState(button, isLoading) {
         if (!button) return;
         const originalText = button.dataset.originalText || button.textContent;
         if (isLoading) {
             button.dataset.originalText = originalText; // Stocker le texte original
             button.disabled = true;
             button.textContent = '...'; // Simple indicateur
         } else {
             button.disabled = false;
             button.textContent = originalText;
             delete button.dataset.originalText; // Nettoyer
         }
     }


});
