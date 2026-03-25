const Commande = require('../models/commande');
const Commercant = require('../models/commercant');
const Produit = require('../models/produit');
const User = require('../models/user');

// ==================== ASSIGNATION AUTOMATIQUE ====================
const assignerLivreurAutomatique = async (commande, req) => {
    try {
        const livreurs = await User.find({
            role: 'livreur',
            statut: 'actif',
            ville: commande.ville,
            'livreur_info.disponible': true
        }).sort({ 'livreur_info.note_moyenne': -1 });

        if (livreurs.length === 0) return null;

        for (const livreur of livreurs) {
            const missionEnCours = await Commande.findOne({
                livreur: livreur._id,
                statut: { $in: ['livreur_assigne', 'en_collecte', 'en_livraison'] }
            });

            if (!missionEnCours) {
                commande.livreur = livreur._id;
                commande.statut = 'livreur_assigne';
                await commande.save();

                const notifier = req?.app?.get('notifierUtilisateur');
                if (notifier) {
                    notifier(livreur._id.toString(), 'nouvelle_mission', {
                        type: 'nouvelle_mission',
                        titre: '🛵 Nouvelle mission !',
                        message: `Commande ${commande.reference} à livrer`,
                        commande_id: commande._id,
                        reference: commande.reference,
                        ville: commande.ville,
                        gain: (commande.montants.frais_livraison * 0.8).toFixed(0) + ' FCFA',
                    });
                }
                return livreur;
            }
        }
        return null;
    } catch (error) {
        console.error('Erreur assignation:', error.message);
        return null;
    }
};

