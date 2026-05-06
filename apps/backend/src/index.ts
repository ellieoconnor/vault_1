import 'dotenv/config';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import express from 'express';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';
import { errorHandler } from './middleware/errorHandler.js';
import router from './routes/auth.js';
import usersRouter from './routes/users.js';
import cheatCodesRouter from './routes/cheatCodes.js';

export const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const PgSession = connectPgSimple(session);
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });
export { prisma };

const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
    const allowed = [
        process.env.CLIENT_ORIGIN,
        'http://localhost:5173',
    ].filter(Boolean) as string[];
    const origin = req.headers.origin;
    if (origin && allowed.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
});

app.use(cookieParser());
app.use(express.json());

app.use(
    session({
        store: new PgSession({
            pool, // reuse the existing Pool
            createTableIfMissing: true, // auto-creates "session" table in Neon
        }),
        secret: process.env.SESSION_SECRET!,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
            sameSite: 'none',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        },
    })
);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.get('/api/debug-cors', (req, res) => {
    res.json({
        CLIENT_ORIGIN: process.env.CLIENT_ORIGIN,
        NODE_ENV: process.env.NODE_ENV,
        requestOrigin: req.headers.origin,
    });
});

app.use('/api/auth', router);
app.use('/api/users', usersRouter);
app.use('/api/cheat-codes', cheatCodesRouter);

app.use(errorHandler);

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export default app;
