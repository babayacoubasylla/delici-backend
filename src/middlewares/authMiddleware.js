const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Vérifier le token JWT
exports.proteger = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'Vous devez être connecté pour accéder à cette ressource'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ status: 'error', message: 'Utilisateur introuvable' });
        }

        if (user.statut === 'suspendu') {
            return res.status(403).json({ status: 'error', message: 'Votre compte est suspendu' });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ status: 'error', message: 'Session expirée, reconnectez-vous' });
        }
        return res.status(401).json({ status: 'error', message: 'Token invalide' });
    }
};

// Restreindre l'accès à certains rôles
exports.restreindre = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'error',
                message: `Accès refusé. Rôle requis: ${roles.join(', ')}`
            });
        }
        next();
    };
};