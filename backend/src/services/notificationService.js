const { transporter } = require('../config/mailer');
const { pool } = require('../config/db');

const EMAIL_TEMPLATES = {
  SAMPEL_DITERIMA: {
    subject: 'Sampel Anda Telah Diterima',
    body: (order) => `Halo ${order.nama_perusahaan},\n\nSampel Anda dengan kode tracking ${order.kode_tracking} telah kami terima dan akan segera diproses.\n\nTerima kasih.`,
  },
  ANALISIS: {
    subject: 'Pembayaran Terverifikasi - Analisis Dimulai',
    body: (order) => `Halo ${order.nama_perusahaan},\n\nPembayaran untuk kode tracking ${order.kode_tracking} telah kami verifikasi. Sampel Anda sekarang memasuki tahap analisis.\n\nTerima kasih.`,
  },
  REVIEW_DRAFT: {
    subject: 'Draft Hasil Siap Ditinjau',
    body: (order) => `Halo ${order.nama_perusahaan},\n\nDraft hasil analisis untuk kode tracking ${order.kode_tracking} sudah tersedia. Silakan cek di website tracking kami untuk meninjau dan memberikan persetujuan.\n\nTerima kasih.`,
  },
  PENGESAHAN: {
    subject: 'Draft Disetujui - Proses Pengesahan',
    body: (order) => `Halo ${order.nama_perusahaan},\n\nDraft hasil untuk kode tracking ${order.kode_tracking} telah disetujui dan sedang dalam proses pengesahan.\n\nTerima kasih.`,
  },
  DOWNLOAD_SERTIFIKAT: {
    subject: 'Sertifikat Anda Siap Diunduh',
    body: (order) => `Halo ${order.nama_perusahaan},\n\nSertifikat untuk kode tracking ${order.kode_tracking} sudah siap. Silakan kunjungi website tracking kami untuk mengisi survei kepuasan dan mengunduh sertifikat.\n\nTerima kasih.`,
  },
};

const WHATSAPP_TEMPLATES = {
  SAMPEL_DITERIMA: (order) =>
    `Halo ${order.nama_perusahaan}, sampel Anda dengan kode tracking *${order.kode_tracking}* telah kami terima dan akan segera diproses.`,
  ANALISIS: (order) =>
    `Halo ${order.nama_perusahaan}, pembayaran untuk kode tracking *${order.kode_tracking}* telah terverifikasi. Sampel Anda memasuki tahap analisis.`,
  REVIEW_DRAFT: (order) =>
    `Halo ${order.nama_perusahaan}, draft hasil untuk kode tracking *${order.kode_tracking}* sudah tersedia. Silakan cek website tracking untuk meninjau.`,
  PENGESAHAN: (order) =>
    `Halo ${order.nama_perusahaan}, draft untuk kode tracking *${order.kode_tracking}* telah disetujui dan sedang dalam proses pengesahan.`,
  DOWNLOAD_SERTIFIKAT: (order) =>
    `Halo ${order.nama_perusahaan}, sertifikat untuk kode tracking *${order.kode_tracking}* sudah siap. Silakan isi survei kepuasan di website untuk mengunduhnya.`,
};

async function sendWhatsApp(noHp, message) {
  const response = await fetch(process.env.WHATSAPP_API_URL, {
    method: 'POST',
    headers: {
      Authorization: process.env.WHATSAPP_API_TOKEN,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ target: noHp, message }),
  });
  const data = await response.json();
  if (!response.ok || data.status === false) {
    throw new Error(data.reason || 'Gagal kirim WhatsApp');
  }
}

async function sendStatusNotification(orderId, newStatus) {
  const emailTemplate = EMAIL_TEMPLATES[newStatus];
  const waTemplate = WHATSAPP_TEMPLATES[newStatus];
  if (!emailTemplate && !waTemplate) return;

  const [orders] = await pool.query(
    `SELECT o.kode_tracking, c.nama_perusahaan, c.email, c.no_hp
     FROM orders o JOIN customers c ON c.customer_id = o.customer_id
     WHERE o.order_id = ?`,
    [orderId]
  );
  if (orders.length === 0) return;
  const order = orders[0];

  if (emailTemplate) {
    let status = 'SENT';
    try {
      await transporter.sendMail({
        from: `"Lab KTNT UNPAD" <${process.env.SMTP_USER}>`,
        to: order.email,
        subject: emailTemplate.subject,
        text: emailTemplate.body(order),
      });
    } catch (err) {
      console.error('[EMAIL] Gagal kirim:', err.message);
      status = 'FAILED';
    }
    await pool.query(
      `INSERT INTO notifications (order_id, channel, template, sent_at, status)
       VALUES (?, 'EMAIL', ?, NOW(), ?)`,
      [orderId, newStatus, status]
    );
  }

  if (waTemplate) {
    let status = 'SENT';
    try {
      await sendWhatsApp(order.no_hp, waTemplate(order));
    } catch (err) {
      console.error('[WHATSAPP] Gagal kirim:', err.message);
      status = 'FAILED';
    }
    await pool.query(
      `INSERT INTO notifications (order_id, channel, template, sent_at, status)
       VALUES (?, 'WHATSAPP', ?, NOW(), ?)`,
      [orderId, newStatus, status]
    );
  }
}

// Event "Draft revisi tersedia" tidak mengubah status tracking (tetap
// REVIEW_DRAFT), sehingga tidak bisa lewat sendStatusNotification — pakai
// wording khusus beda dari draft awal.
async function sendDraftRevisionNotification(orderId) {
  const [orders] = await pool.query(
    `SELECT o.kode_tracking, c.nama_perusahaan, c.email, c.no_hp
     FROM orders o JOIN customers c ON c.customer_id = o.customer_id
     WHERE o.order_id = ?`,
    [orderId]
  );
  if (orders.length === 0) return;
  const order = orders[0];

  const emailText = `Halo ${order.nama_perusahaan},\n\nDraft hasil revisi untuk kode tracking ${order.kode_tracking} telah tersedia. Silakan cek di website tracking kami untuk meninjau ulang.\n\nTerima kasih.`;
  const waText = `Halo ${order.nama_perusahaan}, draft hasil revisi untuk kode tracking *${order.kode_tracking}* telah tersedia. Silakan cek website tracking untuk meninjau ulang.`;

  let emailStatus = 'SENT';
  try {
    await transporter.sendMail({
      from: `"Lab KTNT UNPAD" <${process.env.SMTP_USER}>`,
      to: order.email,
      subject: 'Draft Hasil Revisi Telah Tersedia',
      text: emailText,
    });
  } catch (err) {
    console.error('[EMAIL] Gagal kirim:', err.message);
    emailStatus = 'FAILED';
  }
  await pool.query(
    `INSERT INTO notifications (order_id, channel, template, sent_at, status)
     VALUES (?, 'EMAIL', 'DRAFT_REVISI', NOW(), ?)`,
    [orderId, emailStatus]
  );

  let waStatus = 'SENT';
  try {
    await sendWhatsApp(order.no_hp, waText);
  } catch (err) {
    console.error('[WHATSAPP] Gagal kirim:', err.message);
    waStatus = 'FAILED';
  }
  await pool.query(
    `INSERT INTO notifications (order_id, channel, template, sent_at, status)
     VALUES (?, 'WHATSAPP', 'DRAFT_REVISI', NOW(), ?)`,
    [orderId, waStatus]
  );
}

module.exports = { sendStatusNotification, sendDraftRevisionNotification };