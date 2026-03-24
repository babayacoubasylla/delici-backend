require('dotenv').config();
const mongoose = require('mongoose');

// Fonction slug locale
const genererSlug = (nom) => {
    return nom
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

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log('✅ Connecté à MongoDB');

    const User = require('./src/models/User');
    const Commercant = require('./src/models/Commercant');
    const Produit = require('./src/models/Produit');
    const Commande = require('./src/models/Commande');
    const Zone = require('./src/models/Zone');

    // Nettoyage complet
    await Commande.deleteMany({});
    await Produit.deleteMany({});
    await Commercant.deleteMany({});
    await Zone.deleteMany({});
    await User.deleteMany({});
    console.log('🧹 Base nettoyée');

    // ==================== ZONES ====================
    const zones = await Zone.insertMany([
        { nom: 'Gagnoa', active: true, frais_livraison_base: 500, coordonnees_centre: { latitude: 6.1319, longitude: -5.9503 }, rayon_km: 15 },
        { nom: 'Bouaké', active: true, frais_livraison_base: 600, coordonnees_centre: { latitude: 7.6906, longitude: -5.0317 }, rayon_km: 20 },
        { nom: 'Daloa', active: true, frais_livraison_base: 500, coordonnees_centre: { latitude: 6.8742, longitude: -6.4502 }, rayon_km: 15 },
        { nom: 'San Pedro', active: true, frais_livraison_base: 600, coordonnees_centre: { latitude: 4.7485, longitude: -6.6363 }, rayon_km: 15 },
        { nom: 'Yamoussoukro', active: true, frais_livraison_base: 500, coordonnees_centre: { latitude: 6.8276, longitude: -5.2893 }, rayon_km: 20 },
    ]);
    console.log(`✅ ${zones.length} zones créées`);

    // ==================== UTILISATEURS ====================
    const admin = await User.create({
        nom: 'Admin', prenom: 'DeliCI', telephone: '0700000000',
        email: 'admin@delici.ci', password: 'Admin2024!',
        ville: 'Gagnoa', role: 'admin', statut: 'actif'
    });

    const gerant = await User.create({
        nom: 'Koné', prenom: 'Mamadou', telephone: '0700000100',
        email: 'gerant.gagnoa@delici.ci', password: 'Gerant2024!',
        ville: 'Gagnoa', role: 'gerant_zone', statut: 'actif',
        zone_info: { villes_gerees: ['Gagnoa', 'Daloa'] }
    });

    const livreurs = await User.insertMany([
        { nom: 'Coulibaly', prenom: 'Ibrahim', telephone: '0701000001', password: 'Livreur2024!', ville: 'Gagnoa', role: 'livreur', statut: 'actif', livreur_info: { disponible: true, vehicule: 'moto', note_moyenne: 4.8, total_livraisons: 142, gains_total: 85000 } },
        { nom: 'Bamba', prenom: 'Seydou', telephone: '0701000002', password: 'Livreur2024!', ville: 'Gagnoa', role: 'livreur', statut: 'actif', livreur_info: { disponible: true, vehicule: 'moto', note_moyenne: 4.6, total_livraisons: 98, gains_total: 62000 } },
        { nom: 'Traoré', prenom: 'Aminata', telephone: '0701000003', password: 'Livreur2024!', ville: 'Bouaké', role: 'livreur', statut: 'actif', livreur_info: { disponible: false, vehicule: 'moto', note_moyenne: 4.9, total_livraisons: 213, gains_total: 128000 } },
        { nom: 'Ouattara', prenom: 'Moussa', telephone: '0701000004', password: 'Livreur2024!', ville: 'Daloa', role: 'livreur', statut: 'actif', livreur_info: { disponible: true, vehicule: 'moto', note_moyenne: 4.5, total_livraisons: 67, gains_total: 40000 } },
    ]);

    const proprietaires = await User.insertMany([
        { nom: 'Adjoua', prenom: 'Marie', telephone: '0702000001', password: 'Commerce2024!', ville: 'Gagnoa', role: 'commercant', statut: 'actif' },
        { nom: 'Konaté', prenom: 'Boubacar', telephone: '0702000002', password: 'Commerce2024!', ville: 'Gagnoa', role: 'commercant', statut: 'actif' },
        { nom: 'Yao', prenom: 'Ekra', telephone: '0702000003', password: 'Commerce2024!', ville: 'Gagnoa', role: 'commercant', statut: 'actif' },
        { nom: 'Diallo', prenom: 'Fatoumata', telephone: '0702000004', password: 'Commerce2024!', ville: 'Bouaké', role: 'commercant', statut: 'actif' },
        { nom: 'Assi', prenom: 'Germain', telephone: '0702000005', password: 'Commerce2024!', ville: 'Daloa', role: 'commercant', statut: 'actif' },
    ]);

    const clients = await User.insertMany([
        { nom: 'Kouassi', prenom: 'Emma', telephone: '0703000001', password: 'Client2024!', ville: 'Gagnoa', role: 'client', statut: 'actif' },
        { nom: 'Koffi', prenom: 'Jean', telephone: '0703000002', password: 'Client2024!', ville: 'Gagnoa', role: 'client', statut: 'actif' },
        { nom: 'Diabaté', prenom: 'Aïcha', telephone: '0703000003', password: 'Client2024!', ville: 'Bouaké', role: 'client', statut: 'actif' },
    ]);

    console.log(`✅ ${2 + livreurs.length + proprietaires.length + clients.length} utilisateurs créés`);

    // ==================== COMMERCANTS ====================
    const commercants = await Commercant.insertMany([
        {
            proprietaire: proprietaires[0]._id, nom_boutique: 'Maquis Chez Adjoua',
            slug: genererSlug('Maquis Chez Adjoua'),
            categorie: 'restaurant', description: 'Cuisine ivoirienne traditionnelle — Attiéké poisson, foutou, kedjenou',
            ville: 'Gagnoa', adresse: { quartier: 'Centre-ville', description: 'En face de la mairie' },
            telephone: '0702000001', frais_livraison: 500, temps_preparation_moyen: 25,
            commande_minimum: 2000, statut: 'actif', est_ouvert: true,
            note_moyenne: 4.7, total_avis: 48, total_commandes: 312,
            horaires: {
                lundi: { ouvert: true, ouverture: '07:00', fermeture: '22:00' },
                mardi: { ouvert: true, ouverture: '07:00', fermeture: '22:00' },
                mercredi: { ouvert: true, ouverture: '07:00', fermeture: '22:00' },
                jeudi: { ouvert: true, ouverture: '07:00', fermeture: '22:00' },
                vendredi: { ouvert: true, ouverture: '07:00', fermeture: '23:00' },
                samedi: { ouvert: true, ouverture: '08:00', fermeture: '23:00' },
                dimanche: { ouvert: true, ouverture: '09:00', fermeture: '21:00' },
            }
        },
        {
            proprietaire: proprietaires[1]._id, nom_boutique: 'Fast Food Boubacar',
            slug: genererSlug('Fast Food Boubacar'),
            categorie: 'restaurant', description: 'Burgers, poulets grillés, frites — Livraison rapide !',
            ville: 'Gagnoa', adresse: { quartier: 'Résidentiel', description: "Près de l'école primaire" },
            telephone: '0702000002', frais_livraison: 400, temps_preparation_moyen: 20,
            commande_minimum: 1500, statut: 'actif', est_ouvert: true,
            note_moyenne: 4.4, total_avis: 32, total_commandes: 189,
        },
        {
            proprietaire: proprietaires[2]._id, nom_boutique: 'Pharmacie Centrale Gagnoa',
            slug: genererSlug('Pharmacie Centrale Gagnoa'),
            categorie: 'pharmacie', description: 'Médicaments, produits de santé et conseils pharmaceutiques',
            ville: 'Gagnoa', adresse: { quartier: 'Plateau', description: "Face à l'hôpital" },
            telephone: '0702000003', frais_livraison: 300, temps_preparation_moyen: 10,
            commande_minimum: 500, statut: 'actif', est_ouvert: true,
            note_moyenne: 4.9, total_avis: 87, total_commandes: 524,
        },
        {
            proprietaire: proprietaires[0]._id, nom_boutique: 'Supermarché Sococe Gagnoa',
            slug: genererSlug('Supermarché Sococe Gagnoa'),
            categorie: 'supermarche', description: 'Alimentation, boissons, produits ménagers et plus',
            ville: 'Gagnoa', adresse: { quartier: 'Marché central' },
            telephone: '0702000001', frais_livraison: 600, temps_preparation_moyen: 20,
            commande_minimum: 3000, statut: 'actif', est_ouvert: true,
            note_moyenne: 4.3, total_avis: 61, total_commandes: 278,
        },
        {
            proprietaire: proprietaires[1]._id, nom_boutique: 'Boulangerie Moderne',
            slug: genererSlug('Boulangerie Moderne'),
            categorie: 'boulangerie', description: 'Pain frais, gâteaux, viennoiseries — Livraison dès 6h',
            ville: 'Gagnoa', adresse: { quartier: 'Résidentiel nord' },
            telephone: '0702000002', frais_livraison: 200, temps_preparation_moyen: 15,
            commande_minimum: 500, statut: 'actif', est_ouvert: true,
            note_moyenne: 4.6, total_avis: 43, total_commandes: 412,
        },
        {
            proprietaire: proprietaires[3]._id, nom_boutique: 'Restaurant La Terrasse',
            slug: genererSlug('Restaurant La Terrasse'),
            categorie: 'restaurant', description: 'Cuisine locale et internationale à Bouaké',
            ville: 'Bouaké', adresse: { quartier: 'Commerce', description: 'Boulevard principal' },
            telephone: '0702000004', frais_livraison: 600, temps_preparation_moyen: 30,
            commande_minimum: 2500, statut: 'actif', est_ouvert: true,
            note_moyenne: 4.5, total_avis: 92, total_commandes: 634,
        },
        {
            proprietaire: proprietaires[3]._id, nom_boutique: 'Marché Bio Bouaké',
            slug: genererSlug('Marché Bio Bouaké'),
            categorie: 'marche', description: 'Légumes frais, fruits de saison, épices et condiments',
            ville: 'Bouaké', adresse: { quartier: 'Marché de Koko' },
            telephone: '0702000004', frais_livraison: 500, temps_preparation_moyen: 15,
            commande_minimum: 1000, statut: 'actif', est_ouvert: false,
            note_moyenne: 4.2, total_avis: 34, total_commandes: 156,
        },
        {
            proprietaire: proprietaires[4]._id, nom_boutique: 'Maquis Le Bananier',
            slug: genererSlug('Maquis Le Bananier'),
            categorie: 'restaurant', description: 'Spécialités locales de Daloa — Plats du jour',
            ville: 'Daloa', adresse: { quartier: 'Orly', description: 'Derrière la gare' },
            telephone: '0702000005', frais_livraison: 500, temps_preparation_moyen: 30,
            commande_minimum: 2000, statut: 'actif', est_ouvert: true,
            note_moyenne: 4.6, total_avis: 28, total_commandes: 143,
        },
    ]);
    console.log(`✅ ${commercants.length} commercants créés`);

    // ==================== PRODUITS ====================
    const produitsAdjoua = await Produit.insertMany([
        { commercant: commercants[0]._id, nom: 'Attiéké Poisson', description: 'Attiéké avec poisson braisé et sauce tomate', prix: 1500, categorie: 'Plats locaux', disponible: true, temps_preparation: 20, total_commandes: 145 },
        { commercant: commercants[0]._id, nom: 'Foutou Banane Sauce Graine', description: 'Foutou banane avec sauce graine de palme et poisson fumé', prix: 2000, categorie: 'Plats locaux', disponible: true, temps_preparation: 25, total_commandes: 98 },
        { commercant: commercants[0]._id, nom: 'Kedjenou Poulet', description: 'Poulet mijoté avec légumes dans une gargoulette', prix: 3500, categorie: 'Plats locaux', disponible: true, temps_preparation: 40, total_commandes: 67 },
        { commercant: commercants[0]._id, nom: 'Riz Sauce Arachide', description: 'Riz blanc avec sauce arachide et poulet', prix: 1500, categorie: 'Plats locaux', disponible: true, temps_preparation: 15, total_commandes: 112 },
        { commercant: commercants[0]._id, nom: 'Jus de Gingembre', description: 'Jus de gingembre frais maison', prix: 500, categorie: 'Boissons', disponible: true, temps_preparation: 5, total_commandes: 203 },
        { commercant: commercants[0]._id, nom: 'Eau minérale', description: 'Bouteille 1.5L', prix: 300, categorie: 'Boissons', disponible: true, temps_preparation: 2, total_commandes: 189 },
    ]);

    const produitsBoubacar = await Produit.insertMany([
        { commercant: commercants[1]._id, nom: 'Burger Poulet', description: 'Burger avec poulet grillé, salade et sauce maison', prix: 2000, categorie: 'Burgers', disponible: true, temps_preparation: 15, total_commandes: 89 },
        { commercant: commercants[1]._id, nom: 'Poulet Grillé', description: 'Demi-poulet grillé avec frites et salade', prix: 3000, categorie: 'Grillades', disponible: true, temps_preparation: 25, total_commandes: 76 },
        { commercant: commercants[1]._id, nom: 'Frites', description: 'Portion de frites croustillantes', prix: 500, categorie: 'Accompagnements', disponible: true, temps_preparation: 10, total_commandes: 134 },
        { commercant: commercants[1]._id, nom: 'Coca-Cola 33cl', description: 'Coca-Cola bien frais', prix: 500, categorie: 'Boissons', disponible: true, temps_preparation: 2, total_commandes: 167 },
    ]);

    const produitsPharmaci = await Produit.insertMany([
        { commercant: commercants[2]._id, nom: 'Paracétamol 500mg', description: 'Boite de 16 comprimés', prix: 500, categorie: 'Médicaments', disponible: true, temps_preparation: 5, total_commandes: 234 },
        { commercant: commercants[2]._id, nom: 'Ibuprofène 400mg', description: 'Boite de 20 comprimés', prix: 800, categorie: 'Médicaments', disponible: true, temps_preparation: 5, total_commandes: 145 },
        { commercant: commercants[2]._id, nom: 'Vitamine C 1000mg', description: 'Boite de 30 comprimés effervescents', prix: 1500, categorie: 'Vitamines', disponible: true, temps_preparation: 5, total_commandes: 98 },
        { commercant: commercants[2]._id, nom: 'Masques chirurgicaux', description: 'Boite de 50 masques', prix: 2000, categorie: 'Matériel médical', disponible: true, temps_preparation: 3, total_commandes: 67 },
        { commercant: commercants[2]._id, nom: 'Gel hydroalcoolique', description: 'Flacon 500ml', prix: 1200, categorie: 'Hygiène', disponible: true, temps_preparation: 3, total_commandes: 89 },
    ]);

    const produitsSoco = await Produit.insertMany([
        { commercant: commercants[3]._id, nom: 'Riz Parfumé 5kg', description: 'Sac de riz parfumé thaïlandais', prix: 4500, categorie: 'Alimentation', disponible: true, temps_preparation: 10, total_commandes: 123 },
        { commercant: commercants[3]._id, nom: 'Huile Palme 1L', description: 'Huile de palme pure 1 litre', prix: 1200, categorie: 'Alimentation', disponible: true, temps_preparation: 5, total_commandes: 98 },
        { commercant: commercants[3]._id, nom: 'Lait concentré sucré', description: 'Boite de lait concentré 400g', prix: 800, categorie: 'Alimentation', disponible: true, temps_preparation: 5, total_commandes: 145 },
        { commercant: commercants[3]._id, nom: 'Savon Lux x5', description: 'Pack de 5 savons parfumés', prix: 1500, categorie: 'Hygiène', disponible: true, temps_preparation: 5, total_commandes: 87 },
        { commercant: commercants[3]._id, nom: 'Bière Castel 65cl', description: 'Bouteille de bière fraîche', prix: 700, categorie: 'Boissons', disponible: true, temps_preparation: 5, total_commandes: 234 },
    ]);

    const produitsBoulangerie = await Produit.insertMany([
        { commercant: commercants[4]._id, nom: 'Pain baguette', description: 'Baguette fraîche du jour', prix: 200, categorie: 'Pain', disponible: true, temps_preparation: 5, total_commandes: 456 },
        { commercant: commercants[4]._id, nom: 'Croissant au beurre', description: 'Croissant feuilleté maison', prix: 300, categorie: 'Viennoiseries', disponible: true, temps_preparation: 5, total_commandes: 234 },
        { commercant: commercants[4]._id, nom: 'Gâteau chocolat', description: 'Part de gâteau moelleux au chocolat', prix: 800, categorie: 'Pâtisseries', disponible: true, temps_preparation: 10, total_commandes: 123 },
        { commercant: commercants[4]._id, nom: 'Pain de mie', description: 'Pain de mie en tranches 500g', prix: 600, categorie: 'Pain', disponible: true, temps_preparation: 5, total_commandes: 167 },
    ]);

    const totalProduits = produitsAdjoua.length + produitsBoubacar.length + produitsPharmaci.length + produitsSoco.length + produitsBoulangerie.length;
    console.log(`✅ ${totalProduits} produits créés`);

    // ==================== COMMANDES ====================
    const commandes = await Commande.insertMany([
        {
            reference: 'DLC-2603-0001',
            client: clients[1]._id,
            commercant: commercants[0]._id,
            livreur: livreurs[0]._id,
            articles: [
                { produit: produitsAdjoua[0]._id, nom: 'Attiéké Poisson', prix_unitaire: 1500, quantite: 2, sous_total: 3000 },
                { produit: produitsAdjoua[4]._id, nom: 'Jus de Gingembre', prix_unitaire: 500, quantite: 1, sous_total: 500 },
            ],
            adresse_livraison: { quartier: 'Résidentiel', description: "Maison bleue en face de l'école", point_repere: 'École primaire' },
            statut: 'livree',
            paiement: { methode: 'especes', statut: 'paye', montant: 4000 },
            montants: { sous_total: 3500, frais_livraison: 500, total: 4000 },
            ville: 'Gagnoa',
            note_client: { note_commercant: 5, note_livreur: 5, commentaire: 'Excellent ! Très bon attiéké', date: new Date() },
            historique_statuts: [
                { statut: 'en_attente', date: new Date(Date.now() - 3600000) },
                { statut: 'acceptee', date: new Date(Date.now() - 3400000) },
                { statut: 'en_preparation', date: new Date(Date.now() - 3200000) },
                { statut: 'prete', date: new Date(Date.now() - 2800000) },
                { statut: 'livreur_assigne', date: new Date(Date.now() - 2600000) },
                { statut: 'en_livraison', date: new Date(Date.now() - 2000000) },
                { statut: 'livree', date: new Date(Date.now() - 1800000) },
            ]
        },
        {
            reference: 'DLC-2603-0002',
            client: clients[1]._id,
            commercant: commercants[2]._id,
            livreur: livreurs[1]._id,
            articles: [
                { produit: produitsPharmaci[0]._id, nom: 'Paracétamol 500mg', prix_unitaire: 500, quantite: 2, sous_total: 1000 },
                { produit: produitsPharmaci[2]._id, nom: 'Vitamine C 1000mg', prix_unitaire: 1500, quantite: 1, sous_total: 1500 },
            ],
            adresse_livraison: { quartier: 'Centre-ville', description: 'Immeuble Koffi 2ème étage' },
            statut: 'en_livraison',
            paiement: { methode: 'orange_money', statut: 'paye', montant: 2800 },
            montants: { sous_total: 2500, frais_livraison: 300, total: 2800 },
            ville: 'Gagnoa',
            historique_statuts: [
                { statut: 'en_attente', date: new Date(Date.now() - 1800000) },
                { statut: 'acceptee', date: new Date(Date.now() - 1600000) },
                { statut: 'prete', date: new Date(Date.now() - 1200000) },
                { statut: 'livreur_assigne', date: new Date(Date.now() - 900000) },
                { statut: 'en_livraison', date: new Date(Date.now() - 600000) },
            ]
        },
        {
            reference: 'DLC-2603-0003',
            client: clients[0]._id,
            commercant: commercants[4]._id,
            articles: [
                { produit: produitsBoulangerie[0]._id, nom: 'Pain baguette', prix_unitaire: 200, quantite: 3, sous_total: 600 },
                { produit: produitsBoulangerie[1]._id, nom: 'Croissant au beurre', prix_unitaire: 300, quantite: 2, sous_total: 600 },
            ],
            adresse_livraison: { quartier: 'Résidentiel nord', description: 'Villa verte' },
            statut: 'en_attente',
            paiement: { methode: 'especes', statut: 'en_attente', montant: 1400 },
            montants: { sous_total: 1200, frais_livraison: 200, total: 1400 },
            ville: 'Gagnoa',
            historique_statuts: [{ statut: 'en_attente', date: new Date() }]
        },
    ]);
    console.log(`✅ ${commandes.length} commandes créées`);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 BASE DE DONNÉES REMPLIE AVEC SUCCÈS !');
    console.log('='.repeat(60));
    console.log('\n📋 COMPTES DE TEST :');
    console.log('\n👤 ADMIN :');
    console.log('   Téléphone: 0700000000 | Mot de passe: Admin2024!');
    console.log('\n🏢 GÉRANT DE ZONE :');
    console.log('   Téléphone: 0700000100 | Mot de passe: Gerant2024!');
    console.log('\n🛵 LIVREURS :');
    console.log('   Téléphone: 0701000001 | Mot de passe: Livreur2024! | Ville: Gagnoa');
    console.log('   Téléphone: 0701000002 | Mot de passe: Livreur2024! | Ville: Gagnoa');
    console.log('\n🏪 COMMERCANTS :');
    console.log('   Téléphone: 0702000001 | Mot de passe: Commerce2024! | Ville: Gagnoa');
    console.log('   Téléphone: 0702000002 | Mot de passe: Commerce2024! | Ville: Gagnoa');
    console.log('\n🛍️ CLIENTS :');
    console.log('   Téléphone: 0703000001 | Mot de passe: Client2024!  | Ville: Gagnoa');
    console.log('   Téléphone: 0703000002 | Mot de passe: Client2024!  | Ville: Gagnoa');
    console.log('   Téléphone: 0703000003 | Mot de passe: Client2024!  | Ville: Bouaké');
    console.log('\n📊 DONNÉES CRÉÉES :');
    console.log(`   ✅ ${zones.length} zones`);
    console.log(`   ✅ ${commercants.length} commercants`);
    console.log(`   ✅ ${totalProduits} produits`);
    console.log(`   ✅ ${commandes.length} commandes`);
    console.log('='.repeat(60));

    process.exit(0);
}).catch(err => {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
});