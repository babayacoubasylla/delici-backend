const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/commercantController');
const { proteger, restreindre } = require('../middlewares/authMiddleware');

// ==================== ROUTES PUBLIQUES ====================
router.get('/', ctrl.getCommercantsValides);
router.get('/types', ctrl.getTypesCommerce);
router.get('/valides', ctrl.getCommercantsValides);
router.get('/:id', ctrl.getCommercantById); // ✅ détail d'un commerce (sans token)

// ==================== ROUTES AVEC AUTHENTIFICATION ====================
router.use(proteger);

// ==================== ROUTES COMMERCANT CONNECTÉ ====================
router.post('/inscription', restreindre('commercant', 'client'), ctrl.inscrireCommerce);
router.get('/mon-compte', restreindre('commercant'), ctrl.monCompte);
router.put('/mon-compte', restreindre('commercant'), ctrl.mettreAJourMonCompte);
router.get('/stats', restreindre('commercant'), ctrl.getStats);

// ==================== ROUTES ADMIN ====================
router.get('/admin/tous', restreindre('admin', 'gerant_zone'), ctrl.getAllCommercants);
router.patch('/admin/:id/valider', restreindre('admin', 'gerant_zone'), ctrl.validerCommercant);
router.patch('/admin/:id/rejeter', restreindre('admin', 'gerant_zone'), ctrl.rejeterCommercant);
router.patch('/admin/:id/activer', restreindre('admin', 'gerant_zone'), ctrl.activerCommercant);
router.patch('/admin/:id/desactiver', restreindre('admin', 'gerant_zone'), ctrl.desactiverCommercant);

module.exports = router;