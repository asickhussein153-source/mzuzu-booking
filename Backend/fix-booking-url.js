const fs = require('fs');
let s = fs.readFileSync('server.js','utf8');
if (!s.includes("/api/bookings")) {
  s = s.replace("/api/booking'", "/api/bookings'");
  s = s.replace('"/api/booking"', '"/api/bookings"');
  // Add alias so both work
  s = s.replace("app.listen", "app.post('/api/booking', (req,res)=>{ req.url='/api/bookings'; app.handle(req,res); });\napp.listen");
  fs.writeFileSync('server.js', s);
  console.log('fixed to /api/bookings + alias added');
} else {
  console.log('already has /api/bookings');
}
