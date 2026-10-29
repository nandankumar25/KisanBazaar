# KisanBazaar Seed Script

This directory contains the database seed script for populating realistic demo data for the KisanBazaar platform.

## Seed Data Included
- **Users**: 3 Farmers (Phagwara, Jalandhar, Ludhiana), 3 Buyers, 1 Admin
- **Mandis**: Phagwara, Jalandhar, Ludhiana, Amritsar, Kapurthala
- **Mandi Prices**: Daily rates for Wheat, Rice, Maize, Potato, Mustard
- **Crop Lots**: Farmer produce listings with quantity, quality grade, expected prices, and location
- **Transporters**: Transporter profiles with vehicle type, capacity, price/km, rating, and location
- **Offers**: Buyer purchase offers on farmer crop lots
- **Transactions**: Harvest sale transaction records
- **Transport**: Logistics and transport booking records

> [!NOTE]
> All Mandi rates and transport prices are strictly demo sample data for testing and development purposes.

## How to Run Seed Script

1. Ensure your MongoDB instance is running locally or updated in `server/.env`:
   ```env
   MONGO_URI=mongodb://localhost:27017/kisanbazaar
   ```

2. From the `server` directory, run:
   ```bash
   npm run seed
   ```

   Alternatively, execute directly via Node:
   ```bash
   node seed/seed.js
   ```

3. The script will clear existing records in all 8 collections, insert fresh demo records, display summary counts, and exit automatically.
