const Commercant = require('../models/commercant');
const User = require('../models/user');
const Produit = require('../models/produit');

// Déterminer la catégorie principale en fonction du type de commerce
const determineCategorie = (type_commerce) => {
    const categories = {
        'supermarché_épicerie': 'alimentation',
        'boulangerie_pâtisserie': 'alimentation',
        'marché_légumes': 'alimentation',
        'restaurant_fastfood': 'alimentation',
        'boucherie_poissonnerie': 'alimentation',
        'téléphonie_électronique': 'électronique',
        'vêtements_mode': 'mode',
        'coiffure_beauté': 'beauté',
        'pharmacie_parapharmacie': 'beauté',
        'quincaillerie_bricolage': 'autre',
        'services': 'services',
        'autre': 'autre'
    };
    return categories[type_commerce] || 'autre';
};

// ==================== INSCRIPTION COMMERCANT ====================
exports.inscrireCommerce = async (req, res) => {
    try {
        const {
            nom_boutique, type_commerce, description,
            ville, adresse, telephone, email
        } = req.body;

        const commerceExistant = await Commercant.findOne({ proprietaire: req.user._id });
        if (commerceExistant) {
            return res.status(400).json({
                status: 'error',
                message: 'Vous avez déjà une boutique enregistrée'
            });
        }

        const commercant = await Commercant.create({
            proprietaire: req.user._id,
            nom_boutique,
            type_commerce: type_commerce || 'autre',
            categorie: determineCategorie(type_commerce),
            description,
            ville,
            adresse,
            telephone,
            email: email || req.user.email,
            est_valide: false,
            est_actif: true
        });

        await User.findByIdAndUpdate(req.user._id, { role: 'commercant' });

        res.status(201).json({
            status: 'success',
            message: 'Votre demande d\'inscription a été envoyée. En attente de validation par l\'administrateur.',
            data: { commercant }
        });
    } catch (error) {
        console.error('Erreur inscription commerce:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== MON COMPTE ====================
exports.monCompte = async (req, res) => {
    try {
        const commercant = await Commercant.findOne({ proprietaire: req.user._id })
            .populate('proprietaire', 'nom prenom email telephone');

        if (!commercant) {
            return res.status(404).json({
                status: 'error',
                message: 'Commerce non trouvé'
            });
        }

        res.status(200).json({
            status: 'success',
            data: { commercant }
        });
    } catch (error) {
        console.error('Erreur monCompte:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== METTRE À JOUR MON COMPTE ====================
exports.mettreAJourMonCompte = async (req, res) => {
    try {
        const updates = req.body;
        const allowedUpdates = [
            'nom_boutique', 'description', 'adresse', 'telephone',
            'horaires', 'frais_livraison', 'commande_minimum',
            'temps_preparation_moyen', 'est_ouvert'
        ];

        const filteredUpdates = {};
        allowedUpdates.forEach(field => {
            if (updates[field] !== undefined) {
                filteredUpdates[field] = updates[field];
            }
        });

        const commercant = await Commercant.findOneAndUpdate(
            { proprietaire: req.user._id },
            filteredUpdates,
            { new: true, runValidators: true }
        );

        if (!commercant) {
            return res.status(404).json({
                status: 'error',
                message: 'Commerce non trouvé'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Informations mises à jour',
            data: { commercant }
        });
    } catch (error) {
        console.error('Erreur mise à jour compte:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== TOUS LES COMMERCANTS (ADMIN) ====================
exports.getAllCommercants = async (req, res) => {
    try {
        const { statut, type_commerce, ville, page = 1, limit = 20 } = req.query;
        const filtres = {};

        if (statut === 'en_attente') filtres.est_valide = false;
        else if (statut === 'valide') filtres.est_valide = true;
        if (type_commerce) filtres.type_commerce = type_commerce;
        if (ville) filtres.ville = ville;

        const commercants = await Commercant.find(filtres)
            .populate('proprietaire', 'nom prenom email telephone')
            .populate('valide_par', 'nom prenom')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Commercant.countDocuments(filtres);

        res.status(200).json({
            status: 'success',
            results: commercants.length,
            total,
            data: { commercants }
        });
    } catch (error) {
        console.error('Erreur getAllCommercants:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== COMMERCANTS VALIDÉS (PUBLIC) ====================
exports.getCommercantsValides = async (req, res) => {
    try {
        const { type_commerce, categorie, ville, search, page = 1, limit = 20 } = req.query;
        const filtres = { est_valide: true, est_actif: true };

        if (type_commerce) filtres.type_commerce = type_commerce;
        if (categorie) filtres.categorie = categorie;
        if (ville) filtres.ville = ville;
        if (search) {
            filtres.$text = { $search: search };
        }

        const commercants = await Commercant.find(filtres)
            .select('nom_boutique type_commerce categorie adresse ville logo photo_couverture note_moyenne est_ouvert frais_livraison commande_minimum')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ note_moyenne: -1 });

        res.status(200).json({
            status: 'success',
            results: commercants.length,
            data: { commercants }
        });
    } catch (error) {
        console.error('Erreur getCommercantsValides:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== VALIDER UN COMMERCANT (ADMIN) ====================
exports.validerCommercant = async (req, res) => {
    try {
        const commercant = await Commercant.findById(req.params.id)
            .populate('proprietaire', 'nom prenom email telephone');

        if (!commercant) {
            return res.status(404).json({
                status: 'error',
                message: 'Commerçant non trouvé'
            });
        }

        commercant.est_valide = true;
        commercant.est_verified = true;
        commercant.verified_at = new Date();
        commercant.valide_par = req.user._id;
        commercant.rejected_reason = null;
        await commercant.save();

        const notifier = req.app.get('notifierUtilisateur');
        if (notifier && commercant.proprietaire) {
            notifier(commercant.proprietaire._id.toString(), 'compte_valide', {
                type: 'compte_valide',
                titre: '✅ Compte validé !',
                message: `Votre boutique "${commercant.nom_boutique}" a été validée.`,
                commercant_id: commercant._id
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Commerçant validé avec succès',
            data: { commercant }
        });
    } catch (error) {
        console.error('Erreur validation commercant:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== REJETER UN COMMERCANT (ADMIN) ====================
exports.rejeterCommercant = async (req, res) => {
    try {
        const { raison } = req.body;
        const commercant = await Commercant.findById(req.params.id)
            .populate('proprietaire', 'nom prenom email telephone');

        if (!commercant) {
            return res.status(404).json({
                status: 'error',
                message: 'Commerçant non trouvé'
            });
        }

        commercant.est_valide = false;
        commercant.est_verified = false;
        commercant.rejected_reason = raison;
        commercant.rejected_at = new Date();
        commercant.valide_par = req.user._id;
        await commercant.save();

        const notifier = req.app.get('notifierUtilisateur');
        if (notifier && commercant.proprietaire) {
            notifier(commercant.proprietaire._id.toString(), 'compte_rejete', {
                type: 'compte_rejete',
                titre: '❌ Compte non validé',
                message: `Votre boutique "${commercant.nom_boutique}" n'a pas été validée. Raison: ${raison || 'Non conforme'}`,
                commercant_id: commercant._id,
                raison: raison
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Commerçant rejeté',
            data: { commercant }
        });
    } catch (error) {
        console.error('Erreur rejet commercant:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== ACTIVER UN COMMERCANT (ADMIN) ====================
exports.activerCommercant = async (req, res) => {
    try {
        const commercant = await Commercant.findByIdAndUpdate(
            req.params.id,
            { est_actif: true },
            { new: true }
        ).populate('proprietaire', 'nom prenom email');

        if (!commercant) {
            return res.status(404).json({
                status: 'error',
                message: 'Commerçant non trouvé'
            });
        }

        const notifier = req.app.get('notifierUtilisateur');
        if (notifier && commercant.proprietaire) {
            notifier(commercant.proprietaire._id.toString(), 'compte_active', {
                type: 'compte_active',
                titre: '🟢 Compte activé',
                message: `Votre boutique "${commercant.nom_boutique}" a été réactivée.`,
                commercant_id: commercant._id
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Commerçant activé',
            data: { commercant }
        });
    } catch (error) {
        console.error('Erreur activation commercant:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== DÉSACTIVER UN COMMERCANT (ADMIN) ====================
exports.desactiverCommercant = async (req, res) => {
    try {
        const commercant = await Commercant.findByIdAndUpdate(
            req.params.id,
            { est_actif: false },
            { new: true }
        ).populate('proprietaire', 'nom prenom email');

        if (!commercant) {
            return res.status(404).json({
                status: 'error',
                message: 'Commerçant non trouvé'
            });
        }

        const notifier = req.app.get('notifierUtilisateur');
        if (notifier && commercant.proprietaire) {
            notifier(commercant.proprietaire._id.toString(), 'compte_desactive', {
                type: 'compte_desactive',
                titre: '🔴 Compte désactivé',
                message: `Votre boutique "${commercant.nom_boutique}" a été désactivée.`,
                commercant_id: commercant._id
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Commerçant désactivé',
            data: { commercant }
        });
    } catch (error) {
        console.error('Erreur désactivation commercant:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== TYPES DE COMMERCE DISPONIBLES ====================
exports.getTypesCommerce = async (req, res) => {
    const types = [
        { value: 'supermarché_épicerie', label: 'Supermarché / Épicerie', icon: '🛒', categorie: 'alimentation' },
        { value: 'boulangerie_pâtisserie', label: 'Boulangerie / Pâtisserie', icon: '🥖', categorie: 'alimentation' },
        { value: 'marché_légumes', label: 'Marché / Légumes', icon: '🥬', categorie: 'alimentation' },
        { value: 'restaurant_fastfood', label: 'Restaurant / Fast-food', icon: '🍔', categorie: 'alimentation' },
        { value: 'boucherie_poissonnerie', label: 'Boucherie / Poissonnerie', icon: '🥩', categorie: 'alimentation' },
        { value: 'téléphonie_électronique', label: 'Téléphonie / Électronique', icon: '📱', categorie: 'électronique' },
        { value: 'vêtements_mode', label: 'Vêtements / Mode', icon: '👕', categorie: 'mode' },
        { value: 'coiffure_beauté', label: 'Coiffure / Beauté', icon: '💇', categorie: 'beauté' },
        { value: 'pharmacie_parapharmacie', label: 'Pharmacie / Parapharmacie', icon: '💊', categorie: 'beauté' },
        { value: 'quincaillerie_bricolage', label: 'Quincaillerie / Bricolage', icon: '🔧', categorie: 'autre' },
        { value: 'services', label: 'Services', icon: '🔨', categorie: 'services' },
        { value: 'autre', label: 'Autre', icon: '🏪', categorie: 'autre' }
    ];

    res.status(200).json({ status: 'success', data: { types } });
};

// ==================== STATISTIQUES COMMERCANT ====================
exports.getStats = async (req, res) => {
    try {
        const commercant = await Commercant.findOne({ proprietaire: req.user._id });
        if (!commercant) {
            return res.status(404).json({
                status: 'error',
                message: 'Commerce non trouvé'
            });
        }

        const produits = await Produit.find({ commercant: commercant._id });
        const produitsActifs = produits.filter(p => p.disponible === true).length;

        res.status(200).json({
            status: 'success',
            data: {
                total_commandes: commercant.total_commandes || 0,
                chiffre_affaires: commercant.chiffre_affaires || 0,
                note_moyenne: commercant.note_moyenne || 0,
                total_avis: commercant.total_avis || 0,
                produits_total: produits.length,
                produits_actifs: produitsActifs,
                est_valide: commercant.est_valide,
                est_actif: commercant.est_actif,
                est_ouvert: commercant.est_ouvert
            }
        });
    } catch (error) {
        console.error('Erreur getStats:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};