const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');

// GET /api/packages - Fetch all packages
router.get('/', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const packagesCollection = db.collection('tour_packages');
        
        const packages = await packagesCollection.find({}).toArray();
        
        // Map _id to id so frontend doesn't break immediately on rendering id property
        // though it's better to update frontend to use _id
        const mappedPackages = packages.map(pkg => ({
            ...pkg,
            id: pkg._id.toString()
        }));
        
        res.status(200).json(mappedPackages);
    } catch (err) {
        console.error('Error fetching packages:', err);
        res.status(500).json({ error: 'Failed to fetch packages' });
    }
});

// GET /api/packages/:id - Fetch a single package by id
router.get('/:id', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const packagesCollection = db.collection('tour_packages');
        const packageId = req.params.id;
        
        let query;
        if (ObjectId.isValid(packageId)) {
            query = { _id: new ObjectId(packageId) };
        } else if (!isNaN(packageId)) {
            // For backwards compatibility during transition
            query = { oldId: parseInt(packageId, 10) };
        } else {
            return res.status(400).json({ error: 'Invalid package ID format' });
        }
        
        const pkg = await packagesCollection.findOne(query);
        
        if (!pkg) {
            return res.status(404).json({ error: 'Package not found' });
        }
        
        pkg.id = pkg._id.toString();
        
        res.status(200).json(pkg);
    } catch (err) {
        console.error('Error fetching package:', err);
        res.status(500).json({ error: 'Failed to fetch package' });
    }
});

// POST /api/packages - Create a new package
router.post('/', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const packagesCollection = db.collection('tour_packages');
        
        const newPackage = {
            ...req.body,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const result = await packagesCollection.insertOne(newPackage);
        res.status(201).json({ success: true, id: result.insertedId, package: newPackage });
    } catch (err) {
        console.error('Error creating package:', err);
        res.status(500).json({ error: 'Failed to create package' });
    }
});

// PUT /api/packages/:id - Update an existing package
router.put('/:id', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const packagesCollection = db.collection('tour_packages');
        const packageId = req.params.id;
        
        if (!ObjectId.isValid(packageId)) {
            return res.status(400).json({ error: 'Invalid package ID format' });
        }
        
        const updateData = { ...req.body, updatedAt: new Date() };
        delete updateData._id; // Prevent updating the immutable _id field
        delete updateData.id;
        
        const result = await packagesCollection.updateOne(
            { _id: new ObjectId(packageId) },
            { $set: updateData }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Package not found' });
        }
        
        res.status(200).json({ success: true, message: 'Package updated successfully' });
    } catch (err) {
        console.error('Error updating package:', err);
        res.status(500).json({ error: 'Failed to update package' });
    }
});

// DELETE /api/packages/:id - Delete a package
router.delete('/:id', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const packagesCollection = db.collection('tour_packages');
        const packageId = req.params.id;
        
        if (!ObjectId.isValid(packageId)) {
            return res.status(400).json({ error: 'Invalid package ID format' });
        }
        
        const result = await packagesCollection.deleteOne({ _id: new ObjectId(packageId) });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Package not found' });
        }
        
        res.status(200).json({ success: true, message: 'Package deleted successfully' });
    } catch (err) {
        console.error('Error deleting package:', err);
        res.status(500).json({ error: 'Failed to delete package' });
    }
});

module.exports = router;
