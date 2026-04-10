const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.register = async (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username and password required' });

    const session = db.getSession();
    try {
        // Check if user exists
        const checkResult = await session.run('MATCH (u:User {username: $username}) RETURN u', { username });
        if (checkResult.records.length > 0) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const userRole = role === 'admin' ? 'admin' : 'customer';

        const result = await session.run(
            'CREATE (u:User {id: randomUUID(), username: $username, password: $password, role: $role}) RETURN u',
            { username, password: hashedPassword, role: userRole }
        );

        const createdUser = result.records[0].get('u').properties;
        res.status(201).json({ message: 'User registered successfully', username: createdUser.username });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        await session.close();
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;
    const session = db.getSession();
    try {
        const result = await session.run('MATCH (u:User {username: $username}) RETURN u', { username });
        if (result.records.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

        const user = result.records[0].get('u').properties;
        const validPass = await bcrypt.compare(password, user.password);

        if (!validPass) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });

        res.json({ token, user: { username: user.username, role: user.role } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        await session.close();
    }
};
