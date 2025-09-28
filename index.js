{\rtf1\ansi\ansicpg1252\cocoartf2639
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;\f1\fnil\fcharset0 AppleColorEmoji;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx566\tx1133\tx1700\tx2267\tx2834\tx3401\tx3968\tx4535\tx5102\tx5669\tx6236\tx6803\pardirnatural\partightenfactor0

\f0\fs24 \cf0 const \{ Client \} = require('whatsapp-web.js');\
const \{ GoogleSpreadsheet \} = require('google-spreadsheet');\
const qrcode = require('qrcode-terminal');\
\
// Variables d'environnement Railway (\'e0 ajouter ensuite)\
const creds = JSON.parse(process.env.GOOGLE_CREDS_JSON); // Ton JSON complet ici en variable Railway\
const SPREADSHEET_ID = process.env.SPREADSHEET_ID; // Mets l'ID Google Sheet scouts\
\
const GROUPS_TO_TRACK = [\
  "Ronde Ste Bernadette 
\f1 \uc0\u55356 \u57144 
\f0 ",\
  "Ronde Ste Bernadette 2024-2025"\
];\
\
const client = new Client();\
\
client.on('qr', qr => qrcode.generate(qr, \{small: true\}));\
client.on('ready', () => console.log('WhatsApp pr\'eat !'));\
\
client.on('message', async (message) => \{\
    if (message.isGroupMsg && message.from.includes('@g.us')) \{\
        if(message.body && message.body.length > 0 && message.chat)\{\
            const chat = await message.getChat();\
            if (GROUPS_TO_TRACK.includes(chat.name)) \{\
                const doc = new GoogleSpreadsheet(SPREADSHEET_ID);\
                await doc.useServiceAccountAuth(creds);\
                await doc.loadInfo();\
                const sheet = doc.sheetsByIndex[0];\
                await sheet.addRow(\{\
                    date: new Date().toLocaleString('fr-FR'),\
                    auteur: message.author || 'Inconnu',\
                    contenu: message.body,\
                    groupe: chat.name\
                \});\
            \}\
        \}\
    \}\
\});\
client.initialize();\
}