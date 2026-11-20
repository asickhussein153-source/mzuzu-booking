const fs = require('fs');
let s = fs.readFileSync('server.js','utf8');
if(!s.includes('mailer')) s = s.replace("const bcrypt", "const { sendMail } = require('./mailer');\nconst bcrypt");
if(!s.includes('/approve')){
const code = `
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
`;
  if(s.includes('app.listen')) s = s.replace('app.listen', code + '\napp.listen');
  else s += code;
}
fs.writeFileSync('server.js', s);
console.log('Patched!');
