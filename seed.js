import 'dotenv/config';
import { connectDatabase } from './config/db.js';
import Product from './models/Product.js';
import User from './models/User.js';
import Doctor from './models/Doctor.js';

const image = 'https://placehold.co/600x520/eef4ff/1b2540?text=NexGen+Vet';

// [name, banglaName, price, originalPrice, petType, category(subCategory), brand]
// All categories come from the controlled taxonomy (food/treats/toys/medicine/grooming/accessories/litter).
const products = [
  ['Royal Canin Adult Cat Food 2kg', 'রয়্যাল ক্যানিন অ্যাডাল্ট ক্যাট ফুড', 1850, 2100, 'cat', 'food', 'Royal Canin'],
  ['Whiskas Tuna Wet Food 85g', 'হুইস্কাস টুনা ওয়েট ফুড', 65, 0, 'cat', 'food', 'Whiskas'],
  ['Me-O Persian Cat Food 1.1kg', 'মি-ও পার্সিয়ান ক্যাট ফুড', 750, 0, 'cat', 'food', 'Me-O'],
  ['Creamy Cat Treat Sticks', 'ক্রিমি ক্যাট ট্রিট স্টিক', 220, 260, 'cat', 'treats', 'Me-O'],
  ['Adjustable Cat Collar with Bell', 'অ্যাডজাস্টেবল ক্যাট কলার', 180, 0, 'cat', 'accessories', 'Paws'],
  ['Stainless Steel Cat Bowl', 'স্টেইনলেস স্টিল ক্যাট বোল', 290, 350, 'cat', 'accessories', 'Paws'],
  ['Interactive Feather Wand Toy', 'ইন্টারঅ্যাকটিভ ফেদার টয়', 250, 0, 'cat', 'toys', 'Paws'],
  ['Catnip Plush Mouse Set', 'ক্যাটনিপ মাউস টয় সেট', 330, 390, 'cat', 'toys', 'Paws'],
  ['Cat Multivitamin Gel 100g', 'ক্যাট মাল্টিভিটামিন জেল', 540, 620, 'cat', 'supplements', 'Bioline'],
  ['Cat Deworming Tablet', 'ক্যাট ডিওয়ার্মিং ট্যাবলেট', 190, 0, 'cat', 'medicine', 'PetCare'],
  ['Bentonite Clumping Litter 10L', 'বেনটোনাইট ক্লাম্পিং লিটার', 740, 820, 'cat', 'litter', 'Paws'],
  ['Lavender Scented Cat Litter 5L', 'ল্যাভেন্ডার ক্যাট লিটার', 395, 0, 'cat', 'litter', 'Paws'],
  ['Cat Grooming Slicker Brush', 'ক্যাট গ্রুমিং ব্রাশ', 310, 360, 'cat', 'grooming', 'Paws'],
  ['Pedigree Adult Dog Food 3kg', 'পেডিগ্রি অ্যাডাল্ট ডগ ফুড', 1200, 0, 'dog', 'food', 'Pedigree'],
  ['SmartHeart Puppy Food 1.5kg', 'স্মার্টহার্ট পাপি ফুড', 680, 760, 'dog', 'food', 'SmartHeart'],
  ['Royal Canin Mini Adult 2kg', 'রয়্যাল ক্যানিন মিনি অ্যাডাল্ট', 2050, 2300, 'dog', 'food', 'Royal Canin'],
  ['Dog Dental Chew Treats', 'ডগ ডেন্টাল চিউ ট্রিট', 340, 0, 'dog', 'treats', 'Pedigree'],
  ['Durable Dog Leash & Collar Set', 'ডগ লিশ এবং কলার সেট', 560, 640, 'dog', 'accessories', 'Paws'],
  ['Paw Print Dog Bed Medium', 'প-প্রিন্ট ডগ বেড', 1750, 1990, 'dog', 'accessories', 'Paws'],
  ['Squeaky Rubber Bone Toy', 'স্কুইকি রাবার বোন টয়', 280, 0, 'dog', 'toys', 'Paws'],
  ['Dog Joint Care Supplement', 'ডগ জয়েন্ট কেয়ার সাপ্লিমেন্ট', 790, 0, 'dog', 'supplements', 'Himalaya'],
  ['Dog Tick & Flea Solution', 'ডগ টিক অ্যান্ড ফ্লি সল্যুশন', 450, 520, 'dog', 'medicine', 'Bioline'],
  ['Dog Grooming Brush', 'ডগ গ্রুমিং ব্রাশ', 320, 0, 'dog', 'grooming', 'Paws'],
  ['Premium Parrot Seed Mix 1kg', 'প্রিমিয়াম প্যারট সিড মিক্স', 390, 0, 'bird', 'food', 'Vitapol'],
  ['Bird Cage Water Feeder', 'বার্ড কেজ ওয়াটার ফিডার', 160, 190, 'bird', 'accessories', 'Vitapol'],
  ['Vitamin Drops for Birds 30ml', 'বার্ড ভিটামিন ড্রপস', 280, 0, 'bird', 'medicine', 'Vitapol'],
  ['Millet Spray Bird Treat', 'মিলেট স্প্রে বার্ড ট্রিট', 150, 0, 'bird', 'treats', 'Vitapol'],
  ['Goldfish Flakes Food 100g', 'গোল্ডফিশ ফ্লেকস ফুড', 290, 0, 'fish', 'food', 'Tetra'],
  ['Aqua Filter Pump 15W', 'অ্যাকুয়া ফিল্টার পাম্প', 980, 1120, 'fish', 'accessories', 'Tetra'],
  ['Aquarium Water Conditioner 100ml', 'অ্যাকুয়ারিয়াম ওয়াটার কন্ডিশনার', 350, 0, 'fish', 'medicine', 'Tetra'],
  ['Colorful Aquarium Gravel 1kg', 'কালারফুল অ্যাকুয়ারিয়াম গ্র্যাভেল', 220, 0, 'fish', 'accessories', 'Tetra']
].map(([name, banglaName, price, originalPrice, category, subCategory, brand], index) => ({
  name,
  banglaName,
  price,
  originalPrice: originalPrice || undefined,
  discount: originalPrice && originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0,
  category,
  subCategory,
  brand,
  images: [image],
  stock: 25 + index,
  rating: { average: 4.5 + (index % 5) / 10, count: 8 + index },
  description: `${banglaName} আপনার পোষা প্রাণীর দৈনন্দিন যত্নের জন্য বিশ্বস্ত মানসম্পন্ন পণ্য।`,
  isFeatured: index < 8
}));

