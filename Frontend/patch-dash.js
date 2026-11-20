const fs = require('fs');
let h = fs.readFileSync('dashboard.html','utf8');
if (h.includes('booking.html')) {
  console.log('already has booking link');
} else {
  const btn = '<div style="text-align:center;margin:20px"><a href="booking.html" style="background:#1a5632;color:white;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:bold;display:inline-block">📅 Book a Room</a></div>';
  if (h.includes('Logout')) {
    h = h.replace('Logout', 'Logout</button></div>' + btn + '<div');
    // fallback if that breaks - try simple append
    if (!h.includes('booking.html')) {
      h = h.replace('</body>', btn + '</body>');
    }
  } else {
    h = h.replace('</body>', btn + '</body>');
  }
  fs.writeFileSync('dashboard.html', h);
  console.log('dashboard patched!');
}
