const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/commandeController'); // ✅ bon controller
const { proteger, restreindre } = require('../middlewares/authMiddleware');

// Toutes les routes commandes nécessitent une authentification
router.use(proteger);

// ==================== ROUTES CLIENT ====================
router.post('/', restreindre('client'), ctrl.creerCommande);
router.get('/mes-commandes', restreindre('client'), ctrl.mesCommandes);
router.get('/:id/suivi', restreindre('client', 'admin', 'gerant_zone'), ctrl.suivreCommande);
router.post('/:id/noter', restreindre('client'), ctrl.noterCommande);

// ==================== ROUTES COMMERCANT ====================
router.get('/commerce/liste', restreindre('commercant'), ctrl.commandesCommerce);
router.patch('/commerce/:id/statut', restreindre('commercant'), ctrl.changerStatutCommerce);

// ==================== ROUTES LIVREUR ====================
router.get('/livreur/missions', restreindre('livreur'), ctrl.missionsDisponibles);
router.get('/livreur/en-cours', restreindre('livreur'), ctrl.getCommandesEnCoursLivreur);
router.patch('/livreur/:id/accepter', restreindre('livreur'), ctrl.accepterMission);
router.patch('/livreur/:id/statut', restreindre('livreur'), ctrl.changerStatutLivreur);

// ==================== ROUTES ADMIN ====================
router.get('/admin/toutes', restreindre('admin', 'gerant_zone'), ctrl.toutesLesCommandes);
router.patch('/admin/:id/assigner', restreindre('admin', 'gerant_zone'), ctrl.assignerLivreurManuellement);

module.exports = router;