const doctors = [
  { name: 'ডা. রফিকুল ইসলাম', specialization: 'গবাদিপশু চিকিৎসক', bio: 'গরু ও ছাগলের সাধারণ রোগ, পুষ্টি ও উৎপাদনশীলতা বিষয়ে অভিজ্ঞ।', isActive: true, isOnline: true },
  { name: 'ডা. সাদিয়া আক্তার', specialization: 'ভেটেরিনারি সার্জন', bio: 'গবাদিপশুর জরুরি অবস্থা ও অস্ত্রোপচার সংক্রান্ত প্রাথমিক পরামর্শে অভিজ্ঞ।', isActive: true, isOnline: true },
  { name: 'ডা. তানভীর হাসান', specialization: 'পোল্ট্রি ও হাঁস বিশেষজ্ঞ', bio: 'মুরগি ও হাঁসের পরিচর্যা, পুষ্টি এবং সাধারণ রোগের বিষয়ে অভিজ্ঞ।', isActive: true, isOnline: false }
];

try {
  await connectDatabase();
  await Product.deleteMany();
  await Product.insertMany(products);

  if ((await Doctor.countDocuments()) === 0) await Doctor.insertMany(doctors);

  let admin = await User.findOne({ email: 'admin@nexgenvet.bd' });
  if (!admin) admin = await User.create({ name: 'NexGen Admin', email: 'admin@nexgenvet.bd', password: 'admin123', phone: '01700000000', role: 'admin' });
  else { admin.name = 'NexGen Admin'; admin.phone = '01700000000'; admin.role = 'admin'; await admin.save(); }

  console.log('Seed complete. Admin: admin@nexgenvet.bd / admin123');
  process.exit(0);
} catch (error) {
  console.error(error);
  process.exit(1);
}
