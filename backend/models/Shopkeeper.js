import mongoose from 'mongoose';

const shopkeeperSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true, index: true },
  ownerName: { type: String, trim: true, default: '' },
  shopName: { type: String, trim: true, default: '' },
  preferredLanguage: { type: String, enum: ['en', 'te', 'hi'], default: 'en' },
}, { timestamps: true });

export default mongoose.models.Shopkeeper || mongoose.model('Shopkeeper', shopkeeperSchema);
