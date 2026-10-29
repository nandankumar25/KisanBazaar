const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import Models
const User = require('../models/User');
const Mandi = require('../models/Mandi');
const MandiPrice = require('../models/MandiPrice');
const MandiDemand = require('../models/MandiDemand');
const MandiBooking = require('../models/MandiBooking');
const CropLot = require('../models/CropLot');
const Transporter = require('../models/Transporter');
const Transport = require('../models/Transport');
const Offer = require('../models/Offer');
const Transaction = require('../models/Transaction');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/kisanbazaar';
    console.log(`Connecting to MongoDB for seeding: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('Clearing existing KisanBazaar collections...');
    await User.deleteMany({});
    await Mandi.deleteMany({});
    await MandiPrice.deleteMany({});
    await MandiDemand.deleteMany({});
    await MandiBooking.deleteMany({});
    await CropLot.deleteMany({});
    await Transporter.deleteMany({});
    await Transport.deleteMany({});
    await Offer.deleteMany({});
    await Transaction.deleteMany({});

    console.log('Seeding Users (3 Farmers, 4 Buyers, 1 Mandi Admin, 1 Admin)...');
    const users = await User.create([
      {
        name: 'Gurpreet Singh',
        email: 'gurpreet.farmer@kisanbazaar.com',
        password: 'FarmerPassword123',
        phone: '+91 98765 43210',
        role: 'FARMER',
        isEmailVerified: true,
        location: {
          state: 'Punjab',
          district: 'Kapurthala',
          city: 'Phagwara',
          village: 'Hadiabad',
        },
      },
      {
        name: 'Harpreet Kaur',
        email: 'harpreet.farmer@kisanbazaar.com',
        password: 'FarmerPassword123',
        phone: '+91 98765 43211',
        role: 'FARMER',
        isEmailVerified: true,
        location: {
          state: 'Punjab',
          district: 'Jalandhar',
          city: 'Jalandhar',
          village: 'Nakodar Road',
        },
      },
      {
        name: 'Jasbir Singh',
        email: 'jasbir.farmer@kisanbazaar.com',
        password: 'FarmerPassword123',
        phone: '+91 98765 43212',
        role: 'FARMER',
        isEmailVerified: true,
        location: {
          state: 'Punjab',
          district: 'Ludhiana',
          city: 'Ludhiana',
          village: 'Samrala',
        },
      },
      {
        name: 'Sanjeev Kumar',
        email: 'contact@punjabgrainstraders.com',
        password: 'BuyerPassword123',
        phone: '+91 98123 45678',
        role: 'BUYER',
        isEmailVerified: true,
        location: {
          state: 'Punjab',
          district: 'Ludhiana',
          city: 'Ludhiana',
          village: 'Ferozepur Road',
        },
        buyerProfile: {
          businessName: 'Punjab Grains Traders',
          businessType: 'Grain trader',
          interestedCrops: ['Wheat', 'Maize'],
          minQuantity: 50,
          maxQuantity: 500,
          preferredQualityGrades: ['Grade A (Sharbati)', 'Grade A', 'Grade B (Yellow)'],
          preferredLocations: ['Ludhiana', 'Jalandhar', 'Kapurthala'],
          verified: true,
          description: 'Leading grain trading firm in Punjab looking for bulk wheat and maize purchases.',
        }
      },
      {
        name: 'Amit Singh',
        email: 'procurement@goldenricemills.com',
        password: 'BuyerPassword123',
        phone: '+91 98123 45679',
        role: 'BUYER',
        isEmailVerified: true,
        location: {
          state: 'Punjab',
          district: 'Amritsar',
          city: 'Amritsar',
          village: 'GT Road',
        },
        buyerProfile: {
          businessName: 'Golden Rice Mills',
          businessType: 'Rice mill',
          interestedCrops: ['Rice', 'Basmati Rice'],
          minQuantity: 100,
          maxQuantity: 1000,
          preferredQualityGrades: ['Basmati 1121', 'Premium', 'Grade A'],
          preferredLocations: ['Amritsar', 'Tarn Taran', 'Gurdaspur', 'Jalandhar'],
          verified: true,
          description: 'Premium basmati rice mill processing exports for middle-eastern markets.',
        }
      },
      {
        name: 'Rajesh Gupta',
        email: 'purchasing@freshfoodsprocessing.in',
        password: 'BuyerPassword123',
        phone: '+91 98123 45680',
        role: 'BUYER',
        isEmailVerified: true,
        location: {
          state: 'Haryana',
          district: 'Ambala',
          city: 'Ambala',
          village: 'Industrial Area',
        },
        buyerProfile: {
          businessName: 'Fresh Foods Processing Co.',
          businessType: 'Food processing company',
          interestedCrops: ['Mustard', 'Wheat', 'Maize'],
          minQuantity: 20,
          maxQuantity: 200,
          preferredQualityGrades: ['High Oil Content Grade A', 'Premium Large', 'Grade A'],
          preferredLocations: ['Ambala', 'Patiala', 'Ludhiana'],
          verified: false,
          description: 'Food processing unit manufacturing flour and cooking oils.',
        }
      },
      {
        name: 'Vikram Sharma',
        email: 'sales@doabaveg.com',
        password: 'BuyerPassword123',
        phone: '+91 98123 45681',
        role: 'BUYER',
        isEmailVerified: true,
        location: {
          state: 'Punjab',
          district: 'Jalandhar',
          city: 'Jalandhar',
          village: 'Model Town',
        },
        buyerProfile: {
          businessName: 'Doaba Veg Wholesalers',
          businessType: 'Vegetable wholesaler',
          interestedCrops: ['Potato', 'Onion', 'Tomato'],
          minQuantity: 10,
          maxQuantity: 150,
          preferredQualityGrades: ['Premium Large', 'Grade A', 'Standard'],
          preferredLocations: ['Jalandhar', 'Kapurthala', 'Hoshiarpur'],
          verified: true,
          description: 'Major vegetable wholesaler supplying to local retail markets in Doaba region.',
        }
      },
      {
        name: 'Ludhiana Mandi Admin',
        email: 'mandi.admin@kisanbazaar.com',
        password: 'MandiPassword123',
        phone: '+91 98721 00001',
        role: 'MANDI_ADMIN',
        isEmailVerified: true,
        location: {
          state: 'Punjab',
          district: 'Ludhiana',
          city: 'Ludhiana',
          village: 'Gill Road',
        },
        mandiProfile: {
          mandiName: 'Ludhiana New Grain Market',
          mandiType: 'Government',
          licenseNumber: 'PB-APMC-LDH-2024-001',
          contactPhone: '+91 161 2400112',
          operatingHours: '07:00 AM - 07:00 PM',
          verificationStatus: 'VERIFIED',
          commoditiesHandled: ['Wheat', 'Rice', 'Maize', 'Mustard', 'Cotton'],
        }
      },
      {
        name: 'Punjab Kisan Transport Fleet',
        email: 'transporter@kisanbazaar.com',
        password: 'TransporterPassword123',
        phone: '+91 98720 11223',
        role: 'TRANSPORTER',
        isEmailVerified: true,
        location: {
          state: 'Punjab',
          district: 'Kapurthala',
          city: 'Phagwara',
          village: 'GT Road',
        },
        transporterProfile: {
          vehicleType: '10-Ton Truck',
          vehicleNumber: 'PB-09-AB-1234',
          capacity: 100,
          pricePerKm: 45,
          rating: 4.8,
          isAvailable: true,
        },
      },
      {
        name: 'KisanBazaar Admin',
        email: 'admin@kisanbazaar.com',
        password: 'AdminSecret123',
        phone: '+91 99000 00000',
        role: 'ADMIN',
        isEmailVerified: true,
        location: {
          state: 'Punjab',
          district: 'Chandigarh',
          city: 'Chandigarh',
          village: 'Sector 17',
        },
      },
    ]);

    const farmer1 = users[0];
    const farmer2 = users[1];
    const farmer3 = users[2];
    const buyer1 = users[3];
    const buyer2 = users[4];
    const buyer3 = users[5];
    const buyer4 = users[6];
    const mandiAdminUser = users[7];

    console.log('Seeding Mandis (5 Punjab Mandis)...');
    const mandis = await Mandi.create([
      {
        name: 'Phagwara Grain Mandi',
        state: 'Punjab',
        district: 'Kapurthala',
        city: 'Phagwara',
        address: 'GT Road, Near Railway Station, Phagwara',
        cropsSupported: ['Wheat', 'Rice', 'Maize', 'Potato', 'Mustard'],
        mandiType: 'Government',
        operatingHours: '08:00 AM - 06:00 PM',
        contactPhone: '+91 1828 223450',
        verificationStatus: 'VERIFIED',
        isActive: true,
      },
      {
        name: 'Jalandhar Main Mandi',
        state: 'Punjab',
        district: 'Jalandhar',
        city: 'Jalandhar',
        address: 'Maqsudan Market Yard, Jalandhar',
        cropsSupported: ['Wheat', 'Rice', 'Potato', 'Vegetables'],
        mandiType: 'Government',
        operatingHours: '06:00 AM - 08:00 PM',
        contactPhone: '+91 181 2671234',
        verificationStatus: 'VERIFIED',
        isActive: true,
      },
      {
        name: 'Ludhiana New Grain Market',
        state: 'Punjab',
        district: 'Ludhiana',
        city: 'Ludhiana',
        address: 'Gill Road, Ludhiana',
        cropsSupported: ['Wheat', 'Rice', 'Maize', 'Mustard'],
        mandiType: 'Government',
        operatingHours: '07:00 AM - 07:00 PM',
        contactPhone: '+91 161 2400112',
        verificationStatus: 'VERIFIED',
        mandiAdmin: mandiAdminUser._id,
        isActive: true,
      },
      {
        name: 'Amritsar Central Mandi',
        state: 'Punjab',
        district: 'Amritsar',
        city: 'Amritsar',
        address: 'Bhagtanwala Grain Market, Amritsar',
        cropsSupported: ['Rice', 'Wheat', 'Basmati Rice', 'Potato'],
        mandiType: 'Government',
        operatingHours: '08:00 AM - 06:00 PM',
        contactPhone: '+91 183 2554321',
        verificationStatus: 'VERIFIED',
        isActive: true,
      },
      {
        name: 'Kapurthala Agri Market Yard',
        state: 'Punjab',
        district: 'Kapurthala',
        city: 'Kapurthala',
        address: 'Sultanpur Road, Kapurthala',
        cropsSupported: ['Wheat', 'Rice', 'Maize', 'Mustard'],
        mandiType: 'Government',
        operatingHours: '08:30 AM - 05:30 PM',
        contactPhone: '+91 1822 234120',
        verificationStatus: 'VERIFIED',
        isActive: true,
      },
    ]);

    // Link Mandi to user's mandiProfile
    await User.findByIdAndUpdate(mandiAdminUser._id, {
      'mandiProfile.mandi': mandis[2]._id,
    });

    console.log('Seeding Mandi Prices (Sample Live Yard Rates)...');
    const today = new Date();
    const mandiPrices = await MandiPrice.create([
      {
        mandi: mandis[0]._id, // Phagwara
        crop: 'Wheat',
        qualityGrade: 'Grade A',
        minPrice: 2275,
        maxPrice: 2350,
        modalPrice: 2315,
        unit: 'quintal',
        priceSource: 'MANDI_ENTRY',
        isOfficiallyVerified: true,
        date: today,
      },
      {
        mandi: mandis[0]._id,
        crop: 'Rice',
        qualityGrade: 'Grade A',
        minPrice: 2183,
        maxPrice: 2250,
        modalPrice: 2200,
        unit: 'quintal',
        priceSource: 'MANDI_ENTRY',
        isOfficiallyVerified: true,
        date: today,
      },
      {
        mandi: mandis[1]._id, // Jalandhar
        crop: 'Wheat',
        qualityGrade: 'Grade A',
        minPrice: 2280,
        maxPrice: 2360,
        modalPrice: 2320,
        unit: 'quintal',
        priceSource: 'MANDI_ENTRY',
        isOfficiallyVerified: true,
        date: today,
      },
      {
        mandi: mandis[1]._id,
        crop: 'Potato',
        qualityGrade: 'Grade A',
        minPrice: 1100,
        maxPrice: 1350,
        modalPrice: 1250,
        unit: 'quintal',
        priceSource: 'MANDI_ENTRY',
        isOfficiallyVerified: true,
        date: today,
      },
      {
        mandi: mandis[2]._id, // Ludhiana
        crop: 'Wheat',
        qualityGrade: 'Grade A',
        minPrice: 2450,
        maxPrice: 2600,
        modalPrice: 2550,
        unit: 'quintal',
        priceSource: 'MANDI_ENTRY',
        reportedBy: mandiAdminUser._id,
        isOfficiallyVerified: true,
        date: today,
      },
      {
        mandi: mandis[2]._id,
        crop: 'Mustard',
        qualityGrade: 'Grade A',
        minPrice: 5350,
        maxPrice: 5600,
        modalPrice: 5450,
        unit: 'quintal',
        priceSource: 'MANDI_ENTRY',
        reportedBy: mandiAdminUser._id,
        isOfficiallyVerified: true,
        date: today,
      },
      {
        mandi: mandis[3]._id, // Amritsar
        crop: 'Rice',
        qualityGrade: 'Premium Basmati',
        minPrice: 3800,
        maxPrice: 4200,
        modalPrice: 4050,
        unit: 'quintal',
        priceSource: 'MANDI_ENTRY',
        isOfficiallyVerified: true,
        date: today,
      },
    ]);

    console.log('Seeding Mandi Demands...');
    const mandiDemands = await MandiDemand.create([
      {
        mandi: mandis[2]._id, // Ludhiana
        mandiAdmin: mandiAdminUser._id,
        crop: 'Wheat',
        requiredQuantity: 1500,
        purchasedQuantity: 250,
        qualityRequirements: 'Moisture below 12%, clean whole kernels without pest damage',
        minPrice: 2400,
        maxPrice: 2600,
        startDate: today,
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
      },
      {
        mandi: mandis[2]._id,
        mandiAdmin: mandiAdminUser._id,
        crop: 'Mustard',
        requiredQuantity: 500,
        purchasedQuantity: 50,
        qualityRequirements: 'Black mustard seeds with minimum 40% oil content',
        minPrice: 5300,
        maxPrice: 5600,
        startDate: today,
        endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
      },
    ]);

    console.log('Seeding Farmer Crop Lots...');
    const cropLots = await CropLot.create([
      {
        farmer: farmer1._id,
        crop: 'Wheat',
        quantity: 120,
        unit: 'quintal',
        qualityGrade: 'Grade A (Sharbati)',
        location: {
          state: 'Punjab',
          district: 'Kapurthala',
          city: 'Phagwara',
          village: 'Hadiabad',
        },
        expectedPrice: 2350,
        availableFrom: today,
        status: 'AVAILABLE',
        description: 'Freshly harvested dry Sharbati wheat lot stored in clean moisture-proof bags.',
      },
      {
        farmer: farmer1._id,
        crop: 'Potato',
        quantity: 150,
        unit: 'quintal',
        qualityGrade: 'Premium Large',
        location: {
          state: 'Punjab',
          district: 'Kapurthala',
          city: 'Phagwara',
          village: 'Hadiabad',
        },
        expectedPrice: 1300,
        availableFrom: today,
        status: 'AVAILABLE',
        description: 'High-grade table potatoes, uniform size and undamaged skin.',
      },
      {
        farmer: farmer2._id,
        crop: 'Rice',
        quantity: 90,
        unit: 'quintal',
        qualityGrade: 'Basmati 1121',
        location: {
          state: 'Punjab',
          district: 'Jalandhar',
          city: 'Jalandhar',
          village: 'Nakodar Road',
        },
        expectedPrice: 4100,
        availableFrom: today,
        status: 'AVAILABLE',
        description: 'Long grain aromatic 1121 Basmati paddy lot.',
      },
      {
        farmer: farmer3._id,
        crop: 'Maize',
        quantity: 80,
        unit: 'quintal',
        qualityGrade: 'Grade B (Yellow)',
        location: {
          state: 'Punjab',
          district: 'Ludhiana',
          city: 'Ludhiana',
          village: 'Samrala',
        },
        expectedPrice: 2100,
        availableFrom: today,
        status: 'RESERVED',
        description: 'Sun-dried yellow maize suitable for feed and processing mills.',
      },
      {
        farmer: farmer3._id,
        crop: 'Mustard',
        quantity: 50,
        unit: 'quintal',
        qualityGrade: 'High Oil Content Grade A',
        location: {
          state: 'Punjab',
          district: 'Ludhiana',
          city: 'Ludhiana',
          village: 'Samrala',
        },
        expectedPrice: 5500,
        availableFrom: today,
        status: 'SOLD',
        description: 'Cleaned black mustard seeds with minimum 42% oil content.',
      },
    ]);

    console.log('Seeding Transporters...');
    const transporters = await Transporter.create([
      {
        name: 'Punjab Kisan Transport Services',
        phone: '+91 98720 11223',
        vehicleType: '10-Ton Truck',
        vehicleNumber: 'PB-09-AB-1234',
        capacity: 100,
        pricePerKm: 45,
        rating: 4.8,
        location: {
          state: 'Punjab',
          district: 'Kapurthala',
          city: 'Phagwara',
        },
        isAvailable: true,
      },
      {
        name: 'Doaba Freight Carriers',
        phone: '+91 98720 44556',
        vehicleType: 'Eicher 14ft Canter',
        vehicleNumber: 'PB-08-CD-5678',
        capacity: 50,
        pricePerKm: 30,
        rating: 4.6,
        location: {
          state: 'Punjab',
          district: 'Jalandhar',
          city: 'Jalandhar',
        },
        isAvailable: true,
      },
      {
        name: 'Malwa Agro Logistics',
        phone: '+91 98720 77889',
        vehicleType: 'Mahindra Bolero Pickup',
        vehicleNumber: 'PB-10-EF-9012',
        capacity: 25,
        pricePerKm: 22,
        rating: 4.9,
        location: {
          state: 'Punjab',
          district: 'Ludhiana',
          city: 'Ludhiana',
        },
        isAvailable: true,
      },
      {
        name: 'Majha Express Produce Transport',
        phone: '+91 98720 33445',
        vehicleType: 'Multi-Axle 16-Wheeler',
        vehicleNumber: 'PB-02-GH-3456',
        capacity: 200,
        pricePerKm: 65,
        rating: 4.7,
        location: {
          state: 'Punjab',
          district: 'Amritsar',
          city: 'Amritsar',
        },
        isAvailable: false,
      },
    ]);

    console.log('Seeding Offers...');
    const offers = await Offer.create([
      {
        cropLot: cropLots[0]._id, // Wheat lot
        buyer: buyer1._id,
        offeredPrice: 2320,
        quantity: 120,
        message: 'Interested in taking full 120 quintals with immediate dispatch.',
        status: 'PENDING',
      },
      {
        cropLot: cropLots[0]._id, // Wheat lot
        buyer: buyer3._id,
        offeredPrice: 2340,
        quantity: 60,
        message: 'We can purchase partial lot of 60 quintals.',
        status: 'PENDING',
      },
      {
        cropLot: cropLots[2]._id, // Rice lot
        buyer: buyer2._id,
        offeredPrice: 4050,
        quantity: 90,
        message: 'Direct procurement for export processing.',
        status: 'ACCEPTED',
      },
      {
        cropLot: cropLots[3]._id, // Maize lot
        buyer: buyer1._id,
        offeredPrice: 2050,
        quantity: 80,
        message: 'Counter offer based on current Ludhiana mandi modal rate.',
        status: 'COUNTERED',
      },
    ]);

    console.log('Seeding Transactions...');
    const transactions = await Transaction.create([
      {
        cropLot: cropLots[4]._id, // Mustard lot (SOLD)
        farmer: farmer3._id,
        buyer: buyer1._id,
        quantity: 50,
        pricePerQuintal: 5500,
        totalAmount: 275000,
        transportCost: 3500,
        netAmount: 271500,
        paymentStatus: 'PAID',
        transactionStatus: 'COMPLETED',
        transactionDate: today,
      },
      {
        cropLot: cropLots[2]._id, // Rice lot
        farmer: farmer2._id,
        buyer: buyer2._id,
        quantity: 90,
        pricePerQuintal: 4050,
        totalAmount: 364500,
        transportCost: 4500,
        netAmount: 360000,
        paymentStatus: 'PENDING',
        transactionStatus: 'CONFIRMED',
        transactionDate: today,
      },
    ]);

    console.log('Seeding Transport Booking Records...');
    const transports = await Transport.create([
      {
        farmer: farmer3._id,
        transporter: transporters[2]._id, // Malwa Agro Logistics
        cropLot: cropLots[4]._id,
        pickupLocation: 'Samrala, Ludhiana, Punjab',
        destination: 'Ludhiana New Grain Market Yard 3',
        distanceKm: 35,
        totalCost: 3500,
        costPerQuintal: 70,
        status: 'COMPLETED',
        bookingDate: today,
      },
      {
        farmer: farmer2._id,
        transporter: transporters[1]._id, // Doaba Freight
        cropLot: cropLots[2]._id,
        pickupLocation: 'Nakodar Road, Jalandhar, Punjab',
        destination: 'Bhagtanwala Grain Market, Amritsar',
        distanceKm: 85,
        totalCost: 4500,
        costPerQuintal: 50,
        status: 'BOOKED',
        bookingDate: today,
      },
    ]);

    console.log('Seeding Mandi Bookings...');
    const mandiBookings = await MandiBooking.create([
      {
        bookingNumber: 'MB-LDH-2024-001',
        mandi: mandis[2]._id, // Ludhiana New Grain Market
        mandiAdmin: mandiAdminUser._id,
        farmer: farmer1._id,
        cropLot: cropLots[0]._id,
        crop: 'Wheat',
        quantity: 100,
        qualityGrade: 'Grade A',
        expectedPrice: 2500,
        proposedPrice: 2550,
        acceptedPricePerQuintal: 2550,
        preferredArrivalDate: today,
        tokenNumber: 'TKN-LDH-1001',
        scheduledArrivalDate: today,
        actualArrivalDate: today,
        status: 'COMPLETED',
        actualReceivedQuantity: 98,
        finalQualityGrade: 'Grade A',
        grossAmount: 249900,
        totalDeductions: 0,
        finalPayableAmount: 249900,
        paymentStatus: 'PAID',
        paymentDate: today,
        paymentReference: 'UTR-LDH-APMC-998822',
        paymentMode: 'Bank Transfer',
        paymentNotes: 'Direct APMC RTGS transfer cleared',
      },
      {
        bookingNumber: 'MB-LDH-2024-002',
        mandi: mandis[2]._id, // Ludhiana New Grain Market
        mandiAdmin: mandiAdminUser._id,
        farmer: farmer3._id,
        crop: 'Mustard',
        quantity: 50,
        qualityGrade: 'Grade A',
        expectedPrice: 5400,
        proposedPrice: 5450,
        preferredArrivalDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        tokenNumber: 'TKN-LDH-1002',
        scheduledArrivalDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: 'ACCEPTED',
        paymentStatus: 'PENDING',
      },
      {
        bookingNumber: 'MB-LDH-2024-003',
        mandi: mandis[2]._id, // Ludhiana New Grain Market
        mandiAdmin: mandiAdminUser._id,
        farmer: farmer2._id,
        crop: 'Rice',
        quantity: 80,
        qualityGrade: 'Grade A',
        expectedPrice: 2250,
        preferredArrivalDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: 'PENDING',
        paymentStatus: 'PENDING',
      },
    ]);

    const demoFarmerId = farmer1._id.toString();
    const demoBuyerId = buyer1._id.toString();
    const demoMandiAdminId = mandiAdminUser._id.toString();

    console.log('\n=================================================');
    console.log(' SUCCESS: KisanBazaar Database Seeded Cleanly!');
    console.log('=================================================');
    console.log(`- Demo Farmer ID:      ${demoFarmerId}`);
    console.log(`- Demo Buyer ID:       ${demoBuyerId}`);
    console.log(`- Demo Mandi Admin ID: ${demoMandiAdminId}`);
    console.log(`- Users Seeded:        ${users.length}`);
    console.log(`- Mandis Seeded:       ${mandis.length}`);
    console.log(`- Mandi Prices Seeded: ${mandiPrices.length}`);
    console.log(`- Mandi Demands Seeded:${mandiDemands.length}`);
    console.log(`- Mandi Bookings Seeded:${mandiBookings.length}`);
    console.log(`- Crop Lots Seeded:    ${cropLots.length}`);
    console.log(`- Transporters Seeded: ${transporters.length}`);
    console.log(`- Offers Seeded:       ${offers.length}`);
    console.log(`- Transactions Seeded: ${transactions.length}`);
    console.log(`- Transports Seeded:   ${transports.length}`);
    console.log('=================================================\n');

    // Automatically update client/.env file with current IDs
    try {
      const fs = require('fs');
      const clientEnvPath = path.join(__dirname, '../../client/.env');
      const envContent = `VITE_API_URL=http://localhost:5000/api\nVITE_GOOGLE_CLIENT_ID=79856565875-dreq830u8qvk7r20uh6gv4dphnjn0c2n.apps.googleusercontent.com\nVITE_DEMO_FARMER_ID=${demoFarmerId}\nVITE_DEMO_BUYER_ID=${demoBuyerId}\n`;
      fs.writeFileSync(clientEnvPath, envContent);
      console.log(`Updated client/.env with VITE_DEMO_FARMER_ID and VITE_DEMO_BUYER_ID`);
    } catch (envErr) {
      console.warn(`Could not auto-update client/.env: ${envErr.message}`);
    }

    await mongoose.disconnect();
    console.log('MongoDB connection closed cleanly.');
    process.exit(0);
  } catch (error) {
    console.error(`ERROR SEEDING DATABASE: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
};

seedData();
