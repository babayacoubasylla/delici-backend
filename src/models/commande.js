const mongoose = require('mongoose');

const commandeSchema = new mongoose.Schema({
  reference: { type: String, unique: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  commercant: { type: mongoose.Schema.Types.ObjectId, ref: 'Commercant', required: true },
  livreur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  articles: [{
    produit: { type: mongoose.Schema.Types.ObjectId, ref: 'Produit' },
    nom: String,
    prix_unitaire: Number,
    quantite: { type: Number, min: 1 },
    sous_total: Number
  }],
  adresse_livraison: {
    quartier: { type: String, required: true },
    description: String,
    point_repere: String,
    coordonnees: { latitude: Number, longitude: Number }
  },
  statut: {
    type: String,
    enum: ['en_attente', 'acceptee', 'en_preparation', 'prete', 'livreur_assigne', 'en_collecte', 'en_livraison', 'livree', 'annulee', 'remboursee'],
    default: 'en_attente'
  },
  paiement: {
    methode: { type: String, enum: ['orange_money', 'mtn_money', 'wave', 'moov_money', 'especes'], required: true },
    statut: { type: String, enum: ['en_attente', 'paye', 'echoue', 'rembourse'], default: 'en_attente' },
    transaction_id: String,
    montant: Number,
    paye_le: Date
  },
  montants: {
    sous_total: { type: Number, required: true },
    frais_livraison: { type: Number, default: 500 },
    total: { type: Number, required: true }
  },
  temps_estime: { preparation: Number, livraison: Number, total: Number },
  historique_statuts: [{
    statut: String,
    date: { type: Date, default: Date.now },
    commentaire: String
  }],
  note_client: {
    note_commercant: { type: Number, min: 1, max: 5 },
    note_livreur: { type: Number, min: 1, max: 5 },
    commentaire: String,
    date: Date
  },
  ville: { type: String, required: true },
  annulation: {
    raison: String,
    annule_par: { type: String, enum: ['client', 'commercant', 'admin'] },
    date: Date
  }
}, { timestamps: true });

// ✅ Compatible Mongoose 7+ — sans next()
commandeSchema.pre('save', async function () {
  if (!this.reference) {
    const count = await mongoose.model('Commande').countDocuments();
    const date = new Date();
    const annee = date.getFullYear().toString().slice(-2);
    const mois = String(date.getMonth() + 1).padStart(2, '0');
    this.reference = `DLC-${annee}${mois}-${String(count + 1).padStart(4, '0')}`;
  }
  if (this.isModified('statut')) {
    this.historique_statuts.push({ statut: this.statut });
  }
});

module.exports = mongoose.model('Commande', commandeSchema);