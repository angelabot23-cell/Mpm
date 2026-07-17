const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');
const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");

// ==========================================
// 🎨 ENGIN CANVAS POUR LES ACCÈS ADMIN
// ==========================================
async function generateAdminCanvas(userId, title, subtitle, mainText, themeColor) {
	const canvas = createCanvas(900, 480);
	const ctx = canvas.getContext('2d');

	// Fond dégradé sombre Style Forteresse / Royal Cyber
	let gradient = ctx.createLinearGradient(0, 0, 900, 480);
	gradient.addColorStop(0, '#0c0514');
	gradient.addColorStop(0.5, '#180a29');
	gradient.addColorStop(1, '#0c0514');
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// Cadres doubles gravés de la couleur du thème (Or, Rouge ou Vert)
	ctx.strokeStyle = themeColor;
	ctx.lineWidth = 4;
	ctx.strokeRect(25, 25, 850, 430);
	ctx.strokeStyle = '#ffffff';
	ctx.lineWidth = 1;
	ctx.strokeRect(32, 32, 836, 416);

	// Séparateurs graphiques
	ctx.fillStyle = themeColor;
	ctx.font = 'bold 16px "Sans-Serif"';
	ctx.fillText("✧ ▬▭▬ ▬▬ ✦ ▬▬ ▬▭▬ ✧", 420, 65);
	ctx.fillText("✧ ▬▭▬ ▬▬ ✦ ▬▬ ▬▭▬ ✧", 420, 425);

	// Récupération de la photo de profil de la cible ou de l'opérateur
	const avatarUrl = `https://graph.facebook.com/${userId}/picture?width=300&height=300&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
	try {
		const userAvatar = await loadImage(avatarUrl);
		ctx.save();
		ctx.beginPath();
		ctx.arc(190, 240, 110, 0, Math.PI * 2, true);
		ctx.closePath();
		ctx.clip();
		ctx.drawImage(userAvatar, 80, 130, 220, 220);
		ctx.restore();

		// Anneau de sécurité néon
		ctx.strokeStyle = themeColor;
		ctx.lineWidth = 6;
		ctx.beginPath();
		ctx.arc(190, 240, 112, 0, Math.PI * 2);
		ctx.stroke();
	} catch (e) {
		ctx.fillStyle = themeColor;
		ctx.beginPath(); ctx.arc(190, 240, 110, 0, Math.PI * 2); ctx.fill();
	}

	// Écriture des en-têtes système
	ctx.fillStyle = themeColor;
	ctx.font = 'bold 36px "Sans-Serif"';
	ctx.fillText(title, 420, 120);

	ctx.fillStyle = '#ffffff';
	ctx.font = 'bold 22px "Sans-Serif"';
	ctx.fillText(subtitle, 420, 175);

	// Zone d'affichage de la liste ou des UID (Retour à la ligne automatique)
	ctx.fillStyle = '#e0e0e0';
	ctx.font = '18px "Sans-Serif"';
	
	const lines = mainText.split('\n');
	let y = 220;
	const lineHeight = 28;

	for (let i = 0; i < lines.length; i++) {
		if (y > 390) {
			ctx.fillText("• ... et d'autres enregistrements", 420, y);
			break;
		}
		ctx.fillText(lines[i], 420, y);
		y += lineHeight;
	}

	const tmpDir = path.join(__dirname, "..", "cache");
	await fs.ensureDir(tmpDir);
	const imagePath = path.join(tmpDir, `admin_${Date.now()}_${userId}.png`);
	fs.writeFileSync(imagePath, canvas.toBuffer('image/png'));
	return imagePath;
}

module.exports = {
	config: {
		name: "admin",
		version: "3.0",
		author: "NTKhang + Celestin 👑 (Canvas Edition)",
		countDown: 5,
		role: 2,
		description: {
			en: "Manage admin system with visual cards"
		},
		category: "system"
	},

	langs: {
		en: {
			added: "👑 Accès accordé à %1 élu(s) :\n%2",
			alreadyAdmin: "\n⚠️ Déjà dans l'élite :\n%2",
			missingIdAdd: "⚠️ Donne un UID ou tag",
			removed: "❌ Pouvoir retiré à %1 membre(s) :\n%2",
			notAdmin: "⚠️ Non membre du système :\n%2",
			missingIdRemove: "⚠️ Donne un UID ou tag",
			listAdmin: "👑 Les Boss du Système :\n%1"
		}
	},

	onStart: async function ({ message, args, usersData, event, getLang }) {
		const senderID = event.senderID;

		switch (args[0]) {

			// ================= ADD =================
			case "add":
			case "-a": {
				if (!args[1]) return message.reply(getLang("missingIdAdd"));

				let uids = [];
				if (Object.keys(event.mentions).length > 0)
					uids = Object.keys(event.mentions);
				else if (event.messageReply)
					uids.push(event.messageReply.senderID);
				else
					uids = args.filter(arg => !isNaN(arg));

				if (uids.length == 0) return message.reply(getLang("missingIdAdd"));

				const notAdminIds = [];
				const adminIds = [];

				for (const uid of uids) {
					if (config.adminBot.includes(uid)) adminIds.push(uid);
					else notAdminIds.push(uid);
				}

				config.adminBot.push(...notAdminIds);
				writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

				const getNames = await Promise.all(
					uids.map(uid => usersData.getName(uid).then(name => ({ uid, name })))
				);

				const canvasText = getNames.map(i => `• ${i.name}\n  [UID: ${i.uid}]`).join("\n");
				const imagePath = await generateAdminCanvas(uids[0], "👑 ACCÈS SYSTÈME ACCORDÉ", `Élu(s) détecté(s) : ${notAdminIds.length}`, canvasText, "#ffb703");

				let replyText = (notAdminIds.length > 0 ? getLang("added", notAdminIds.length, getNames.map(i => `• ${i.name} (${i.uid})`).join("\n")) : "") +
					(adminIds.length > 0 ? getLang("alreadyAdmin", adminIds.length, adminIds.map(uid => `• ${uid}`).join("\n")) : "");

				return message.reply({ body: replyText, attachment: fs.createReadStream(imagePath) }, () => {
					if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
				});
			}

			// ================= REMOVE =================
			case "remove":
			case "-r": {
				if (!args[1]) return message.reply(getLang("missingIdRemove"));

				let uids = [];
				if (Object.keys(event.mentions).length > 0)
					uids = Object.keys(event.mentions);
				else if (event.messageReply)
					uids.push(event.messageReply.senderID);
				else
					uids = args.filter(arg => !isNaN(arg));

				if (uids.length == 0) return message.reply(getLang("missingIdRemove"));

				const notAdminIds = [];
				const adminIds = [];

				for (const uid of uids) {
					if (config.adminBot.includes(uid)) adminIds.push(uid);
					else notAdminIds.push(uid);
				}

				for (const uid of adminIds)
					config.adminBot.splice(config.adminBot.indexOf(uid), 1);

				writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

				const getNames = await Promise.all(
					adminIds.map(uid => usersData.getName(uid).then(name => ({ uid, name })))
				);

				const canvasText = getNames.map(i => `• ${i.name}\n  [UID: ${i.uid}]`).join("\n");
				const imagePath = await generateAdminCanvas(uids[0], "❌ POUVOIR DESTITUTION", `Statut : ${adminIds.length} révoqué(s)`, canvasText, "#f72585");

				let replyText = (adminIds.length > 0 ? getLang("removed", adminIds.length, getNames.map(i => `• ${i.name} (${i.uid})`).join("\n")) : "") +
					(notAdminIds.length > 0 ? getLang("notAdmin", notAdminIds.length, notAdminIds.map(uid => `• ${uid}`).join("\n")) : "");

				return message.reply({ body: replyText, attachment: fs.createReadStream(imagePath) }, () => {
					if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
				});
			}

			// ================= LIST =================
			case "list":
			case "-l": {
				const getNames = await Promise.all(
					config.adminBot.map(uid => usersData.getName(uid).then(name => ({ uid, name })))
				);

				const canvasText = getNames.map((i, index) => `${index + 1}. ${i.name} (${i.uid})`).join("\n");
				const imagePath = await generateAdminCanvas(senderID, "🛡️ LISTE DES SOUVERAINS", `Total : ${config.adminBot.length} Administrateurs`, canvasText, "#00f5d4");

				return message.reply({ body: getLang("listAdmin", getNames.map(i => `• ${i.name} (${i.uid})`).join("\n")), attachment: fs.createReadStream(imagePath) }, () => {
					if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
				});
			}

			// ================= DEFAULT =================
			default:
				return message.reply("⚠️ Commande invalide. Options valides : add (-a), remove (-r), list (-l)");
		}
	}
};
