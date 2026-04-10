const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Import Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/product');
const bookingRoutes = require('./routes/booking');
const socialRoutes = require('./routes/social');
const adminRoutes = require('./routes/admin');
const db = require('./config/db');
const bcrypt = require('bcrypt');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const seedAdmin = async () => {
    const session = db.getSession();
    try {
        const result = await session.run('MATCH (u:User {username: "srihari"}) RETURN u');
        if (result.records.length === 0) {
            const hashedPassword = await bcrypt.hash('998931', 10);
            await session.run(
                'CREATE (u:User {id: randomUUID(), username: "srihari", password: $password, role: "admin"})',
                { password: hashedPassword }
            );
            console.log('Seeded default admin user (srihari / 998931)');
        }
    } catch (e) {
        console.log('Admin seeding skipped/failed', e);
    } finally {
        await session.close();
    }
};

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await seedAdmin();
});

module.exports = app;
