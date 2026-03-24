const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/courseController');
const { proteger, restreindre } = require('../middlewares/authMiddleware');

// Client
router.post('/', proteger, restreindre('client'), ctrl.creerCourse);
router.get('/mes-courses', proteger, restreindre('client'), ctrl.mesCourses);
router.patch('/:id/annuler', proteger, restreindre('client'), ctrl.annulerCourse);
router.post('/:id/noter', proteger, restreindre('client'), ctrl.noterCourse);

// Livreur
router.get('/disponibles', proteger, restreindre('livreur'), ctrl.coursesDisponibles);
router.patch('/:id/accepter', proteger, restreindre('livreur'), ctrl.accepterCourse);
router.patch('/:id/statut', proteger, restreindre('livreur'), ctrl.changerStatutCourse);
router.get('/mes-livraisons', proteger, restreindre('livreur'), ctrl.mesCoursesList);

// Gérant / Admin
router.patch('/:id/assigner', proteger, restreindre('admin', 'gerant_zone'), ctrl.assignerLivreur);

module.exports = router;