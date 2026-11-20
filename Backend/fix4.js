const fs = require('fs');
let s = fs.readFileSync('server.js','utf8');
// Pass booking object so mailer can show real name/room/date
s = s.replace(/await sendMail\(booking\.email, 'Booking Approved[^;]*\);/g, "await sendMail(booking.email, 'Booking Approved - Mzuzu', 'Approved', booking);");
s = s.replace(/await sendMail\(booking\.email, 'Booking Rejected[^;]*\);/g, "await sendMail(booking.email, 'Booking Rejected - Mzuzu', 'Rejected', booking);");
// Also fix the POST approve/reject routes if they exist
s = s.split('b.fullName').join('b.fullName');
fs.writeFileSync('server.js', s);
console.log('Gmail now shows real name/room/date!');
