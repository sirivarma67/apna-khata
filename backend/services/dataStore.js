import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import Shopkeeper from '../models/Shopkeeper.js';
import Customer from '../models/Customer.js';
import Transaction from '../models/Transaction.js';
import { addDaysToISODate, indiaDate } from '../utils/dates.js';

const memory = {
  shopkeepers: new Map(),
  customers: new Map(),
  transactions: new Map(),
};

const isMongo = () => mongoose.connection.readyState === 1;
function plain(record) {
  if (!record) return null;
  const value = typeof record.toObject === 'function' ? record.toObject() : record;
  const { _id, __v, ...fields } = value;
  return { ...fields, id: String(_id ?? value.id) };
}

function customerPlain(record) {
  const result = plain(record);
  if (result) result.shopkeeperId = String(result.shopkeeperId);
  return result;
}

function transactionPlain(record) {
  const result = plain(record);
  if (result) {
    result.shopkeeperId = String(result.shopkeeperId);
    result.customerId = String(result.customerId);
  }
  return result;
}

export async function findShopkeeperByPhone(phone) {
  if (isMongo()) return plain(await Shopkeeper.findOne({ phone }).lean());
  return Array.from(memory.shopkeepers.values()).find((shopkeeper) => shopkeeper.phone === phone) || null;
}

export async function getShopkeeperById(id) {
  if (isMongo()) {
    if (!mongoose.isValidObjectId(id)) return null;
    return plain(await Shopkeeper.findById(id).lean());
  }
  return memory.shopkeepers.get(id) || null;
}

export async function createShopkeeper(profile) {
  if (isMongo()) return plain(await Shopkeeper.create(profile));
  const shopkeeper = { ...profile, id: randomUUID(), createdAt: new Date(), updatedAt: new Date() };
  memory.shopkeepers.set(shopkeeper.id, shopkeeper);
  return shopkeeper;
}

export async function updateShopkeeper(id, updates) {
  if (isMongo()) {
    const shopkeeper = await Shopkeeper.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).lean();
    return plain(shopkeeper);
  }
  const shopkeeper = memory.shopkeepers.get(id);
  if (!shopkeeper) return null;
  Object.assign(shopkeeper, updates, { updatedAt: new Date() });
  return shopkeeper;
}

