const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/commercantController');
const { proteger, restreindre } = require('../middlewares/authMiddleware');

router.get('/', ctrl.getCommercants);
router.get('/:id', ctrl.getCommercant);
router.post('/mon-commerce/creer', proteger, restreindre('commercant'), ctrl.creerCommerce);
router.get('/mon-commerce/details', proteger, restreindre('commercant'), ctrl.monCommerce);
router.patch('/mon-commerce/modifier', proteger, restreindre('commercant'), ctrl.modifierCommerce);
router.patch('/mon-commerce/ouverture', proteger, restreindre('commercant'), ctrl.toggleOuverture);
router.get('/admin/tous', proteger, restreindre('admin', 'gerant_zone'), ctrl.getTousCommercants);
router.patch('/admin/:id/valider', proteger, restreindre('admin'), ctrl.validerCommerce);

module.exports = router;