// Script pour re-hasher tous les mots de passe des utilisateurs existants
// Lance ce script une seule fois si tu as des utilisateurs avec des mots de passe non hashés
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./src/models/User');

async function rehashPasswords() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connecté à MongoDB');

    const users = await User.find().select('+password');
    let count = 0;
    for (const user of users) {
        // Vérifie si le mot de passe est déjà hashé (bcrypt hash commence par $2)
        if (user.password && !user.password.startsWith('$2')) {
            user.password = await bcrypt.hash(user.password, 12);
            await user.save();
            count++;
            console.log(`Mot de passe hashé pour ${user.telephone}`);
        }
    }
    console.log(`Mots de passe re-hashés pour ${count} utilisateur(s)`);
    await mongoose.disconnect();
}

rehashPasswords().catch(console.error);
