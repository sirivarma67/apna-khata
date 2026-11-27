import test from 'node:test';
import assert from 'node:assert/strict';
import { createCustomer, createShopkeeper, createTransaction, deleteCustomer, findCustomer } from '../services/dataStore.js';

test('customer credit and payments keep outstanding balance consistent', async () => {
  const shopkeeper = await createShopkeeper({ phone: `+91${Date.now()}` });
  const customer = await createCustomer(shopkeeper.id, {
    name: 'Test Customer',
    phone: '+91 90000 00000',
    address: '',
  });
  const credit = await createTransaction(shopkeeper.id, customer, {
    type: 'credit',
    amount: 800,
    transactionDate: '2026-11-27',
    dueDate: '2026-12-27',
    voiceInput: 'Test Customer took groceries worth 800',
    detectedLanguage: 'en',
  });
  assert.equal(credit.customer.balance, 800);

  const rejectedPayment = await createTransaction(shopkeeper.id, credit.customer, {
    type: 'payment',
    amount: 900,
    transactionDate: '2026-11-27',
    dueDate: null,
    voiceInput: 'Test Customer paid 900',
    detectedLanguage: 'en',
  });
  assert.equal(rejectedPayment.error, 'balance_exceeded');

  const payment = await createTransaction(shopkeeper.id, credit.customer, {
    type: 'payment',
    amount: 300,
    transactionDate: '2026-11-27',
    dueDate: null,
    voiceInput: 'Test Customer paid 300',
    detectedLanguage: 'en',
  });
  const savedCustomer = await findCustomer(shopkeeper.id, customer.id);
  assert.equal(payment.customer.balance, 500);
  assert.equal(savedCustomer.totalCredit, 800);
  assert.equal(savedCustomer.totalPaid, 300);
  assert.equal(savedCustomer.balance, 500);
});

test('prevents archiving a customer with an outstanding balance', async () => {
  const shopkeeper = await createShopkeeper({ phone: '+919000000001' });
  const customer = await createCustomer(shopkeeper.id, {
    name: 'Pending Customer',
    phone: '+91 90000 00001',
    address: '',
  });
  await createTransaction(shopkeeper.id, customer, {
    type: 'credit',
    amount: 100,
    transactionDate: '2026-11-27',
    dueDate: '2026-12-27',
    voiceInput: '',
    detectedLanguage: 'unknown',
  });

  assert.equal(await deleteCustomer(shopkeeper.id, customer.id), false);
  assert.ok(await findCustomer(shopkeeper.id, customer.id));
  const pending = await findCustomer(shopkeeper.id, customer.id);
  await createTransaction(shopkeeper.id, pending, {
    type: 'payment',
    amount: 100,
    transactionDate: '2026-11-27',
    dueDate: null,
    voiceInput: '',
    detectedLanguage: 'unknown',
  });
  assert.equal(await deleteCustomer(shopkeeper.id, customer.id), true);
  assert.equal(await findCustomer(shopkeeper.id, customer.id), null);
});
