const Course = require('../models/Course');
const User = require('../models/User');

// ==================== CRÉER UNE COURSE (CLIENT) ====================
exports.creerCourse = async (req, res) => {
    try {
        const {
            depart, arrivee, description_course,
            paiement_methode, montant
        } = req.body;

        if (!depart || !arrivee || !description_course) {
            return res.status(400).json({
                status: 'error',
                message: 'Départ, arrivée et description sont obligatoires'
            });
        }

        const course = await Course.create({
            client: req.user._id,
            depart,
            arrivee,
            description_course,
            paiement: {
                methode: paiement_methode || 'especes',
                montant: montant || 0,
                statut: 'en_attente'
            },
            ville: req.user.ville,
            historique_statuts: [{ statut: 'en_attente' }]
        });

        // Notifier les livreurs de la ville
        const notifierRoom = req.app.get('notifierRoom');
        if (notifierRoom) {
            notifierRoom(`livreurs_${req.user.ville}`, 'nouvelle_course', {
                type: 'nouvelle_course',
                titre: '🛵 Nouvelle course disponible !',
                message: `Course ${course.reference} - ${course.paiement.montant} FCFA`,
                course_id: course._id,
                reference: course.reference,
                depart: depart.description,
                arrivee: arrivee.description,
                montant: course.paiement.montant
            });
        }

        res.status(201).json({
            status: 'success',
            message: 'Course créée ! En attente d\'un livreur...',
            data: { course }
        });
    } catch (error) {
        console.error('❌ Erreur creerCourse:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== MES COURSES (CLIENT) ====================
exports.mesCourses = async (req, res) => {
    try {
        const { statut, page = 1, limit = 10 } = req.query;
        const filtres = { client: req.user._id };
        if (statut) filtres.statut = statut;

        const courses = await Course.find(filtres)
            .populate('livreur', 'nom prenom telephone livreur_info')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            results: courses.length,
            data: { courses }
        });
    } catch (error) {
        console.error('❌ Erreur mesCourses:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== COURSES DISPONIBLES (LIVREUR) ====================
exports.coursesDisponibles = async (req, res) => {
    try {
        console.log(`📦 Récupération courses disponibles pour livreur ${req.user._id} dans ${req.user.ville}`);
        
        const courses = await Course.find({
            statut: 'en_attente',
            ville: req.user.ville,
            livreur: null
        })
            .populate('client', 'nom prenom telephone')
            .sort({ createdAt: 1 });

        console.log(`✅ ${courses.length} courses disponibles trouvées`);
        
        res.status(200).json({
            status: 'success',
            results: courses.length,
            data: { courses }
        });
    } catch (error) {
        console.error('❌ Erreur coursesDisponibles:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== ACCEPTER UNE COURSE (LIVREUR) ====================
exports.accepterCourse = async (req, res) => {
    try {
        // Vérifier si le livreur a déjà une course en cours
        const courseEnCours = await Course.findOne({
            livreur: req.user._id,
            statut: { $in: ['acceptee', 'en_cours'] }
        });
        
        if (courseEnCours) {
            return res.status(400).json({
                status: 'error',
                message: 'Vous avez déjà une course en cours. Terminez-la avant d\'en accepter une nouvelle.'
            });
        }

        const course = await Course.findOne({
            _id: req.params.id,
            statut: 'en_attente',
            livreur: null
        });

        if (!course) {
            return res.status(404).json({
                status: 'error',
                message: 'Course introuvable ou déjà prise'
            });
        }

        course.livreur = req.user._id;
        course.statut = 'acceptee';
        await course.save();

        // Notifier le client
        const notifier = req.app.get('notifierUtilisateur');
        if (notifier && course.client) {
            notifier(course.client.toString(), 'course_acceptee', {
                type: 'course_acceptee',
                titre: '✅ Course acceptée !',
                message: `${req.user.prenom} ${req.user.nom} a accepté votre course`,
                course_id: course._id,
                reference: course.reference,
                livreur: {
                    nom: req.user.nom,
                    prenom: req.user.prenom,
                    telephone: req.user.telephone
                }
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Course acceptée !',
            data: { course }
        });
    } catch (error) {
        console.error('❌ Erreur accepterCourse:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== CHANGER STATUT COURSE (LIVREUR) ====================
exports.changerStatutCourse = async (req, res) => {
    try {
        const { statut } = req.body;
        const statutsAutorises = ['en_cours', 'terminee'];

        if (!statutsAutorises.includes(statut)) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'Statut non autorisé. Utilisez: en_cours ou terminee' 
            });
        }

        const course = await Course.findOne({
            _id: req.params.id,
            livreur: req.user._id
        }).populate('client', 'nom prenom telephone _id');

        if (!course) {
            return res.status(404).json({ 
                status: 'error', 
                message: 'Course introuvable' 
            });
        }

        const ancienStatut = course.statut;
        course.statut = statut;
        await course.save();

        // Mettre à jour les stats du livreur si terminée
        if (statut === 'terminee') {
            const gain = course.paiement.montant * 0.8;
            await User.findByIdAndUpdate(req.user._id, {
                $inc: {
                    'livreur_info.total_livraisons': 1,
                    'livreur_info.gains_total': gain
                }
            });
            console.log(`💰 Livreur ${req.user.prenom} a gagné ${gain} FCFA pour la course ${course.reference}`);
        }

        // Notifier le client
        const notifier = req.app.get('notifierUtilisateur');
        if (notifier && course.client) {
            const messages = {
                en_cours: {
                    titre: '🛵 Course en cours !',
                    message: `${req.user.prenom} ${req.user.nom} est en route pour récupérer votre course`
                },
                terminee: {
                    titre: '✅ Course terminée !',
                    message: 'Votre course est terminée. Merci !'
                }
            };
            
            notifier(course.client._id.toString(), 'statut_course', {
                type: 'statut_course',
                titre: messages[statut].titre,
                message: messages[statut].message,
                course_id: course._id,
                reference: course.reference,
                statut: statut,
                ancien_statut: ancienStatut
            });
        }

        // Générer l'URL Google Maps si nécessaire
        let googleMapsUrl = null;
        if (statut === 'en_cours' && course.depart) {
            const dest = encodeURIComponent(`${course.depart.description || ''} ${course.ville}`);
            googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${dest}`;
        } else if (statut === 'terminee' && course.arrivee) {
            const dest = encodeURIComponent(`${course.arrivee.description || ''} ${course.ville}`);
            googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${dest}`;
        }

        res.status(200).json({
            status: 'success',
            message: statut === 'terminee' ? '🎉 Course terminée !' : `🛵 Course ${statut}`,
            data: { 
                course,
                google_maps_url: googleMapsUrl,
                client_telephone: course.client?.telephone
            }
        });
    } catch (error) {
        console.error('❌ Erreur changerStatutCourse:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== ANNULER UNE COURSE (CLIENT) ====================
exports.annulerCourse = async (req, res) => {
    try {
        const course = await Course.findOne({
            _id: req.params.id,
            client: req.user._id,
            statut: { $in: ['en_attente', 'acceptee'] }
        });

        if (!course) {
            return res.status(404).json({
                status: 'error',
                message: 'Course introuvable ou ne peut pas être annulée'
            });
        }

        // Si un livreur était assigné, le libérer
        if (course.livreur) {
            const notifier = req.app.get('notifierUtilisateur');
            if (notifier) {
                notifier(course.livreur.toString(), 'course_annulee', {
                    type: 'course_annulee',
                    titre: '❌ Course annulée',
                    message: `La course ${course.reference} a été annulée par le client`,
                    course_id: course._id
                });
            }
        }

        course.statut = 'annulee';
        await course.save();

        res.status(200).json({
            status: 'success',
            message: 'Course annulée',
            data: { course }
        });
    } catch (error) {
        console.error('❌ Erreur annulerCourse:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== MES COURSES (LIVREUR) ====================
exports.mesCoursesList = async (req, res) => {
    try {
        console.log(`📦 Récupération des courses pour livreur ${req.user._id}`);
        
        const { statut } = req.query;
        const filtres = { livreur: req.user._id };
        if (statut) filtres.statut = statut;

        const courses = await Course.find(filtres)
            .populate('client', 'nom prenom telephone')
            .sort({ createdAt: -1 });

        console.log(`✅ ${courses.length} courses trouvées pour le livreur`);
        
        res.status(200).json({
            status: 'success',
            results: courses.length,
            data: { courses }
        });
    } catch (error) {
        console.error('❌ Erreur mesCoursesList:', error);
        res.status(500).json({ 
            status: 'error', 
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// ==================== NOTER UNE COURSE (CLIENT) ====================
exports.noterCourse = async (req, res) => {
    try {
        const { note, commentaire } = req.body;

        if (!note || note < 1 || note > 5) {
            return res.status(400).json({
                status: 'error',
                message: 'La note doit être entre 1 et 5'
            });
        }

        const course = await Course.findOne({
            _id: req.params.id,
            client: req.user._id,
            statut: 'terminee'
        });

        if (!course) {
            return res.status(404).json({
                status: 'error',
                message: 'Course introuvable ou pas encore terminée'
            });
        }

        course.note_client = { note, commentaire, date: new Date() };
        await course.save();

        // Mettre à jour la note moyenne du livreur
        if (course.livreur) {
            const toutesNotes = await Course.find({
                livreur: course.livreur,
                'note_client.note': { $exists: true }
            }).select('note_client.note');
            
            const sommeNotes = toutesNotes.reduce((sum, c) => sum + c.note_client.note, 0);
            const moyenne = sommeNotes / toutesNotes.length;
            
            await User.findByIdAndUpdate(course.livreur, {
                'livreur_info.note_moyenne': moyenne
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Merci pour votre note !',
            data: { note: course.note_client }
        });
    } catch (error) {
        console.error('❌ Erreur noterCourse:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== GÉRANT - ASSIGNER UN LIVREUR ====================
exports.assignerLivreur = async (req, res) => {
    try {
        const { livreur_id } = req.body;

        if (!livreur_id) {
            return res.status(400).json({
                status: 'error',
                message: 'L\'ID du livreur est requis'
            });
        }

        const livreur = await User.findOne({
            _id: livreur_id,
            role: 'livreur',
            statut: 'actif',
            'livreur_info.disponible': true
        });

        if (!livreur) {
            return res.status(404).json({
                status: 'error',
                message: 'Livreur introuvable ou non disponible'
            });
        }

        // Vérifier si le livreur n'a pas déjà une course en cours
        const courseEnCours = await Course.findOne({
            livreur: livreur_id,
            statut: { $in: ['acceptee', 'en_cours'] }
        });
        
        if (courseEnCours) {
            return res.status(400).json({
                status: 'error',
                message: 'Ce livreur a déjà une course en cours'
            });
        }

        const course = await Course.findByIdAndUpdate(
            req.params.id,
            { livreur: livreur_id, statut: 'acceptee' },
            { new: true }
        ).populate('client', 'nom prenom telephone');

        if (!course) {
            return res.status(404).json({ 
                status: 'error', 
                message: 'Course introuvable' 
            });
        }

        // Notifier le livreur
        const notifier = req.app.get('notifierUtilisateur');
        if (notifier) {
            notifier(livreur_id, 'nouvelle_course', {
                type: 'nouvelle_course',
                titre: '🛵 Nouvelle course assignée !',
                message: `Course ${course.reference} vous a été assignée par l'administrateur`,
                course_id: course._id,
                reference: course.reference,
                montant: course.paiement.montant
            });
        }

        res.status(200).json({
            status: 'success',
            message: `Livreur ${livreur.prenom} ${livreur.nom} assigné !`,
            data: { course }
        });
    } catch (error) {
        console.error('❌ Erreur assignerLivreur:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== STATISTIQUES LIVREUR ====================
exports.statsLivreur = async (req, res) => {
    try {
        const coursesTerminees = await Course.find({
            livreur: req.user._id,
            statut: 'terminee'
        });

        const totalCourses = coursesTerminees.length;
        const gainsTotal = coursesTerminees.reduce((sum, c) => sum + (c.paiement.montant * 0.8), 0);
        
        const notes = coursesTerminees
            .filter(c => c.note_client?.note)
            .map(c => c.note_client.note);
        
        const moyenneNote = notes.length > 0 
            ? notes.reduce((sum, n) => sum + n, 0) / notes.length 
            : 0;

        res.status(200).json({
            status: 'success',
            data: {
                total_courses: totalCourses,
                gains_total: gainsTotal,
                note_moyenne: moyenneNote,
                courses: coursesTerminees
            }
        });
    } catch (error) {
        console.error('❌ Erreur statsLivreur:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};