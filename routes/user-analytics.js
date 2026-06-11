const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { verifyToken, isUser } = require('../middleware/auth');

// Apply auth middleware to all routes
// Apply verifyToken to all routes
router.use(verifyToken);

// --- Wishlist API (Toggle & Fetch Items) - accessible by both Users and Admins ---
router.post('/wishlist/toggle', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const userId = new ObjectId(req.userId);
        const { packageId } = req.body;
        
        if (!packageId) return res.status(400).json({ message: 'Package ID required' });

        let objPackageId;
        if (ObjectId.isValid(packageId)) {
            objPackageId = new ObjectId(packageId);
        } else {
            // For backwards compatibility with any remaining numbers, though shouldn't happen now
            objPackageId = new ObjectId(String(packageId).padStart(24, '0'));
        }

        const existing = await db.collection('wishlists').findOne({ userId, packageId: objPackageId });

        if (existing) {
            await db.collection('wishlists').deleteOne({ _id: existing._id });
            return res.json({ action: 'removed', packageId });
        } else {
            await db.collection('wishlists').insertOne({
                userId,
                packageId: objPackageId,
                createdAt: new Date()
            });
            return res.json({ action: 'added', packageId });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error toggling wishlist' });
    }
});

router.get('/wishlist/items', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const userId = new ObjectId(req.userId);
        
        const wishlists = await db.collection('wishlists').find({ userId }).toArray();
        const packageIds = wishlists.map(w => w.packageId.toString());
        
        res.json(packageIds);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching wishlist items' });
    }
});

// Apply isUser middleware to the rest of the analytics routes
router.use(isUser);

// 1. Dashboard Overview Cards
router.get('/dashboard', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const userId = new ObjectId(req.userId);
        
        const myBookings = await db.collection('bookings').countDocuments({ userId });
        const upcomingTrips = await db.collection('bookings').countDocuments({ 
            userId, 
            bookingStatus: { $ne: 'cancelled' },
            travelDate: { $gte: new Date().toISOString() } // Simple string compare for now
        });
        const wishlistCount = await db.collection('wishlists').countDocuments({ userId });
        
        const payments = await db.collection('payments').find({ userId, paymentStatus: 'successful' }).toArray();
        const totalAmountSpent = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        
        const reviewsSubmitted = await db.collection('testimonials').countDocuments({ userId });
        const notificationsCount = await db.collection('notifications').countDocuments({ userId, read: false });
        
        // Since contact form doesn't explicitly link to user ID right now, we check by email.
        const user = await db.collection('users').findOne({ _id: userId });
        const contactRequestsSubmitted = await db.collection('contact_messages').countDocuments({ email: user.email });
        
        const lastBooking = await db.collection('bookings').find({ userId }).sort({ createdAt: -1 }).limit(1).toArray();
        const lastBookingStatus = lastBooking.length > 0 ? lastBooking[0].bookingStatus : 'N/A';

        res.json({
            myBookings,
            upcomingTrips,
            wishlistCount,
            totalAmountSpent,
            reviewsSubmitted,
            notificationsCount,
            contactRequestsSubmitted,
            lastBookingStatus
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching user dashboard data' });
    }
});

// 2. My Account Overview
router.get('/account', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const user = await db.collection('users').findOne({ _id: new ObjectId(req.userId) });
        
        // Profile completion simple calc
        let filledFields = 0;
        const requiredFields = ['name', 'email', 'phone', 'address', 'profileImage'];
        requiredFields.forEach(field => {
            if (user[field]) filledFields++;
        });
        const profileCompletion = Math.round((filledFields / requiredFields.length) * 100);

        res.json({
            accountCreationDate: user.createdAt,
            lastLogin: user.lastLogin,
            profileCompletionPercentage: profileCompletion
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching account overview' });
    }
});

