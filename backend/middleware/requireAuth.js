import jwt from 'jsonwebtoken';
import { getShopkeeperById } from '../services/dataStore.js';

const jwtSecret = process.env.JWT_SECRET || 'development-only-secret-change-before-deploy';

export default async function requireAuth(request, response, next) {
  const authorization = request.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) {
    response.status(401).json({ error: 'Authentication required.' });
    return;
  }
  let payload;
  try {
    payload = jwt.verify(token, jwtSecret);
  } catch {
    response.status(401).json({ error: 'Your session has expired. Please sign in again.' });
    return;
  }
  try {
    const shopkeeper = await getShopkeeperById(payload.sub);
    if (!shopkeeper) {
      response.status(401).json({ error: 'Your shop account was not found. Please sign in again.' });
      return;
    }
    request.shopkeeperId = shopkeeper.id;
    next();
  } catch (error) {
    next(error);
  }
}
