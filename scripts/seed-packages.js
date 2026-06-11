const { MongoClient } = require('mongodb');
const dns = require('dns');
require('dotenv').config();

// Force Google DNS so SRV lookups work
dns.setServers(['8.8.8.8', '8.8.4.4']);

const packagesData = [
  {
    oldId: 1, // Store the old ID to map wishlists if necessary, but we'll use object id now
    title: "Silk Route Tour",
    category: "adventure",
    duration: "5 Days / 4 Nights",
    price: "₹6,900",
    description: "Fooding and lodging with car rental and including permit.",
    image: "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&q=80&w=800",
    featured: true,
    includes: ["Accommodation (4 nights)", "All meals (breakfast, lunch, dinner)", "Car rental with driver", "Permits included", "Sightseeing as per itinerary"],
    gallery: [
      "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=800"
    ],
    itinerary: [
      {
        day: 1,
        title: "NJP/Bagdogra to Silk Route (Rorathang/Aritar)",
        description: "Pick up from NJP Station or Bagdogra Airport. Drive through scenic hills to Rorathang or Aritar. Check-in to hotel, freshen up. Evening free for leisure walk around the area. Overnight stay at Rorathang/Aritar.",
        image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&q=80&w=600"
      },
      {
        day: 2,
        title: "Rorathang/Aritar – Zuluk – Thambi View Point",
        description: "After breakfast, drive to Zuluk. Visit the famous Thambi View Point for breathtaking views of the zigzag roads. Explore historic Silk Route trails. Overnight stay at Zuluk.",
        image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=600"
      },
      {
        day: 3,
        title: "Zuluk – Nathang Valley – Kupup Lake – Baba Mandir",
        description: "Early morning drive to Nathang Valley (the 'Ladakh of East'). Visit Kupup Lake (Elephant Lake) and Old Baba Mandir. Enjoy the stunning high-altitude landscapes. Return to Zuluk for overnight stay.",
        image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=600"
      },
      {
        day: 4,
        title: "Zuluk – Aritar Lake – Mankhim Temple",
        description: "After breakfast, descend to Aritar. Visit the beautiful Aritar Lake (Lampokhari) for boating. Explore Mankhim Temple with panoramic views. Overnight stay at Aritar.",
        image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=600"
      },
      {
        day: 5,
        title: "Aritar – NJP/Bagdogra Drop",
        description: "After breakfast, check out. Drive back to NJP Station or Bagdogra Airport. Tour ends with beautiful memories.",
        image: "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&q=80&w=600"
      }
    ]
  },
  {
    oldId: 2,
    title: "North Sikkim Tour",
    category: "family",
    duration: "5 Days / 4 Nights",
    price: "₹7,600",
    description: "Fooding and lodging with car rental.",
    image: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&q=80&w=800",
    featured: true,
    includes: ["Accommodation (4 nights)", "All meals (breakfast, lunch, dinner)", "Car rental with driver", "Sightseeing as per itinerary"],
    gallery: [
      "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1542224566-6e85f2e6772f?auto=format&fit=crop&q=80&w=800"
    ],
    itinerary: [
      {
        day: 1,
        title: "NJP/Bagdogra to Gangtok",
        description: "Pick up from NJP Station or Bagdogra Airport. Drive to Gangtok (approx 4-5 hours). Check-in to hotel. Evening free for MG Marg walk. Overnight stay at Gangtok.",
        image: "https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?auto=format&fit=crop&q=80&w=600"
      },
      {
        day: 2,
        title: "Gangtok to Lachen",
        description: "After breakfast, drive to Lachen (approx 5-6 hours). En route visit Naga Waterfalls, Singhik Viewpoint, and Chungthang. Check-in at Lachen. Overnight stay at Lachen.",
        image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=600"
      },
      {
        day: 3,
        title: "Lachen – Gurudongmar Lake – Lachung",
        description: "Early morning drive to Gurudongmar Lake (17,800 ft), one of the highest lakes in the world. Return to Lachen for lunch. Proceed to Lachung. Overnight stay at Lachung.",
        image: "https://images.unsplash.com/photo-1542224566-6e85f2e6772f?auto=format&fit=crop&q=80&w=600"
      },
      {
        day: 4,
        title: "Lachung – Yumthang Valley – Gangtok",
        description: "After breakfast, visit Yumthang Valley (Valley of Flowers). Optional visit to Zero Point (extra cost). Return drive to Gangtok. Overnight stay at Gangtok.",
        image: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&q=80&w=600"
      },
      {
        day: 5,
        title: "Gangtok – NJP/Bagdogra Drop",
        description: "After breakfast, check out from hotel. Visit Banjhakri Falls and Tashi Viewpoint if time permits. Drive to NJP/Bagdogra for departure. Tour ends with wonderful memories.",
        image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&q=80&w=600"
      }
    ]
  },
  {
    oldId: 3,
    title: "South & West Sikkim",
    category: "family",
    duration: "5 Days / 4 Nights",
    price: "₹7,200",
    description: "Fooding and lodging with car rental.",
    image: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&q=80&w=800",
    featured: true,
    includes: ["Accommodation (4 nights)", "All meals (breakfast, lunch, dinner)", "Car rental with driver", "Sightseeing as per itinerary"],
    gallery: [
      "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1512100356356-de1b84283e18?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1494500764479-0c8f2919a3d8?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=800"
    ],
    itinerary: [
      {
        day: 1,
        title: "NJP/Bagdogra to Namchi",
        description: "Pick up from NJP Station or Bagdogra Airport. Drive to Namchi, South Sikkim (approx 3-4 hours). Check-in to hotel. Evening visit Samdruptse Hill with the giant Guru Padmasambhava statue. Overnight stay at Namchi.",
        image: "https://images.unsplash.com/photo-1512100356356-de1b84283e18?auto=format&fit=crop&q=80&w=600"
      },
      {
        day: 2,
        title: "Namchi Sightseeing – Ravangla",
        description: "After breakfast, visit Char Dham (replica of Hindu Char Dham temples), Tendong Hill for panoramic views. Drive to Ravangla. Visit Buddha Park (Tathagata Tsal) with the 130-ft Buddha statue. Overnight stay at Ravangla.",
        image: "https://images.unsplash.com/photo-1494500764479-0c8f2919a3d8?auto=format&fit=crop&q=80&w=600"
      },
      {
        day: 3,
        title: "Ravangla – Pelling",
        description: "After breakfast, drive to Pelling via Temi Tea Garden. Enjoy the beautiful tea estate views. Check-in at Pelling. Evening visit Pelling Skywalk and Sangachoeling Monastery. Overnight stay at Pelling.",
        image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=600"
      },
      {
        day: 4,
        title: "Pelling Sightseeing",
        description: "Full day sightseeing: Kecheopalri Lake (Wish-fulfilling Lake), Khangchendzonga Falls, Rimbi Waterfalls, Pemayangtse Monastery, Rabdentse Ruins. Enjoy stunning views of Kanchenjunga range. Overnight stay at Pelling.",
        image: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&q=80&w=600"
      },
      {
        day: 5,
        title: "Pelling – NJP/Bagdogra Drop",
        description: "After breakfast, check out. Drive back to NJP Station or Bagdogra Airport (approx 5 hours). Tour ends with beautiful memories of South & West Sikkim.",
        image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=600"
      }
    ]
  },
  {
    oldId: 4,
    title: "NJP – Kathmandu – Pokhara Tour",
    category: "adventure",
    duration: "8 Days / 7 Nights",
    price: "₹26,000",
    description: "Foodie 🍛, lodging 🏨 and car 🚘 fees included.",
    image: "https://images.unsplash.com/photo-1531366936310-6cb1c830bc36?auto=format&fit=crop&q=80&w=800",
    featured: false,
    includes: ["Accommodation (7 nights)", "All meals (breakfast, lunch, dinner)", "Car rental with driver", "Border crossing assistance", "Sightseeing as per itinerary"],
    gallery: [
      "https://images.unsplash.com/photo-1531366936310-6cb1c830bc36?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1558799401-1dcba79834c2?auto=format&fit=crop&q=80&w=800"
    ],
    itinerary: [
      {
        day: 1,
        title: "NJP/Bagdogra to Kakarbhitta (India-Nepal Border)",
        description: "Pick up from NJP Station or Bagdogra Airport. Drive to Kakarbhitta (India-Nepal border crossing). Complete border formalities. Check-in at border town hotel. Overnight stay at Kakarbhitta.",
        image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=600"
      },
      {
        day: 2,
        title: "Kakarbhitta to Kathmandu",
        description: "Early morning drive/flight to Kathmandu. Check-in at hotel in Thamel area. Evening explore the vibrant streets of Thamel. Overnight stay at Kathmandu.",
        image: "https://images.unsplash.com/photo-1531366936310-6cb1c830bc36?auto=format&fit=crop&q=80&w=600"
      },
      {
        day: 3,
        title: "Kathmandu Sightseeing",
        description: "Full day Kathmandu Valley tour: Pashupatinath Temple, Boudhanath Stupa, Swayambhunath (Monkey Temple), Kathmandu Durbar Square. Experience rich Nepalese culture and heritage. Overnight stay at Kathmandu.",
        image: "https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&q=80&w=600"
      },
      {
        day: 4,
        title: "Kathmandu – Bhaktapur – Nagarkot",
        description: "Morning visit Bhaktapur Durbar Square (UNESCO World Heritage Site). Explore ancient pottery square and woodcarving artisans. Drive to Nagarkot for sunset views of the Himalayas. Overnight stay at Nagarkot.",
        image: "https://images.unsplash.com/photo-1558799401-1dcba79834c2?auto=format&fit=crop&q=80&w=600"
      },
      {
        day: 5,
        title: "Nagarkot – Pokhara",
        description: "Early morning sunrise view of Himalayan range (Mt. Everest on clear days). Drive to Pokhara (approx 6 hours) via scenic Prithvi Highway along Trishuli River. Check-in at lakeside hotel. Overnight stay at Pokhara.",
        image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=600"
      },
      {
        day: 6,
        title: "Pokhara Sightseeing",
        description: "Full day Pokhara exploration: Phewa Lake boating, World Peace Pagoda, Davis Falls, Gupteshwor Cave, International Mountain Museum. Evening lakeside walk. Overnight stay at Pokhara.",
        image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&q=80&w=600"
      },
      {
        day: 7,
        title: "Pokhara – Lumbini / Leisure Day",
        description: "Option to visit Sarangkot for paragliding (extra cost) or day trip to Lumbini (birthplace of Buddha). Free time for shopping and exploring local markets. Overnight stay at Pokhara.",
        image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=600"
      },
      {
        day: 8,
        title: "Pokhara – Kakarbhitta – NJP/Bagdogra Drop",
        description: "After breakfast, drive/flight back to Kakarbhitta. Cross border to India. Drive to NJP/Bagdogra for departure. Tour ends with unforgettable memories of Nepal.",
        image: "https://images.unsplash.com/photo-1531366936310-6cb1c830bc36?auto=format&fit=crop&q=80&w=600"
      }
    ]
  }
];

async function seedPackages() {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri, {
      tls: true,
      tlsAllowInvalidCertificates: true,
      serverSelectionTimeoutMS: 30000
    });

    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db('heavens_path');
        const packagesCollection = db.collection('tour_packages');

        // Check if packages already exist to avoid duplicates
        const count = await packagesCollection.countDocuments();
        if (count > 0) {
            console.log(`Found ${count} packages already. Clearing collection before seed...`);
            await packagesCollection.deleteMany({});
        }
        
        const transformedData = packagesData.map(pkg => ({
          ...pkg,
          price: parseInt(pkg.price.replace(/[^0-9]/g, ''), 10),
          location: pkg.title.includes('Nepal') ? 'Nepal' : 'Sikkim',
          status: 'active'
        }));
        
        const result = await packagesCollection.insertMany(transformedData);
        console.log(`Successfully inserted ${result.insertedCount} packages`);
        
    } catch (err) {
        console.error('Error seeding packages:', err);
    } finally {
        await client.close();
        console.log('Disconnected from MongoDB');
    }
}

seedPackages();
