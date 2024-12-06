import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import Walk from '../models/walk.js'; // Utilise "walk" au lieu de "balade"
import User from '../models/user.js';

const router = express.Router();

// Middleware d'authentification
const authenticate = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).send('Access denied.');
    jwt.verify(token, 'secret_key', (err, user) => {
        if (err) return res.status(401).send('Invalid token.');
        req.user = user;
        next();
    });
};

// 1. Lister toutes les balades
router.get('/', async (req, res) => {
    const walks = await Walk.find();
    res.json(walks);
});

// 2. Afficher une balade par ID
router.get('/id/:id', async (req, res) => {
    try {
        const walk = await Walk.findById(req.params.id);
        if (!walk) return res.status(404).send('Walk not found.');
        res.json(walk);
    } catch {
        res.status(400).send('Invalid ID.');
    }
});

// 3. Rechercher une balade par texte_intro
router.get('/search/:search', async (req, res) => {
    const searchTerm = req.params.search;
    const results = await Walk.find({ texte_intro: new RegExp(searchTerm, 'i') });
    res.json(results);
});

// 4. Compter les balades par arrondissement
router.get('/arrondissement/:num_arrondissement', async (req, res) => {
    const count = await Walk.countDocuments({ arrondissement: req.params.num_arrondissement });
    res.json({ count });
});

// 5. Synthèse par arrondissement
router.get('/synthese', async (req, res) => {
    const synthesis = await Walk.aggregate([
        { $group: { _id: "$arrondissement", count: { $sum: 1 } } },
    ]);
    res.json(synthesis);
});

// 6. Ajouter une balade (auth requise)
router.post('/add', authenticate, async (req, res) => {
    try {
        const { nom, arrondissement, texte_intro } = req.body;
        if (!arrondissement || !texte_intro) return res.status(400).send("Missing required fields.");
        const newWalk = new Walk({ nom, arrondissement, texte_intro });
        await newWalk.save();
        res.status(201).json(newWalk);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// 7. Mettre à jour une balade (auth requise)
router.post('/update-one/:id', authenticate, async (req, res) => {
    try {
        const walk = await Walk.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!walk) return res.status(404).send('Walk not found.');
        res.json(walk);
    } catch {
        res.status(400).send('Invalid ID.');
    }
});

// 8. Supprimer une balade (auth requise)
router.delete('/delete/:id', authenticate, async (req, res) => {
    try {
        const walk = await Walk.findByIdAndDelete(req.params.id);
        if (!walk) return res.status(404).send('Walk not found.');
        res.send('Walk deleted.');
    } catch {
        res.status(400).send('Invalid ID.');
    }
});

// 9. Enregistrer un utilisateur
router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (await User.findOne({ email })) return res.status(400).send('Email already exists.');
        const newUser = new User({ email, password });
        await newUser.save();
        res.status(201).send('User registered.');
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// 10. Connexion utilisateur
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).send('Invalid credentials.');
        }
        const token = jwt.sign({ id: user._id }, 'secret_key', { expiresIn: '1h' });
        res.json({ token });
    } catch {
        res.status(400).send('Login error.');
    }
});

export default router;
