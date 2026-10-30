const mongoose = require('../node_modules/mongoose');
const Notification = require('../models/Notification');
const Transport = require('../models/Transport');
require('../node_modules/dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function syncAll() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kisanbazaar');
    const notifs = await Notification.find({ type: 'TRANSPORT_REFUND' });
    console.log(`Found ${notifs.length} refund notifications`);

    for (const n of notifs) {
      let cropName = 'Wheat4';
      let qty = 50;
      let amt = 840;
      let action = 'rejected';

      if (n.relatedTransport) {
        const t = await Transport.findById(n.relatedTransport);
        if (t) {
          cropName = t.cropName || cropName;
          qty = t.quantity || qty;
          amt = t.refundAmount || t.paidAmount || t.totalCost || amt;
          action = (t.status === 'CANCELLED' || String(t.cancellationReason || '').trim()) ? 'cancelled' : 'rejected';
        }
      } else if (n.message) {
        const cropMatch = n.message.match(/for\s+([^(]+)\s*\(/i);
        if (cropMatch) cropName = cropMatch[1].trim();
        const qtyMatch = n.message.match(/\((\d+)\s*qtl\)/i);
        if (qtyMatch) qty = qtyMatch[1].trim();
        const amtMatch = n.message.match(/₹(\d+)/);
        if (amtMatch) amt = amtMatch[1].trim();
        if (n.message.includes('cancelled')) action = 'cancelled';
      }

      n.title = 'Transport Refund Successful';
      n.message = `Your transport booking for ${cropName} (${qty} qtl) has been ${action}. Your refund of ₹${amt} has been successfully credited to your original payment method.`;
      await n.save();
      console.log(`Updated notification ${n._id}: ${n.title} - ${n.message}`);
    }
    console.log('All refund notifications successfully updated!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

syncAll();
