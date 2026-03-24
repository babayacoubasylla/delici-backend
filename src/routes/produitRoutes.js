const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/produitController');
const { proteger, restreindre } = require('../middlewares/authMiddleware');
const { uploadProduit } = require('../middlewares/uploadMiddleware');

router.get('/commercant/:commercantId', ctrl.getProduits);

router.post('/', proteger, restreindre('commercant'), (req, res, next) => {
    uploadProduit(req, res, (err) => {
        if (err) return res.status(400).json({ status: 'error', message: err.message });
        next();
    });
}, ctrl.creerProduit);

router.patch('/:id', proteger, restreindre('commercant'), (req, res, next) => {
    uploadProduit(req, res, (err) => {
        if (err) return res.status(400).json({ status: 'error', message: err.message });
        next();
    });
}, ctrl.modifierProduit);

router.delete('/:id', proteger, restreindre('commercant'), ctrl.supprimerProduit);
router.patch('/:id/disponibilite', proteger, restreindre('commercant'), ctrl.toggleDisponibilite);

module.exports = router;