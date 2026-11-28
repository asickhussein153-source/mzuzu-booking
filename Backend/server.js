const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'mzuzu-secret-key-change-me';

app.use(cors());
app.use(express.json());

// --- MongoDB Connect ---
mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI)
.then(()=> console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err.message));

// --- Models ---
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, lowercase: true },
  phone: String,
  password: String,
  role: { type: String, default: 'user' },
  resetCode: String,
  resetExpires: Date,
}, { timestamps: true });
const User = mongoose.model('User', userSchema);

const roomSchema = new mongoose.Schema({
  name: String,
  type: String,
  price: Number,
  capacity: Number,
  amenities: [String],
  image: String,
  available: { type: Boolean, default: true },
  desc: String,
});
const Room = mongoose.model('Room', roomSchema);

const bookingSchema = new mongoose.Schema({
  roomId: String,
  room: String,
  roomName: String,
  name: String,
  email: { type: String, lowercase: true },
  phone: String,
  guests: Number,
  checkIn: String,
  checkOut: String,
  total: Number,
  status: { type: String, default: 'Pending' },
  reason: String,
}, { timestamps: true });
const Booking = mongoose.model('Booking', bookingSchema);

// --- Seed Rooms Once ---
const seedRooms = [
  { name: 'Standard Room', type: 'Standard', price: 45000, capacity: 2, amenities: ['WiFi','TV','Breakfast'], image: '/images/standard.jpg', available: true, desc: 'Cozy standard room' },
  { name: 'Deluxe Room', type: 'Deluxe', price: 75000, capacity: 3, amenities: ['WiFi','TV','Breakfast','Mini Bar'], image: '/images/deluxe.jpg', available: true, desc: 'Spacious deluxe room' },
  { name: 'Executive Suite', type: 'Suite', price: 120000, capacity: 4, amenities: ['WiFi','TV','Breakfast','Mini Bar','Jacuzzi'], image: '/images/suite.jpg', available: true, desc: 'Luxury suite' },
  { name: 'Family Room', type: 'Family', price: 95000, capacity: 5, amenities: ['WiFi','TV','Breakfast'], image: '/images/family.jpg', available: true, desc: 'Perfect for families' },
];
async function seedIfEmpty(){
  try{
    const count = await Room.countDocuments();
    if(count === 0){ await Room.insertMany(seedRooms); console.log('Rooms seeded'); }
  }catch(e){ console.log('Seed error', e.message); }
}
seedIfEmpty();

// --- Mailer ---
const nodemailer = require('nodemailer');
const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});
async function sendMail(to, subject, text){
  if(!process.env.EMAIL_USER) { console.log('Email skipped, no EMAIL_USER'); return; }
  try{ await mailer.sendMail({ from: process.env.EMAIL_USER, to, subject, text }); console.log('Email sent to', to); }
  catch(e){ console.log('Email failed:', e.message); }
}

// --- Auth Middleware ---
function auth(req, res, next){
  const token = req.headers['authorization']?.split(' ')[1];
  if(!token) return res.status(401).json({ message: 'No token' });
  try{ req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch(e){ return res.status(401).json({ message: 'Invalid token' }); }
}
function adminOnly(req, res, next){
  if(req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  next();
}

// --- Routes ---
app.get('/', (req,res)=> res.send('Mzuzu Backend Running with MongoDB'));

app.post('/api/register', async (req,res)=>{
  const { name, email, phone, password } = req.body;
  if(!email || !password) return res.status(400).json({ message: 'Email and password required' });
  const exists = await User.findOne({ email: email.toLowerCase() });
  if(exists) return res.status(400).json({ message: 'Email already registered' });
  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ name, email: email.toLowerCase(), phone, password: hashed, role: 'user' });
  await user.save();
  res.status(201).json({ message: 'Registered successfully' });
});

app.post('/api/login', async (req,res)=>{
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  if(!user) return res.status(400).json({ message: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if(!ok) return res.status(400).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ id: user._id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ message: 'Login successful', token, id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
});

app.post('/api/forgot-password', async (req,res)=>{
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  if(!user) return res.status(404).json({ message: 'Email not found' });
  const code = Math.floor(100000 + Math.random()*900000).toString();
  user.resetCode = code;
  user.resetExpires = new Date(Date.now() + 15*60*1000);
  await user.save();
  await sendMail(email, 'Password Reset - Mzuzu', 'Your reset code is: ' + code);
  res.json({ message: 'Reset code sent to email' });
});

app.post('/api/reset-password', async (req,res)=>{
  const { email, code, newPassword } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  if(!user || user.resetCode !== code) return res.status(400).json({ message: 'Invalid code' });
  if(user.resetExpires < new Date()) return res.status(400).json({ message: 'Code expired' });
  user.password = await bcrypt.hash(newPassword, 10);
  user.resetCode = undefined; user.resetExpires = undefined;
  await user.save();
  res.json({ message: 'Password reset successful' });
});

app.get('/api/rooms', async (req,res)=>{
  const rooms = await Room.find();
  res.json(rooms);
});

app.get('/api/rooms/:id', async (req,res)=>{
  const room = await Room.findById(req.params.id);
  if(!room) return res.status(404).json({ message: 'Room not found' });
  res.json(room);
});

app.post('/api/bookings', async (req,res)=>{
  const { roomId, room, roomName, name, email, phone, guests, checkIn, checkOut, total } = req.body;
  // room check removed
const booking = new Booking({ roomId, room, roomName, name, email, phone, guests, checkIn, checkOut, total });
  await booking.save();
  await sendMail(email, 'Booking Received - Mzuzu', 'Hi ' + name + ', your booking for ' + (roomName || room || 'room') + ' is received and Pending approval.');
  res.status(201).json({ message: 'Booking created', booking });
});

app.get('/api/bookings', auth, adminOnly, async (req,res)=>{
  const bookings = await Booking.find().sort({ createdAt: -1 });
  res.json(bookings);
});

app.get('/api/my-bookings', async (req,res)=>{
  const email = req.headers['x-email'] || req.query.email;
  if(!email) return res.json([]);
  const bookings = await Booking.find({ email: email.toLowerCase() }).sort({ createdAt: -1 });
  res.json(bookings);
});

app.post('/api/bookings/:id/approve', async (req,res)=>{
  const b = await Booking.findById(req.params.id);
  if(!b) return res.status(404).json({ message: 'Not found' });
  b.status = 'Approved';
  await b.save();
  await sendMail(b.email, 'Booking Approved - Mzuzu', 'Hi ' + b.name + ', Your booking for ' + (b.room || b.roomName || 'room') + ' is APPROVED.');
  res.json({ message: 'Approved + email sent', booking: b });
});

app.post('/api/bookings/:id/reject', async (req,res)=>{
  const b = await Booking.findById(req.params.id);
  if(!b) return res.status(404).json({ message: 'Not found' });
  b.status = 'Rejected'; b.reason = req.body.reason || 'No reason given';
  await b.save();
  await sendMail(b.email, 'Booking Rejected - Mzuzu', 'Hi ' + b.name + ', Your booking for ' + (b.room || b.roomName || 'room') + ' was REJECTED. Reason: ' + b.reason);
  res.json({ message: 'Rejected + email sent', booking: b });
});

app.listen(PORT, ()=>{ console.log(`Server running at http://localhost:${PORT}`); });
