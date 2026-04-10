const db = require('../config/db');

exports.createReview = async (req, res) => {
    const { productName, text, rating } = req.body;
    const userId = req.user.id;

    const session = db.getSession();
    try {
        await session.run(`
            MATCH (u:User {id: $userId})
            MATCH (p:Product {name: $productName})
            CREATE (r:Review {id: randomUUID(), text: $text, rating: $rating, createdAt: datetime()})
            CREATE (u)-[:WROTE]->(r)
            CREATE (r)-[:ABOUT]->(p)
        `, { userId, productName, text, rating: parseInt(rating, 10) });

        res.status(201).json({ message: 'Review created' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        await session.close();
    }
};

exports.getReviews = async (req, res) => {
    const session = db.getSession();
    try {
        const result = await session.run(`
            MATCH (u:User)-[:WROTE]->(r:Review)-[:ABOUT]->(p:Product)
            OPTIONAL MATCH (r)<-[re:REACTED_TO]-(u2:User)
            RETURN r.id AS id, r.text AS text, r.rating AS rating, u.username AS author, p.name AS product, COUNT(re) AS reactions, r.createdAt AS createdAt
            ORDER BY createdAt DESC LIMIT 20
        `);
        
        const reviews = result.records.map(rec => ({
            id: rec.get('id'),
            text: rec.get('text'),
            rating: rec.get('rating'),
            author: rec.get('author'),
            product: rec.get('product'),
            reactions: rec.get('reactions').toNumber()
        }));
        
        res.json(reviews);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        await session.close();
    }
};

exports.getProductStats = async (req, res) => {
    const session = db.getSession();
    try {
        const result = await session.run(`
            MATCH (p:Product)<-[:ABOUT]-(r:Review)
            RETURN p.name AS product, avg(r.rating) AS avgRating, count(r) AS reviewCount
        `);
        const stats = result.records.map(rec => ({
            product: rec.get('product'),
            avgRating: Math.round(rec.get('avgRating') * 10) / 10,
            reviewCount: rec.get('reviewCount').toNumber()
        }));
        res.json(stats);
    } catch (e) {
        console.error(e);
        res.status(500).json({message: 'Server error'});
    } finally {
        await session.close();
    }
};

exports.getProductReviews = async (req, res) => {
    const { productName } = req.params;
    const session = db.getSession();
    try {
        const result = await session.run(`
            MATCH (u:User)-[:WROTE]->(r:Review)-[:ABOUT]->(p:Product {name: $productName})
            OPTIONAL MATCH (r)<-[re:REACTED_TO]-(u2:User)
            RETURN r.id AS id, r.text AS text, r.rating AS rating, u.username AS author, p.name AS product, 
                   COUNT(CASE WHEN re.type = 'like' THEN 1 END) AS likes,
                   COUNT(CASE WHEN re.type = 'dislike' THEN 1 END) AS dislikes,
                   r.createdAt AS createdAt
            ORDER BY createdAt DESC
        `, { productName });

        const reviews = result.records.map(rec => ({
            id: rec.get('id'),
            text: rec.get('text'),
            rating: rec.get('rating').toNumber ? rec.get('rating').toNumber() : rec.get('rating'),
            author: rec.get('author'),
            likes: rec.get('likes').toNumber(),
            dislikes: rec.get('dislikes').toNumber()
        }));
        res.json(reviews);
    } catch(e) {
        console.error(e);
        res.status(500).json({message: 'Server error'});
    } finally {
        await session.close();
    }
};

exports.reactToReview = async (req, res) => {
    const { reviewId, type } = req.body; // type: 'like' or 'dislike'
    const userId = req.user.id;

    if (!['like', 'dislike'].includes(type)) return res.status(400).json({message: 'Invalid reaction type'});

    const session = db.getSession();
    try {
        await session.run(`
            MATCH (u:User {id: $userId})
            MATCH (r:Review {id: $reviewId})
            MERGE (u)-[re:REACTED_TO]->(r)
            SET re.type = $type
            
            // Derive a CONNECTED_TO relationship between interactor and author
            WITH u, r, $type AS reactType
            MATCH (author:User)-[:WROTE]->(r)
            WHERE u.id <> author.id
            MERGE (u)-[c:CONNECTED_TO]-(author)
            ON CREATE SET c.weight = CASE WHEN reactType = 'like' THEN 1 ELSE -1 END
            ON MATCH SET c.weight = coalesce(c.weight, 0) + CASE WHEN reactType = 'like' THEN 1 ELSE -1 END
        `, { userId, reviewId, type });

        res.json({ message: 'Reaction recorded' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        await session.close();
    }
};