// 3. Create a Booking
router.post('/bookings', async (req, res) => {
    try {
        const { packageId, travelerName, phone, email, travelDate, numberOfPersons } = req.body;
        const db = req.app.locals.db;
        const userId = new ObjectId(req.userId);

        if (!packageId || !travelerName || !phone || !email || !travelDate || !numberOfPersons) {
            return res.status(400).json({ message: 'All booking fields are required.' });
        }

        const newBooking = {
            userId,
            packageId: new ObjectId(packageId),
            travelerName,
            phone,
            email,
            travelDate,
            numberOfPersons: parseInt(numberOfPersons),
            bookingStatus: 'pending',
            totalAmount: 0, // This could be calculated based on package price, setting 0 for now as requested
            createdAt: new Date()
        };

        // Try to fetch package price to set totalAmount
        const pkg = await db.collection('tour_packages').findOne({ _id: new ObjectId(packageId) });
        if (pkg && pkg.price) {
            newBooking.totalAmount = (typeof pkg.price === 'number' ? pkg.price : parseInt(pkg.price.replace(/\D/g, ''))) * newBooking.numberOfPersons;
        }

        await db.collection('bookings').insertOne(newBooking);
        res.status(201).json({ message: 'Booking request submitted successfully! We will contact you soon.' });
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// 3. My Bookings Summary
router.get('/bookings', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const userId = new ObjectId(req.userId);
        
        const bookings = await db.collection('bookings').find({ userId }).toArray();
        const now = new Date().toISOString();

        const upcomingTrips = bookings.filter(b => b.travelDate >= now && b.bookingStatus !== 'cancelled').length;
        const completedTrips = bookings.filter(b => b.bookingStatus === 'completed' || (b.travelDate < now && b.bookingStatus !== 'cancelled')).length;

        // Fetch actual bookings list for display if needed
        const bookingDetails = await db.collection('bookings').aggregate([
            { $match: { userId } },
            { $lookup: { from: "tour_packages", localField: "packageId", foreignField: "_id", as: "package" } },
            { $unwind: { path: "$package", preserveNullAndEmptyArrays: true } },
            { $sort: { createdAt: -1 } }
        ]).toArray();

        res.json({
            totalBookings: bookings.length,
            upcomingTrips,
            completedTrips,
            cancelledTrips: bookings.filter(b => b.bookingStatus === 'cancelled').length,
            pendingTrips: bookings.filter(b => b.bookingStatus === 'pending').length,
            lastBookingDate: bookings.length > 0 ? [...bookings].sort((a,b) => b.createdAt - a.createdAt)[0].createdAt : null,
            list: bookingDetails
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching my bookings' });
    }
});

// 4. My Wishlist Summary
router.get('/wishlist', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const userId = new ObjectId(req.userId);
        
        const wishlistItems = await db.collection('wishlists').aggregate([
            { $match: { userId } },
            { $lookup: { from: "tour_packages", localField: "packageId", foreignField: "_id", as: "package" } },
            { $unwind: "$package" },
            { $sort: { createdAt: -1 } }
        ]).toArray();

        res.json({
            totalWishlistPackages: wishlistItems.length,
            recentlyAddedPackages: wishlistItems.slice(0, 3).map(w => w.package.title),
            mostViewedSavedPackage: wishlistItems.length > 0 ? wishlistItems.sort((a,b) => (b.package.views||0) - (a.package.views||0))[0].package.title : 'N/A',
            list: wishlistItems
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching my wishlist' });
    }
});

// 5. My Payments Summary
router.get('/payments', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const userId = new ObjectId(req.userId);
        
        const payments = await db.collection('payments').find({ userId }).sort({ createdAt: -1 }).toArray();
        const successful = payments.filter(p => p.paymentStatus === 'successful');
        const totalSpent = successful.reduce((sum, p) => sum + (p.amount || 0), 0);
        
        res.json({
            totalAmountSpent: totalSpent,
            lastPaymentAmount: payments.length > 0 ? payments[0].amount : 0,
            paymentHistoryCount: payments.length,
            list: payments
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching my payments' });
    }
});

// 6. My Reviews Summary
router.get('/reviews', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const userId = new ObjectId(req.userId);
        
        const reviews = await db.collection('testimonials').find({ userId }).toArray();
        const avg = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
        
        res.json({
            totalReviewsSubmitted: reviews.length,
            averageRatingGiven: avg.toFixed(1),
            list: reviews
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching my reviews' });
    }
});

// 7. My Contact Requests
router.get('/contacts', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const user = await db.collection('users').findOne({ _id: new ObjectId(req.userId) });
        
        const contacts = await db.collection('contact_messages').find({ email: user.email }).sort({ createdAt: -1 }).toArray();
        
        res.json({
            totalInquiriesSubmitted: contacts.length,
            pendingResponses: contacts.filter(c => !c.status || c.status === 'pending').length,
            resolvedResponses: contacts.filter(c => c.status === 'resolved').length,
            list: contacts
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching my contacts' });
    }
});

// 8. My Notifications
router.get('/notifications', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const userId = new ObjectId(req.userId);
        
        const notifications = await db.collection('notifications').find({ userId }).sort({ createdAt: -1 }).toArray();
        
        res.json({
            totalNotifications: notifications.length,
            unreadNotifications: notifications.filter(n => !n.read).length,
            latestUpdates: notifications.slice(0, 5),
            list: notifications
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching my notifications' });
    }
});

module.exports = router;
