import mongoose from 'mongoose';

const BaladeSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    arrondissement: { type: Number, required: true, min: 1, max: 20 },
    texte_intro: { type: String, required: true },
    date_publication: { type: Date, default: Date.now },
});

export default mongoose.model('Balade', BaladeSchema);
