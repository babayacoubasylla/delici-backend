const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { proteger } = require('../middlewares/authMiddleware');

// Routes publiques
router.post('/inscription', authController.inscription);
router.post('/connexion', authController.connexion);

// Routes protégées
router.get('/moi', proteger, authController.moi);
router.patch('/modifier-profil', proteger, authController.modifierProfil);
router.patch('/changer-mot-de-passe', proteger, authController.changerMotDePasse);

module.exports = router;