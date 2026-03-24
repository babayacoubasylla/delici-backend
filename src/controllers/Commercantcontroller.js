const Commercant = require('../models/commercant');
const User = require('../models/user');

// ==================== LISTE DES COMMERCANTS ====================
exports.getCommercants = async (req, res) => {
    try {
        const { ville, categorie, page = 1, limit = 20 } = req.query;

        const filtres = { statut: 'actif' };
        if (ville) filtres.ville = ville;
        if (categorie) filtres.categorie = categorie;

        const skip = (page - 1) * limit;

        const commercants = await Commercant.find(filtres)
            .select('-documents -__v')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ note_moyenne: -1, createdAt: -1 });

        const total = await Commercant.countDocuments(filtres);

        res.status(200).json({
            status: 'success',
            results: commercants.length,
            total,
            pages: Math.ceil(total / limit),
            page: parseInt(page),
            data: { commercants }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== UN COMMERCANT ====================
exports.getCommercant = async (req, res) => {
    try {
        const commercant = await Commercant.findById(req.params.id)
            .populate('proprietaire', 'nom prenom telephone')
            .select('-documents -__v');

        if (!commercant) {
            return res.status(404).json({ status: 'error', message: 'Commercant introuvable' });
        }

        res.status(200).json({
            status: 'success',
            data: { commercant }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== CRÉER MON COMMERCE ====================
exports.creerCommerce = async (req, res) => {
    try {
        const {
            nom_boutique, categorie, description, ville,
            adresse, telephone, horaires, frais_livraison,
            commande_minimum, temps_preparation_moyen
        } = req.body;

        // Vérifier si ce propriétaire a déjà un commerce
        const existant = await Commercant.findOne({ proprietaire: req.user._id });
        if (existant) {
            return res.status(400).json({
                status: 'error',
                message: 'Vous avez déjà un commerce enregistré'
            });
        }

        const commercant = await Commercant.create({
            proprietaire: req.user._id,
            nom_boutique,
            categorie,
            description,
            ville: ville || req.user.ville,
            adresse,
            telephone: telephone || req.user.telephone,
            horaires,
            frais_livraison,
            commande_minimum,
            temps_preparation_moyen,
            statut: 'en_attente'
        });

        res.status(201).json({
            status: 'success',
            message: 'Commerce créé ! En attente de validation par notre équipe.',
            data: { commercant }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== MON COMMERCE ====================
exports.monCommerce = async (req, res) => {
    try {
        const commercant = await Commercant.findOne({ proprietaire: req.user._id });

        if (!commercant) {
            return res.status(404).json({
                status: 'error',
                message: 'Vous n\'avez pas encore de commerce enregistré'
            });
        }

        res.status(200).json({
            status: 'success',
            data: { commercant }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== MODIFIER MON COMMERCE ====================
exports.modifierCommerce = async (req, res) => {
    try {
        const {
            nom_boutique, description, adresse, telephone,
            horaires, frais_livraison, commande_minimum,
            temps_preparation_moyen, est_ouvert
        } = req.body;

        const commercant = await Commercant.findOneAndUpdate(
            { proprietaire: req.user._id },
            {
                nom_boutique, description, adresse, telephone,
                horaires, frais_livraison, commande_minimum,
                temps_preparation_moyen, est_ouvert
            },
            { new: true, runValidators: true }
        );

        if (!commercant) {
            return res.status(404).json({ status: 'error', message: 'Commerce introuvable' });
        }

        res.status(200).json({
            status: 'success',
            message: 'Commerce mis à jour',
            data: { commercant }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== OUVRIR / FERMER ====================
exports.toggleOuverture = async (req, res) => {
    try {
        const commercant = await Commercant.findOne({ proprietaire: req.user._id });

        if (!commercant) {
            return res.status(404).json({ status: 'error', message: 'Commerce introuvable' });
        }

        if (commercant.statut !== 'actif') {
            return res.status(400).json({
                status: 'error',
                message: 'Votre commerce n\'est pas encore validé'
            });
        }

        commercant.est_ouvert = !commercant.est_ouvert;
        await commercant.save();

        res.status(200).json({
            status: 'success',
            message: commercant.est_ouvert ? '🟢 Commerce ouvert !' : '🔴 Commerce fermé',
            data: { est_ouvert: commercant.est_ouvert }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== ADMIN - VALIDER UN COMMERCE ====================
exports.validerCommerce = async (req, res) => {
    try {
        const { statut } = req.body; // 'actif' ou 'suspendu'

        const commercant = await Commercant.findByIdAndUpdate(
            req.params.id,
            { statut, valide_par: req.user._id },
            { new: true }
        );

        if (!commercant) {
            return res.status(404).json({ status: 'error', message: 'Commerce introuvable' });
        }

        // Mettre à jour le statut du propriétaire si validé
        if (statut === 'actif') {
            await User.findByIdAndUpdate(commercant.proprietaire, { statut: 'actif' });
        }

        res.status(200).json({
            status: 'success',
            message: `Commerce ${statut === 'actif' ? 'validé' : 'suspendu'} avec succès`,
            data: { commercant }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== ADMIN - TOUS LES COMMERCANTS ====================
exports.getTousCommercants = async (req, res) => {
    try {
        const { statut, ville } = req.query;
        const filtres = {};
        if (statut) filtres.statut = statut;
        if (ville) filtres.ville = ville;

        const commercants = await Commercant.find(filtres)
            .populate('proprietaire', 'nom prenom telephone')
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            results: commercants.length,
            data: { commercants }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};