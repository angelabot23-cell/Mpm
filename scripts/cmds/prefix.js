const { createCanvas, loadImage } = require('canvas');
const fs = require("fs-extra");
const path = require("path");
const GIFEncoder = require('gifencoder');
const { utils } = global;

// ==========================================
// 🎨 ENGINE CANVAS ANIMÉ ADVANCED CYBER (1000x580)
// ==========================================
async function generatePrefixCanvas(userId, title, prefixText, detailsText, themeColor, badgeText = "STATUS") {
	const width = 1000;
	const height = 580;
	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext('2d');

	const charsArray = Array.from(prefixText);
	let framesText = [];
	let cursorState = []; // Gère le clignotement du curseur

	// Étape A : Écriture progressive avec curseur actif
	for (let i = 1; i <= charsArray.length; i++) {
		framesText.push(charsArray.slice(0, i).join(""));
		cursorState.push(true);
	}
	// Étape B : Pause statique avec curseur clignotant (effet Glitch/Terminal)
	const fullText = charsArray.join("");
	for (let i = 0; i < 4; i++) {
		framesText.push(fullText);
		cursorState.push(i % 2 === 0); // Alterne allumé/éteint
	}
	// Étape C : Effacement progressif rapide
	for (let i = charsArray.length - 1; i >= 0; i--) {
		framesText.push(charsArray.slice(0, i).join(""));
		cursorState.push(true);
	}

	const tmpDir = path.join(__dirname, "..", "cache");
	await fs.ensureDir(tmpDir);
	const gifPath = path.join(tmpDir, `prefix_${Date.now()}_${userId}.gif`);

	const encoder = new GIFEncoder(width, height);
	const writeStream = fs.createWriteStream(gifPath);
	encoder.createReadStream().pipe(writeStream);

	encoder.start();
	encoder.setRepeat(0);   
	encoder.setDelay(80); // Vitesse boostée à 80ms pour des animations fluides
	encoder.setQuality(15);

	let userAvatar = null;
	const avatarUrl = `https://graph.facebook.com/${userId}/picture?height=500&width=500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
	try {
		userAvatar = await loadImage(avatarUrl);
	} catch (e) {
		try {
			userAvatar = await loadImage(`https://api.mestaria.com/fb/avatar?id=${userId}`);
		} catch (err) {}
	}

	const avatarX = 200;
	const avatarY = 290;
	const radius = 110;

	for (let f = 0; f < framesText.length; f++) {
		ctx.clearRect(0, 0, width, height);

		// Fond sombre avec dégradé radial
		let gradient = ctx.createRadialGradient(width/2, height/2, 50, width/2, height/2, width);
		gradient.addColorStop(0, '#100a26');
		gradient.addColorStop(0.7, '#05060f');
		gradient.addColorStop(1, '#010204');
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, width, height);

		// Cadre Lumineux Néon Cyber
		ctx.strokeStyle = themeColor;
		ctx.lineWidth = 4;
		ctx.shadowColor = themeColor;
		ctx.shadowBlur = 18;
		ctx.beginPath();
		ctx.roundRect(30, 30, width - 60, height - 60, 20);
		ctx.stroke();
		ctx.shadowBlur = 0; 

		// ANIMATION 1 : Double anneau rotatif autour de l'avatar
		// Anneau fixe de fond
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
		ctx.lineWidth = 6;
		ctx.beginPath();
		ctx.arc(avatarX, avatarY, radius + 15, 0, Math.PI * 2);
		ctx.stroke();

		// Fragment tournant (sens horaire)
		ctx.strokeStyle = themeColor;
		ctx.lineWidth = 5;
		ctx.beginPath();
		let startAngle = f * 0.3; 
		ctx.arc(avatarX, avatarY, radius + 15, startAngle, startAngle + Math.PI * 0.8);
		ctx.stroke();

		// Petit point orbital inversé (sens anti-horaire)
		ctx.fillStyle = '#ffffff';
		ctx.beginPath();
		let dotAngle = -(f * 0.2);
		ctx.arc(avatarX + (radius + 25) * Math.cos(dotAngle), avatarY + (radius + 25) * Math.sin(dotAngle), 4, 0, Math.PI * 2);
		ctx.fill();

		// Rendu Avatar
		if (userAvatar) {
			ctx.save();
			ctx.beginPath();
			ctx.arc(avatarX, avatarY, radius, 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.clip();
			ctx.drawImage(userAvatar, avatarX - radius, avatarY - radius, radius * 2, radius * 2);
			ctx.restore();
		} else {
			ctx.fillStyle = themeColor;
			ctx.beginPath(); 
			ctx.arc(avatarX, avatarY, radius, 0, Math.PI * 2); 
			ctx.fill();
		}

		// Badge Statut
		ctx.fillStyle = themeColor;
		ctx.beginPath();
		ctx.roundRect(width - 165, 65, 100, 26, 6);
		ctx.fill();
		ctx.fillStyle = '#000000';
		ctx.font = 'bold 11px "Sans-Serif"';
		ctx.textAlign = 'center';
		ctx.fillText(badgeText.toUpperCase(), width - 115, 82);

		// Textes de gauche
		ctx.textAlign = 'left';
		ctx.fillStyle = '#ffffff';
		ctx.font = 'bold 38px "Sans-Serif"';
		ctx.fillText(title.toUpperCase(), 420, 115);

		ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
		ctx.font = '16px "Sans-Serif"';
		const cleanDetails = detailsText.length > 45 ? detailsText.substring(0, 42) + "..." : detailsText;
		ctx.fillText(cleanDetails, 420, 155);

		const decoration = "⚡ ─── ❖ ── ✦ ── ❖ ─── ⚡";

		// Séparateur haut
		ctx.textAlign = 'left';
		ctx.fillStyle = themeColor;
		ctx.font = 'bold 18px Arial';
		ctx.fillText(decoration, 420, 215);

		// ANIMATION 2 : Rendu texte + Curseurs clignotants alternés (┃ ou ▕)
		ctx.textAlign = 'center';
		ctx.fillStyle = '#ffffff';
		ctx.shadowColor = themeColor;
		ctx.shadowBlur = 25;
		ctx.font = 'bold 125px "Sans-Serif", "Segoe UI Emoji"';
		
		let textToRender = framesText[f] + (cursorState[f] ? "┃" : " ");
		ctx.fillText(textToRender, 670, 345);
		ctx.shadowBlur = 0;

		// ANIMATION 3 : Clignotement léger du label inférieur
		ctx.fillStyle = (f % 4 === 0) ? '#ffffff' : themeColor;
		ctx.font = 'bold 13px "Sans-Serif"';
		ctx.fillText("⚡ SYSTEM LIVE TERMINAL ⚡", 670, 395);

		// Séparateur bas
		ctx.textAlign = 'left';
		ctx.fillStyle = themeColor;
		ctx.font = 'bold 18px Arial';
		ctx.fillText(decoration, 420, 455);

		// Footer
		ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
		ctx.font = '11px "Sans-Serif"';
		ctx.fillText("» HYPER ENGINE V4.0 «", 420, 510);

		encoder.addFrame(ctx);
	}

	encoder.finish();
	await new Promise((resolve) => writeStream.on('finish', resolve));
	return gifPath;
}

