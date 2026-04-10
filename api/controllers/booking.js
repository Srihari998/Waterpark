const db = require('../config/db');

exports.createBooking = async (req, res) => {
    const { items } = req.body; // items: [{ name, price }, ...]
    const userId = req.user.id;

    if (!items || items.length === 0) return res.status(400).json({ message: 'No items in cart' });

    const session = db.getSession();
    try {
        let total = 0;
        const tx = session.beginTransaction();
        
        for (let item of items) {
            const qty = item.quantity || 1;
            const linePrice = parseInt(item.price, 10) * qty;
            total += linePrice;
            
            // Create booking relationship for each item
            await tx.run(`
                MATCH (u:User {id: $userId})
                MATCH (p:Product {name: $productName})
                CREATE (u)-[:BOOKED { date: datetime(), pricePaid: $price, quantity: $qty, timeSlot: $slot, id: randomUUID() }]->(p)
            `, { userId, productName: item.name, price: linePrice, qty, slot: item.slot || 'No Slot' });
        }
        
        await tx.commit();
        res.status(201).json({ message: 'Booking successful', total });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during booking' });
    } finally {
        await session.close();
    }
};

exports.getUserBookings = async (req, res) => {
    const userId = req.user.id;
    const session = db.getSession();
    
    try {
        const result = await session.run(`
            MATCH (u:User {id: $userId})-[b:BOOKED]->(p:Product)
            OPTIONAL MATCH (u)-[:WROTE]->(r:Review)-[:ABOUT]->(p)
            RETURN toString(b.date) AS date, p.name AS product, b.pricePaid AS price, coalesce(b.quantity, 1) AS quantity, coalesce(b.timeSlot, 'N/A') AS slot, r.text AS reviewText, r.rating AS reviewRating
            ORDER BY b.date DESC
        `, { userId });
        
        const bookings = result.records.map(r => ({
            date: r.get('date'),
            product: r.get('product'),
            price: r.get('price'),
            quantity: r.get('quantity').toNumber ? r.get('quantity').toNumber() : r.get('quantity'),
            slot: r.get('slot'),
            reviewText: r.get('reviewText'),
            reviewRating: r.get('reviewRating') ? (r.get('reviewRating').toNumber ? r.get('reviewRating').toNumber() : r.get('reviewRating')) : null
        }));
        
        res.json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        await session.close();
    }
};
