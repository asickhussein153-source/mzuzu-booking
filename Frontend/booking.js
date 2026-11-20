async function submitBooking(e) {

    e.preventDefault();

    const token = localStorage.getItem('token');

    if (!token) {
        alert('Please login first to book a room');
        window.location.href = 'login.html';
        return;
    }

    const fd = new FormData(e.target);

    const data = Object.fromEntries(fd.entries());

    try {

        const res = await fetch('http://localhost:3000/book-room', {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },

            body: JSON.stringify(data)
        });

        const out = await res.json();

        if (res.ok) {

            alert('Booking Request Sent Successfully!');

            document.getElementById('bookingForm').reset();

        } else {

            alert(out.message || 'Booking failed');

            if (res.status === 401) {
                window.location.href = 'login.html';
            }
        }

    } catch (err) {

        alert('Server not running. Please start the backend.');

        console.error(err);
    }
}