module.exports = {
	config: {
		name: "prefix",
		version: "4.0 Hyper-Animé",
		author: "NTKhang x Célestin 🔥",
		countDown: 2,
		role: 0,
		description: "Affiche ou modifie le préfixe avec une interface cyberpunk ultra-animée",
		category: "config",
		guide: {
			en: "   {pn} <nouveau préfixe>\n   Exemple: {pn} #\n\n   {pn} reset"
		}
	},

	onStart: async function ({ message, role, args, commandName, event, threadsData }) {
		const senderID = event.senderID;
		const chatDeco = "⚡ ════════════════════ ⚡";

		if (!args[0]) {
			const sysPrefix = global.GoatBot.config.prefix;
			const groupPrefix = utils.getPrefix(event.threadID);
			const imagePath = await generatePrefixCanvas(senderID, "Core System", groupPrefix, `Global : [ ${sysPrefix} ]`, "#00ffcc", "ACTIVE");
			
			return message.reply({
				body: `${chatDeco}\n⚙️ **PRÉFIXE DU GROUPE :** [ ${groupPrefix} ]\n🌍 **PRÉFIXE GLOBAL :** [ ${sysPrefix} ]\n${chatDeco}`,
				attachment: fs.createReadStream(imagePath)
			}, () => {
				setTimeout(() => { if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath); }, 2000);
			});
		}

		if (args[0] == 'reset') {
			await threadsData.set(event.threadID, null, "data.prefix");
			const defaultPrefix = global.GoatBot.config.prefix;
			const imagePath = await generatePrefixCanvas(senderID, "Reset System", defaultPrefix, "Retour usine", "#ff3366", "RESET");
			
			return message.reply({
				body: `${chatDeco}\n🔄 **RÉINITIALISATION REUSSIE**\nPréfixe par défaut : [ ${defaultPrefix} ]\n${chatDeco}`,
				attachment: fs.createReadStream(imagePath)
			}, () => {
				setTimeout(() => { if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath); }, 2000);
			});
		}

		const newPrefix = args[0];
		const formSet = { commandName, author: senderID, newPrefix };

		if (args[1] === "-g") {
			if (role < 2) return;
			formSet.setGlobal = true;
		} else {
			formSet.setGlobal = false;
		}

		return message.reply(
			`${chatDeco}\n⚠️ **CONFIRMATION RECOMISE**\nRéagissez pour appliquer le préfixe : [ ${newPrefix} ]\n${chatDeco}`,
			(err, info) => {
				formSet.messageID = info.messageID;
				global.GoatBot.onReaction.set(info.messageID, formSet);
			}
		);
	},

	onReaction: async function ({ message, threadsData, event, Reaction }) {
		const { author, newPrefix, setGlobal } = Reaction;
		if (event.userID !== author) return;
		const chatDeco = "⚡ ════════════════════ ⚡";

		if (setGlobal) {
			global.GoatBot.config.prefix = newPrefix;
			fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
			
			const imagePath = await generatePrefixCanvas(author, "Global Config", newPrefix, "Réseau global mis à jour", "#9d4edd", "GLOBAL");
			return message.reply({
				body: `${chatDeco}\n🌐 **PRÉFIXE GLOBAL CONFIGURÉ**\nNouveau préfixe : [ ${newPrefix} ]\n${chatDeco}`,
				attachment: fs.createReadStream(imagePath)
			}, () => {
				setTimeout(() => { if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath); }, 2000);
			});
		} else {
			await threadsData.set(event.threadID, newPrefix, "data.prefix");
			
			const imagePath = await generatePrefixCanvas(author, "Local Config", newPrefix, "Ce groupe uniquement", "#00ffcc", "LOCAL");
			return message.reply({
				body: `${chatDeco}\n📌 **PRÉFIXE LOCAL CONFIGURÉ**\nNouveau préfixe du groupe : [ ${newPrefix} ]\n${chatDeco}`,
				attachment: fs.createReadStream(imagePath)
			}, () => {
				setTimeout(() => { if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath); }, 2000);
			});
		}
	},

	onChat: async function ({ event, message }) {
		if (event.body && event.body.toLowerCase() === "prefix") {
			const uid = event.senderID;
			const chatDeco = "⚡ ════════════════════ ⚡";
			const sysPrefix = global.GoatBot.config.prefix;
			const groupPrefix = utils.getPrefix(event.threadID);

			const imagePath = await generatePrefixCanvas(uid, "Core System", groupPrefix, `Global : [ ${sysPrefix} ]`, "#00ffcc", "ACTIVE");

			return message.reply({
				body: `${chatDeco}\n⚙️ **PRÉFIXE DU GROUPE :** [ ${groupPrefix} ]\n🌍 **PRÉFIXE GLOBAL :** [ ${sysPrefix} ]\n${chatDeco}`,
				attachment: fs.createReadStream(imagePath)
			}, () => {
				setTimeout(() => { if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath); }, 2000);
			});
		}
	}
};
