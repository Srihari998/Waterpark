const db = require('../config/db');

exports.getProducts = async (req, res) => {
    const session = db.getSession();
    try {
        const result = await session.run('MATCH (p:Product) RETURN p');
        
        if (result.records.length === 0) {
            // Seed database if empty
            console.log('Seeding products...');
            await session.run(`
                CREATE 
                    (p1:Product {id: randomUUID(), name: 'twister slide', category: 'rides', price: 850}),
                    (p2:Product {id: randomUUID(), name: 'lazy river', category: 'rides', price: 490}),
                    (p3:Product {id: randomUUID(), name: 'whirlpool rush', category: 'rides', price: 1100}),
                    (p4:Product {id: randomUUID(), name: 'kiddie pool', category: 'rides', price: 390}),
                    (fo1:Product {id: randomUUID(), name: 'margherita pizza', category: 'food', price: 240}),
                    (fo2:Product {id: randomUUID(), name: 'ice cream', category: 'food', price: 95}),
                    (fo3:Product {id: randomUUID(), name: 'mocktail', category: 'food', price: 130}),
                    (fo4:Product {id: randomUUID(), name: 'veggie burger', category: 'food', price: 190}),
                    (s1:Product {id: randomUUID(), name: 'beach cabana', category: 'stays', price: 1990}),
                    (s2:Product {id: randomUUID(), name: 'private pool villa', category: 'stays', price: 5490}),
                    (s3:Product {id: randomUUID(), name: 'cabana lounge', category: 'stays', price: 1490}),
                    (e1:Product {id: randomUUID(), name: 'poolside dj pass', category: 'events', price: 650}),
                    (e2:Product {id: randomUUID(), name: 'birthday bash', category: 'events', price: 1250})
            `);
            const retryResult = await session.run('MATCH (p:Product) RETURN p');
            const seededProducts = retryResult.records.map(record => record.get('p').properties);
            return res.json(seededProducts);
        }

        const products = result.records.map(record => record.get('p').properties);
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        await session.close();
    }
};
