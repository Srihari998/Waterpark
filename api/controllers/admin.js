const db = require('../config/db');

exports.getMetrics = async (req, res) => {
    const session = db.getSession();
    try {
        const metrics = {};

        const usersResult = await session.run('MATCH (u:User) RETURN count(u) AS total');
        metrics.totalUsers = usersResult.records[0].get('total').toNumber();

        const revenueResult = await session.run('MATCH ()-[b:BOOKED]->() RETURN sum(b.pricePaid) AS rev, count(b) AS bookings');
        metrics.totalRevenue = revenueResult.records[0].get('rev') || 0;
        metrics.totalBookings = revenueResult.records[0].get('bookings').toNumber();

        res.json(metrics);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        await session.close();
    }
};

exports.getGraphData = async (req, res) => {
    const session = db.getSession();
    try {
        // Collect Nodes (Users, Products, Reviews) and Links
        const nodes = [];
        const links = [];

        // Fetch Users
        const usersRes = await session.run('MATCH (u:User) RETURN u');
        usersRes.records.forEach(rec => {
            const u = rec.get('u').properties;
            nodes.push({ data: { id: u.id, label: u.username, role: u.role, type: 'User' } });
        });

        // Fetch Products
        const prodRes = await session.run('MATCH (u:Product) RETURN u');
        prodRes.records.forEach(rec => {
            const p = rec.get('u').properties;
            nodes.push({ data: { id: p.id, label: p.name, type: 'Product' } });
        });

        // Fetch Reviews
        const revRes = await session.run('MATCH (r:Review) RETURN r');
        revRes.records.forEach(rec => {
            const r = rec.get('r').properties;
            nodes.push({ data: { id: r.id, label: 'Review ' + r.rating + '* ', type: 'Review' } });
        });

        const relsRes = await session.run(`
            MATCH (n)-[r]->(m) 
            WHERE type(r) IN ['BOOKED', 'WROTE', 'ABOUT', 'REACTED_TO', 'CONNECTED_TO']
            RETURN n.id AS source, m.id AS target, type(r) AS relType, id(r) as rid, r.type AS reactType
        `);

        relsRes.records.forEach(rec => {
            const relType = rec.get('relType');
            const reactType = rec.get('reactType');
            links.push({
                data: {
                    id: 'e' + rec.get('rid').toNumber(),
                    source: rec.get('source'),
                    target: rec.get('target'),
                    label: relType === 'REACTED_TO' ? (reactType || 'reacted') : relType
                }
            });
        });

        res.json({ elements: [...nodes, ...links] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        await session.close();
    }
};

exports.deleteUser = async (req, res) => {
    const { username } = req.params;
    if (username === 'srihari') {
        return res.status(400).json({ message: 'Cannot delete the master admin.' });
    }

    const session = db.getSession();
    try {
        const result = await session.run('MATCH (u:User {username: $username}) DETACH DELETE u RETURN u', { username });
        if (result.records.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: `User ${username} successfully removed.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error deleting user' });
    } finally {
        await session.close();
    }
};
