const Produit = require('../models/produit');
const Commercant = require('../models/commercant');
const path = require('path');

// Récupérer les produits d'un commercant
exports.getProduits = async (req, res) => {
    try {
        const { commercantId } = req.params;
        const { categorie, disponible } = req.query;
        const filtres = { commercant: commercantId };
        if (categorie) filtres.categorie = categorie;
        if (disponible !== undefined) filtres.disponible = disponible === 'true';
        const produits = await Produit.find(filtres).sort({ categorie: 1, nom: 1 });
        res.status(200).json({ status: 'success', results: produits.length, data: { produits } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Créer un produit avec photo
exports.creerProduit = async (req, res) => {
    try {
        const commercant = await Commercant.findOne({ proprietaire: req.user._id });
        if (!commercant) return res.status(404).json({ status: 'error', message: 'Commerce introuvable' });
        if (commercant.statut !== 'actif') return res.status(400).json({ status: 'error', message: 'Commerce non validé' });

        const { nom, description, prix, categorie, temps_preparation, tags } = req.body;

        // URL de la photo si uploadée
        let photo = null;
        if (req.file) {
            photo = `${req.protocol}://${req.get('host')}/uploads/produits/${req.file.filename}`;
        }

        const produit = await Produit.create({
            commercant: commercant._id,
            nom, description, prix: parseFloat(prix),
            categorie, photo,
            temps_preparation: parseInt(temps_preparation) || 15,
            tags: tags ? tags.split(',').map(t => t.trim()) : []
        });

        res.status(201).json({ status: 'success', message: 'Produit ajouté !', data: { produit } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Modifier un produit avec photo
exports.modifierProduit = async (req, res) => {
    try {
        const commercant = await Commercant.findOne({ proprietaire: req.user._id });
        if (!commercant) return res.status(404).json({ status: 'error', message: 'Commerce introuvable' });

        const updates = { ...req.body };
        if (req.file) {
            updates.photo = `${req.protocol}://${req.get('host')}/uploads/produits/${req.file.filename}`;
        }
        if (updates.prix) updates.prix = parseFloat(updates.prix);

        const produit = await Produit.findOneAndUpdate(
            { _id: req.params.id, commercant: commercant._id },
            updates,
            { new: true, runValidators: true }
        );

        if (!produit) return res.status(404).json({ status: 'error', message: 'Produit introuvable' });
        res.status(200).json({ status: 'success', message: 'Produit mis à jour', data: { produit } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Supprimer un produit
exports.supprimerProduit = async (req, res) => {
    try {
        const commercant = await Commercant.findOne({ proprietaire: req.user._id });
        if (!commercant) return res.status(404).json({ status: 'error', message: 'Commerce introuvable' });
        const produit = await Produit.findOneAndDelete({ _id: req.params.id, commercant: commercant._id });
        if (!produit) return res.status(404).json({ status: 'error', message: 'Produit introuvable' });
        res.status(200).json({ status: 'success', message: 'Produit supprimé' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Toggle disponibilité
exports.toggleDisponibilite = async (req, res) => {
    try {
        const commercant = await Commercant.findOne({ proprietaire: req.user._id });
        if (!commercant) return res.status(404).json({ status: 'error', message: 'Commerce introuvable' });
        const produit = await Produit.findOne({ _id: req.params.id, commercant: commercant._id });
        if (!produit) return res.status(404).json({ status: 'error', message: 'Produit introuvable' });
        produit.disponible = !produit.disponible;
        await produit.save();
        res.status(200).json({ status: 'success', message: produit.disponible ? 'Produit disponible' : 'Produit indisponible', data: { disponible: produit.disponible } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};