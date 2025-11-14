import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import employeeRoutes from './routes/employeeRoutes.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/employees', employeeRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('Backend is running');
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => 
    console.log(`Server running on http://localhost:${PORT}`));

