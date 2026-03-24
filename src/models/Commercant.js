const mongoose = require('mongoose');

const commercantSchema = new mongoose.Schema({
    proprietaire: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    nom_boutique: {
        type: String,
        required: [true, 'Le nom de la boutique est obligatoire'],
        trim: true
    },
    slug: {
        type: String,
        unique: true,
        sparse: true, // ✅ permet plusieurs documents sans slug (null ignoré par l'index)
        lowercase: true
    },
    categorie: {
        type: String,
        required: true,
        enum: ['restaurant', 'marche', 'supermarche', 'pharmacie', 'boulangerie', 'autre']
    },
    description: String,
    photo_couverture: String,
    logo: String,
    ville: {
        type: String,
        required: true,
        enum: [
            'Bouaké', 'Yamoussoukro', 'San Pedro', 'Daloa',
            'Gagnoa', 'Man', 'Korhogo', 'Soubré', 'Divo', 'Sinfra'
        ]
    },
    adresse: {
        quartier: { type: String, required: true },
        description: String,
        coordonnees: {
            latitude: Number,
            longitude: Number
        }
    },
    telephone: {
        type: String,
        required: true
    },
    horaires: {
        lundi:    { ouvert: Boolean, ouverture: String, fermeture: String },
        mardi:    { ouvert: Boolean, ouverture: String, fermeture: String },
        mercredi: { ouvert: Boolean, ouverture: String, fermeture: String },
        jeudi:    { ouvert: Boolean, ouverture: String, fermeture: String },
        vendredi: { ouvert: Boolean, ouverture: String, fermeture: String },
        samedi:   { ouvert: Boolean, ouverture: String, fermeture: String },
        dimanche: { ouvert: Boolean, ouverture: String, fermeture: String }
    },
    statut: {
        type: String,
        enum: ['en_attente', 'actif', 'suspendu', 'ferme'],
        default: 'en_attente'
    },
    est_ouvert: {
        type: Boolean,
        default: false
    },
    temps_preparation_moyen: {
        type: Number,
        default: 20 // minutes
    },
    frais_livraison: {
        type: Number,
        default: 500 // FCFA
    },
    commande_minimum: {
        type: Number,
        default: 1000 // FCFA
    },
    note_moyenne: {
        type: Number,
        default: 0
    },
    total_avis: {
        type: Number,
        default: 0
    },
    total_commandes: {
        type: Number,
        default: 0
    },
    chiffre_affaires: {
        type: Number,
        default: 0
    },
    commission_taux: {
        type: Number,
        default: 15 // pourcentage
    },
    // Documents de vérification
    documents: {
        rccm: String,
        cni_proprietaire: String
    },
    valide_par: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// ✅ Fonction utilitaire exportée pour générer un slug (utilisable dans le seed aussi)
const genererSlug = (nomBoutique) => {
    return nomBoutique
        .toLowerCase()
        .replace(/[éèêë]/g, 'e')
        .replace(/[àâä]/g, 'a')
        .replace(/[ùûü]/g, 'u')
        .replace(/[ôö]/g, 'o')
        .replace(/[îï]/g, 'i')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') + '-' + Date.now();
};

// Hook pre('save') — fonctionne pour .create() et .save()
// ⚠️ Ne se déclenche PAS avec insertMany() → utiliser genererSlug() manuellement dans ce cas
commercantSchema.pre('save', function (next) {
    if (this.isModified('nom_boutique') || !this.slug) {
        this.slug = genererSlug(this.nom_boutique);
    }
    next();
});

const Commercant = mongoose.model('Commercant', commercantSchema);

module.exports = Commercant;
module.exports.genererSlug = genererSlug; // ✅ exporté pour usage dans seed.js