export async function createCustomer(shopkeeperId, data) {
  if (isMongo()) return customerPlain(await Customer.create({ ...data, shopkeeperId }));
  const customer = {
    ...data,
    shopkeeperId,
    balance: 0,
    totalCredit: 0,
    totalPaid: 0,
    dueDate: null,
    lastTransactionAt: null,
    archivedAt: null,
    id: randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  memory.customers.set(customer.id, customer);
  return customer;
}

export async function listCustomers(shopkeeperId) {
  if (isMongo()) {
    const customers = await Customer.find({ shopkeeperId, archivedAt: null }).sort({ name: 1 }).lean();
    return customers.map(customerPlain);
  }
  return Array.from(memory.customers.values())
    .filter((customer) => customer.shopkeeperId === shopkeeperId && !customer.archivedAt)
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function findCustomer(shopkeeperId, customerId) {
  if (isMongo()) {
    if (!mongoose.isValidObjectId(customerId)) return null;
    return customerPlain(await Customer.findOne({ _id: customerId, shopkeeperId, archivedAt: null }).lean());
  }
  const customer = memory.customers.get(customerId);
  return customer?.shopkeeperId === shopkeeperId && !customer.archivedAt ? customer : null;
}

export async function updateCustomer(shopkeeperId, customerId, updates) {
  if (isMongo()) {
    if (!mongoose.isValidObjectId(customerId)) return null;
    return customerPlain(await Customer.findOneAndUpdate(
      { _id: customerId, shopkeeperId, archivedAt: null },
      updates,
      { new: true, runValidators: true },
    ).lean());
  }
  const customer = await findCustomer(shopkeeperId, customerId);
  if (!customer) return null;
  Object.assign(customer, updates, { updatedAt: new Date() });
  return customer;
}

export async function deleteCustomer(shopkeeperId, customerId) {
  if (isMongo()) {
    if (!mongoose.isValidObjectId(customerId)) return false;
    const result = await Customer.updateOne(
      { _id: customerId, shopkeeperId, archivedAt: null, balance: 0 },
      { $set: { archivedAt: new Date() } },
    );
    return result.modifiedCount === 1;
  }
  const customer = await findCustomer(shopkeeperId, customerId);
  if (!customer || customer.balance > 0) return false;
  customer.archivedAt = new Date();
  return true;
}

export async function listTransactions(shopkeeperId, customerId) {
  if (isMongo()) {
    const activeCustomers = await Customer.find({ shopkeeperId, archivedAt: null }).distinct('_id');
    const query = { shopkeeperId, customerId: customerId || { $in: activeCustomers } };
    const records = await Transaction.find(query)
      .sort({ transactionDate: -1, createdAt: -1 })
      .populate('customerId', 'name')
      .lean();
    return records.map((record) => {
      const customerName = record.customerId?.name || '';
      const result = transactionPlain({ ...record, customerId: record.customerId?._id });
      return { ...result, customerName };
    });
  }
  const activeCustomerIds = new Set(
    Array.from(memory.customers.values())
      .filter((customer) => customer.shopkeeperId === shopkeeperId && !customer.archivedAt)
      .map((customer) => customer.id),
  );
  return Array.from(memory.transactions.values())
    .filter((transaction) => transaction.shopkeeperId === shopkeeperId
      && activeCustomerIds.has(transaction.customerId)
      && (!customerId || transaction.customerId === customerId))
    .sort((left, right) => new Date(right.transactionDate) - new Date(left.transactionDate))
    .map((transaction) => ({
      ...transaction,
      customerName: memory.customers.get(transaction.customerId)?.name || '',
    }));
}

export async function createTransaction(shopkeeperId, customer, transaction) {
  if (isMongo()) {
    const session = await mongoose.startSession();
    let result;
    try {
      await session.withTransaction(async () => {
        const [record] = await Transaction.create([{
          ...transaction,
          shopkeeperId,
          customerId: customer.id,
          confirmationStatus: 'confirmed',
        }], { session });
        const balanceChange = transaction.type === 'credit' ? transaction.amount : -transaction.amount;
        const update = transaction.type === 'credit'
          ? { $inc: { balance: balanceChange, totalCredit: transaction.amount }, $set: { dueDate: transaction.dueDate } }
          : { $inc: { balance: balanceChange, totalPaid: transaction.amount } };
        const balanceFilter = transaction.type === 'payment' ? { balance: { $gte: transaction.amount } } : {};
        const updatedCustomer = await Customer.findOneAndUpdate(
          { _id: customer.id, shopkeeperId, archivedAt: null, ...balanceFilter },
          { ...update, $set: { ...update.$set, lastTransactionAt: new Date() } },
          { new: true, session },
        ).lean();
        if (!updatedCustomer) {
          const error = new Error('Payment exceeds the outstanding balance.');
          error.code = 'BALANCE_EXCEEDED';
          throw error;
        }
        result = {
          transaction: { ...transactionPlain(record), customerName: customer.name },
          customer: customerPlain(updatedCustomer),
        };
      });
      return result;
    } catch (error) {
      if (error.code === 'BALANCE_EXCEEDED') return { error: 'balance_exceeded' };
      throw error;
    } finally {
      await session.endSession();
    }
  }

  if (transaction.type === 'payment' && transaction.amount > customer.balance) {
    return { error: 'balance_exceeded' };
  }
  const now = new Date();
  const updatedCustomer = {
    ...customer,
    balance: customer.balance + (transaction.type === 'credit' ? transaction.amount : -transaction.amount),
    totalCredit: customer.totalCredit + (transaction.type === 'credit' ? transaction.amount : 0),
    totalPaid: customer.totalPaid + (transaction.type === 'payment' ? transaction.amount : 0),
    dueDate: transaction.type === 'credit' ? transaction.dueDate : customer.dueDate,
    lastTransactionAt: now,
    updatedAt: now,
  };
  const record = {
    ...transaction,
    shopkeeperId,
    customerId: customer.id,
    confirmationStatus: 'confirmed',
    id: randomUUID(),
    createdAt: now,
  };
  memory.customers.set(customer.id, updatedCustomer);
  memory.transactions.set(record.id, record);
  return {
    transaction: { ...record, customerName: customer.name },
    customer: updatedCustomer,
  };
}

export async function seedDemoData(shopkeeperId) {
  const records = [
    { name: 'Ravi Kumar', phone: '+91 98765 43210', address: 'Vaishali Nagar', credit: 2450, dueIn: 0 },
    { name: 'Lakshmi Devi', phone: '+91 98765 12345', address: 'Mansarovar', credit: 1800, dueIn: 1 },
    { name: 'Ramesh Patel', phone: '+91 99887 76655', address: 'Shastri Nagar', credit: 4250, dueIn: 3 },
    { name: 'Anjali Sharma', phone: '+91 91234 56780', address: '', credit: 950, dueIn: 5 },
  ];
  const today = indiaDate();
  for (const record of records) {
    const dueDate = addDaysToISODate(today, record.dueIn);
    const customer = await createCustomer(shopkeeperId, {
      name: record.name,
      phone: record.phone,
      address: record.address,
    });
    await createTransaction(shopkeeperId, customer, {
      type: 'credit',
      amount: record.credit,
      transactionDate: today,
      dueDate,
      voiceInput: '',
      detectedLanguage: 'en',
    });
  }
}
