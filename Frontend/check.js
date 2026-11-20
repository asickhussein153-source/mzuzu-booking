
const token = localStorage.getItem('token');
if (!token) {
  alert('Please login first to book a room');
  window.location.href = 'login.html';
}
async function submitBooking() {
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = Object.fromEntries(fd.entries());
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

    alert(out.message || 'Please login again');
      if (res.status === 401) window.location.href = 'login.html';
    }
  } catch (err) {
    alert('Server not running. Start Backend!');
  }
}
