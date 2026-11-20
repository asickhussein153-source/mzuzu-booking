const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});
async function sendMail(to, subject, text, booking){
  try{
    let name = booking ? booking.fullName : 'Student';
    let room = booking ? booking.room : '';
    let date = booking ? booking.bookingDate : '';
    let time = booking ? (booking.startTime+' - '+booking.endTime) : '';
    let reason = booking ? (booking.rejectionReason||'') : '';
    let isApproved = subject.includes('Approved');
    let color = isApproved ? '#1a7a3a' : '#c0392b';
    let title = isApproved ? 'Booking Approved' : 'Booking Rejected';
    let statusLine = isApproved ? '<p style="color:#1a7a3a"><b>Status: APPROVED - You can use the room.</b></p>' : '<p style="color:#c0392b"><b>Status: REJECTED</b></p><p><b>Reason:</b> '+reason+'</p>';
    let html = `
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;border:1px solid #eee;border-radius:10px;overflow:hidden">
      <div style="background:#1a5632;color:white;padding:20px;text-align:center">
        <h2 style="margin:0">Mzuzu University</h2>
        <p style="margin:5px 0 0;font-size:13px">Room Booking System</p>
      </div>
      <div style="padding:25px">
        <h3 style="color:${color};margin:0 0 10px">${isApproved ? '✅' : '❌'} ${title}</h3>
        <p>Hi <b>${name}</b>,</p>
        <div style="background:#f7f7f7;padding:15px;border-radius:8px">
          <p style="margin:5px 0"><b>Room:</b> ${room}</p>
          <p style="margin:5px 0"><b>Date:</b> ${date}</p>
          <p style="margin:5px 0"><b>Time:</b> ${time}</p>
        </div>
        ${statusLine}
        <p style="font-size:13px;color:#666;margin-top:20px">Check <b>My Bookings</b> in the app for full details.</p>
      </div>
    </div>`;
    await transporter.sendMail({ from: '"Mzuzu University Booking" <'+process.env.EMAIL_USER+'>', to, subject, text, html });
    console.log('Email sent to', to);
  } catch(e){ console.log('Email failed:', e.message); }
}
module.exports = { sendMail };
