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

let creds, SPREADSHEET_ID;
try {
  creds = JSON.parse(process.env.GOOGLE_CREDS_JSON);
  SPREADSHEET_ID = process.env.SPREADSHEET_ID;
  if (!creds || !SPREADSHEET_ID) throw new Error('Variables d’environnement manquantes');
} catch (e) {
  console.error('Erreur config :', e);
  process.exit(1);
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

  sock.ev.on('messages.upsert', async ({ messages }) => {
    for(const msg of messages) {
      try {
        if(!msg.key.remoteJid.endsWith('@g.us')) return;
        const groupName = sock.chats?.get(msg.key.remoteJid)?.name || '';
        if(!GROUPS_TO_TRACK.includes(groupName)) return;
        const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
        if(!body) return;
        const sender = msg.pushName || 'Inconnu';
        const doc = new GoogleSpreadsheet(SPREADSHEET_ID);
        await doc.useServiceAccountAuth(creds);
        await doc.loadInfo();
        const sheet = doc.sheetsByIndex[0];
        await sheet.addRow({
          date: new Date().toLocaleString('fr-FR'),
          auteur: sender,
          contenu: body,
          groupe: groupName
        });
        console.log(`Msg archivé [${groupName}] : ${body.substr(0, 80)}...`);
      } catch (e) {
        console.error('Erreur sauvegarde message :', e);
      }
    }
  });
}

main().catch((e) => {
  console.error("Erreur fatale démarrage bot : ", e);
  process.exit(1);
});
