import { randomInt, timingSafeEqual } from 'node:crypto';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import requireAuth from '../middleware/requireAuth.js';
import {
  createCustomer,
  createShopkeeper,
  createTransaction,
  deleteCustomer,
  findCustomer,
  findShopkeeperByPhone,
  getShopkeeperById,
  listCustomers,
  listTransactions,
  seedDemoData,
  updateCustomer,
  updateShopkeeper,
} from '../services/dataStore.js';
import { addDaysToISODate, indiaDate, isValidISODate } from '../utils/dates.js';

const router = Router();
const pendingOtps = new Map();
const otpRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_request, response) => response.status(429).json({ error: 'Too many code requests. Please try again later.' }),
});
const otpVerifyRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_request, response) => response.status(429).json({ error: 'Too many verification attempts. Request a new code later.' }),
});
const jwtSecret = process.env.JWT_SECRET || 'development-only-secret-change-before-deploy';
const languages = new Set(['en', 'te', 'hi']);
const detectedLanguages = new Set(['en', 'te', 'hi', 'mixed', 'unknown']);

function sendError(response, status, message) {
  response.status(status).json({ error: message });
}

function phoneValue(value) {
  return typeof value === 'string' ? value.replace(/[^\d+]/g, '') : '';
}

function isValidPhone(value) {
  return /^\+?\d{10,15}$/.test(value);
}

