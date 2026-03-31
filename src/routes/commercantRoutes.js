const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/commercantController');
const { proteger, restreindre } = require('../middlewares/authMiddleware');

// ==================== ROUTES PUBLIQUES ====================
router.get('/', ctrl.getCommercants);
router.get('/:id', ctrl.getCommercant);

// ==================== ROUTES PROTÉGÉES ====================
router.use(proteger);

// Commercant connecté
router.post('/mon-commerce/creer', restreindre('commercant'), ctrl.creerMonCommerce);
router.get('/mon-commerce/details', restreindre('commercant'), ctrl.monCommerce);
router.patch('/mon-commerce/modifier', restreindre('commercant'), ctrl.modifierMonCommerce);
router.patch('/mon-commerce/ouverture', restreindre('commercant'), ctrl.toggleOuverture);

// Admin
router.get('/admin/tous', restreindre('admin', 'gerant_zone'), ctrl.tousLesCommercants);
router.patch('/admin/:id/valider', restreindre('admin', 'gerant_zone'), ctrl.validerCommercant);

module.exports = router;