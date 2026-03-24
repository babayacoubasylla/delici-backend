const express = require('express');
const router = express.Router();
const { proteger, restreindre } = require('../middlewares/authMiddleware');
const Commande = require('../models/Commande');
const Commercant = require('../models/Commercant');
const User = require('../models/User');

router.get('/admin', proteger, restreindre('admin'), async (req, res) => {
    try {
        const [totalUsers, totalCommercants, totalCommandes, commandesLivrees] = await Promise.all([
            User.countDocuments(),
            Commercant.countDocuments({ statut: 'actif' }),
            Commande.countDocuments(),
            Commande.countDocuments({ statut: 'livree' })
        ]);
        res.status(200).json({
            status: 'success',
            data: { stats: { totalUsers, totalCommercants, totalCommandes, commandesLivrees } }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

router.get('/client', proteger, restreindre('client'), async (req, res) => {
    try {
        const commandes = await Commande.find({ client: req.user._id });
        const livrees = commandes.filter(c => c.statut === 'livree').length;
        const total_depenses = commandes.reduce((acc, c) => acc + c.montants.total, 0);
        res.status(200).json({
            status: 'success',
            data: { stats: { total_commandes: commandes.length, livrees, total_depenses } }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

router.get('/commercant', proteger, restreindre('commercant'), async (req, res) => {
    try {
        const commercant = await Commercant.findOne({ proprietaire: req.user._id });
        if (!commercant) return res.status(404).json({ status: 'error', message: 'Commerce introuvable' });
        const commandes = await Commande.find({ commercant: commercant._id });
        const livrees = commandes.filter(c => c.statut === 'livree').length;
        res.status(200).json({
            status: 'success',
            data: { stats: { total_commandes: commandes.length, livrees, chiffre_affaires: commercant.chiffre_affaires } }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;