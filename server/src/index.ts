
import dotenv from 'dotenv';
dotenv.config(); // ✅ Load env before anything else

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev-key';


const app = express();
const port = process.env.PORT || 3001;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    (req as any).user = user;
    next();
  });
}

// Register
app.post('/api/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || password.length < 6) {
      res.status(400).json({ error: 'Invalid email or password' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { email, password: hashedPassword },
    });

    res.status(201).json({ message: 'User created' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
app.post('/api/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ message: 'OK' });
});


// Explicit route handler typing
app.post(
  '/api/parties',
  async function (req: Request, res: Response, _next: NextFunction): Promise<void> {
    const { name, members }: { name: string; members: Prisma.PartyMemberCreateWithoutPartyInput[] } = req.body;

    if (!name || !Array.isArray(members)) {
      res.status(400).json({ error: 'Invalid party data' });
      return;
    }

    try {
      const newParty = await prisma.party.create({
        data: {
          name,
          members: {
            create: members
          }
        },
        include: { members: true }
      });

      res.status(201).json(newParty);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create party' });
    }
  }
);


// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
