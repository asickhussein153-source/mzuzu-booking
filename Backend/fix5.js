const fs = require('fs');
let s = fs.readFileSync('server.js','utf8');
if(!s.includes('adminFeedback')){
  s = s.replace("booking.status = 'Approved'", "booking.status = 'Approved';\n  booking.adminFeedback = req.body.feedback || 'Your request has been approved.'");
  s = s.replace("booking.status = 'Rejected'", "booking.status = 'Rejected';\n  booking.adminFeedback = req.body.feedback || 'Sorry, your request was not approved.'");
  fs.writeFileSync('server.js', s);
  console.log('Patch done - Gmail untouched, feedback added!');
} else {
  console.log('Already patched, nothing changed!');
}
