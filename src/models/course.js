const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    reference: {
        type: String,
        unique: true
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    livreur: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    type: {
        type: String,
        enum: ['course_privee', 'course_express'],
        default: 'course_privee'
    },
    depart: {
        description: { type: String, required: true },
        quartier: String,
        coordonnees: {
            latitude: Number,
            longitude: Number
        }
    },
    arrivee: {
        description: { type: String, required: true },
        quartier: String,
        coordonnees: {
            latitude: Number,
            longitude: Number
        }
    },
    description_course: {
        type: String,
        required: true
    },
    statut: {
        type: String,
        enum: [
            'en_attente',      // en attente d'un livreur
            'acceptee',        // livreur assigné
            'en_cours',        // livreur en route
            'terminee',        // course terminée
            'annulee'          // annulée
        ],
        default: 'en_attente'
    },
    paiement: {
        methode: {
            type: String,
            enum: ['especes', 'orange_money', 'mtn_money', 'wave', 'moov_money'],
            default: 'especes'
        },
        montant: { type: Number, default: 0 },
        statut: {
            type: String,
            enum: ['en_attente', 'paye', 'echoue'],
            default: 'en_attente'
        }
    },
    ville: {
        type: String,
        required: true
    },
    distance_km: Number,
    duree_estimee: Number, // minutes
    note_client: {
        note: { type: Number, min: 1, max: 5 },
        commentaire: String,
        date: Date
    },
    historique_statuts: [
        {
            statut: String,
            date: { type: Date, default: Date.now }
        }
    ]
}, {
    timestamps: true
});

// Générer la référence automatiquement
courseSchema.pre('save', async function () {
    if (!this.reference) {
        const count = await mongoose.model('Course').countDocuments();
        const date = new Date();
        const annee = date.getFullYear().toString().slice(-2);
        const mois = String(date.getMonth() + 1).padStart(2, '0');
        this.reference = `CRS-${annee}${mois}-${String(count + 1).padStart(4, '0')}`;
    }
    if (this.isModified('statut')) {
        this.historique_statuts.push({ statut: this.statut });
    }
});

module.exports = mongoose.model('Course', courseSchema);