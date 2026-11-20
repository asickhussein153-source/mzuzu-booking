const fs = require('fs');
let html = fs.readFileSync('booking.html','utf8');

if (!html.includes('id="bookingForm"')) {
  html = html.replace('<form', '<form id="bookingForm"', 1);
}

const script = `
<script>
const token = localStorage.getItem('token');
if (!token) {
  alert('Please login first to book a room');
  window.location.href = 'login.html';
}
document.getElementById('bookingForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = Object.fromEntries(fd.entries());
  data.name = localStorage.getItem('name') || 'Student';
  data.email = localStorage.getItem('email') || '';
  try {
    const res = await fetch('http://localhost:3000/api/bookings', {
      method: 'POST',
      headers: {'Content-Type':'application/json', 'Authorization':'Bearer ' + token},
      body: JSON.stringify(data)
    });
    const out = await res.json();
    if (res.ok) {
      alert('Booking Request Sent! ' + (out.message || ''));
      e.target.reset();
    } else {
      alert('Failed: ' + (out.message || 'Please login again'));
      if (res.status === 401) window.location.href = 'login.html';
    }
  } catch (err) {
    alert('Server not running. Start Backend!');
  }
});
</script>
`;

if (!html.includes('localStorage.getItem')) {
  html = html.replace('</body>', script + '</body>');
}

fs.writeFileSync('booking.html', html);
console.log('booking.html patched!');
