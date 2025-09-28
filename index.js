const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { GoogleSpreadsheet } = require('google-spreadsheet');

// Configuration
const creds = JSON.parse(process.env.GOOGLE_CREDS_JSON );
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

const GROUPS_TO_TRACK = [
  "Ronde Ste Bernadette 🌸",
  "Ronde Ste Bernadette 2024-2025"
];

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('baileys_auth');
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({ version, auth: state });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log("\n\nSCANNE SUR TON TÉLÉPHONE:\n\n" + qr + "\n\n");
        }
        if(connection === 'open') {
            console.log('WhatsApp (Baileys) connecté !');
        }
        if(connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connexion fermée. Reconnexion:', shouldReconnect);
            if(shouldReconnect) {
                connectToWhatsApp();
            }
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        for(const msg of messages) {
            if(!msg.key.remoteJid.endsWith('@g.us')) return; // Only group messages
            if(!msg.message?.conversation && !msg.message?.extendedTextMessage?.text) return;
            const groupName = sock.chats.get(msg.key.remoteJid)?.name || '';
            if(!GROUPS_TO_TRACK.includes(groupName)) return;

            const content = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
            const sender = msg.pushName || 'Inconnu';

            const doc = new GoogleSpreadsheet(SPREADSHEET_ID);
            await doc.useServiceAccountAuth(creds);
            await doc.loadInfo();
            const sheet = doc.sheetsByIndex[0];
            await sheet.addRow({
                date: new Date().toLocaleString('fr-FR'),
                auteur: sender,
                contenu: content,
                groupe: groupName
            });
            console.log(`Msg archivé (${groupName}) : ${content.substr(0,60)}...`);
        }
    });
}

connectToWhatsApp();
