const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: true,
        unique: true,
        enum: [
            'Bouaké', 'Yamoussoukro', 'San Pedro', 'Daloa',
            'Gagnoa', 'Man', 'Korhogo', 'Soubré', 'Divo', 'Sinfra'
        ]
    },
    gerant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    active: {
        type: Boolean,
        default: true
    },
    frais_livraison_base: {
        type: Number,
        default: 500 // FCFA
    },
    coordonnees_centre: {
        latitude: Number,
        longitude: Number
    },
    rayon_km: {
        type: Number,
        default: 10
    },
    stats: {
        total_commercants: { type: Number, default: 0 },
        total_livreurs: { type: Number, default: 0 },
        total_commandes: { type: Number, default: 0 },
        chiffre_affaires: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Zone', zoneSchema);