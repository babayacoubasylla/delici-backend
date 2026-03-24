const multer = require('multer');
const path = require('path');
const fs = require('fs');

const creerDossier = (dossier) => {
    if (!fs.existsSync(dossier)) fs.mkdirSync(dossier, { recursive: true });
};

const storageProduits = multer.diskStorage({
    destination: (req, file, cb) => {
        const dossier = 'uploads/produits';
        creerDossier(dossier);
        cb(null, dossier);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `produit-${Date.now()}-${Math.round(Math.random() * 1000)}${ext}`);
    }
});

const storageCommercants = multer.diskStorage({
    destination: (req, file, cb) => {
        const dossier = 'uploads/commercants';
        creerDossier(dossier);
        cb(null, dossier);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `commerce-${Date.now()}-${Math.round(Math.random() * 1000)}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const typesAutorises = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (typesAutorises.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Format non supporté. Utilisez JPG, PNG ou WEBP.'), false);
    }
};

exports.uploadProduit = multer({
    storage: storageProduits,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
}).single('photo');

exports.uploadCommercant = multer({
    storage: storageCommercants,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
}).single('photo');