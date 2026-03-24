const mongoose = require('mongoose');

const produitSchema = new mongoose.Schema({
    commercant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Commercant',
        required: true
    },
    nom: {
        type: String,
        required: [true, 'Le nom du produit est obligatoire'],
        trim: true
    },
    description: String,
    photo: String,
    categorie: {
        type: String,
        required: true
    },
    prix: {
        type: Number,
        required: [true, 'Le prix est obligatoire'],
        min: 0
    },
    disponible: {
        type: Boolean,
        default: true
    },
    temps_preparation: {
        type: Number,
        default: 15 // minutes
    },
    allergenes: [String],
    tags: [String],
    note_moyenne: {
        type: Number,
        default: 0
    },
    total_commandes: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Produit', produitSchema);