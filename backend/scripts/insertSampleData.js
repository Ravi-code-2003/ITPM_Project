/**
 * Sample Data Insertion Script
 * Populates MongoDB with test data for the chatbot
 * Run with: node scripts/insertSampleData.js
 */

require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

// Models
const FoodItem = require('../src/models/FoodItem');
const ComboMeal = require('../src/models/ComboMeal');
const Restaurant = require('../src/models/Restaurant');
const RoomModel = require('../src/models/RoomModel');
const RoomOffer = require('../src/models/RoomOffer');
const EducationProgram = require('../src/models/EducationProgram');
const User = require('../src/models/User');

const MONGO_URI = process.env.MONGO_URI;

async function insertSampleData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected');

    // ============ FIRST: CLEAR EXISTING DATA (optional) ============
    console.log('\n🗑️  Clearing existing sample data...');
    await Promise.all([
      FoodItem.deleteMany({}),
      ComboMeal.deleteMany({}),
      Restaurant.deleteMany({}),
      RoomModel.deleteMany({}),
      RoomOffer.deleteMany({}),
      EducationProgram.deleteMany({}),
      User.deleteMany({ role: { $in: ['shop-owner', 'house-owner'] } })
    ]);
    console.log('✅ Cleared existing data');

    // ============ CREATE SHOP OWNER USERS ============
    console.log('\n👥 Creating sample shop owner users...');
    
    const shopOwners = await User.insertMany([
      {
        fullName: 'Ahmed Hassan',
        email: `ahmedcafe${Date.now() + 1}@example.com`,
        password: 'hashed_password_123',
        role: 'shop-owner',
        shopName: 'ABC Campus Cafe',
        location: 'Campus 1, Building A',
        status: 'approved',
        isApproved: true
      },
      {
        fullName: 'Maria Silva',
        email: `mariafood${Date.now() + 2}@example.com`,
        password: 'hashed_password_123',
        role: 'shop-owner',
        shopName: 'XYZ Food Court',
        location: 'Campus 2, Main Gate',
        status: 'approved',
        isApproved: true
      },
      {
        fullName: 'James Wilson',
        email: `jamesmeals${Date.now() + 3}@example.com`,
        password: 'hashed_password_123',
        role: 'shop-owner',
        shopName: 'Happy Meals Canteen',
        location: 'Student Center, Ground Floor',
        status: 'approved',
        isApproved: true
      }
    ], { validateBeforeSave: false });

    console.log(`✅ Created ${shopOwners.length} shop owners`);

    // ============ CREATE RESTAURANTS ============
    console.log('\n🍽️  Creating sample restaurants...');
    
    const restaurants = await Restaurant.insertMany([
      {
        shopOwnerId: shopOwners[0]._id,
        shopName: 'ABC Campus Cafe',
        location: 'Campus 1, Building A'
      },
      {
        shopOwnerId: shopOwners[1]._id,
        shopName: 'XYZ Food Court',
        location: 'Campus 2, Main Gate'
      },
      {
        shopOwnerId: shopOwners[2]._id,
        shopName: 'Happy Meals Canteen',
        location: 'Student Center, Ground Floor'
      }
    ]);

    console.log(`✅ Created ${restaurants.length} restaurants`);

    // ============ CREATE FOOD ITEMS ============
    console.log('\n🍜 Creating sample food items...');

    const foodItems = await FoodItem.insertMany([
      // Breakfast items
      {
        restaurantId: restaurants[0]._id,
        name: 'Kottu Roti with Curry',
        price: 150,
        category: 'breakfast',
        status: 'Available'
      },
      {
        restaurantId: restaurants[0]._id,
        name: 'Lamprais',
        price: 200,
        category: 'breakfast',
        status: 'Available'
      },
      {
        restaurantId: restaurants[1]._id,
        name: 'Dhal Curry with Rice',
        price: 120,
        category: 'breakfast',
        status: 'Available'
      },

      // Lunch items
      {
        restaurantId: restaurants[0]._id,
        name: 'Chicken Biryani',
        price: 250,
        category: 'lunch',
        status: 'Available'
      },
      {
        restaurantId: restaurants[0]._id,
        name: 'Kottu Parotta',
        price: 180,
        category: 'lunch',
        status: 'Available'
      },
      {
        restaurantId: restaurants[1]._id,
        name: 'Fish Curry with Rice',
        price: 280,
        category: 'lunch',
        status: 'Available'
      },
      {
        restaurantId: restaurants[2]._id,
        name: 'Fried Rice with Meat',
        price: 220,
        category: 'lunch',
        status: 'Available'
      },

      // Dinner items
      {
        restaurantId: restaurants[0]._id,
        name: 'Chicken Fried Rice',
        price: 200,
        category: 'dinner',
        status: 'Available'
      },
      {
        restaurantId: restaurants[1]._id,
        name: 'Veggie Stir Fry',
        price: 160,
        category: 'dinner',
        status: 'Available'
      },
      {
        restaurantId: restaurants[2]._id,
        name: 'Pasta Carbonara',
        price: 320,
        category: 'dinner',
        status: 'Available'
      },

      // Snacks
      {
        restaurantId: restaurants[0]._id,
        name: 'Samosa (2pcs)',
        price: 60,
        category: 'snack',
        status: 'Available'
      },
      {
        restaurantId: restaurants[1]._id,
        name: 'Spring Rolls (3pcs)',
        price: 80,
        category: 'snack',
        status: 'Available'
      },

      // Drinks
      {
        restaurantId: restaurants[0]._id,
        name: 'Fresh Orange Juice',
        price: 80,
        category: 'drink',
        status: 'Available'
      },
      {
        restaurantId: restaurants[2]._id,
        name: 'Iced Coffee',
        price: 100,
        category: 'drink',
        status: 'Available'
      }
    ]);

    console.log(`✅ Created ${foodItems.length} food items`);

    // ============ CREATE COMBO MEALS ============
    console.log('\n📦 Creating sample combo meals...');

    const comboMeals = await ComboMeal.insertMany([
      {
        restaurantId: restaurants[0]._id,
        name: 'Student Special Combo',
        description: 'Rice + Curry + Drink',
        totalPrice: 180,
        status: 'Available'
      },
      {
        restaurantId: restaurants[1]._id,
        name: 'Budget Lunch Pack',
        description: 'Kottu + Juice',
        totalPrice: 150,
        status: 'Available'
      },
      {
        restaurantId: restaurants[2]._id,
        name: 'Premium Dinner Combo',
        description: 'Main course + Side + Dessert + Drink',
        totalPrice: 450,
        status: 'Available'
      }
    ]);

    console.log(`✅ Created ${comboMeals.length} combo meals`);

    // ============ CREATE HOUSE OWNER USERS ============
    console.log('\n👥 Creating sample house owner users...');
    
    const houseOwners = await User.insertMany([
      {
        fullName: 'Raj Kumar',
        email: `rajhouse1${Date.now() + 4}@example.com`,
        password: 'hashed_password_123',
        role: 'house-owner',
        address: 'Colombo 7, Sri Lanka',
        status: 'approved',
        isApproved: true
      },
      {
        fullName: 'Sarah Williams',
        email: `sarahrooms${Date.now() + 5}@example.com`,
        password: 'hashed_password_123',
        role: 'house-owner',
        address: 'Colombo 6, Sri Lanka',
        status: 'approved',
        isApproved: true
      }
    ], { validateBeforeSave: false });

    console.log(`✅ Created ${houseOwners.length} house owners`);

    // ============ CREATE ROOMS ============
    console.log('\n🏠 Creating sample rooms...');

    const rooms = await RoomModel.insertMany([
      {
        owner: houseOwners[0]._id,
        title: 'Cozy Single Room Near Campus',
        description: 'Well-maintained single room with great ventilation',
        monthlyRent: 5000,
        location: {
          area: 'Colombo 7',
          address: 'Near Campus Gate 1, Colombo 7',
          coordinates: {
            type: 'Point',
            coordinates: [6.9027, 80.6315]
          }
        },
        facilities: {
          wifi: true,
          water: true,
          electricity: true,
          attachedBathroom: true,
          furnished: true
        },
        availability: 'AVAILABLE',
        roomType: 'single'
      },
      {
        owner: houseOwners[1]._id,
        title: 'Spacious Double Room with Balcony',
        description: 'Large double room with private balcony and good natural light',
        monthlyRent: 7000,
        location: {
          area: 'Colombo 6',
          address: 'Campus Road, Colombo 6',
          coordinates: {
            type: 'Point',
            coordinates: [6.9125, 80.6425]
          }
        },
        facilities: {
          wifi: true,
          water: true,
          electricity: true,
          attachedBathroom: true,
          kitchen: true,
          furnished: true
        },
        availability: 'AVAILABLE',
        roomType: 'double'
      }
    ], { validateBeforeSave: false });

    console.log(`✅ Created ${rooms.length} rooms`);

    // ============ CREATE EDUCATION PROGRAMS ============
    console.log('\n📚 Creating sample education programs...');

    const programs = await EducationProgram.insertMany([
      {
        title: 'Advanced Python Programming',
        category: 'Programming',
        provider: 'Tech Academy Sri Lanka',
        description: 'Learn Python from basics to advanced level with real-world projects',
        duration: '8 weeks',
        level: 'Intermediate',
        price: '15,000',
        tags: ['Python', 'Programming', 'Web Development'],
        rating: 4.5,
        students: 120
      },
      {
        title: 'Web Development with MERN Stack',
        category: 'Web Development',
        provider: 'Digital Institute Colombo',
        description: 'MongoDB, Express, React, Node.js comprehensive training for beginners',
        duration: '12 weeks',
        level: 'Beginner',
        price: '25,000',
        tags: ['MERN', 'React', 'Node.js', 'MongoDB'],
        rating: 4.7,
        students: 85
      },
      {
        title: 'Data Science Fundamentals',
        category: 'Data Science',
        provider: 'Analytics Center',
        description: 'Introduction to data science, machine learning, and analytics',
        duration: '10 weeks',
        level: 'Intermediate',
        price: '20,000',
        tags: ['Data Science', 'Machine Learning', 'Python'],
        rating: 4.6,
        students: 65
      },
      {
        title: 'Digital Marketing Basics',
        category: 'Marketing',
        provider: 'Marketing Pro Institute',
        description: 'SEO, Social Media, Content Marketing, and Email Marketing',
        duration: '6 weeks',
        level: 'Beginner',
        price: '12,000',
        tags: ['Marketing', 'SEO', 'Social Media'],
        rating: 4.4,
        students: 150
      }
    ], { validateBeforeSave: false });

    console.log(`✅ Created ${programs.length} education programs`);

    console.log('\n✅ Sample data inserted successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Shop Owners: ${shopOwners.length}`);
    console.log(`   Restaurants: ${restaurants.length}`);
    console.log(`   Food Items: ${foodItems.length}`);
    console.log(`   Combo Meals: ${comboMeals.length}`);
    console.log(`   House Owners: ${houseOwners.length}`);
    console.log(`   Rooms: ${rooms.length}`);
    console.log(`   Education Programs: ${programs.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error inserting sample data:', error.message);
    process.exit(1);
  }
}

insertSampleData();
