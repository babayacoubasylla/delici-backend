// clean-livreur.js
const mongoose = require('mongoose');
require('dotenv').config();

const cleanLivreur = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connecté à MongoDB');

        const livreurId = '69c15b87fea884c28acfcf8b';
        
        // 1. Trouver les commandes bloquées
        const commandesBloquees = await mongoose.connection.db.collection('commandes').find({
            livreur: new mongoose.Types.ObjectId(livreurId),
            statut: { $in: ['livreur_assigne', 'en_collecte', 'en_livraison'] }
        }).toArray();
        
        console.log(`📦 Commandes bloquées trouvées: ${commandesBloquees.length}`);
        commandesBloquees.forEach(cmd => {
            console.log(`   - ${cmd.reference} (${cmd.statut})`);
        });
        
        // 2. Mettre à jour les commandes
        if (commandesBloquees.length > 0) {
            const result = await mongoose.connection.db.collection('commandes').updateMany(
                {
                    livreur: new mongoose.Types.ObjectId(livreurId),
                    statut: { $in: ['livreur_assigne', 'en_collecte', 'en_livraison'] }
                },
                { $set: { statut: 'livree' } }
            );
            console.log(`✅ ${result.modifiedCount} commandes mises à jour`);
        }
        
        // 3. Vérifier les courses bloquées
        const coursesBloquees = await mongoose.connection.db.collection('courses').find({
            livreur: new mongoose.Types.ObjectId(livreurId),
            statut: { $in: ['acceptee', 'en_cours'] }
        }).toArray();
        
        console.log(`🛵 Courses bloquées trouvées: ${coursesBloquees.length}`);
        coursesBloquees.forEach(course => {
            console.log(`   - ${course.reference} (${course.statut})`);
        });
        
        // 4. Mettre à jour les courses
        if (coursesBloquees.length > 0) {
            const result = await mongoose.connection.db.collection('courses').updateMany(
                {
                    livreur: new mongoose.Types.ObjectId(livreurId),
                    statut: { $in: ['acceptee', 'en_cours'] }
                },
                { $set: { statut: 'terminee' } }
            );
            console.log(`✅ ${result.modifiedCount} courses mises à jour`);
        }
        
        console.log('🎉 Nettoyage terminé !');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
};

cleanLivreur();