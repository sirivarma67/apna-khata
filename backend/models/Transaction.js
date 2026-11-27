import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  shopkeeperId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shopkeeper', required: true, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  type: { type: String, enum: ['credit', 'payment'], required: true },
  amount: { type: Number, required: true, min: 1 },
  transactionDate: { type: Date, required: true },
  dueDate: { type: String, default: null },
  voiceInput: { type: String, default: '', maxlength: 500 },
  detectedLanguage: { type: String, enum: ['en', 'te', 'hi', 'mixed', 'unknown'], default: 'unknown' },
  confirmationStatus: { type: String, enum: ['confirmed'], required: true },
}, { timestamps: true });

transactionSchema.index({ shopkeeperId: 1, transactionDate: -1 });

export default mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
