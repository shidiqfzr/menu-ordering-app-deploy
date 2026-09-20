import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB;

// 45 Authentic Indonesian Customer Profiles
const DUMMY_CUSTOMERS = [
  { name: 'Budi Santoso', email: 'budi.santoso@gmail.com' },
  { name: 'Siti Nurhaliza', email: 'siti.nurhaliza@gmail.com' },
  { name: 'Dimas Pratama', email: 'dimas.pratama@gmail.com' },
  { name: 'Anisa Rahmawati', email: 'anisa.rahma@gmail.com' },
  { name: 'Rian Hidayat', email: 'rian.hidayat@gmail.com' },
  { name: 'Jessica Tanuwijaya', email: 'jessica.tan@gmail.com' },
  { name: 'Ahmad Fauzi', email: 'ahmad.fauzi@gmail.com' },
  { name: 'Nadia Putri', email: 'nadia.putri@gmail.com' },
  { name: 'Kevin Sanjaya', email: 'kevin.sanjaya@gmail.com' },
  { name: 'Dewi Lestari', email: 'dewi.lestari@gmail.com' },
  { name: 'Bayu Wicaksono', email: 'bayu.wicaksono@gmail.com' },
  { name: 'Farhan Maulana', email: 'farhan.maulana@gmail.com' },
  { name: 'Tiara Andini', email: 'tiara.andini@gmail.com' },
  { name: 'Reza Oktovian', email: 'reza.oktovian@gmail.com' },
  { name: 'Clara Amanda', email: 'clara.amanda@gmail.com' },
  { name: 'Aditya Pratama', email: 'aditya.pratama@gmail.com' },
  { name: 'Putri Ayu Wulandari', email: 'putri.ayu@gmail.com' },
  { name: 'Rizky Ramadhan', email: 'rizky.ramadhan@gmail.com' },
  { name: 'Salsa Maulida', email: 'salsa.maulida@gmail.com' },
  { name: 'Bambang Sudarmono', email: 'bambang.sudar@gmail.com' },
  { name: 'Nita Kusumawati', email: 'nita.kusuma@gmail.com' },
  { name: 'Fajar Hidayatullah', email: 'fajar.hidayat@gmail.com' },
  { name: 'Indah Permatasari', email: 'indah.permata@gmail.com' },
  { name: 'Gilang Dirga', email: 'gilang.dirga@gmail.com' },
  { name: 'Bella Safira', email: 'bella.safira@gmail.com' },
  { name: 'Hendra Wijaya', email: 'hendra.wijaya@gmail.com' },
  { name: 'Dina Mariana', email: 'dina.mariana@gmail.com' },
  { name: 'Eko Yulianto', email: 'eko.yulianto@gmail.com' },
  { name: 'Mega Utami', email: 'mega.utami@gmail.com' },
  { name: 'Satria Wibowo', email: 'satria.wibowo@gmail.com' },
  { name: 'Yuliana Sitorus', email: 'yuliana.sitorus@gmail.com' },
  { name: 'Arif Rachman', email: 'arif.rachman@gmail.com' },
  { name: 'Citra Kirana', email: 'citra.kirana@gmail.com' },
  { name: 'Danang Sutrisno', email: 'danang.sutrisno@gmail.com' },
  { name: 'Vina Panduwinata', email: 'vina.pandu@gmail.com' },
  { name: 'Hadi Gunawan', email: 'hadi.gunawan@gmail.com' },
  { name: 'Tantri Syalindri', email: 'tantri.syalindri@gmail.com' },
  { name: 'Rahmat Hidayat', email: 'rahmat.hidayat@gmail.com' },
  { name: 'Fitri Handayani', email: 'fitri.handayani@gmail.com' },
  { name: 'Agung Laksono', email: 'agung.laksono@gmail.com' },
  { name: 'Desi Ratnasari', email: 'desi.ratnasari@gmail.com' },
  { name: 'Yoga Pratama', email: 'yoga.pratama@gmail.com' },
  { name: 'Zahra Amelia', email: 'zahra.amelia@gmail.com' },
  { name: 'Ilham Ramadhan', email: 'ilham.ramadhan@gmail.com' },
  { name: 'Wulan Guritno', email: 'wulan.guritno@gmail.com' }
];

