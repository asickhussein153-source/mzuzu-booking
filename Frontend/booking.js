document.getElementById('bookingForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const roomFromUrl = new URLSearchParams(location.search).get('room');
  const bookingDate = fd.get('bookingDate');
  const startTime = fd.get('startTime');
  const endTime = fd.get('endTime');
  const data = {
    name: fd.get('fullName'),
    fullName: fd.get('fullName'),
    registrationNumber: fd.get('registrationNumber'),
    email: fd.get('email'),
    phone: fd.get('phone'),
    eventName: fd.get('eventName'),
    eventType: fd.get('eventType'),
    purpose: fd.get('purpose'),
    participants: fd.get('participants'),
    guests: fd.get('participants'),
    room: roomFromUrl || fd.get('room'),
    roomId: roomFromUrl || fd.get('room'),
    roomName: roomFromUrl || fd.get('room'),
    bookingDate: bookingDate,
    startTime: startTime,
    endTime: endTime,
    checkIn: bookingDate && startTime ? bookingDate + 'T' + startTime : bookingDate,
    checkOut: bookingDate && endTime ? bookingDate + 'T' + endTime : bookingDate,
    total: 0
  };
  console.log('SENDING:', data);
  const res = await fetch('https://mzuzu-booking-2.onrender.com/api/bookings', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(data)
  });
  const result = await res.json();
  alert(result.message || 'Booking successful!');
  if(res.ok) e.target.reset();
});
