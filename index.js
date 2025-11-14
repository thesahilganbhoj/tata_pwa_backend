import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import employeeRoutes from './routes/employeeRoutes.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
app.use(cors({
    origin: ['https://tata-pwa-frontend.vercel.app', 'http://localhost:3000'],
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    credentials: true
}));
app.use(express.json());

app.use('/api/employees', employeeRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('Backend is running');
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => 
    console.log(`Server running on https://tata-pwa-backend.vercel.app`));

export default app;