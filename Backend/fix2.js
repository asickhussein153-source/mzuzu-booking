const fs = require('fs');
let s = fs.readFileSync('server.js','utf8');
// Make PUT route async + send email
s = s.replace("app.put('/api/bookings/:id', (req, res)", "app.put('/api/bookings/:id', async (req, res)");
if(!s.includes('sendMail(booking.email')){
  s = s.replace("booking.status = status;", "booking.status = status;\n  if(status==='Approved') await sendMail(booking.email, 'Booking Approved - Mzuzu', 'Hi '+booking.fullName+', Your booking for '+booking.room+' on '+booking.bookingDate+' is APPROVED.');\n  if(status==='Rejected') await sendMail(booking.email, 'Booking Rejected - Mzuzu', 'Hi '+booking.fullName+', Your booking for '+booking.room+' was REJECTED. Reason: '+(booking.rejectionReason||req.body.reason||'No reason'));");
}
fs.writeFileSync('server.js', s);
console.log('PUT route now sends email!');
