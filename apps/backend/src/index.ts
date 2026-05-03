import 'dotenv/config';
import cors from 'cors';
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

app.use(
    cors({
        origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
        credentials: true, // required for session cookies
    })
);

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
