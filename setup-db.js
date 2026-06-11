/**
 * MongoDB Database Setup Script for Heaven's Path Journey
 * 
 * This script:
 * 1. Drops the old `admin_list` collection
 * 2. Creates 8 new collections with validation schemas
 * 3. Inserts sample documents into each collection
 * 
 * Usage:
 *   1. Install dependency:  npm install mongodb
 *   2. Update the CONNECTION_URI below with your MongoDB connection string
 *   3. Run:  node setup-db.js
 */

const { MongoClient } = require("mongodb");
const dns = require("dns");

// Force Google DNS so SRV lookups work (ISP DNS doesn't support SRV records)
dns.setServers(["8.8.8.8", "8.8.4.4"]);

// MongoDB Atlas connection
const CONNECTION_URI = "mongodb+srv://heavenspath994:Heaven%40994@heavenspath.runraqn.mongodb.net/?appName=HEAVENsPATH";

const DB_NAME = "heavens_path";

async function setupDatabase() {
  const client = new MongoClient(CONNECTION_URI, {
    tls: true,
    tlsAllowInvalidCertificates: true,
    serverSelectionTimeoutMS: 30000
  });

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB successfully!\n");

    const db = client.db(DB_NAME);

    // ----------------------------------------------------------
    // Step 1: Drop the old admin_list collection
    // ----------------------------------------------------------
    try {
      await db.collection("admin_list").drop();
      console.log("🗑️  Dropped old 'admin_list' collection");
    } catch (err) {
      if (err.codeName === "NamespaceNotFound") {
        console.log("ℹ️  'admin_list' collection does not exist, skipping drop");
      } else {
        throw err;
      }
    }

    // ----------------------------------------------------------
    // Step 2: Create collections with validators
    // ----------------------------------------------------------

    // 1. users
    await createCollectionSafe(db, "users", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["name", "email", "password", "role"],
          properties: {
            name: { bsonType: "string", description: "Full name of the user" },
            email: { bsonType: "string", description: "Email address" },
            phone: { bsonType: "string", description: "Phone number" },
            password: { bsonType: "string", description: "Hashed password" },
            role: { bsonType: "string", enum: ["customer"], description: "User role" },
            createdAt: { bsonType: "date", description: "Account creation date" }
          }
        }
      }
    });

    // 2. admins
    await createCollectionSafe(db, "admins", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["name", "email", "password", "role"],
          properties: {
            name: { bsonType: "string", description: "Admin name" },
            email: { bsonType: "string", description: "Admin email" },
            password: { bsonType: "string", description: "Hashed password" },
            role: { bsonType: "string", enum: ["admin"], description: "Admin role" }
          }
        }
      }
    });

    // 3. tour_packages
    await createCollectionSafe(db, "tour_packages", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["title", "duration", "price", "location", "status"],
          properties: {
            title: { bsonType: "string", description: "Package title" },
            duration: { bsonType: "string", description: "Trip duration e.g. 5D/4N" },
            price: { bsonType: "number", description: "Price in INR" },
            location: { bsonType: "string", description: "Destination location" },
            description: { bsonType: "string", description: "Package description" },
            image: { bsonType: "string", description: "Image URL" },
            highlights: { bsonType: "array", description: "Key highlights", items: { bsonType: "string" } },
            status: { bsonType: "string", enum: ["active", "inactive"], description: "Package status" }
          }
        }
      }
    });

    // 4. bookings
    await createCollectionSafe(db, "bookings", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["userId", "packageId", "travelerName", "phone", "travelDate", "numberOfPersons", "bookingStatus"],
          properties: {
            userId: { bsonType: "objectId", description: "Reference to users collection" },
            packageId: { bsonType: "objectId", description: "Reference to tour_packages collection" },
            travelerName: { bsonType: "string", description: "Name of the traveler" },
            phone: { bsonType: "string", description: "Contact phone" },
            email: { bsonType: "string", description: "Contact email" },
            travelDate: { bsonType: "string", description: "Preferred travel date" },
            numberOfPersons: { bsonType: "int", description: "Number of travelers" },
            totalAmount: { bsonType: "number", description: "Total booking amount" },
            bookingStatus: { bsonType: "string", enum: ["pending", "confirmed", "completed", "cancelled"], description: "Booking status" },
            createdAt: { bsonType: "date", description: "Booking creation date" }
          }
        }
      }
    });

    // 5. contact_messages
    await createCollectionSafe(db, "contact_messages", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["name", "email", "message"],
          properties: {
            userId: { bsonType: "objectId", description: "Reference to user if logged in" },
            name: { bsonType: "string", description: "Sender name" },
            email: { bsonType: "string", description: "Sender email" },
            phone: { bsonType: "string", description: "Sender phone" },
            subject: { bsonType: "string", description: "Inquiry interest" },
            dates: { bsonType: "string", description: "Travel dates" },
            message: { bsonType: "string", description: "Message content" },
            status: { bsonType: "string", description: "Message status" },
            read: { bsonType: "bool", description: "If message is read" },
            createdAt: { bsonType: "date", description: "Submission date" }
          }
        }
      }
    });

    // 6. testimonials
    await createCollectionSafe(db, "testimonials", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["name", "rating", "review"],
          properties: {
            name: { bsonType: "string", description: "Reviewer name" },
            rating: { bsonType: "int", minimum: 1, maximum: 5, description: "Rating 1-5" },
            review: { bsonType: "string", description: "Review text" },
            image: { bsonType: "string", description: "Reviewer photo URL" },
            approved: { bsonType: "bool", description: "Whether approved by admin" }
          }
        }
      }
    });

    // 7. gallery
    await createCollectionSafe(db, "gallery", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["title", "imageUrl"],
          properties: {
            title: { bsonType: "string", description: "Image title" },
            imageUrl: { bsonType: "string", description: "Image URL" },
            category: { bsonType: "string", description: "Category e.g. Nature, Culture" }
          }
        }
      }
    });

    // 8. destinations
    await createCollectionSafe(db, "destinations", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["name"],
          properties: {
            name: { bsonType: "string", description: "Destination name" },
            description: { bsonType: "string", description: "Destination description" },
            image: { bsonType: "string", description: "Image URL" },
            bestSeason: { bsonType: "string", description: "Best time to visit" }
          }
        }
      }
    });

    // 9. wishlists
    await createCollectionSafe(db, "wishlists", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["userId", "packageId"],
          properties: {
            userId: { bsonType: "objectId" },
            packageId: { bsonType: "objectId" },
            createdAt: { bsonType: "date" }
          }
        }
      }
    });

    // 10. payments
    await createCollectionSafe(db, "payments", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["userId", "bookingId", "amount", "paymentStatus"],
          properties: {
            userId: { bsonType: "objectId" },
            bookingId: { bsonType: "objectId" },
            amount: { bsonType: "number" },
            paymentMethod: { bsonType: "string" },
            paymentStatus: { bsonType: "string", enum: ["pending", "successful", "failed"] },
            transactionId: { bsonType: "string" },
            createdAt: { bsonType: "date" }
          }
        }
      }
    });

    // 11. notifications
    await createCollectionSafe(db, "notifications", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["userId", "title", "message"],
          properties: {
            userId: { bsonType: "objectId" },
            title: { bsonType: "string" },
            message: { bsonType: "string" },
            type: { bsonType: "string" },
            read: { bsonType: "bool" },
            createdAt: { bsonType: "date" }
          }
        }
      }
    });

    // ----------------------------------------------------------
    // Step 3: Create indexes for better query performance
    // ----------------------------------------------------------
    console.log("\n📇 Creating indexes...");

    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    console.log("   ✅ users.email (unique)");

    await db.collection("admins").createIndex({ email: 1 }, { unique: true });
    console.log("   ✅ admins.email (unique)");

    await db.collection("tour_packages").createIndex({ status: 1 });
    await db.collection("tour_packages").createIndex({ location: 1 });
    console.log("   ✅ tour_packages.status, tour_packages.location");

    await db.collection("bookings").createIndex({ userId: 1 });
    await db.collection("bookings").createIndex({ bookingStatus: 1 });
    console.log("   ✅ bookings.userId, bookings.bookingStatus");

    await db.collection("contact_messages").createIndex({ createdAt: -1 });
    console.log("   ✅ contact_messages.createdAt (descending)");

    await db.collection("testimonials").createIndex({ approved: 1 });
    console.log("   ✅ testimonials.approved");

    await db.collection("gallery").createIndex({ category: 1 });
    console.log("   ✅ gallery.category");

    await db.collection("destinations").createIndex({ name: 1 });
    console.log("   ✅ destinations.name");

    // ----------------------------------------------------------
    // Step 4: Insert sample documents
    // ----------------------------------------------------------
    console.log("\n📝 Inserting sample documents...");

    // Clear existing data to avoid duplicate key errors
    await db.collection("users").deleteMany({});
    await db.collection("admins").deleteMany({});
    await db.collection("tour_packages").deleteMany({});
    await db.collection("bookings").deleteMany({});
    await db.collection("contact_messages").deleteMany({});
    await db.collection("testimonials").deleteMany({});
    await db.collection("gallery").deleteMany({});
    await db.collection("destinations").deleteMany({});
    await db.collection("wishlists").deleteMany({});
    await db.collection("payments").deleteMany({});
    await db.collection("notifications").deleteMany({});

    // Sample user
    await db.collection("users").insertOne({
      name: "Chirayantan Sarkar",
      email: "user@gmail.com",
      phone: "9876543210",
      password: "hashed_password_placeholder",
      role: "customer",
      status: "active",
      lastLogin: new Date(),
      createdAt: new Date()
    });
    console.log("   ✅ users: 1 sample document inserted");

    // Sample admin
    await db.collection("admins").insertOne({
      name: "Admin",
      email: "admin@heavenspath.com",
      password: "hashed_password_placeholder",
      role: "admin"
    });
    console.log("   ✅ admins: 1 sample document inserted");

    // User's requested tour packages
    await db.collection("tour_packages").insertMany([
      {
        title: "Silk Route Tour Package",
        duration: "4 Nights / 5 Days",
        price: 6900,
        location: "Silk Route, East Sikkim",
        category: "adventure",
        featured: true,
        description: "Experience the historic Silk Route. Includes fooding, lodging, car rental, and all necessary permits.",
        image: "http://localhost:3000/images/packages/silk-route-zuluk.png",
        gallery: [
          "http://localhost:3000/images/packages/silk-route-zuluk.png",
          "http://localhost:3000/images/packages/silk-route-kupup.png",
          "http://localhost:3000/images/packages/silk-route-nathang.png"
        ],
        mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d113645.10903387869!2d88.66572805!3d27.34685045!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39e6a005bc18fde3%3A0x6bfa58bcff61c0d5!2sZuluk%2C%20Sikkim%20737131!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin",
        highlights: ["Fooding and lodging with car rental And including permit", "Zuluk Loops", "Nathang Valley", "Kupup Lake", "All Meals"],
        status: "active",
        itinerary: [
          { day: 1, title: "Arrival at Sillery Gaon / Aritar", description: "Meet and greet at NJP/Bagdogra and transfer to Sillery Gaon or Aritar. Enjoy the peaceful evening and acclimatize. Overnight stay with dinner." },
          { day: 2, title: "Transfer to Zuluk", description: "After breakfast, proceed to Zuluk via Rongli (permit checkpost), Lingtam, Padamchen. Enjoy the scenic drive through the winding roads. Overnight stay at Zuluk." },
          { day: 3, title: "Silk Route Sightseeing & Nathang Valley", description: "Start early to witness the sunrise from Thambi View Point. Drive through the 95 zigzag turns of Zuluk. Visit Lungthung, Nathang Valley, Tukla Valley, Old Baba Mandir, Kupup Lake, and Elephant Lake. Return or proceed to your next destination. Overnight stay." },
          { day: 4, title: "Transfer to Reshikhola / Mankhim", description: "After breakfast, travel down towards Reshikhola or Mankhim. Enjoy the riverside or hilltop views. Relax in the lap of nature. Overnight stay." },
          { day: 5, title: "Departure", description: "After breakfast, depart for NJP/Bagdogra with beautiful memories of the Silk Route." }
        ]
      },
      {
        title: "North Sikkim Tour Package",
        duration: "4 Nights / 5 Days",
        price: 7600,
        location: "North Sikkim",
        category: "adventure",
        featured: true,
        description: "Discover the breathtaking beauty of North Sikkim. Includes fooding, lodging, and car rental.",
        image: "http://localhost:3000/images/packages/north-sikkim-gurudongmar.png",
        gallery: [
          "http://localhost:3000/images/packages/north-sikkim-gurudongmar.png",
          "http://localhost:3000/images/packages/silk-route-zuluk.png",
          "http://localhost:3000/images/packages/south-sikkim-ravangla.png"
        ],
        mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d227092.36531980304!2d88.42398605!3d27.7850882!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39e66cb79d4cc7db%3A0xc6440c9d6ba19d3c!2sLachung%2C%20Sikkim%20737120!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin",
        highlights: ["Fooding and lodging With car rental", "Lachen & Lachung", "Gurudongmar Lake", "Yumthang Valley", "Zero Point (Optional)"],
        status: "active",
        itinerary: [
          { day: 1, title: "Gangtok to Lachen", description: "Drive from Gangtok to Lachen (approx. 6 hours). En route visit Seven Sisters Waterfall and Naga Waterfall. Overnight stay at Lachen." },
          { day: 2, title: "Gurudongmar Lake & Transfer to Lachung", description: "Early morning drive to the sacred Gurudongmar Lake (17,800 ft). After returning, have lunch and transfer to Lachung. Overnight stay at Lachung." },
          { day: 3, title: "Yumthang Valley Excursion", description: "Morning drive to Yumthang Valley (Valley of Flowers). Enjoy the hot springs and scenic beauty. Optional visit to Zero Point (extra cost). Return to Lachung for overnight stay." },
          { day: 4, title: "Lachung to Gangtok", description: "After breakfast, drive back to Gangtok. En route visit Bheema and Twin Waterfalls. Evening free for leisure at MG Marg. Overnight stay at Gangtok." },
          { day: 5, title: "Departure", description: "Morning breakfast and transfer to NJP/Bagdogra for your onward journey." }
        ]
      },
      {
        title: "South & West Sikkim Tour",
        duration: "4 Nights / 5 Days",
        price: 7200,
        location: "South & West Sikkim",
        category: "family",
        featured: true,
        description: "Explore the cultural and natural heritage of South and West Sikkim. Includes fooding, lodging, and car rental.",
        image: "http://localhost:3000/images/packages/south-sikkim-ravangla.png",
        gallery: [
          "http://localhost:3000/images/packages/south-sikkim-ravangla.png",
          "http://localhost:3000/images/packages/north-sikkim-gurudongmar.png",
          "http://localhost:3000/images/packages/nepal-kathmandu.png"
        ],
        mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d57053.48316377317!2d88.29367465!3d27.28828555!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39e69c0d38ecbf15%3A0xc3f6a27e02e0df5!2sPelling%2C%20Sikkim%20737113!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin",
        highlights: ["Fooding and lodging With car rental", "Namchi Chardham", "Ravangla Buddha Park", "Pelling Skywalk", "Kanchenjunga Falls"],
        status: "active",
        itinerary: [
          { day: 1, title: "Arrival & Transfer to Namchi/Ravangla", description: "Pick up from NJP/Bagdogra and transfer to Namchi or Ravangla. Visit the beautiful Siddhesvara Dham (Chardham) in Namchi. Overnight stay." },
          { day: 2, title: "Ravangla Sightseeing & Transfer to Pelling", description: "Visit the magnificent Buddha Park in Ravangla. Enjoy the peaceful surroundings. Later, transfer to Pelling. Overnight stay in Pelling." },
          { day: 3, title: "Pelling Local Sightseeing", description: "Full day Pelling sightseeing. Visit the Chenrezig Statue & Glass Skywalk, Pemayangtse Monastery, Rabdentse Ruins, Khecheopalri Lake, and Kanchenjunga Falls." },
          { day: 4, title: "Pelling to Kalimpong/Darjeeling (Optional)", description: "Transfer to another nearby destination or enjoy a free day exploring Pelling's local markets and views of Mt. Kanchenjunga." },
          { day: 5, title: "Departure", description: "After breakfast, transfer to NJP/Bagdogra." }
        ]
      },
      {
        title: "NJP – Kathmandu – Pokhara Tour",
        duration: "7 Nights / 8 Days",
        price: 26000,
        location: "Nepal (Kathmandu & Pokhara)",
        category: "family",
        featured: true,
        description: "An unforgettable international journey from NJP to the heart of Nepal. Includes fooding, lodging, and car fees.",
        image: "http://localhost:3000/images/packages/nepal-kathmandu.png",
        gallery: [
          "http://localhost:3000/images/packages/nepal-kathmandu.png",
          "http://localhost:3000/images/packages/silk-route-kupup.png",
          "http://localhost:3000/images/packages/silk-route-nathang.png"
        ],
        mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d226176.7905183353!2d85.20188730999052!3d27.708890250004543!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb198a307baabf%3A0xb5137c1bf18db1ea!2sKathmandu%2044600%2C%20Nepal!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin",
        highlights: ["Foodie lodging and car rental", "Pashupatinath Temple", "Swayambhunath Stupa", "Pokhara Phewa Lake", "Sarangkot Sunrise", "7N/8D Complete Package"],
        status: "active",
        itinerary: [
          { day: 1, title: "NJP to Kakarvitta / Kathmandu", description: "Pick up from NJP and transfer to the Nepal border at Kakarvitta. Complete immigration and proceed towards Kathmandu. Overnight journey or stay midway." },
          { day: 2, title: "Arrival in Kathmandu", description: "Arrive in Kathmandu. Check-in to your hotel. Rest and relax after the long journey. Evening free to explore Thamel. Overnight stay." },
          { day: 3, title: "Kathmandu Sightseeing", description: "Full day sightseeing in Kathmandu. Visit the sacred Pashupatinath Temple, Boudhanath Stupa, and the historic Kathmandu Durbar Square. Overnight stay." },
          { day: 4, title: "Kathmandu to Pokhara", description: "After breakfast, scenic drive to Pokhara. En route, you can experience river rafting (optional). Arrive in Pokhara and enjoy the evening by Phewa Lake. Overnight stay." },
          { day: 5, title: "Pokhara Local Sightseeing", description: "Early morning visit to Sarangkot for a spectacular sunrise over the Annapurna range. Later visit Bindhyabasini Temple, Davis Falls, Gupteshwor Cave, and enjoy boating at Phewa Lake." },
          { day: 6, title: "Pokhara to Chitwan / Kathmandu", description: "Drive back towards Kathmandu or visit Chitwan National Park (depending on final route choice). Relax and enjoy the scenic drive." },
          { day: 7, title: "Kathmandu Free Day", description: "A free day in Kathmandu for shopping, exploring local cafes, or visiting the Swayambhunath (Monkey Temple). Overnight stay." },
          { day: 8, title: "Departure", description: "Early morning drive back to the Kakarvitta border and drop off at NJP with beautiful memories of Nepal." }
        ]
      }
    ]);
    console.log("   ✅ tour_packages: 4 sample documents inserted");

    // Sample booking
    const sampleUser = await db.collection("users").findOne({ email: "user@gmail.com" });
    const samplePackage = await db.collection("tour_packages").findOne({ title: "North Sikkim Tour Package" });

    await db.collection("bookings").insertOne({
      userId: sampleUser._id,
      packageId: samplePackage._id,
      travelerName: "Chirayantan Sarkar",
      phone: "9876543210",
      email: "user@gmail.com",
      travelDate: "2026-07-15",
      numberOfPersons: 4,
      bookingStatus: "pending",
      totalAmount: 63996, // 15999 * 4
      createdAt: new Date()
    });
    console.log("   ✅ bookings: 1 sample document inserted");

    // Sample contact message
    await db.collection("contact_messages").insertOne({
      name: "Rahul Sharma",
      email: "rahul@example.com",
      phone: "9123456789",
      message: "I want to know more about the North Sikkim tour package. Can you share details?",
      status: "pending",
      read: false,
      createdAt: new Date()
    });
    console.log("   ✅ contact_messages: 1 sample document inserted");

    // Sample testimonial
    await db.collection("testimonials").insertOne({
      name: "Rahul Sharma",
      rating: 5,
      review: "Amazing trip experience! The team at Heaven's Path made everything so smooth and memorable.",
      image: "",
      approved: true,
      status: "approved",
      userId: sampleUser._id
    });
    console.log("   ✅ testimonials: 1 sample document inserted");

    // Sample gallery images
    await db.collection("gallery").insertMany([
      { title: "Gurudongmar Lake", imageUrl: "http://localhost:3000/images/packages/north-sikkim-gurudongmar.png", category: "Nature" },
      { title: "Buddha Park of Ravangla", imageUrl: "http://localhost:3000/images/packages/south-sikkim-ravangla.png", category: "Culture" },
      { title: "Kathmandu Durbar Square", imageUrl: "http://localhost:3000/images/packages/nepal-kathmandu.png", category: "Culture" },
      { title: "Zuluk Silk Route", imageUrl: "http://localhost:3000/images/packages/silk-route-zuluk.png", category: "Adventure" },
      { title: "Kupup Lake", imageUrl: "http://localhost:3000/images/packages/silk-route-kupup.png", category: "Nature" },
      { title: "Nathang Valley", imageUrl: "http://localhost:3000/images/packages/silk-route-nathang.png", category: "Adventure" }
    ]);
    console.log("   ✅ gallery: 6 sample documents inserted");

    // Sample destinations
    await db.collection("destinations").insertMany([
      {
        name: "Gangtok",
        description: "The capital of Sikkim, known for its stunning views of Kanchenjunga, monasteries, and vibrant markets.",
        image: "",
        bestSeason: "March-June"
      },
      {
        name: "Darjeeling",
        description: "The Queen of the Hills, famous for tea gardens, the toy train, and panoramic Himalayan views.",
        image: "",
        bestSeason: "April-June"
      }
    ]);
    console.log("   ✅ destinations: 2 sample documents inserted");

    // Sample wishlist
    await db.collection("wishlists").insertOne({
      userId: sampleUser._id,
      packageId: samplePackage._id,
      createdAt: new Date()
    });
    console.log("   ✅ wishlists: 1 sample document inserted");

    // Sample payment
    const sampleBooking = await db.collection("bookings").findOne({ userId: sampleUser._id });
    await db.collection("payments").insertOne({
      userId: sampleUser._id,
      bookingId: sampleBooking._id,
      amount: 63996,
      paymentMethod: "credit_card",
      paymentStatus: "successful",
      transactionId: "TXN123456789",
      createdAt: new Date()
    });
    console.log("   ✅ payments: 1 sample document inserted");

    // Sample notification
    await db.collection("notifications").insertOne({
      userId: sampleUser._id,
      title: "Booking Confirmed",
      message: "Your booking for North Sikkim Tour has been confirmed.",
      type: "booking",
      read: false,
      createdAt: new Date()
    });
    console.log("   ✅ notifications: 1 sample document inserted");

    // ----------------------------------------------------------
    // Summary
    // ----------------------------------------------------------
    console.log("\n" + "=".repeat(50));
    console.log("🎉 Database setup complete!");
    console.log("=".repeat(50));

    const collections = await db.listCollections().toArray();
    console.log(`\n📂 Collections in '${DB_NAME}':`);
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`   📁 ${col.name} (${count} documents)`);
    }

  } catch (err) {
    console.error("❌ Error:", err.message);
    throw err;
  } finally {
    await client.close();
    console.log("\n🔌 Connection closed.");
  }
}

/**
 * Helper: Create a collection only if it doesn't already exist.
 */
async function createCollectionSafe(db, name, options) {
  try {
    await db.createCollection(name, options);
    console.log(`✅ Created collection: '${name}'`);
  } catch (err) {
    if (err.codeName === "NamespaceExists") {
      console.log(`ℹ️  Collection '${name}' already exists, skipping creation`);
    } else {
      throw err;
    }
  }
}

// Run the setup
setupDatabase();
