const Commercant = require('../models/commercant');
const User = require('../models/user');

// ==================== LISTE DES COMMERCANTS (CLIENT) ====================
exports.getCommercants = async (req, res) => {
    try {
        const { ville, categorie, page = 1, limit = 20 } = req.query;
        const filtres = { statut: 'actif' };
        if (ville) filtres.ville = ville;
        if (categorie) filtres.categorie = categorie;

        const commercants = await Commercant.find(filtres)
            .select('-__v')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ note_moyenne: -1 });

        res.status(200).json({
            status: 'success',
            results: commercants.length,
            data: { commercants }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== UN COMMERCANT ====================
exports.getCommercant = async (req, res) => {
    try {
        const commercant = await Commercant.findById(req.params.id);
        if (!commercant) {
            return res.status(404).json({ status: 'error', message: 'Commerce introuvable' });
        }
        res.status(200).json({ status: 'success', data: { commercant } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== CRÉER MON COMMERCE ====================
exports.creerMonCommerce = async (req, res) => {
    try {
        const existant = await Commercant.findOne({ proprietaire: req.user._id });
        if (existant) {
            return res.status(400).json({ status: 'error', message: 'Vous avez déjà un commerce enregistré' });
        }

        const {
            nom_boutique, categorie, description, adresse,
            telephone, frais_livraison, temps_preparation_moyen,
            commande_minimum, ville
        } = req.body;

        const commercant = await Commercant.create({
            proprietaire: req.user._id,
            nom_boutique,
            categorie,
            description,
            adresse,
            telephone: telephone || req.user.telephone,
            frais_livraison: frais_livraison || 500,
            temps_preparation_moyen: temps_preparation_moyen || 20,
            commande_minimum: commande_minimum || 1000,
            ville: ville || req.user.ville,
            statut: 'actif', // ✅ Validé automatiquement
            est_ouvert: false,
        });

        res.status(201).json({
            status: 'success',
            message: 'Commerce créé avec succès !',
            data: { commercant }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== MON COMMERCE (détails) ====================
exports.monCommerce = async (req, res) => {
    try {
        const commercant = await Commercant.findOne({ proprietaire: req.user._id });
        if (!commercant) {
            return res.status(404).json({ status: 'error', message: 'Aucun commerce trouvé' });
        }
        res.status(200).json({ status: 'success', data: { commercant } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== MODIFIER MON COMMERCE ====================
exports.modifierMonCommerce = async (req, res) => {
    try {
        const commercant = await Commercant.findOneAndUpdate(
            { proprietaire: req.user._id },
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!commercant) {
            return res.status(404).json({ status: 'error', message: 'Commerce introuvable' });
        }
        res.status(200).json({ status: 'success', message: 'Commerce mis à jour !', data: { commercant } });
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

// ==================== ADMIN - TOUS LES COMMERCANTS ====================
exports.tousLesCommercants = async (req, res) => {
    try {
        const { statut, ville } = req.query;
        const filtres = {};
        if (statut) filtres.statut = statut;
        if (ville) filtres.ville = ville;

        const commercants = await Commercant.find(filtres)
            .populate('proprietaire', 'nom prenom telephone')
            .sort({ createdAt: -1 });

        res.status(200).json({ status: 'success', results: commercants.length, data: { commercants } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== ADMIN - VALIDER UN COMMERCANT ====================
exports.validerCommercant = async (req, res) => {
    try {
        const { statut } = req.body;
        const commercant = await Commercant.findByIdAndUpdate(
            req.params.id,
            { statut },
            { new: true }
        );
        if (!commercant) {
            return res.status(404).json({ status: 'error', message: 'Commerce introuvable' });
        }
        res.status(200).json({
            status: 'success',
            message: `Commerce ${statut === 'actif' ? 'validé ✅' : 'suspendu ❌'}`,
            data: { commercant }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};