const mongoose = require('mongoose');

const commercantSchema = new mongoose.Schema({
    proprietaire: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    nom_boutique: {
        type: String,
        required: [true, 'Le nom de la boutique est obligatoire'],
        trim: true
    },
    slug: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true
    },
    type_commerce: {
        type: String,
        enum: [
            'supermarché_épicerie',
            'boulangerie_pâtisserie',
            'marché_légumes',
            'restaurant_fastfood',
            'boucherie_poissonnerie',
            'téléphonie_électronique',
            'vêtements_mode',
            'coiffure_beauté',
            'pharmacie_parapharmacie',
            'quincaillerie_bricolage',
            'services',
            'autre'
        ],
        default: 'autre',
        required: true
    },
    categorie: {
        type: String,
        enum: ['alimentation', 'électronique', 'beauté', 'mode', 'services', 'autre'],
        default: 'autre',
        required: true
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
        rue: String,
        point_repere: String,
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
    email: String,
    horaires: {
        lundi: { ouvert: Boolean, ouverture: String, fermeture: String, ferme: Boolean },
        mardi: { ouvert: Boolean, ouverture: String, fermeture: String, ferme: Boolean },
        mercredi: { ouvert: Boolean, ouverture: String, fermeture: String, ferme: Boolean },
        jeudi: { ouvert: Boolean, ouverture: String, fermeture: String, ferme: Boolean },
        vendredi: { ouvert: Boolean, ouverture: String, fermeture: String, ferme: Boolean },
        samedi: { ouvert: Boolean, ouverture: String, fermeture: String, ferme: Boolean },
        dimanche: { ouvert: Boolean, ouverture: String, fermeture: String, ferme: Boolean }
    },
    statut: {
        type: String,
        enum: ['en_attente', 'actif', 'suspendu', 'ferme'],
        default: 'en_attente'
    },
    est_valide: {
        type: Boolean,
        default: false
    },
    est_actif: {
        type: Boolean,
        default: true
    },
    est_ouvert: {
        type: Boolean,
        default: false
    },
    temps_preparation_moyen: {
        type: Number,
        default: 20
    },
    frais_livraison: {
        type: Number,
        default: 500
    },
    commande_minimum: {
        type: Number,
        default: 1000
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
        default: 15
    },
    zones_livraison: [{
        quartier: String,
        frais_supplementaires: Number
    }],
    photos: [String],
    documents: {
        rccm: String,
        cni_proprietaire: String,
        identifiant_fiscal: String
    },
    est_verified: {
        type: Boolean,
        default: false
    },
    verified_at: Date,
    valide_par: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    rejected_reason: String,
    rejected_at: Date
}, {
    timestamps: true
});

// Index pour les recherches
commercantSchema.index({ ville: 1, est_valide: 1, est_actif: 1 });
commercantSchema.index({ type_commerce: 1, categorie: 1 });
commercantSchema.index({ nom_boutique: 'text', description: 'text' });

// Fonction utilitaire pour générer un slug
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

commercantSchema.pre('save', function (next) {
    if (this.isModified('nom_boutique') || !this.slug) {
        this.slug = genererSlug(this.nom_boutique);
    }
    next();
});

const Commercant = mongoose.model('Commercant', commercantSchema);

module.exports = Commercant;
module.exports.genererSlug = genererSlug;