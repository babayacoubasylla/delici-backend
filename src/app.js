const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const httpServer = createServer(app);

// ==================== CORS ORIGINS ====================
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    process.env.FRONTEND_URL, // URL Vercel en production
].filter(Boolean);

// ==================== SOCKET.IO ====================
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

const utilisateursConnectes = new Map();

io.on('connection', (socket) => {
    console.log(`🔌 Socket connecté: ${socket.id}`);

    socket.on('identifier', (userId) => {
        utilisateursConnectes.set(userId, socket.id);
        socket.emit('identifie', { message: 'Connecté aux notifications !' });
    });

    socket.on('rejoindre_room', (room) => {
        socket.join(room);
    });

    socket.on('disconnect', () => {
        for (const [userId, socketId] of utilisateursConnectes.entries()) {
            if (socketId === socket.id) {
                utilisateursConnectes.delete(userId);
                break;
            }
        }
    });
});

const notifierUtilisateur = (userId, evenement, data) => {
    const socketId = utilisateursConnectes.get(userId?.toString());
    if (socketId) {
        io.to(socketId).emit(evenement, data);
        return true;
    }
    return false;
};

const notifierRoom = (room, evenement, data) => {
    io.to(room).emit(evenement, data);
};

app.set('io', io);
app.set('notifierUtilisateur', notifierUtilisateur);
app.set('notifierRoom', notifierRoom);

// ==================== CONNEXION BASE DE DONNÉES ====================
const connectDB = async (retryCount = 0) => {
    const uri = process.env.MONGO_URI;
    const maxDelay = 30000;
    try {
        const conn = await mongoose.connect(uri);
        console.log(`✅ MongoDB connecté: ${conn.connection.host}`);
        console.log(`📊 Base de données: ${conn.connection.name}`);
        await checkInitialData();
    } catch (error) {
        const delay = Math.min(5000 * Math.pow(1.5, retryCount), maxDelay);
        console.error(`❌ Erreur DB (tentative ${retryCount + 1}):`, error.message);
        setTimeout(() => connectDB(retryCount + 1), delay);
    }
};

mongoose.connection.on('connected', () => console.log('🟢 Mongoose connecté'));
mongoose.connection.on('error', (err) => console.error('🔴 Erreur Mongoose:', err.message));
mongoose.connection.on('disconnected', () => console.warn('🟠 Mongoose déconnecté'));

const checkInitialData = async () => {
    try {
        const User = require('./models/User');
        const userCount = await User.countDocuments();
        console.log(`👥 Utilisateurs en base: ${userCount}`);
    } catch (error) {
        console.log('ℹ️  Modèles pas encore chargés...');
    }
};

connectDB();

// ==================== MIDDLEWARES ====================
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
    origin: (origin, callback) => {
        // Autoriser les requêtes sans origin (Postman, mobile...)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS bloqué: ${origin}`));
    },
    credentials: true
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ==================== ROUTES ====================
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/commercants', require('./routes/commercantRoutes'));
app.use('/api/produits', require('./routes/produitRoutes'));
app.use('/api/commandes', require('./routes/commandeRoutes'));
app.use('/api/livreurs', require('./routes/livreurRoutes'));
app.use('/api/zones', require('./routes/zoneRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));

// ==================== ROUTE SANTÉ ====================
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: '🚀 DeliCI API opérationnelle!',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: { connected: mongoose.connection.readyState === 1 },
        sockets: { connexions_actives: utilisateursConnectes.size }
    });
});

// ==================== GESTION DES ERREURS ====================
app.use((req, res) => {
    res.status(404).json({ status: 'error', message: `Route ${req.method} ${req.originalUrl} introuvable` });
});

app.use((error, req, res, next) => {
    console.error('Erreur:', error);
    if (error.name === 'ValidationError') {
        return res.status(400).json({ status: 'error', message: 'Erreur de validation', errors: Object.values(error.errors).map(e => e.message) });
    }
    if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        return res.status(400).json({ status: 'error', message: `${field} déjà utilisé` });
    }
    if (error.name === 'JsonWebTokenError') return res.status(401).json({ status: 'error', message: 'Token invalide' });
    if (error.name === 'TokenExpiredError') return res.status(401).json({ status: 'error', message: 'Token expiré' });
    res.status(error.status || 500).json({ status: 'error', message: error.message || 'Erreur serveur interne' });
});

// ==================== DÉMARRAGE ====================
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(60));
    console.log("🚀 DELICI API - PLATEFORME DE LIVRAISON CÔTE D'IVOIRE");
    console.log('='.repeat(60));
    console.log(`✅ Serveur démarré sur le port ${PORT}`);
    console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📡 Socket.io activé`);
    console.log(`🌐 Origins autorisées: ${allowedOrigins.join(', ')}`);
    console.log('='.repeat(60));
});

module.exports = { app, io, notifierUtilisateur, notifierRoom };