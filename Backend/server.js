const express = require('express');
const path = require('path');
const cors = require('cors');
const { sendMail } = require('./mailer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = 'mzuzu-secret-123';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const frontendPath = path.join(__dirname, '../Frontend');
app.use(express.static(frontendPath));
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'home.html'));
});

let users = [];
let bookings = [];

let rooms = [
  { id: 1, name: 'Lecture Room 1', location: 'Main Campus', capacity: 100, type: 'Lecture Room', description: 'Suitable for meetings, presentations and academic events.' },
  { id: 2, name: 'Room T', location: 'Vigwagwa', capacity: 50, type: 'Lecture Room', description: 'Suitable for university meetings, academic activities and student events.' },
  { id: 3, name: 'Auditorium 1', location: 'Near Essup Building', capacity: 150, type: 'Auditorium', description: 'Suitable for conferences, seminars, presentations and university events.' },
  { id: 4, name: 'Auditorium 2', location: 'Near Essup Building', capacity: 100, type: 'Auditorium', description: 'Suitable for conferences, seminars, presentations and university events.' },
  { id: 5, name: 'English Lecture Room', location: 'Essup Building', capacity: 90, type: 'Lecture Room', description: 'Suitable for academic meetings, discussions and student activities.' },
  { id: 6, name: 'Geography Lecture Room', location: 'Essup Building', capacity: 80, type: 'Lecture Room', description: 'Suitable for academic meetings, discussions and student activities.' },
  { id: 7, name: 'Conference Room', location: 'Administration Block', capacity: 50, type: 'Conference Room', description: 'Suitable for conferences, discussions and workshops.' },
  { id: 8, name: 'Computer Laboratory', location: 'ICT Department', capacity: 40, type: 'Laboratory', description: 'Suitable for computer-based training and practical sessions.' },
];

app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Fill all fields' });
  if (users.find(u => u.email === email)) return res.status(400).json({ message: 'Email already exists' });
  const hashed = await bcrypt.hash(password, 10);
  users.push({ name, email, password: hashed });
  res.json({ message: 'Registered successfully, now login!' });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(400).json({ message: 'User not found' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ message: 'Wrong password' });
    const role = email === 'admin@mzuzu.ac.mw' ? 'admin' : 'student';
     const token = jwt.sign({ email, role }, SECRET, { expiresIn: '1h' });
  res.json({ token, name: user.name, email, role });
});

app.get('/api/rooms', (req, res) => { res.json(rooms); });
app.get('/api/bookings', (req, res) => { res.json(bookings); });

app.post('/api/bookings', (req, res) => {
  const { fullName, registrationNumber, email, phone, eventName, eventType, purpose, participants, room, bookingDate, startTime, endTime } = req.body;
  if (!fullName || !email || !room || !eventName || !bookingDate || !startTime || !endTime) {
    return res.status(400).json({ message: 'Fill all booking fields' });
  }
  if (endTime <= startTime) return res.status(400).json({ message: 'End time must be after start time' });
  const clash = bookings.find(b => {
    if (b.room !== room) return false;
    if (b.bookingDate !== bookingDate) return false;
    return startTime < b.endTime && endTime > b.startTime;
  });
  if (clash) {
    return res.status(400).json({
     message: `Sorry, ${room} is already booked for your selected date and time (${clash.bookingDate} from ${clash.startTime} to ${clash.endTime}). Please try another room or choose a different time.`
    });
  }
  const booking = { id: bookings.length + 1, fullName, registrationNumber, email, phone, eventName, eventType, purpose, participants, room, bookingDate, startTime, endTime, status: 'Pending' };
  bookings.push(booking);
res.json({ message: 'You have successfully submitted your request and it is pending approval. Please wait for confirmation from the Admin.' });
});
// ADMIN: approve / reject a booking
app.put('/api/bookings/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { status, reason } = req.body;
  const booking = bookings.find(b => b.id === id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (!['Approved','Rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
  if (status === 'Rejected' && !reason) {
    return res.status(400).json({ message: 'Please provide reason for rejection' });
  }
  booking.status = status;
  if(status==='Approved') await sendMail(booking.email, 'Booking Approved - Mzuzu', 'Approved', booking);
  if(status==='Rejected') await sendMail(booking.email, 'Booking Rejected - Mzuzu', 'Rejected', booking);
  booking.rejectionReason = status === 'Rejected' ? reason : '';
  res.json({ message: `Booking ${status}`, booking });
});


app.get('/api/my-bookings', (req,res)=>{
  const email = req.headers['x-email'] || req.query.email;
  if(!email) return res.json([]);
  res.json(bookings.filter(b => b.email === email));
});
app.post('/api/bookings/:id/approve', async (req,res)=>{
  const b = bookings.find(x => String(x.id) === String(req.params.id));
  if(!b) return res.status(404).json({message:'Not found'});
  b.status = 'Approved';
  await sendMail(b.email, 'Booking Approved - Mzuzu', 'Hi '+b.name+', Your booking for '+(b.room||b.roomName||'room')+' is APPROVED.');
  res.json({message:'Approved + email sent', booking: b});
});
app.post('/api/bookings/:id/reject', async (req,res)=>{
  const b = bookings.find(x => String(x.id) === String(req.params.id));
  if(!b) return res.status(404).json({message:'Not found'});
  b.status = 'Rejected'; b.reason = req.body.reason || 'No reason given';
  await sendMail(b.email, 'Booking Rejected - Mzuzu', 'Hi '+b.name+', Your booking for '+(b.room||b.roomName||'room')+' was REJECTED. Reason: '+b.reason);
  res.json({message:'Rejected + email sent', booking: b});
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
