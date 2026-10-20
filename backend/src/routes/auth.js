import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { timingSafeEqual } from 'crypto';

const router = Router();

function safeCompare(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

router.post('/login', (req, res) => {
  const { username, password } = req.body ?? {};

  const validUser = process.env.APP_USER;
  const validPass = process.env.APP_PASSWORD;
  const secret    = process.env.JWT_SECRET;

  if (!validUser || !validPass || !secret) {
    return res.status(500).json({ error: 'Credenciales no configuradas en el servidor' });
  }

  const ok = safeCompare(username, validUser) && safeCompare(password, validPass);

  if (!ok) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }

  const token = jwt.sign({ username: validUser }, secret, { expiresIn: '8h' });
  res.json({ token });
});

export default router;