function compareCodes(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function normalizeCustomerInput(body, { partial = false } = {}) {
  const result = {};
  for (const field of ['name', 'phone', 'address']) {
    if (body[field] === undefined) {
      if (!partial && field !== 'address') return { error: `${field} is required.` };
      continue;
    }
    if (typeof body[field] !== 'string') return { error: `${field} must be text.` };
    const value = body[field].trim();
    if (field === 'name' && (!value || value.length > 70)) return { error: 'Enter a name up to 70 characters.' };
    if (field === 'phone' && (!isValidPhone(phoneValue(value)) || value.length > 20)) return { error: 'Enter a valid phone number.' };
    if (field === 'address' && value.length > 200) return { error: 'Address must be 200 characters or fewer.' };
    result[field] = value;
  }
  return { value: result };
}

router.get('/health', (_request, response) => {
  response.json({ status: 'ok', database: process.env.MONGODB_URI ? 'configured' : 'demo-memory' });
});

router.post('/auth/request-otp', otpRateLimit, (request, response) => {
  const phone = phoneValue(request.body?.phone);
  if (!isValidPhone(phone)) return sendError(response, 400, 'Enter a valid phone number with country code if needed.');
  if (process.env.NODE_ENV === 'production') {
    return sendError(response, 503, 'Phone verification is not configured. Connect an OTP provider before production use.');
  }
  const otp = process.env.NODE_ENV !== 'production'
    ? (phone === (process.env.DEMO_PHONE || '9876543210') ? (process.env.DEMO_OTP || '123456') : String(randomInt(100000, 1000000)))
    : null;
  if (!otp) return sendError(response, 503, 'OTP delivery is unavailable.');
  for (const [pendingPhone, pending] of pendingOtps) {
    if (pending.expiresAt < Date.now()) pendingOtps.delete(pendingPhone);
  }
  pendingOtps.set(phone, { code: otp, expiresAt: Date.now() + 5 * 60 * 1000 });
  response.json({
    message: 'A verification code has been requested.',
    expiresInSeconds: 300,
    ...(process.env.NODE_ENV === 'production' ? {} : { demoOtp: otp }),
  });
});

router.post('/auth/verify-otp', otpVerifyRateLimit, async (request, response, next) => {
  try {
    const body = request.body || {};
    const phone = phoneValue(body.phone);
    const otp = typeof body.otp === 'string' ? body.otp.trim() : '';
    if (!isValidPhone(phone) || !/^\d{6}$/.test(otp)) return sendError(response, 400, 'Enter your phone number and six-digit code.');
    const pending = pendingOtps.get(phone);
    if (!pending || pending.expiresAt < Date.now() || !compareCodes(otp, pending.code)) {
      return sendError(response, 401, 'That code is invalid or has expired. Request a new one.');
    }
    pendingOtps.delete(phone);
    let shopkeeper = await findShopkeeperByPhone(phone);
    let isNewAccount = false;
    if (!shopkeeper) {
      shopkeeper = await createShopkeeper({
        phone,
        ownerName: typeof body.ownerName === 'string' ? body.ownerName.trim().slice(0, 70) : '',
        shopName: typeof body.shopName === 'string' ? body.shopName.trim().slice(0, 100) : '',
        preferredLanguage: languages.has(body.preferredLanguage) ? body.preferredLanguage : 'en',
      });
      isNewAccount = true;
    }
    if (!languages.has(shopkeeper.preferredLanguage)) {
      const normalizedShopkeeper = await updateShopkeeper(shopkeeper.id, { preferredLanguage: 'en' });
      if (!normalizedShopkeeper) return sendError(response, 401, 'Your account could not be found.');
      shopkeeper = normalizedShopkeeper;
    }
    if (isNewAccount && process.env.NODE_ENV !== 'production' && phone === (process.env.DEMO_PHONE || '9876543210')) {
      await seedDemoData(shopkeeper.id);
    }
    const token = jwt.sign({ sub: shopkeeper.id }, jwtSecret, { expiresIn: '12h' });
    response.json({ token, user: shopkeeper });
  } catch (error) {
    next(error);
  }
});

router.use(requireAuth);

router.get('/auth/me', async (request, response, next) => {
  try {
    let user = await getShopkeeperById(request.shopkeeperId);
    if (!user) return sendError(response, 401, 'Your account could not be found.');
    if (!languages.has(user.preferredLanguage)) {
      user = await updateShopkeeper(request.shopkeeperId, { preferredLanguage: 'en' });
      if (!user) return sendError(response, 401, 'Your account could not be found.');
    }
    response.json({ user });
  } catch (error) {
    next(error);
  }
});

router.patch('/auth/profile', async (request, response, next) => {
  try {
    const updates = {};
    for (const field of ['ownerName', 'shopName']) {
      if (request.body?.[field] !== undefined) {
        if (typeof request.body[field] !== 'string' || request.body[field].length > (field === 'ownerName' ? 70 : 100)) {
          return sendError(response, 400, `Invalid ${field}.`);
        }
        updates[field] = request.body[field].trim();
      }
    }
    if (request.body?.preferredLanguage !== undefined) {
      if (!languages.has(request.body.preferredLanguage)) return sendError(response, 400, 'Choose a supported language.');
      updates.preferredLanguage = request.body.preferredLanguage;
    }
    if (!Object.keys(updates).length) return sendError(response, 400, 'Add at least one profile field to update.');
    const currentUser = await getShopkeeperById(request.shopkeeperId);
    const user = await updateShopkeeper(request.shopkeeperId, updates);
    response.json({ user: user || currentUser });
  } catch (error) {
    next(error);
  }
});

router.get('/customers', async (request, response, next) => {
  try {
    response.json({ customers: await listCustomers(request.shopkeeperId) });
  } catch (error) {
    next(error);
  }
});

router.post('/customers', async (request, response, next) => {
  try {
    const normalized = normalizeCustomerInput(request.body || {});
    if (normalized.error) return sendError(response, 400, normalized.error);
    const customer = await createCustomer(request.shopkeeperId, normalized.value);
    response.status(201).json({ customer });
  } catch (error) {
    next(error);
  }
});

router.get('/customers/:customerId', async (request, response, next) => {
  try {
    const customer = await findCustomer(request.shopkeeperId, request.params.customerId);
    if (!customer) return sendError(response, 404, 'Customer not found.');
    const transactions = await listTransactions(request.shopkeeperId, customer.id);
    response.json({ customer, transactions });
  } catch (error) {
    next(error);
  }
});

router.patch('/customers/:customerId', async (request, response, next) => {
  try {
    const normalized = normalizeCustomerInput(request.body || {}, { partial: true });
    if (normalized.error) return sendError(response, 400, normalized.error);
    if (!Object.keys(normalized.value).length) return sendError(response, 400, 'Add at least one field to update.');
    const customer = await updateCustomer(request.shopkeeperId, request.params.customerId, normalized.value);
    if (!customer) return sendError(response, 404, 'Customer not found.');
    response.json({ customer });
  } catch (error) {
    next(error);
  }
});

router.delete('/customers/:customerId', async (request, response, next) => {
  try {
    const customer = await findCustomer(request.shopkeeperId, request.params.customerId);
    if (!customer) return sendError(response, 404, 'Customer not found.');
    if (customer.balance > 0) return sendError(response, 409, 'Settle this customer’s balance before removing the account.');
    const archived = await deleteCustomer(request.shopkeeperId, customer.id);
    if (!archived) return sendError(response, 409, 'Settle this customer’s balance before removing the account.');
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.get('/transactions', async (request, response, next) => {
  try {
    const transactions = await listTransactions(request.shopkeeperId);
    response.json({ transactions });
  } catch (error) {
    next(error);
  }
});

router.post('/transactions', async (request, response, next) => {
  try {
    const body = request.body || {};
    if (body.confirmed !== true) return sendError(response, 400, 'Review and confirm the transaction before saving.');
    if (body.type !== 'credit' && body.type !== 'payment') return sendError(response, 400, 'Choose credit or payment.');
    const amount = Number(body.amount);
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 100000000) return sendError(response, 400, 'Enter a valid amount in rupees.');
    const customer = await findCustomer(request.shopkeeperId, String(body.customerId || ''));
    if (!customer) return sendError(response, 404, 'Choose a customer in this shop’s khata.');
    const transactionDate = body.transactionDate || indiaDate();
    if (!isValidISODate(transactionDate)) return sendError(response, 400, 'Choose a valid khata date.');
    let dueDate = null;
    if (body.type === 'credit') {
      dueDate = body.dueDate || addDaysToISODate(transactionDate, 30);
      if (!isValidISODate(dueDate)) return sendError(response, 400, 'Choose a valid due date.');
    }
    const detectedLanguage = detectedLanguages.has(body.detectedLanguage) ? body.detectedLanguage : 'unknown';
    const result = await createTransaction(request.shopkeeperId, customer, {
      type: body.type,
      amount,
      transactionDate,
      dueDate,
      voiceInput: typeof body.voiceInput === 'string' ? body.voiceInput.slice(0, 500) : '',
      detectedLanguage,
    });
    if (result.error === 'balance_exceeded') return sendError(response, 409, 'Payment exceeds the customer’s outstanding balance.');
    response.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/dashboard', async (request, response, next) => {
  try {
    const [customers, transactions] = await Promise.all([
      listCustomers(request.shopkeeperId),
      listTransactions(request.shopkeeperId),
    ]);
    const today = indiaDate();
    const tomorrow = addDaysToISODate(today, 1);
    const pending = customers.filter((customer) => customer.balance > 0);
    const todayTransactions = transactions.filter((transaction) => indiaDate(new Date(transaction.transactionDate)) === today);
    const dueToday = pending.filter((customer) => customer.dueDate === today);
    const overdue = pending.filter((customer) => customer.dueDate && customer.dueDate < today);
    const dueTomorrow = pending.filter((customer) => customer.dueDate === tomorrow);
    response.json({
      date: today,
      summary: {
        totalCustomers: customers.length,
        outstandingAmount: pending.reduce((total, customer) => total + customer.balance, 0),
        collectionToday: todayTransactions.filter((transaction) => transaction.type === 'payment').reduce((total, transaction) => total + transaction.amount, 0),
        creditToday: todayTransactions.filter((transaction) => transaction.type === 'credit').reduce((total, transaction) => total + transaction.amount, 0),
        pendingCustomers: pending.length,
        dueToday: dueToday.length,
        overdue: overdue.length,
        dueTomorrow: dueTomorrow.length,
      },
      dueToday,
      overdue,
      dueTomorrow,
      recentTransactions: transactions.slice(0, 8),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/reports', async (request, response, next) => {
  try {
    const [customers, transactions] = await Promise.all([
      listCustomers(request.shopkeeperId),
      listTransactions(request.shopkeeperId),
    ]);
    const today = indiaDate();
    const tomorrow = addDaysToISODate(today, 1);
    const todayTransactions = transactions.filter((transaction) => indiaDate(new Date(transaction.transactionDate)) === today);
    const credits = todayTransactions.filter((transaction) => transaction.type === 'credit');
    const payments = todayTransactions.filter((transaction) => transaction.type === 'payment');
    const pending = customers.filter((customer) => customer.balance > 0);
    const dueToday = pending.filter((customer) => customer.dueDate === today);
    const dueTomorrow = pending.filter((customer) => customer.dueDate === tomorrow);
    const overdue = pending.filter((customer) => customer.dueDate && customer.dueDate < today)
      .sort((left, right) => left.dueDate.localeCompare(right.dueDate));
    const outstandingAmount = pending.reduce((total, customer) => total + customer.balance, 0);
    response.json({
      date: today,
      daily: {
        credit: credits.reduce((total, transaction) => total + transaction.amount, 0),
        collection: payments.reduce((total, transaction) => total + transaction.amount, 0),
        creditTransactions: credits,
      },
      dues: { today: dueToday, tomorrow: dueTomorrow, overdue },
      outstanding: {
        total: outstandingAmount,
        pendingCustomers: pending.length,
      },
      transactions,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/reminders', async (request, response, next) => {
  try {
    const customers = await listCustomers(request.shopkeeperId);
    const today = indiaDate();
    const tomorrow = addDaysToISODate(today, 1);
    const reminders = customers
      .filter((customer) => customer.balance > 0 && customer.dueDate && customer.dueDate <= tomorrow)
      .map((customer) => ({
        customerId: customer.id,
        name: customer.name,
        phone: customer.phone,
        amount: customer.balance,
        dueDate: customer.dueDate,
        overdue: customer.dueDate < today,
        message: customer.dueDate < today
          ? `${customer.name}’s khata payment is overdue.`
          : customer.dueDate === today
            ? `${customer.name}’s khata payment is due today.`
            : `${customer.name}’s khata payment is due tomorrow.`,
      }));
    response.json({ date: today, reminders });
  } catch (error) {
    next(error);
  }
});

router.get('/reminders/:customerId', async (request, response, next) => {
  try {
    const customer = await findCustomer(request.shopkeeperId, request.params.customerId);
    if (!customer) return sendError(response, 404, 'Customer not found.');
    if (customer.balance <= 0) return sendError(response, 409, 'This customer has no outstanding balance.');
    const shopkeeper = await getShopkeeperById(request.shopkeeperId);
    const today = indiaDate();
    const daysOverdue = customer.dueDate && customer.dueDate < today
      ? Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${customer.dueDate}T00:00:00Z`)) / 86400000)
      : 0;
    const dueLabel = !customer.dueDate
      ? 'at your convenience'
      : customer.dueDate === today
        ? 'today'
        : daysOverdue
          ? `overdue by ${daysOverdue} ${daysOverdue === 1 ? 'day' : 'days'}`
          : `on ${new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${customer.dueDate}T00:00:00Z`))}`;
    const amount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(customer.balance);
    const shopName = shopkeeper?.shopName || 'our shop';
    response.json({
      reminder: {
        customerId: customer.id,
        message: `Namaste ${customer.name}, a friendly reminder from ${shopName}: your khata balance is ${amount}, due ${dueLabel}. Please pay when convenient. Thank you!`,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
