process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
  process.exit(1);
});

console.log('--- DÉMARRAGE BOT SCOUTS Railway ---');

const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { GoogleSpreadsheet } = require('google-spreadsheet');

// Variables Railway (facultatif ici, pour la future archivage Sheet)
let creds, SPREADSHEET_ID;
try {
  creds = JSON.parse(process.env.GOOGLE_CREDS_JSON);
  SPREADSHEET_ID = process.env.SPREADSHEET_ID;
  if (!creds || !SPREADSHEET_ID) throw new Error('Variables d’environnement manquantes');
} catch (e) {
  console.error('Erreur config :', e);
}

const GROUPS_TO_TRACK = [
  "Ronde Ste Bernadette 🌸",
  "Ronde Ste Bernadette 2024-2025"
];

async function main() {
  const { state, saveCreds } = await useMultiFileAuthState('/tmp/auth_info_multi');
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({ version, auth: state, printQRInTerminal: true });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log('\n\nQR SCOUTS (colle-le en QR plain-text, scanne instantanément) :\n\n' + qr + '\n\n');
    }
    if(connection === 'open') {
      console.log('WhatsApp (Baileys) connecté et actif !');
    }
    if(connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Connexion fermée. Reconnexion:', shouldReconnect);
      if(shouldReconnect) setTimeout(main, 3000);
      else process.exit(1);
    }
  });

  // -------- LOG MASSIF de tous les messages reçus --------
  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      try {
        const jid = msg.key.remoteJid || "";
        const fromMe = msg.key.fromMe;
        const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
        const sender = msg.pushName || 'Inconnu';
        const messageType = msg.message ? Object.keys(msg.message).join(',') : "inconnu";
        const groupFlag = jid.endsWith('@g.us') ? "[GROUPE]" : "[PRIVÉ]";
        console.log(`[RECU ${groupFlag}] JID: ${jid} | Type: ${messageType} | De: ${sender} | Moi: ${fromMe} | Message: "${body}"`);
      } catch (e) {
        console.error('Erreur logging message :', e);
      }
    }
  });
}

main().catch((e) => {
  console.error("Erreur fatale démarrage bot : ", e);
  process.exit(1);
});
