const fs = require('fs');
let s = fs.readFileSync('server.js','utf8');
s = s.replace("app.post('/api/booking'", "app.post('/api/bookings'");
fs.writeFileSync('server.js', s);
console.log('Done');
