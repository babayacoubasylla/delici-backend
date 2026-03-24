require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const User = require('./src/models/User');

    const comptes = [
        { telephone: '0700000000', password: 'Admin2024!' },
        { telephone: '0700000100', password: 'Gerant2024!' },
        { telephone: '0701000001', password: 'Livreur2024!' },
        { telephone: '0701000002', password: 'Livreur2024!' },
        { telephone: '0701000003', password: 'Livreur2024!' },
        { telephone: '0701000004', password: 'Livreur2024!' },
        { telephone: '0702000001', password: 'Commerce2024!' },
        { telephone: '0702000002', password: 'Commerce2024!' },
        { telephone: '0702000003', password: 'Commerce2024!' },
        { telephone: '0702000004', password: 'Commerce2024!' },
        { telephone: '0702000005', password: 'Commerce2024!' },
        { telephone: '0703000001', password: 'Client2024!' },
        { telephone: '0703000002', password: 'Client2024!' },
        { telephone: '0703000003', password: 'Client2024!' },
    ];

    for (const compte of comptes) {
        const hash = await bcrypt.hash(compte.password, 12);
        await User.collection.updateOne(
            { telephone: compte.telephone },
            { $set: { password: hash } }
        );
        console.log(`✅ ${compte.telephone} corrigé`);
    }

    console.log('\n🎉 Tous les mots de passe sont corrigés !');
    console.log('\n📋 Comptes disponibles :');
    console.log('Admin     : 0700000000 / Admin2024!');
    console.log('Gérant    : 0700000100 / Gerant2024!');
    console.log('Livreur   : 0701000001 / Livreur2024!');
    console.log('Commercant: 0702000001 / Commerce2024!');
    console.log('Client    : 0703000001 / Client2024!');

    process.exit(0);
}).catch(err => {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
});