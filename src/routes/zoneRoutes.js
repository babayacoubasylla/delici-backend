const express = require('express');
const router = express.Router();
const { proteger, restreindre } = require('../middlewares/authMiddleware');
const Zone = require('../models/zone');

router.get('/', async (req, res) => {
    try {
        const zones = await Zone.find({ active: true }).populate('gerant', 'nom prenom telephone');
        res.status(200).json({ status: 'success', data: { zones } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

router.post('/', proteger, restreindre('admin'), async (req, res) => {
    try {
        const zone = await Zone.create(req.body);
        res.status(201).json({ status: 'success', data: { zone } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;