const REALISTIC_NOTES = [
  '-',
  '-',
  '-',
  '-',
  '-',
  'Pedas sedang ya mas',
  'Sambal terasi dipisah',
  'Es batunya sedikit saja (less ice)',
  'Gulanya 50% ya (less sugar)',
  'Jangan pakai seledri & bawang goreng',
  'Kuah dipisah ya',
  'Tolong sendok & sedotan lebih',
  'Minta sedotan kertas 2',
  'Bungkus rapi (take away)',
  'Panas mendidih ya',
  'Minumannya tolong keluar duluan',
  'Bikin agak gurih sedikit ya chef',
  'Tanpa es batu ya, dingin kulkas saja'
];

async function seed() {
  if (!MONGODB_URI) {
    console.error('Error: MONGODB connection string is missing from .env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected successfully.');

  const db = mongoose.connection.db;
  const usersCol = db.collection('users');
  const foodsCol = db.collection('foods');
  const ordersCol = db.collection('orders');

  // 1. Fetch Food Menu
  const foods = await foodsCol.find().toArray();
  if (foods.length === 0) {
    console.error('Error: No food items found in DB. Please add menu items first.');
    await mongoose.disconnect();
    return;
  }
  console.log(`Found ${foods.length} food items in catalog.`);

  const mains = foods.filter(f => ['Pasta', 'Noodles', 'Sandwich', 'Rolls', 'Pure Veg'].includes(f.category));
  const desserts = foods.filter(f => ['Deserts', 'Cake'].includes(f.category));
  const salads = foods.filter(f => f.category === 'Salad');
  const allFoods = foods;

  // 2. Ensure / Seed 45 Realistic Customers with simple password "customer12345"
  console.log(`Verifying & seeding ${DUMMY_CUSTOMERS.length} customer profiles (Password: customer12345)...`);
  
  // Drop accidental unique index on password if present
  try {
    await usersCol.dropIndex('password_1');
    console.log('Dropped accidental unique index on password_1.');
  } catch {
    // index does not exist or already dropped
  }

  const activeUserIds = [];
  const salt = await bcrypt.genSalt(10);
  const commonCustomerPasswordHash = await bcrypt.hash('customer12345', salt);

  for (const cust of DUMMY_CUSTOMERS) {
    const existing = await usersCol.findOne({ email: cust.email.toLowerCase() });
    if (existing) {
      // Ensure password is synchronized to customer12345
      await usersCol.updateOne(
        { _id: existing._id },
        { $set: { password: commonCustomerPasswordHash, updatedAt: new Date() } }
      );
      activeUserIds.push(existing._id.toString());
    } else {
      const res = await usersCol.insertOne({
        name: cust.name,
        email: cust.email.toLowerCase(),
        password: commonCustomerPasswordHash,
        role: 'user',
        cartData: {},
        isDummy: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      activeUserIds.push(res.insertedId.toString());
      console.log(`+ Created customer: ${cust.name}`);
    }
  }

  const regulars = activeUserIds.slice(0, 12);

  // 3. Clean previous dummy orders
  const delOrders = await ordersCol.deleteMany({ isDummy: true });
  if (delOrders.deletedCount > 0) {
    console.log(`Cleaned ${delOrders.deletedCount} previous dummy orders.`);
  }

  // 4. Generate 60 Days of Realistic Orders
  const dummyOrders = [];
  const now = new Date();
  let invoiceSeq = 3000;

  function pickOrderItems() {
    const orderType = Math.random();
    const selected = [];

    if (orderType < 0.45) {
      // Solo: 1 Main + 1 Dessert/Salad
      const main = mains[Math.floor(Math.random() * mains.length)] || allFoods[0];
      selected.push({ ...main, quantity: 1 });
      if (Math.random() < 0.65) {
        const side = (Math.random() < 0.7 ? desserts : salads)[Math.floor(Math.random() * (desserts.length || 1))] || allFoods[1];
        selected.push({ ...side, quantity: 1 });
      }
    } else if (orderType < 0.85) {
      // Duo / Couple: 2 Mains + 1-2 Desserts/Salads
      const m1 = mains[Math.floor(Math.random() * mains.length)] || allFoods[0];
      const m2 = mains[Math.floor(Math.random() * mains.length)] || allFoods[1];
      selected.push({ ...m1, quantity: 1 });
      if (m2.name !== m1.name) {
        selected.push({ ...m2, quantity: 1 });
      } else {
        selected[0].quantity = 2;
      }
      const d = desserts[Math.floor(Math.random() * desserts.length)] || allFoods[2];
      selected.push({ ...d, quantity: Math.random() < 0.5 ? 1 : 2 });
    } else {
      // Group / Family: 3 to 4 dishes with multiple quantities
      const numItems = Math.floor(Math.random() * 2) + 3;
      for (let i = 0; i < numItems; i++) {
        const item = allFoods[Math.floor(Math.random() * allFoods.length)];
        const existing = selected.find(s => s._id.toString() === item._id.toString());
        const qty = Math.floor(Math.random() * 2) + 1;
        if (existing) {
          existing.quantity += qty;
        } else {
          selected.push({ ...item, quantity: qty });
        }
      }
    }

    let subtotal = 0;
    const cleanItems = selected.map(item => {
      const priceNum = parseInt(item.price, 10) || 15000;
      subtotal += priceNum * item.quantity;
      return {
        _id: item._id,
        name: item.name,
        description: item.description || '',
        price: item.price,
        image: item.image,
        category: item.category || 'Menu',
        quantity: item.quantity
      };
    });

    return { cleanItems, subtotal };
  }

  function makeOrder(targetDate, status = 'Selesai', isPaid = true, explicitTableNumber = null, explicitNote = null) {
    invoiceSeq++;
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    const randCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const invoiceNumber = `M-${yyyy}${mm}${dd}-${invoiceSeq.toString().slice(-3)}${randCode}`;

    const { cleanItems, subtotal } = pickOrderItems();
    const paymentMethod = status === 'Pending' ? 'Tunai' : (Math.random() < 0.70 ? 'QRIS' : 'Tunai');
    const finalPaid = status === 'Pending' ? false : isPaid;

    const userId = Math.random() < 0.40 
      ? regulars[Math.floor(Math.random() * regulars.length)]
      : activeUserIds[Math.floor(Math.random() * activeUserIds.length)];

    const tableNumber = explicitTableNumber !== null ? explicitTableNumber : (Math.floor(Math.random() * 20) + 1);
    const note = explicitNote !== null ? explicitNote : REALISTIC_NOTES[Math.floor(Math.random() * REALISTIC_NOTES.length)];

    return {
      userId,
      invoiceNumber,
      items: cleanItems,
      discount: 0,
      amount: subtotal,
      tableNumber,
      note,
      paymentMethod,
      status,
      date: targetDate,
      payment: finalPaid,
      isDummy: true
    };
  }

  console.log('Generating 60-day historical orders with realistic peak hours...');

  for (let daysAgo = 60; daysAgo >= 1; daysAgo--) {
    const dObj = new Date(now);
    dObj.setDate(dObj.getDate() - daysAgo);

    const dayOfWeek = dObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
    const baseOrders = isWeekend
      ? Math.floor(Math.random() * 11) + 18
      : Math.floor(Math.random() * 8) + 9;

    for (let i = 0; i < baseOrders; i++) {
      const orderDate = new Date(dObj);
      const rHour = Math.random();
      let hour = 12;

      if (rHour < 0.08) {
        hour = Math.floor(Math.random() * 2) + 8; // 08:00 - 10:00
      } else if (rHour < 0.45) {
        hour = Math.floor(Math.random() * 3) + 11; // 11:00 - 14:00 (Lunch)
      } else if (rHour < 0.65) {
        hour = Math.floor(Math.random() * 3) + 14; // 14:00 - 17:00 (Snack)
      } else {
        hour = Math.floor(Math.random() * 4) + 18; // 18:00 - 22:00 (Dinner)
      }

      const minute = Math.floor(Math.random() * 59);
      orderDate.setHours(hour, minute, Math.floor(Math.random() * 59), 0);

      const isCancelled = Math.random() < 0.03;
      const status = isCancelled ? 'Dibatalkan' : 'Selesai';
      const isPaid = !isCancelled;

      dummyOrders.push(makeOrder(orderDate, status, isPaid));
    }
  }

  // 5. Today's Realistic Live Floor (Meja & QR Code Simulation) + Daily Completed Orders
  console.log('Generating realistic live table floor state (Meja & QR Code + Semua Pesanan)...');

  // A. Completed orders earlier today (past table turnovers throughout the day)
  const currentHour = now.getHours();
  const pastHoursToday = [];
  for (let h = 8; h < Math.max(9, currentHour); h++) {
    pastHoursToday.push(h);
  }

  const numFinishedToday = Math.min(16, Math.max(8, pastHoursToday.length * 2));
  for (let i = 0; i < numFinishedToday; i++) {
    const d = new Date(now);
    const randHour = pastHoursToday.length > 0 
      ? pastHoursToday[Math.floor(Math.random() * pastHoursToday.length)]
      : Math.max(8, currentHour - 3);
    const randMinute = Math.floor(Math.random() * 59);
    d.setHours(randHour, randMinute, Math.floor(Math.random() * 59), 0);
    if (d.getTime() < now.getTime() - 65 * 60 * 1000) {
      dummyOrders.push(makeOrder(d, 'Selesai', true));
    }
  }

  // 1 Cancelled order earlier today (e.g. customer cancelled before confirmation)
  const cancelDate = new Date(now.getTime() - 95 * 60 * 1000);
  dummyOrders.push(makeOrder(cancelDate, 'Dibatalkan', false));

  // B. Live Active Floor (Real-time snapshot for Meja & QR Code)
  // Perfectly realistic distribution of a 20-table cafe:
  // - 2 tables 🟠 Menunggu Konfirmasi (Pending QR orders placed 2m, 6m ago)
  // - 3 tables 🔵 Diproses (Dapur / Barista preparing food & drinks: 14m, 20m, 26m ago)
  // - 4 tables 🟡 Sedang Santap (Dishes served to table, guests dining: 16m, 28m, 42m, 58m ago)
  // - Remaining 11 tables are 🟢 Kosong / Bebas ready for new guests!
  const liveTableConfigs = [
    // 🟠 Menunggu Konfirmasi (Customer just scanned QR code and placed order)
    { tableNumber: 3, status: 'Pending', minutesAgo: 2, paid: false, note: 'Tolong sendok & sedotan lebih ya mas' },
    { tableNumber: 11, status: 'Pending', minutesAgo: 6, paid: false, note: 'Bayar tunai di kasir' },

    // 🔵 Diproses (Dapur / Barista preparing food & drinks in kitchen)
    { tableNumber: 7, status: 'Diproses', minutesAgo: 14, paid: true, note: 'Pedas sedang ya mas' },
    { tableNumber: 15, status: 'Diproses', minutesAgo: 20, paid: true, note: 'Minumannya tolong keluar duluan' },
    { tableNumber: 18, status: 'Diproses', minutesAgo: 26, paid: true, note: 'Sambal terasi dipisah' },

    // 🟡 Sedang Santap / Disajikan (Dishes served to table, customers currently eating / nongkrong)
    { tableNumber: 2, status: 'Disajikan', minutesAgo: 16, paid: true, note: 'Es batunya sedikit saja (less ice)' },
    { tableNumber: 6, status: 'Disajikan', minutesAgo: 28, paid: true, note: '-' },
    { tableNumber: 10, status: 'Disajikan', minutesAgo: 42, paid: true, note: 'Gulanya 50% ya (less sugar)' },
    { tableNumber: 16, status: 'Disajikan', minutesAgo: 58, paid: true, note: '-' }
  ];

  for (const item of liveTableConfigs) {
    const orderTime = new Date(now.getTime() - item.minutesAgo * 60 * 1000);
    dummyOrders.push(makeOrder(orderTime, item.status, item.paid, item.tableNumber, item.note));
  }

  dummyOrders.sort((a, b) => new Date(a.date) - new Date(b.date));

  const insertRes = await ordersCol.insertMany(dummyOrders);
  console.log(`Saved ${insertRes.insertedCount} orders to MongoDB!`);

  const totalRevenue = dummyOrders.filter(o => o.payment).reduce((sum, o) => sum + o.amount, 0);
  const totalPaidOrders = dummyOrders.filter(o => o.payment).length;
  const aov = Math.round(totalRevenue / totalPaidOrders);

  console.log('\n================ SEED SUMMARY ================');
  console.log(`Total Customers : ${activeUserIds.length}`);
  console.log(`Total Orders    : ${dummyOrders.length}`);
  console.log(`Paid Orders     : ${totalPaidOrders}`);
  console.log(`Total Sales     : Rp ${totalRevenue.toLocaleString('id-ID')}`);
  console.log(`AOV             : Rp ${aov.toLocaleString('id-ID')} / ticket`);
  console.log(`Coverage        : 60 Days (Historical + Today)`);
  console.log('==============================================\n');

  await mongoose.disconnect();
  console.log('Seeding completed.');
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
