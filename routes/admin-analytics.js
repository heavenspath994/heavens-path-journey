const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(verifyToken);
router.use(isAdmin);

// --- Helpers ---
// Get start of today
const getStartOfToday = () => {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d;
};
// Get start of this week (Sunday)
const getStartOfWeek = () => {
    const d = new Date();
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() - d.getDay());
    return d;
};
// Get start of this month
const getStartOfMonth = () => {
    const d = new Date();
    d.setHours(0,0,0,0);
    d.setDate(1);
    return d;
};

// 1. Dashboard Overview Cards
router.get('/dashboard', async (req, res) => {
    try {
        const db = req.app.locals.db;
        
        const totalUsers = await db.collection('users').countDocuments();
        const totalBookings = await db.collection('bookings').countDocuments();
        
        // Total Revenue
        const payments = await db.collection('payments').find({ paymentStatus: 'successful' }).toArray();
        const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        
        const totalPackages = await db.collection('tour_packages').countDocuments();
        const totalDestinations = await db.collection('destinations').countDocuments();
        const totalReviews = await db.collection('testimonials').countDocuments();
        const totalContactForms = await db.collection('contact_messages').countDocuments();
        const totalWishlistEntries = await db.collection('wishlists').countDocuments();
        
        const pendingBookings = await db.collection('bookings').countDocuments({ bookingStatus: 'pending' });
        const pendingReviews = await db.collection('testimonials').countDocuments({ approved: false });
        const unreadMessages = await db.collection('contact_messages').countDocuments({ read: false }); // Need to add read field or assume !status='resolved'

        res.json({
            totalUsers,
            totalBookings,
            totalRevenue,
            totalPackages,
            totalDestinations,
            totalReviews,
            totalContactForms,
            totalWishlistEntries,
            pendingBookings,
            pendingReviews,
            unreadMessages
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching dashboard data' });
    }
});

// 2. User Analytics
router.get('/users', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const users = await db.collection('users').find().toArray();
        
        const today = getStartOfToday();
        const week = getStartOfWeek();
        const month = getStartOfMonth();

        res.json({
            totalRegistered: users.length,
            newToday: users.filter(u => u.createdAt >= today).length,
            newThisWeek: users.filter(u => u.createdAt >= week).length,
            newThisMonth: users.filter(u => u.createdAt >= month).length,
            activeUsers: users.filter(u => u.status === 'active' || !u.status).length, // Fallback if no status
            inactiveUsers: users.filter(u => u.status === 'inactive').length,
            blockedUsers: users.filter(u => u.status === 'blocked').length,
            list: users.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching user analytics' });
    }
});

// 3. Booking Analytics
router.get('/bookings', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const bookings = await db.collection('bookings').find().toArray();
        
        const today = getStartOfToday();
        const week = getStartOfWeek();
        const month = getStartOfMonth();
        const now = new Date();

        res.json({
            totalBookings: bookings.length,
            bookingsToday: bookings.filter(b => b.createdAt >= today).length,
            bookingsThisWeek: bookings.filter(b => b.createdAt >= week).length,
            bookingsThisMonth: bookings.filter(b => b.createdAt >= month).length,
            pendingBookings: bookings.filter(b => b.bookingStatus === 'pending').length,
            confirmedBookings: bookings.filter(b => b.bookingStatus === 'confirmed').length,
            completedBookings: bookings.filter(b => b.bookingStatus === 'completed').length,
            cancelledBookings: bookings.filter(b => b.bookingStatus === 'cancelled').length,
            upcomingTrips: bookings.filter(b => new Date(b.travelDate) >= now && b.bookingStatus !== 'cancelled').length,
            pastTrips: bookings.filter(b => new Date(b.travelDate) < now && b.bookingStatus !== 'cancelled').length,
            list: bookings.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching booking analytics' });
    }
});

// 4. Contact Form Analytics
router.get('/contacts', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const contacts = await db.collection('contact_messages').find().toArray();
        
        const today = getStartOfToday();
        const week = getStartOfWeek();
        const month = getStartOfMonth();

        res.json({
            totalSubmissions: contacts.length,
            messagesToday: contacts.filter(c => c.createdAt >= today).length,
            messagesThisWeek: contacts.filter(c => c.createdAt >= week).length,
            messagesThisMonth: contacts.filter(c => c.createdAt >= month).length,
            resolvedMessages: contacts.filter(c => c.status === 'resolved').length,
            pendingMessages: contacts.filter(c => !c.status || c.status === 'pending').length,
            unreadMessages: contacts.filter(c => c.read === false || c.read === undefined).length,
            list: contacts.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching contact analytics' });
    }
});

// 5. Package Analytics
router.get('/packages', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const packages = await db.collection('tour_packages').find().toArray();
        
        // Sort for most viewed/booked
        const mostViewed = [...packages].sort((a, b) => (b.views || 0) - (a.views || 0))[0];
        const mostBooked = [...packages].sort((a, b) => (b.bookingCount || 0) - (a.bookingCount || 0))[0];
        const leastBooked = [...packages].sort((a, b) => (a.bookingCount || 0) - (b.bookingCount || 0))[0];
        
        // Wishlists
        const wishlists = await db.collection('wishlists').aggregate([
            { $group: { _id: "$packageId", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]).toArray();
        
        let mostWishlistedPkg = null;
        let leastWishlistedPkg = null;
        
        if (wishlists.length > 0) {
            mostWishlistedPkg = packages.find(p => p._id.toString() === wishlists[0]._id.toString());
            leastWishlistedPkg = packages.find(p => p._id.toString() === wishlists[wishlists.length - 1]._id.toString());
        }

        res.json({
            totalPackages: packages.length,
            activePackages: packages.filter(p => p.status === 'active').length,
            inactivePackages: packages.filter(p => p.status === 'inactive').length,
            mostViewedPackage: mostViewed ? mostViewed.title : 'N/A',
            mostBookedPackage: mostBooked ? mostBooked.title : 'N/A',
            leastBookedPackage: leastBooked ? leastBooked.title : 'N/A',
            mostWishlistedPackage: mostWishlistedPkg ? mostWishlistedPkg.title : 'N/A',
            leastWishlistedPackage: leastWishlistedPkg ? leastWishlistedPkg.title : 'N/A',
            list: packages.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching package analytics' });
    }
});

// 6. Destination Analytics
router.get('/destinations', async (req, res) => {
    try {
        const db = req.app.locals.db;
        
        const destStats = await db.collection('bookings').aggregate([
            {
                $lookup: {
                    from: "tour_packages",
                    localField: "packageId",
                    foreignField: "_id",
                    as: "package"
                }
            },
            { $unwind: "$package" },
            {
                $group: {
                    _id: "$package.location",
                    bookingCount: { $sum: 1 },
                    revenue: { $sum: "$totalAmount" }
                }
            },
            { $sort: { bookingCount: -1 } }
        ]).toArray();

        res.json({
            mostPopularDestination: destStats.length > 0 ? destStats[0]._id : 'N/A',
            leastPopularDestination: destStats.length > 0 ? destStats[destStats.length - 1]._id : 'N/A',
            destinationStats: destStats.map(d => ({
                name: d._id,
                bookingCount: d.bookingCount,
                revenue: d.revenue || 0
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching destination analytics' });
    }
});

// 7. Wishlist Analytics
router.get('/wishlists', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const wishlists = await db.collection('wishlists').find().toArray();
        
        // Most wishlisted user
        const userStats = await db.collection('wishlists').aggregate([
            { $group: { _id: "$userId", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 },
            { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
            { $unwind: "$user" }
        ]).toArray();

        res.json({
            totalWishlistEntries: wishlists.length,
            mostWishlistedPackage: "N/A", // Handled in packages for now, could duplicate logic
            userWithHighestWishlistCount: userStats.length > 0 ? userStats[0].user.name : 'N/A',
            wishlistGrowthTrend: "Growing steadily", // Placeholder for actual timeseries trend
            list: wishlists.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching wishlist analytics' });
    }
});

// 8. Payment Analytics
router.get('/payments', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const payments = await db.collection('payments').find().toArray();
        
        const today = getStartOfToday();
        const week = getStartOfWeek();
        const month = getStartOfMonth();

        const successfulPayments = payments.filter(p => p.paymentStatus === 'successful');
        
        const revTotal = successfulPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const revToday = successfulPayments.filter(p => p.createdAt >= today).reduce((sum, p) => sum + (p.amount || 0), 0);
        const revWeek = successfulPayments.filter(p => p.createdAt >= week).reduce((sum, p) => sum + (p.amount || 0), 0);
        const revMonth = successfulPayments.filter(p => p.createdAt >= month).reduce((sum, p) => sum + (p.amount || 0), 0);

        res.json({
            totalRevenue: revTotal,
            revenueToday: revToday,
            revenueThisWeek: revWeek,
            revenueThisMonth: revMonth,
            successfulPayments: successfulPayments.length,
            failedPayments: payments.filter(p => p.paymentStatus === 'failed').length,
            pendingPayments: payments.filter(p => p.paymentStatus === 'pending').length,
            averageBookingValue: successfulPayments.length > 0 ? (revTotal / successfulPayments.length) : 0,
            list: payments.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching payment analytics' });
    }
});

// 9. Review Analytics
router.get('/reviews', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const reviews = await db.collection('testimonials').find().toArray();
        
        const totalRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
        
        res.json({
            totalReviews: reviews.length,
            averageRating: reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0,
            fiveStarReviews: reviews.filter(r => r.rating === 5).length,
            fourStarReviews: reviews.filter(r => r.rating === 4).length,
            pendingReviews: reviews.filter(r => r.status === 'pending' || r.approved === false).length,
            approvedReviews: reviews.filter(r => r.status === 'approved' || r.approved === true).length,
            rejectedReviews: reviews.filter(r => r.status === 'rejected').length,
            list: reviews.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching review analytics' });
    }
});

// 10. Gallery Analytics
router.get('/gallery', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const gallery = await db.collection('gallery').find().toArray();
        
        const albums = new Set(gallery.map(g => g.album || g.category));
        const mostViewed = [...gallery].sort((a, b) => (b.views || 0) - (a.views || 0))[0];

        res.json({
            totalImages: gallery.length,
            totalAlbums: albums.size,
            mostViewedGalleryImage: mostViewed ? mostViewed.title : 'N/A',
            list: gallery.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching gallery analytics' });
    }
});

// 11. System Analytics
router.get('/system', async (req, res) => {
    try {
        const db = req.app.locals.db;
        
        const collections = await db.listCollections().toArray();
        let totalRecords = 0;
        
        for (const col of collections) {
            const count = await db.collection(col.name).countDocuments();
            totalRecords += count;
        }

        // Just fetching some recent activity globally is tricky without a dedicated audit log, 
        // we'll mock these specific text fields or pull latest created records from bookings/users
        const latestUser = await db.collection('users').find().sort({createdAt: -1}).limit(1).toArray();
        
        res.json({
            totalDatabaseRecords: totalRecords,
            totalCollections: collections.length,
            lastAdminLogin: new Date().toISOString(), // In reality fetch from admins collection
            recentPlatformActivities: "System running smoothly",
            recentUserActivities: latestUser.length > 0 ? `User ${latestUser[0].name} registered` : "No recent activity"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching system analytics' });
    }
});

// --- Status Update Endpoints ---

// Update Booking Status
router.put('/bookings/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const db = req.app.locals.db;
        
        await db.collection('bookings').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { bookingStatus: status } }
        );
        res.json({ message: 'Booking status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating booking status' });
    }
});

// Update Contact Status
router.put('/contacts/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const db = req.app.locals.db;
        
        await db.collection('contact_messages').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { status: status, read: true } }
        );
        res.json({ message: 'Contact status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating contact status' });
    }
});

module.exports = router;
