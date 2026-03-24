const express = require('express');
const router = express.Router();
const { proteger, restreindre } = require('../middlewares/authMiddleware');
const User = require('../models/user');

router.patch('/disponibilite', proteger, restreindre('livreur'), async (req, res) => {
    try {
        const { disponible } = req.body;
        await User.findByIdAndUpdate(req.user._id, { 'livreur_info.disponible': disponible });
        res.status(200).json({ status: 'success', message: disponible ? 'Vous êtes en ligne' : 'Vous êtes hors ligne' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

router.patch('/position', proteger, restreindre('livreur'), async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        await User.findByIdAndUpdate(req.user._id, {
            'livreur_info.position_actuelle': { latitude, longitude, updated_at: new Date() }
        });
        res.status(200).json({ status: 'success', message: 'Position mise à jour' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;