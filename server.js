require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const dns = require('dns');

// Force Google DNS so SRV lookups work (ISP DNS doesn't support SRV records)
dns.setServers(['8.8.8.8', '8.8.4.4']);

const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static images
app.use('/images', express.static(path.join(__dirname, 'images')));

// MongoDB connection
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  tls: true,
  tlsAllowInvalidCertificates: true,
  serverSelectionTimeoutMS: 30000
});

let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db('heavens_path');
    console.log('✅ Connected to MongoDB successfully!');
    
    // Make db available to routes
    app.locals.db = db;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

connectDB();

// Routes
const authRoutes = require('./routes/auth');
const adminAnalyticsRoutes = require('./routes/admin-analytics');
const userAnalyticsRoutes = require('./routes/user-analytics');
const packagesRoutes = require('./routes/packages');
const destinationsRoutes = require('./routes/destinations');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminAnalyticsRoutes);
app.use('/api/user', userAnalyticsRoutes);
app.use('/api/packages', packagesRoutes);
app.use('/api/destinations', destinationsRoutes);

app.get('/', (req, res) => {
  res.send("Heaven's Path Journey API is running...");
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
