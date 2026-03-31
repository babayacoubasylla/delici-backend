const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/produitController');
const { proteger, restreindre } = require('../middlewares/authMiddleware');

// PUBLIC — liste des produits d'un commercant
router.get('/commercant/:commercantId', ctrl.getProduits);

// PROTÉGÉES — commercant connecté
router.use(proteger);
router.post('/', restreindre('commercant'), ctrl.creerProduit);
router.patch('/:id', restreindre('commercant'), ctrl.modifierProduit);
router.delete('/:id', restreindre('commercant'), ctrl.supprimerProduit);
router.patch('/:id/disponibilite', restreindre('commercant'), ctrl.toggleDisponibilite);

module.exports = router;