// ==================== CRÉER UNE COMMANDE (CLIENT) ====================
exports.creerCommande = async (req, res) => {
    try {
        const { commercant_id, articles, adresse_livraison, paiement_methode } = req.body;

        if (!articles || articles.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Le panier est vide' });
        }

        const commercant = await Commercant.findById(commercant_id);
        if (!commercant) return res.status(404).json({ status: 'error', message: 'Commerce introuvable' });
        if (!commercant.est_ouvert) return res.status(400).json({ status: 'error', message: 'Ce commerce est fermé' });

        let sous_total = 0;
        const articlesDetail = [];

        for (const item of articles) {
            const produit = await Produit.findById(item.produit_id);
            if (!produit || !produit.disponible) {
                return res.status(400).json({ status: 'error', message: 'Produit indisponible' });
            }
            const sous_total_item = produit.prix * item.quantite;
            sous_total += sous_total_item;
            articlesDetail.push({
                produit: produit._id,
                nom: produit.nom,
                prix_unitaire: produit.prix,
                quantite: item.quantite,
                sous_total: sous_total_item
            });
        }

        if (sous_total < commercant.commande_minimum) {
            return res.status(400).json({
                status: 'error',
                message: `Minimum: ${commercant.commande_minimum} FCFA (votre panier: ${sous_total} FCFA)`
            });
        }

        const frais_livraison = commercant.frais_livraison;
        const total = sous_total + frais_livraison;

        const commande = await Commande.create({
            client: req.user._id,
            commercant: commercant._id,
            articles: articlesDetail,
            adresse_livraison,
            paiement: { methode: paiement_methode, montant: total, statut: 'en_attente' },
            montants: { sous_total, frais_livraison, total },
            temps_estime: {
                preparation: commercant.temps_preparation_moyen,
                livraison: 20,
                total: commercant.temps_preparation_moyen + 20
            },
            ville: commercant.ville,
            historique_statuts: [{ statut: 'en_attente' }]
        });

        await Commercant.findByIdAndUpdate(commercant._id, { $inc: { total_commandes: 1 } });

        const notifier = req.app.get('notifierUtilisateur');
        if (notifier) {
            notifier(commercant.proprietaire.toString(), 'nouvelle_commande', {
                type: 'nouvelle_commande',
                titre: '🔔 Nouvelle commande !',
                message: `Commande ${commande.reference} — ${total.toLocaleString()} FCFA`,
                commande_id: commande._id,
                reference: commande.reference,
                total,
            });
        }

        res.status(201).json({
            status: 'success',
            message: 'Commande passée avec succès !',
            data: {
                commande: {
                    id: commande._id,
                    reference: commande.reference,
                    statut: commande.statut,
                    montants: commande.montants,
                    temps_estime: commande.temps_estime
                }
            }
        });
    } catch (error) {
        console.error('Erreur commande:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== MES COMMANDES (CLIENT) ====================
exports.mesCommandes = async (req, res) => {
    try {
        const { statut, page = 1, limit = 10 } = req.query;
        const filtres = { client: req.user._id };
        if (statut) filtres.statut = statut;

        const commandes = await Commande.find(filtres)
            .populate('commercant', 'nom_boutique ville adresse')
            .populate('livreur', 'nom prenom telephone')
            .select('-historique_statuts -__v')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        res.status(200).json({ status: 'success', results: commandes.length, data: { commandes } });
    } catch (error) {
        console.error('Erreur mesCommandes:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== SUIVI COMMANDE ====================
exports.suivreCommande = async (req, res) => {
    try {
        const commande = await Commande.findById(req.params.id)
            .populate('commercant', 'nom_boutique adresse telephone')
            .populate('livreur', 'nom prenom telephone livreur_info')
            .select('-__v');

        if (!commande) return res.status(404).json({ status: 'error', message: 'Commande introuvable' });

        if (
            commande.client.toString() !== req.user._id.toString() &&
            req.user.role !== 'admin' &&
            req.user.role !== 'gerant_zone'
        ) {
            return res.status(403).json({ status: 'error', message: 'Accès refusé' });
        }

        res.status(200).json({ status: 'success', data: { commande } });
    } catch (error) {
        console.error('Erreur suivreCommande:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== COMMANDES DU COMMERCE ====================
// ✅ Renommé en commandesCommerce pour correspondre à commandeRoutes.js
exports.commandesCommerce = async (req, res) => {
    try {
        const commercant = await Commercant.findOne({ proprietaire: req.user._id });
        if (!commercant) return res.status(404).json({ status: 'error', message: 'Commerce introuvable' });

        const { statut, page = 1, limit = 20 } = req.query;
        const filtres = { commercant: commercant._id };
        if (statut) filtres.statut = statut;

        const commandes = await Commande.find(filtres)
            .populate('client', 'nom prenom telephone')
            .populate('livreur', 'nom prenom telephone')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        res.status(200).json({ status: 'success', results: commandes.length, data: { commandes } });
    } catch (error) {
        console.error('Erreur commandesCommerce:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== CHANGER STATUT (COMMERCANT) ====================
exports.changerStatutCommerce = async (req, res) => {
    try {
        const { statut } = req.body;
        const statutsAutorises = ['acceptee', 'en_preparation', 'prete', 'annulee'];
        if (!statutsAutorises.includes(statut)) {
            return res.status(400).json({ status: 'error', message: 'Statut non autorisé' });
        }

        const commercant = await Commercant.findOne({ proprietaire: req.user._id });
        if (!commercant) return res.status(404).json({ status: 'error', message: 'Commerce introuvable' });

        const commande = await Commande.findOne({ _id: req.params.id, commercant: commercant._id })
            .populate('client', 'nom prenom telephone _id');
        if (!commande) return res.status(404).json({ status: 'error', message: 'Commande introuvable' });

        commande.statut = statut;
        await commande.save();

        const notifier = req.app.get('notifierUtilisateur');
        const notifierRoom = req.app.get('notifierRoom');

        if (notifier && commande.client) {
            const messages = {
                acceptee: '✅ Votre commande a été acceptée !',
                en_preparation: '👨‍🍳 Votre commande est en préparation',
                prete: '📦 Votre commande est prête, un livreur arrive !',
                annulee: '❌ Votre commande a été annulée',
            };
            notifier(commande.client._id.toString(), 'statut_commande', {
                type: 'statut_commande',
                titre: messages[statut] || `Commande ${statut}`,
                message: `Commande ${commande.reference}`,
                commande_id: commande._id,
                statut,
            });
        }

        let livreurAssigne = null;
        if (statut === 'prete') {
            livreurAssigne = await assignerLivreurAutomatique(commande, req);
            if (!livreurAssigne && notifierRoom) {
                notifierRoom(`livreurs_${commande.ville}`, 'mission_disponible', {
                    type: 'mission_disponible',
                    titre: '📦 Nouvelle mission disponible !',
                    message: `Commande ${commande.reference} à ${commande.ville}`,
                    commande_id: commande._id,
                    reference: commande.reference,
                    ville: commande.ville,
                    gain: (commande.montants.frais_livraison * 0.8).toFixed(0) + ' FCFA',
                });
            }
        }

        res.status(200).json({
            status: 'success',
            message: livreurAssigne
                ? `Commande ${statut} — Livreur ${livreurAssigne.prenom} assigné ! 🛵`
                : statut === 'prete'
                    ? "Commande prête — En attente d'un livreur"
                    : `Commande ${statut}`,
            data: {
                commande,
                livreur_assigne: livreurAssigne
                    ? { nom: livreurAssigne.nom, prenom: livreurAssigne.prenom }
                    : null
            }
        });
    } catch (error) {
        console.error('Erreur changerStatutCommerce:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== MISSIONS DISPONIBLES (LIVREUR) ====================
exports.missionsDisponibles = async (req, res) => {
    try {
        const commandes = await Commande.find({
            statut: 'prete',
            ville: req.user.ville,
            livreur: null
        })
            .populate('commercant', 'nom_boutique adresse ville telephone')
            .select('reference montants adresse_livraison temps_estime commercant createdAt ville')
            .sort({ createdAt: 1 });

        res.status(200).json({ status: 'success', results: commandes.length, data: { commandes } });
    } catch (error) {
        console.error('Erreur missionsDisponibles:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== ACCEPTER MISSION (LIVREUR) ====================
exports.accepterMission = async (req, res) => {
    try {
        const missionEnCours = await Commande.findOne({
            livreur: req.user._id,
            statut: { $in: ['livreur_assigne', 'en_collecte', 'en_livraison'] }
        });
        if (missionEnCours) {
            return res.status(400).json({ status: 'error', message: 'Vous avez déjà une mission en cours' });
        }

        const commande = await Commande.findOne({ _id: req.params.id, statut: 'prete', livreur: null });
        if (!commande) return res.status(404).json({ status: 'error', message: 'Mission introuvable ou déjà prise' });

        commande.livreur = req.user._id;
        commande.statut = 'livreur_assigne';
        await commande.save();

        const notifier = req.app.get('notifierUtilisateur');
        if (notifier) {
            notifier(commande.client.toString(), 'statut_commande', {
                type: 'statut_commande',
                titre: '🛵 Un livreur a pris votre commande !',
                message: `${req.user.prenom} ${req.user.nom} va récupérer votre commande ${commande.reference}`,
                commande_id: commande._id,
                statut: 'livreur_assigne',
            });
        }

        res.status(200).json({ status: 'success', message: 'Mission acceptée ! 🛵', data: { commande } });
    } catch (error) {
        console.error('Erreur accepterMission:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== CHANGER STATUT (LIVREUR) ====================
exports.changerStatutLivreur = async (req, res) => {
    try {
        const { statut } = req.body;
        const statutsAutorises = ['en_collecte', 'en_livraison', 'livree'];
        if (!statutsAutorises.includes(statut)) {
            return res.status(400).json({ status: 'error', message: 'Statut non autorisé' });
        }

        const commande = await Commande.findOne({ _id: req.params.id, livreur: req.user._id })
            .populate('commercant', 'nom_boutique adresse telephone ville')
            .populate('client', 'nom prenom telephone _id');
        if (!commande) return res.status(404).json({ status: 'error', message: 'Commande introuvable' });

        commande.statut = statut;
        await commande.save();

        const notifier = req.app.get('notifierUtilisateur');
        const messages = {
            en_collecte: '🏃 Votre livreur se dirige vers le commerce',
            en_livraison: '🛵 Votre livreur est en route !',
            livree: '🎉 Votre commande a été livrée !',
        };
        if (notifier && commande.client) {
            notifier(commande.client._id.toString(), 'statut_commande', {
                type: 'statut_commande',
                titre: messages[statut] || `Statut: ${statut}`,
                message: `Commande ${commande.reference}`,
                commande_id: commande._id,
                statut,
            });
        }

        if (statut === 'livree') {
            await User.findByIdAndUpdate(req.user._id, {
                $inc: {
                    'livreur_info.total_livraisons': 1,
                    'livreur_info.gains_total': commande.montants.frais_livraison * 0.8
                }
            });
            await Commercant.findByIdAndUpdate(commande.commercant._id, {
                $inc: { chiffre_affaires: commande.montants.sous_total }
            });
        }

        let googleMapsUrl = null;
        if (statut === 'en_collecte' && commande.commercant) {
            const dest = encodeURIComponent(`${commande.commercant.adresse?.quartier || ''} ${commande.commercant.ville}`);
            googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${dest}`;
        } else if (statut === 'en_livraison') {
            const dest = encodeURIComponent(`${commande.adresse_livraison?.quartier || ''} ${commande.adresse_livraison?.description || ''} ${commande.ville}`);
            googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${dest}`;
        }

        res.status(200).json({
            status: 'success',
            message: statut === 'livree' ? '🎉 Livraison terminée !' : `Statut: ${statut}`,
            data: {
                commande,
                google_maps_url: googleMapsUrl,
                client_telephone: commande.client?.telephone
            }
        });
    } catch (error) {
        console.error('Erreur changerStatutLivreur:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== NOTER COMMANDE (CLIENT) ====================
exports.noterCommande = async (req, res) => {
    try {
        const { note_commercant, note_livreur, commentaire } = req.body;
        const commande = await Commande.findOne({
            _id: req.params.id,
            client: req.user._id,
            statut: 'livree'
        });
        if (!commande) return res.status(404).json({ status: 'error', message: 'Commande introuvable ou pas livrée' });

        commande.note_client = { note_commercant, note_livreur, commentaire, date: new Date() };
        await commande.save();

        res.status(200).json({ status: 'success', message: 'Merci pour votre avis !', data: { note: commande.note_client } });
    } catch (error) {
        console.error('Erreur noterCommande:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== ADMIN - TOUTES LES COMMANDES ====================
exports.toutesLesCommandes = async (req, res) => {
    try {
        const { ville, statut, page = 1, limit = 20 } = req.query;
        const filtres = {};
        if (ville) filtres.ville = ville;
        if (statut) filtres.statut = statut;

        const commandes = await Commande.find(filtres)
            .populate('client', 'nom prenom telephone')
            .populate('commercant', 'nom_boutique ville')
            .populate('livreur', 'nom prenom telephone')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Commande.countDocuments(filtres);

        res.status(200).json({ status: 'success', results: commandes.length, total, data: { commandes } });
    } catch (error) {
        console.error('Erreur toutesLesCommandes:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== ADMIN - ASSIGNER MANUELLEMENT ====================
exports.assignerLivreurManuellement = async (req, res) => {
    try {
        const { livreur_id } = req.body;
        const livreur = await User.findOne({ _id: livreur_id, role: 'livreur', statut: 'actif' });
        if (!livreur) return res.status(404).json({ status: 'error', message: 'Livreur introuvable' });

        const commande = await Commande.findByIdAndUpdate(
            req.params.id,
            { livreur: livreur_id, statut: 'livreur_assigne' },
            { new: true }
        ).populate('livreur', 'nom prenom telephone');
        if (!commande) return res.status(404).json({ status: 'error', message: 'Commande introuvable' });

        const notifier = req.app.get('notifierUtilisateur');
        if (notifier) {
            notifier(livreur_id, 'nouvelle_mission', {
                type: 'nouvelle_mission',
                titre: "🛵 Mission assignée par l'admin !",
                message: `Commande ${commande.reference} vous a été assignée`,
                commande_id: commande._id,
            });
        }

        res.status(200).json({
            status: 'success',
            message: `Livreur ${livreur.prenom} assigné !`,
            data: { commande }
        });
    } catch (error) {
        console.error('Erreur assignerLivreurManuellement:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==================== COMMANDES EN COURS (LIVREUR) ====================
exports.getCommandesEnCoursLivreur = async (req, res) => {
    try {
        const commandes = await Commande.find({
            livreur: req.user._id,
            statut: { $in: ['livreur_assigne', 'en_collecte', 'en_livraison'] }
        })
            .populate('commercant', 'nom_boutique adresse ville telephone')
            .populate('client', 'nom prenom telephone')
            .select('-historique_statuts -__v -note_client -annulation')
            .sort({ updatedAt: -1 });

        res.status(200).json({ status: 'success', results: commandes.length, data: { commandes } });
    } catch (error) {
        console.error('Erreur getCommandesEnCoursLivreur:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};