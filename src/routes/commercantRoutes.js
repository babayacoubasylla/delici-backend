const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/commercantController');
const { proteger, restreindre } = require('../middlewares/authMiddleware');

// ==================== ROUTES PROTÉGÉES EN PREMIER ====================
// (avant /:id pour éviter les conflits)
router.post('/mon-commerce/creer', proteger, restreindre('commercant'), ctrl.creerMonCommerce);
router.get('/mon-commerce/details', proteger, restreindre('commercant'), ctrl.monCommerce);
router.patch('/mon-commerce/modifier', proteger, restreindre('commercant'), ctrl.modifierMonCommerce);
router.patch('/mon-commerce/ouverture', proteger, restreindre('commercant'), ctrl.toggleOuverture);

// Admin
router.get('/admin/tous', proteger, restreindre('admin', 'gerant_zone'), ctrl.tousLesCommercants);
router.patch('/admin/:id/valider', proteger, restreindre('admin', 'gerant_zone'), ctrl.validerCommercant);

// ==================== ROUTES PUBLIQUES ====================
// (/:id en dernier pour ne pas intercepter les routes ci-dessus)
router.get('/', ctrl.getCommercants);
router.get('/:id', ctrl.getCommercant);

module.exports = router;