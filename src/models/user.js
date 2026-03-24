const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: [true, 'Le nom est obligatoire'],
        trim: true
    },
    prenom: {
        type: String,
        required: [true, 'Le prénom est obligatoire'],
        trim: true
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true
    },
    telephone: {
        type: String,
        required: [true, 'Le téléphone est obligatoire'],
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Le mot de passe est obligatoire'],
        minlength: 6,
        select: false
    },
    role: {
        type: String,
        enum: ['client', 'livreur', 'commercant', 'gerant_zone', 'admin'],
        default: 'client'
    },
    ville: {
        type: String,
        required: [true, 'La ville est obligatoire'],
        enum: [
            'Bouaké', 'Yamoussoukro', 'San Pedro', 'Daloa',
            'Gagnoa', 'Man', 'Korhogo', 'Soubré', 'Divo', 'Sinfra'
        ]
    },
    adresse: {
        quartier: String,
        description: String,
        coordonnees: {
            latitude: Number,
            longitude: Number
        }
    },
    photo: {
        type: String,
        default: null
    },
    statut: {
        type: String,
        enum: ['actif', 'inactif', 'suspendu', 'en_attente'],
        default: 'actif'
    },
    livreur_info: {
        disponible: { type: Boolean, default: false },
        vehicule: { type: String, enum: ['moto', 'velo', 'voiture'], default: 'moto' },
        numero_cni: String,
        numero_permis: String,
        note_moyenne: { type: Number, default: 0 },
        total_livraisons: { type: Number, default: 0 },
        gains_total: { type: Number, default: 0 },
        position_actuelle: {
            latitude: Number,
            longitude: Number,
            updated_at: Date
        }
    },
    zone_info: {
        villes_gerees: [String]
    },
    refresh_token: { type: String, select: false },
    reset_password_token: { type: String, select: false },
    reset_password_expires: { type: Date, select: false },
    push_token: String,
    notifications_actives: { type: Boolean, default: true }
}, {
    timestamps: true
});

// ✅ Sans next() — compatible Mongoose 7+
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.verifierMotDePasse = async function (motDePasse) {
    return await bcrypt.compare(motDePasse, this.password);
};

userSchema.virtual('nom_complet').get(function () {
    return `${this.prenom} ${this.nom}`;
});

module.exports = mongoose.model('User', userSchema);