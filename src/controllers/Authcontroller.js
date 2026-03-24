const jwt = require('jsonwebtoken');
const User = require('../models/user');

const genererToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

// INSCRIPTION
exports.inscription = async (req, res) => {
    try {
        const { nom, prenom, telephone, email, password, ville, role } = req.body;

        if (!nom || !prenom || !telephone || !password || !ville) {
            return res.status(400).json({
                status: 'error',
                message: 'Nom, prénom, téléphone, mot de passe et ville sont obligatoires'
            });
        }

        const existant = await User.findOne({ telephone });
        if (existant) {
            return res.status(400).json({
                status: 'error',
                message: 'Ce numéro de téléphone est déjà utilisé'
            });
        }

        const roleAutorise = ['client', 'livreur', 'commercant'].includes(role) ? role : 'client';

        const user = await User.create({
            nom,
            prenom,
            telephone,
            email,
            password,
            ville,
            role: roleAutorise,
            statut: ['livreur', 'commercant'].includes(roleAutorise) ? 'en_attente' : 'actif'
        });

        const token = genererToken(user._id);

        return res.status(201).json({
            status: 'success',
            message: roleAutorise === 'client'
                ? 'Compte créé avec succès !'
                : 'Inscription réussie ! Votre compte est en attente de validation.',
            data: {
                token,
                user: {
                    id: user._id,
                    nom: user.nom,
                    prenom: user.prenom,
                    telephone: user.telephone,
                    email: user.email,
                    role: user.role,
                    ville: user.ville,
                    statut: user.statut
                }
            }
        });
    } catch (error) {
        console.error('Erreur inscription:', error);
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

// CONNEXION
exports.connexion = async (req, res) => {
    try {
        const { telephone, password } = req.body;

        if (!telephone || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Téléphone et mot de passe requis'
            });
        }

        const user = await User.findOne({ telephone }).select('+password');

        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Numéro de téléphone ou mot de passe incorrect'
            });
        }

        const motDePasseCorrect = await user.verifierMotDePasse(password);
        if (!motDePasseCorrect) {
            return res.status(401).json({
                status: 'error',
                message: 'Numéro de téléphone ou mot de passe incorrect'
            });
        }

        if (user.statut === 'suspendu') {
            return res.status(403).json({
                status: 'error',
                message: 'Votre compte a été suspendu. Contactez le support.'
            });
        }

        if (user.statut === 'en_attente') {
            return res.status(403).json({
                status: 'error',
                message: 'Votre compte est en attente de validation par notre équipe.'
            });
        }

        const token = genererToken(user._id);

        return res.status(200).json({
            status: 'success',
            message: 'Connexion réussie !',
            data: {
                token,
                user: {
                    id: user._id,
                    nom: user.nom,
                    prenom: user.prenom,
                    telephone: user.telephone,
                    email: user.email,
                    role: user.role,
                    ville: user.ville,
                    statut: user.statut,
                    photo: user.photo,
                    livreur_info: user.role === 'livreur' ? user.livreur_info : undefined
                }
            }
        });
    } catch (error) {
        console.error('Erreur connexion:', error);
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

// PROFIL CONNECTÉ
exports.moi = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        return res.status(200).json({
            status: 'success',
            data: {
                user: {
                    id: user._id,
                    nom: user.nom,
                    prenom: user.prenom,
                    telephone: user.telephone,
                    email: user.email,
                    role: user.role,
                    ville: user.ville,
                    statut: user.statut,
                    photo: user.photo,
                    adresse: user.adresse,
                    livreur_info: user.role === 'livreur' ? user.livreur_info : undefined,
                    createdAt: user.createdAt
                }
            }
        });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

// MODIFIER PROFIL
exports.modifierProfil = async (req, res) => {
    try {
        const { nom, prenom, email, adresse, push_token } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { nom, prenom, email, adresse, push_token },
            { new: true, runValidators: true }
        );
        return res.status(200).json({
            status: 'success',
            message: 'Profil mis à jour',
            data: { user }
        });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

// CHANGER MOT DE PASSE
exports.changerMotDePasse = async (req, res) => {
    try {
        const { ancien_password, nouveau_password } = req.body;
        const user = await User.findById(req.user._id).select('+password');
        const correct = await user.verifierMotDePasse(ancien_password);

        if (!correct) {
            return res.status(400).json({
                status: 'error',
                message: 'Ancien mot de passe incorrect'
            });
        }

        user.password = nouveau_password;
        await user.save();

        const token = genererToken(user._id);
        return res.status(200).json({
            status: 'success',
            message: 'Mot de passe modifié avec succès',
            data: { token }
        });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
};