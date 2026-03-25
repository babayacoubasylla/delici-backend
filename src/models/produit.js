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
    images: [String],
    categorie: {
        type: String,
        enum: [
            'boissons', 'epicerie_salee', 'epicerie_sucree', 'fruits_legumes',
            'viande_poisson', 'produits_laitiers', 'boulangerie', 'patisserie',
            'traiteur', 'telephones', 'accessoires_telephone', 'ordinateurs',
            'accessoires_informatique', 'audio_video', 'electromenager',
            'coiffure', 'soins_visage', 'soins_corps', 'parfums', 'maquillage',
            'vetements_homme', 'vetements_femme', 'vetements_enfant', 'chaussures',
            'accessoires_mode', 'livraison', 'menage', 'reparation', 'autre'
        ],
        default: 'autre',
        required: true
    },
    prix: {
        type: Number,
        required: [true, 'Le prix est obligatoire'],
        min: 0
    },
    prix_promotion: {
        type: Number,
        min: 0
    },
    est_en_promotion: {
        type: Boolean,
        default: false
    },
    promotion_fin: Date,
    stock: {
        type: Number,
        default: 0,
        min: 0
    },
    unite: {
        type: String,
        enum: ['pièce', 'kg', 'litre', 'boîte', 'sachet', 'bouteille', 'assiette', 'service', 'autre'],
        default: 'pièce'
    },
    disponible: {
        type: Boolean,
        default: true
    },
    temps_preparation: {
        type: Number,
        default: 15
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
    },
    total_ventes: {
        type: Number,
        default: 0
    },
    poids_grammes: Number,
    ingredients: String,
    est_vegetarien: Boolean,
    est_vegan: Boolean,
    est_sans_gluten: Boolean
}, {
    timestamps: true
});

produitSchema.index({ nom: 'text', description: 'text' });
produitSchema.index({ commercant: 1, categorie: 1 });
produitSchema.index({ prix: 1, disponible: 1 });

module.exports = mongoose.model('Produit', produitSchema);