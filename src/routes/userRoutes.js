const express = require('express');
const router = express.Router();
const { proteger, restreindre } = require('../middlewares/authMiddleware');
const User = require('../models/user');

// ==================== LISTE DES UTILISATEURS (ADMIN) ====================
// Supporte les filtres: ?role=commercant&statut=en_attente&ville=Abidjan
router.get('/', proteger, restreindre('admin', 'gerant_zone'), async (req, res) => {
    try {
        const { role, ville, statut, page = 1, limit = 20 } = req.query;
        const filtres = {};

        if (role) filtres.role = role;
        if (ville) filtres.ville = ville;
        if (statut) filtres.statut = statut;

        const users = await User.find(filtres)
            .select('-password -refresh_token')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await User.countDocuments(filtres);

        res.status(200).json({
            status: 'success',
            results: users.length,
            total,
            data: { users }
        });
    } catch (error) {
        console.error('Erreur liste users:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ==================== DÉTAIL D'UN UTILISATEUR ====================
router.get('/:id', proteger, restreindre('admin', 'gerant_zone'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password -refresh_token');
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Utilisateur introuvable' });
        }
        res.status(200).json({ status: 'success', data: { user } });
    } catch (error) {
        console.error('Erreur détail user:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ==================== CHANGER LE STATUT D'UN UTILISATEUR (ADMIN) ====================
router.patch('/:id/statut', proteger, restreindre('admin'), async (req, res) => {
    try {
        const { statut } = req.body;
        const statutsValides = ['actif', 'suspendu', 'en_attente', 'inactif'];

        if (!statutsValides.includes(statut)) {
            return res.status(400).json({
                status: 'error',
                message: `Statut invalide. Valeurs acceptées: ${statutsValides.join(', ')}`
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { statut },
            { new: true }
        ).select('-password -refresh_token');

        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Utilisateur introuvable' });
        }

        res.status(200).json({
            status: 'success',
            message: 'Statut mis à jour',
            data: { user }
        });
    } catch (error) {
        console.error('Erreur statut user:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ==================== CHANGER LE RÔLE D'UN UTILISATEUR (ADMIN) ====================
router.patch('/:id/role', proteger, restreindre('admin'), async (req, res) => {
    try {
        const { role } = req.body;
        const rolesValides = ['client', 'commercant', 'livreur', 'gerant_zone', 'admin'];

        if (!rolesValides.includes(role)) {
            return res.status(400).json({
                status: 'error',
                message: `Rôle invalide. Valeurs acceptées: ${rolesValides.join(', ')}`
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        ).select('-password -refresh_token');

        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Utilisateur introuvable' });
        }

        res.status(200).json({
            status: 'success',
            message: 'Rôle mis à jour',
            data: { user }
        });
    } catch (error) {
        console.error('Erreur rôle user:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ==================== SUPPRIMER UN UTILISATEUR (ADMIN) ====================
router.delete('/:id', proteger, restreindre('admin'), async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Utilisateur introuvable' });
        }
        res.status(200).json({ status: 'success', message: 'Utilisateur supprimé' });
    } catch (error) {
        console.error('Erreur suppression user:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;