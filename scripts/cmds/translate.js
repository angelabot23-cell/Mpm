const axios = require('axios');
const { createCanvas } = require('canvas');
const fs = require('fs-extra');
const path = require('path');

// Fonction utilitaire pour découper le texte long sur plusieurs lignes
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = ctx.measureText(testLine);
        let testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, currentY);
            line = words[n] + ' ';
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, currentY);
    return currentY + lineHeight; // Retourne la position finale Y
}

// 🖼️ Générateur d'image Canvas Premium (Format Carré 800x800)
async function generateTranslateCanvas(originalText, translatedText, fromLang, toLang) {
    const size = 800;
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Fond dégradé radial immersif
    let gradient = ctx.createRadialGradient(size/2, size/2, 50, size/2, size/2, size);
    gradient.addColorStop(0, '#111827');
    gradient.addColorStop(1, '#070a12');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Bordures Néon Émeraude
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, size - 40, size - 40);

    // En-tête / Header
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 32px "Sans-Serif"';
    ctx.fillText("⚡ NÉO TRANSLATE INDEX", 50, 75);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "Sans-Serif"';
    ctx.fillText(`${fromLang.toUpperCase()}  ➔  ${toLang.toUpperCase()}`, 50, 115);

    // Ligne de séparation de l'en-tête
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(30, 145); ctx.lineTo(size - 30, 145); ctx.stroke();

    const maxTextWidth = 680;

    // --- ZONE 1 : BLOC TEXTE ORIGINAL ---
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.fillRect(40, 175, 720, 250);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeRect(40, 175, 720, 250);

    ctx.fillStyle = '#6b7280';
    ctx.font = 'bold 14px "Sans-Serif"';
    ctx.fillText("ORIGINAL TEXT //", 60, 210);

    ctx.fillStyle = '#9ca3af';
    ctx.font = 'italic 18px "Sans-Serif"';
    // Limite préventive globale pour éviter les débordements extrêmes
    let cleanOrigText = originalText.length > 500 ? originalText.substring(0, 497) + "..." : originalText;
    wrapText(ctx, cleanOrigText, 60, 245, maxTextWidth, 26);


    // --- ZONE 2 : BLOC TRADUCTION ---
    ctx.fillStyle = 'rgba(16, 185, 129, 0.03)';
    ctx.fillRect(40, 455, 720, 270);
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.strokeRect(40, 455, 720, 270);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 14px "Sans-Serif"';
    ctx.fillText("TRANSLATED OUTPUT //", 60, 490);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Sans-Serif"';
    let cleanTransText = translatedText.length > 600 ? translatedText.substring(0, 597) + "..." : translatedText;
    wrapText(ctx, cleanTransText, 60, 530, maxTextWidth, 32);


    // Footer Matrix
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.font = 'bold 11px "Sans-Serif"';
    ctx.textAlign = 'center';
    ctx.fillText("» TRANSLATION CORE TRANSLATOR SYSTEM V3.0 «", size / 2, size - 35);

    const tmpDir = path.join(__dirname, 'cache');
    await fs.ensureDir(tmpDir);
    const p = path.join(tmpDir, `trans_${Date.now()}.png`);
    await fs.writeFile(p, canvas.toBuffer('image/png'));
    return p;
}

// Fonction de traduction via Google API
async function translate(text, langCode) {
    const res = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(text)}`);
    return {
        text: res.data[0].map(item => item[0]).join(''),
        lang: res.data[2]
    };
}

// Fonction principale d'envoi
async function translateAndSendMessage(content, langCodeTrans, message) {
    try {
        const { text, lang } = await translate(content.trim(), langCodeTrans.trim());
        const imagePath = await generateTranslateCanvas(content, text, lang, langCodeTrans);
        
        await message.reply({
            body: `✅ Traduction système complétée avec succès :`,
            attachment: fs.createReadStream(imagePath)
        }, () => {
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        });
    } catch (err) {
        console.error(err);
        message.reply("⚠️ Une erreur est survenue lors du traitement de la traduction graphique.");
    }
}

module.exports = {
	config: {
		name: "translate",
		aliases: ["trans", "trad"],
		version: "3.0",
		author: "NTKhang x Célestin",
		countDown: 5,
		role: 0,
		category: "utility",
        shortDescription: "Traduit un texte à l'aide d'un grand format graphique (Canvas Carré)"
	},

	onStart: async function ({ message, event, args, threadsData }) {
		const { body = "" } = event;
		let content;
		let langCodeTrans;
		const langOfThread = await threadsData.get(event.threadID, "data.lang") || "fr";

		if (event.messageReply) {
			content = event.messageReply.body;
			langCodeTrans = args[0] && args[0].length <= 3 ? args[0] : langOfThread;
		} else {
			content = args.join(" ");
			let sep = content.lastIndexOf("->");
			if (sep !== -1) {
				langCodeTrans = content.slice(sep + 2).trim();
				content = content.slice(0, sep).trim();
			} else {
				langCodeTrans = langOfThread;
			}
		}

		if (!content) return message.reply("⚠️ Veuillez entrer un contenu textuel valide à décoder.");
		await translateAndSendMessage(content, langCodeTrans, message);
	}
};
		
