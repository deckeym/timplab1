const axios = require("axios");
const nodemailer = require("nodemailer");

const API_URL = "http://localhost:5000/threats";

const GMAIL_USER = "clashroyale.1.prins@gmail.com";
const GMAIL_APP_PASSWORD = "cvdv xlbr whgj lpob";

const CHECK_INTERVAL_MS = 60 * 1000;
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD
  }
});

function shouldSendReminder(incident) {
  if (!incident) return false;
  if (incident.statusReminderSent) return false;
  if (String(incident.status).trim() !== "Новый") return false;
  if (!incident.detectedAt) return false;
  if (!incident.notificationEmail) return false;

  const detectedTime = new Date(incident.detectedAt).getTime();

  if (Number.isNaN(detectedTime)) return false;

  const diff = Date.now() - detectedTime;
  return diff >= TWO_HOURS_MS;
}

async function sendReminderEmail(incident) {
  const subject = `Уведомление: инцидент "${incident.title}" не обновлен`;
  const text = `
Здравствуйте!

Инцидент информационной безопасности не был обновлен в течение 2 часов с момента обнаружения.

ID: ${incident.id}
Название: ${incident.title}
Статус: ${incident.status}
Категория: ${incident.category || "-"}
Критичность: ${incident.severity || "-"}
Дата и время обнаружения: ${incident.detectedAt}
Владелец: ${incident.ownerUsername || "-"}
Ответственный: ${incident.responsible || "-"}

Требуется перевести инцидент в статус "В работе" или в другой актуальный статус.

Письмо сформировано автоматически локальным уведомителем.
  `.trim();

  await transporter.sendMail({
    from: GMAIL_USER,
    to: incident.notificationEmail,
    subject,
    text
  });
}

async function markReminderSent(incident) {
  await axios.patch(
    `${API_URL}/${incident.id}`,
    { statusReminderSent: true },
    { headers: { "Content-Type": "application/json" } }
  );
}

async function checkIncidents() {
  try {
    const response = await axios.get(API_URL, {
      headers: { "Content-Type": "application/json" }
    });

    const incidents = response.data || [];

    for (const incident of incidents) {
      if (!shouldSendReminder(incident)) {
        continue;
      }

      try {
        await sendReminderEmail(incident);
        await markReminderSent(incident);

        console.log(
          `[OK] Уведомление отправлено для инцидента ${incident.id} (${incident.title}) на ${incident.notificationEmail}`
        );
      } catch (error) {
        console.error(
          `[ERROR] Не удалось отправить уведомление для инцидента ${incident.id}:`,
          error.message
        );
      }
    }
  } catch (error) {
    console.error("[ERROR] Ошибка проверки инцидентов:", error.message);
  }
}

console.log("Локальный уведомитель запущен. Проверка раз в 1 минуту.");
checkIncidents();
setInterval(checkIncidents, CHECK_INTERVAL_MS);