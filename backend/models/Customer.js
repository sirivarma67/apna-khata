import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  shopkeeperId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shopkeeper', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 70 },
  phone: { type: String, required: true, trim: true, maxlength: 20 },
  address: { type: String, trim: true, default: '', maxlength: 200 },
  balance: { type: Number, min: 0, default: 0 },
  totalCredit: { type: Number, min: 0, default: 0 },
  totalPaid: { type: Number, min: 0, default: 0 },
  dueDate: { type: String, default: null },
  lastTransactionAt: { type: Date, default: null },
  archivedAt: { type: Date, default: null },
}, { timestamps: true });

customerSchema.index({ shopkeeperId: 1, name: 1 });

export default mongoose.models.Customer || mongoose.model('Customer', customerSchema);
