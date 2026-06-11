const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');

// GET /api/destinations - Fetch all destinations
router.get('/', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const destinationsCollection = db.collection('destinations');
        const destinations = await destinationsCollection.find({}).toArray();
        const mappedDestinations = destinations.map(dest => ({
            ...dest,
            id: dest._id.toString()
        }));
        res.status(200).json(mappedDestinations);
    } catch (err) {
        console.error('Error fetching destinations:', err);
        res.status(500).json({ error: 'Failed to fetch destinations' });
    }
});

// GET /api/destinations/:id - Fetch a single destination
router.get('/:id', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const destinationsCollection = db.collection('destinations');
        const destId = req.params.id;
        
        if (!ObjectId.isValid(destId)) {
            return res.status(400).json({ error: 'Invalid destination ID format' });
        }
        
        const dest = await destinationsCollection.findOne({ _id: new ObjectId(destId) });
        if (!dest) {
            return res.status(404).json({ error: 'Destination not found' });
        }
        dest.id = dest._id.toString();
        res.status(200).json(dest);
    } catch (err) {
        console.error('Error fetching destination:', err);
        res.status(500).json({ error: 'Failed to fetch destination' });
    }
});

// POST /api/destinations - Create a new destination
router.post('/', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const destinationsCollection = db.collection('destinations');
        const newDest = {
            ...req.body,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const result = await destinationsCollection.insertOne(newDest);
        res.status(201).json({ success: true, id: result.insertedId, destination: newDest });
    } catch (err) {
        console.error('Error creating destination:', err);
        res.status(500).json({ error: 'Failed to create destination' });
    }
});

// PUT /api/destinations/:id - Update a destination
router.put('/:id', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const destinationsCollection = db.collection('destinations');
        const destId = req.params.id;
        
        if (!ObjectId.isValid(destId)) {
            return res.status(400).json({ error: 'Invalid destination ID format' });
        }
        
        const updateData = { ...req.body, updatedAt: new Date() };
        delete updateData._id;
        delete updateData.id;
        
        const result = await destinationsCollection.updateOne(
            { _id: new ObjectId(destId) },
            { $set: updateData }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Destination not found' });
        }
        res.status(200).json({ success: true, message: 'Destination updated successfully' });
    } catch (err) {
        console.error('Error updating destination:', err);
        res.status(500).json({ error: 'Failed to update destination' });
    }
});

// DELETE /api/destinations/:id - Delete a destination
router.delete('/:id', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const destinationsCollection = db.collection('destinations');
        const destId = req.params.id;
        
        if (!ObjectId.isValid(destId)) {
            return res.status(400).json({ error: 'Invalid destination ID format' });
        }
        
        const result = await destinationsCollection.deleteOne({ _id: new ObjectId(destId) });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Destination not found' });
        }
        res.status(200).json({ success: true, message: 'Destination deleted successfully' });
    } catch (err) {
        console.error('Error deleting destination:', err);
        res.status(500).json({ error: 'Failed to delete destination' });
    }
});

module.exports = router;
