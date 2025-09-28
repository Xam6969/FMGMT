const { Client } = require('whatsapp-web.js');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const qrcode = require('qrcode-terminal');

// Variables Railway
const creds = JSON.parse(process.env.GOOGLE_CREDS_JSON);
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

const GROUPS_TO_TRACK = [
  "Ronde Ste Bernadette 🌸",
  "Ronde Ste Bernadette 2024-2025"
];

const client = new Client();

client.on('qr', qr => qrcode.generate(qr, {small: true}));
client.on('ready', () => console.log('WhatsApp prêt !'));

client.on('message', async (message) => {
    if (message.isGroupMsg && message.from && message.from.includes("@g.us")) {
        const chat = await message.getChat();
        if (GROUPS_TO_TRACK.includes(chat.name) && message.body && message.body.length > 0) {
            const doc = new GoogleSpreadsheet(SPREADSHEET_ID);
            await doc.useServiceAccountAuth(creds);
            await doc.loadInfo();
            const sheet = doc.sheetsByIndex[0];
            await sheet.addRow({
                date: new Date().toLocaleString('fr-FR'),
                auteur: message.author || 'Inconnu',
                contenu: message.body,
                groupe: chat.name
            });
        }
    }
});
client.initialize();
