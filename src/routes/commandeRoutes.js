const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/commandeController');
const { proteger, restreindre } = require('../middlewares/authMiddleware');

// Client
router.post('/', proteger, restreindre('client'), ctrl.creerCommande);
router.get('/mes-commandes', proteger, restreindre('client'), ctrl.mesCommandes);
router.get('/suivi/:id', proteger, ctrl.suivreCommande);
router.post('/:id/noter', proteger, restreindre('client'), ctrl.noterCommande);

// Commercant
router.get('/commerce/liste', proteger, restreindre('commercant'), ctrl.commandesCommerce);
router.patch('/commerce/:id/statut', proteger, restreindre('commercant'), ctrl.changerStatutCommerce);

// Livreur
router.get('/livreur/missions', proteger, restreindre('livreur'), ctrl.missionsDisponibles);
router.get('/livreur/en-cours', proteger, restreindre('livreur'), ctrl.getCommandesEnCoursLivreur);
router.patch('/livreur/:id/accepter', proteger, restreindre('livreur'), ctrl.accepterMission);
router.patch('/livreur/:id/statut', proteger, restreindre('livreur'), ctrl.changerStatutLivreur);

// Admin / Gérant — assignation manuelle + toutes les commandes
router.get('/admin/toutes', proteger, restreindre('admin', 'gerant_zone'), ctrl.toutesLesCommandes);
router.patch('/admin/:id/assigner', proteger, restreindre('admin', 'gerant_zone'), ctrl.assignerLivreurManuellement);

module.exports = router;