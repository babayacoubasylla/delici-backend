const express = require('express');
const router = express.Router();
const { proteger, restreindre } = require('../middlewares/authMiddleware');
const User = require('../models/User');

router.get('/', proteger, restreindre('admin', 'gerant_zone'), async (req, res) => {
    try {
        const { role, ville, statut } = req.query;
        const filtres = {};
        if (role) filtres.role = role;
        if (ville) filtres.ville = ville;
        if (statut) filtres.statut = statut;
        const users = await User.find(filtres).select('-password -refresh_token').sort({ createdAt: -1 });
        res.status(200).json({ status: 'success', results: users.length, data: { users } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

router.patch('/:id/statut', proteger, restreindre('admin'), async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { statut: req.body.statut }, { new: true });
        res.status(200).json({ status: 'success', message: 'Statut mis à jour', data: { user } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;