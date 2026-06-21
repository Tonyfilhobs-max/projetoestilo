const prizes = [
  { name: '5% de desconto', weight: 25 },
  { name: '10% de desconto', weight: 20 },
  { name: '15% de desconto', weight: 15 },
  { name: '20% de desconto', weight: 8 },
  { name: '25% de desconto', weight: 3 },
  { name: 'Brinde surpresa', weight: 5 },
  { name: 'Desconto especial em óculos', weight: 12 },
  { name: 'Desconto especial em perfumes', weight: 12 }
];

const storeWhatsApp = '5587991017197';
const adminPassword = 'style123';
const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
let currentRotation = 0;
let participant = null;

function drawWheel() {
  const center = canvas.width / 2;
  const radius = center - 8;
  const slice = (Math.PI * 2) / prizes.length;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  prizes.forEach((prize, index) => {
    const start = index * slice;
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, start, start + slice);
    ctx.closePath();
    ctx.fillStyle = index % 2 === 0 ? '#d4af37' : '#073b8e';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(start + slice / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = index % 2 === 0 ? '#071226' : '#ffffff';
    ctx.font = 'bold 13px Arial';
    wrapText(prize.name, radius - 16, 4, 88, 15);
    ctx.restore();
  });

  ctx.beginPath();
  ctx.arc(center, center, 58, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
}

function wrapText(text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let lines = [];
  words.forEach(word => {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxWidth) {
      lines.push(line.trim());
      line = word + ' ';
    } else {
      line = test;
    }
  });
  lines.push(line.trim());
  lines.forEach((l, i) => ctx.fillText(l, x, y + (i - lines.length / 2) * lineHeight));
}

function cleanPhone(phone) {
  return phone.replace(/\D/g, '');
}

function pickPrize() {
  const total = prizes.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * total;
  for (const prize of prizes) {
    random -= prize.weight;
    if (random <= 0) return prize;
  }
  return prizes[0];
}

function couponCode() {
  return 'STYLE-' + Math.random().toString(36).substring(2, 7).toUpperCase();
}

function getParticipants() {
  return JSON.parse(localStorage.getItem('styleParticipants') || '[]');
}

function saveParticipant(data) {
  const list = getParticipants();
  list.push(data);
  localStorage.setItem('styleParticipants', JSON.stringify(list));
  localStorage.setItem('stylePhone_' + data.phone, 'true');
}

function showConfetti() {
  for (let i = 0; i < 70; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.background = ['#d4af37', '#ffffff', '#073b8e', '#f5d76e'][Math.floor(Math.random() * 4)];
    c.style.animationDelay = Math.random() * .8 + 's';
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 3200);
  }
}

function playSound() {
  try {
    const audio = new AudioContext();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.frequency.value = 720;
    gain.gain.setValueAtTime(0.08, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.25);
    osc.start();
    osc.stop(audio.currentTime + 0.25);
  } catch (e) {}
}

function showResult(prize, code) {
  document.getElementById('resultBox').classList.remove('hidden');
  document.getElementById('prizeText').innerText = `Você ganhou: ${prize.name}`;
  document.getElementById('couponCode').innerText = code;
  const msg = `Olá! Ganhei ${prize.name} na Roleta da Style Essence. Meu cupom é ${code}. Nome: ${participant.name}. WhatsApp: ${participant.phone}`;
  document.getElementById('whatsappBtn').href = `https://wa.me/${storeWhatsApp}?text=${encodeURIComponent(msg)}`;
  showConfetti();
}

document.getElementById('startBtn').addEventListener('click', () => {
  const name = document.getElementById('name').value.trim();
  const phone = cleanPhone(document.getElementById('phone').value);
  const terms = document.getElementById('terms').checked;

  if (!name || phone.length < 10 || !terms) {
    alert('Preencha nome, WhatsApp válido e aceite participar.');
    return;
  }
  if (localStorage.getItem('stylePhone_' + phone)) {
    alert('Este WhatsApp já participou nesta promoção neste aparelho.');
    return;
  }
  participant = { name, phone };
  document.getElementById('formCard').classList.add('hidden');
  document.getElementById('wheelArea').classList.remove('hidden');
});

document.getElementById('spinBtn').addEventListener('click', () => {
  const btn = document.getElementById('spinBtn');
  btn.disabled = true;
  playSound();
  const prize = pickPrize();
  const prizeIndex = prizes.findIndex(p => p.name === prize.name);
  const sliceDeg = 360 / prizes.length;
  const targetDeg = 270 - (prizeIndex * sliceDeg + sliceDeg / 2);
  const spins = 360 * 6;
  currentRotation += spins + targetDeg;
  canvas.style.transform = `rotate(${currentRotation}deg)`;

  setTimeout(() => {
    const code = couponCode();
    const data = { ...participant, prize: prize.name, coupon: code, date: new Date().toLocaleString('pt-BR') };
    saveParticipant(data);
    showResult(prize, code);
  }, 5200);
});

document.getElementById('adminBtn').addEventListener('click', () => {
  if (document.getElementById('adminPass').value !== adminPassword) {
    alert('Senha incorreta.');
    return;
  }
  document.getElementById('adminPanel').classList.remove('hidden');
  renderParticipants();
});

function renderParticipants() {
  const list = getParticipants();
  const box = document.getElementById('participants');
  if (!list.length) {
    box.innerHTML = '<p>Nenhum participante ainda.</p>';
    return;
  }
  box.innerHTML = list.map(p => `<div class="participant"><strong>${p.name}</strong><br>WhatsApp: ${p.phone}<br>Prêmio: ${p.prize}<br>Cupom: ${p.coupon}<br>Data: ${p.date}</div>`).join('');
}

document.getElementById('exportCsv').addEventListener('click', () => {
  const list = getParticipants();
  const header = 'Nome,WhatsApp,Premio,Cupom,Data\n';
  const rows = list.map(p => `${p.name},${p.phone},${p.prize},${p.coupon},${p.date}`).join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'participantes-style-essence.csv';
  link.click();
});

document.getElementById('clearData').addEventListener('click', () => {
  if (confirm('Deseja apagar todos os participantes deste aparelho?')) {
    localStorage.clear();
    renderParticipants();
  }
});

drawWheel();
