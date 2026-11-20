const fs = require('fs');
let s = fs.readFileSync('server.js','utf8');
if (s.includes('/api/bookings')) {
  console.log('already has bookings');
} else {
  const code = `
// --- BOOKINGS ---
let bookings = [];
app.post('/api/bookings', (req,res)=>{
  const auth = req.headers.authorization;
  if(!auth) return res.status(401).json({message:'Login required'});
  const b = {id: Date.now(), ...req.body, createdAt: new Date()};
  bookings.push(b);
  console.log('NEW BOOKING:', b);
  res.json({message:'Booking received', booking:b});
});
app.get('/api/bookings', (req,res)=>{ res.json(bookings); });
`;
  if (s.includes('app.listen')) {
    s = s.replace('app.listen', code + '\napp.listen');
  } else {
    s += code;
  }
  fs.writeFileSync('server.js', s);
  console.log('server.js patched!');
}
