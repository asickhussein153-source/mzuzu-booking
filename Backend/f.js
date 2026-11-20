let fs=require('fs');
let p='../Frontend/admin.html';
let t=fs.readFileSync(p,'utf8');
t=t.split('<div id="reasonBox" class="modal">').join('<div id="reasonBox" class="modal" style="display:none">');
t=t.split('pendingRejectId = id;').join("pendingRejectId = id; document.getElementById('reasonBox').style.display='block';");
t=t.split('pendingRejectId=null;').join("pendingRejectId=null; document.getElementById('reasonBox').style.display='none';");
t=t.split('pendingRejectId = null;').join("pendingRejectId = null; document.getElementById('reasonBox').style.display='none';");
fs.writeFileSync(p,t);
console.log('fixed reasonBox');
