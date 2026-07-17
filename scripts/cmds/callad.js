const { getStreamsFromAttachment, log } = global.utils;
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const mediaTypes = ["photo", "png", "animated_image", "video", "audio"];
const TARGET_GROUP_ID = "1286661779130987"; 

// Récupérer l'avatar de l'utilisateur
async function getAvatarBuffer(uid, api) {
	try {
		const userInfo = await api.getUserInfo(uid);
		const url = userInfo[uid]?.thumbSrc || `https://graph.facebook.com/${uid}/picture?type=large`;
		const response = await axios.get(url, { responseType: 'arraybuffer' });
		return Buffer.from(response.data, 'binary');
	} catch (_) {
		try {
			const fallback = await axios.get('https://i.imgur.com/6V7669V.png', { responseType: 'arraybuffer' });
			return Buffer.from(fallback.data, 'binary');
		} catch(__) { return null; }
	}
}

// Récupérer la photo du groupe
async function getGroupImageBuffer(threadID, api) {
	try {
		const threadInfo = await api.getThreadInfo(threadID);
		const url = threadInfo.imageSrc || `https://graph.facebook.com/${threadID}/picture?type=large`;
		const response = await axios.get(url, { responseType: 'arraybuffer' });
		return Buffer.from(response.data, 'binary');
	} catch (_) {
		return null; 
	}
}

// Coins arrondis pour Canvas
function roundRect(ctx, x, y, width, height, radius) {
	if (typeof radius === 'number') {
		radius = {tl: radius, tr: radius, br: radius, bl: radius};
	}
	ctx.beginPath();
	ctx.moveTo(x + radius.tl, y);
	ctx.lineTo(x + width - radius.tr, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
	ctx.lineTo(x + width, y + height - radius.br);
	ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
	ctx.lineTo(x + radius.bl, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
	ctx.lineTo(x, y + radius.tl);
	ctx.quadraticCurveTo(x, y, x + radius.tl, y);
	ctx.closePath();
}

async function createCustomCanvas(title, subText, mainContent, avatarBuffer, groupBuffer, isAnonymous = false) {
	const canvas = createCanvas(800, 450);
	const ctx = canvas.getContext('2d');

	const now = new Date();
	const timeString = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
	const hour = now.getHours();

	let bgColor = '#0a192f';
	let primaryNeon = '#00c6ff';
	let secondaryNeon = '#0072ff';
	let bubbleBg = 'rgba(23, 42, 69, 0.7)';

	if (hour >= 6 && hour < 12) {
		bgColor = '#110c1a';
		primaryNeon = '#b92b27';
		secondaryNeon = '#1565c0';
		bubbleBg = 'rgba(35, 21, 51, 0.7)';
	} else if (hour >= 12 && hour < 18) {
		bgColor = '#0f051d';
		primaryNeon = '#ff007f';
		secondaryNeon = '#00f0ff';
		bubbleBg = 'rgba(37, 12, 62, 0.7)';
	} else if (hour >= 18 && hour < 22) {
		bgColor = '#1a0f00';
		primaryNeon = '#f12711';
		secondaryNeon = '#f5af19';
		bubbleBg = 'rgba(51, 26, 0, 0.7)';
	}

	// Mode anonyme force une couleur sombre / mystérieuse
	if (isAnonymous) {
		bgColor = '#0d0d0d';
		primaryNeon = '#555555';
		secondaryNeon = '#222222';
		bubbleBg = 'rgba(25, 25, 25, 0.8)';
	}

	// Background
	ctx.fillStyle = bgColor;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// Bordures Néon
	const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
	gradient.addColorStop(0, primaryNeon);
	gradient.addColorStop(1, secondaryNeon);
	ctx.strokeStyle = gradient;
	ctx.lineWidth = 10;
	ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

	// Haut de page
	ctx.fillStyle = primaryNeon;
	ctx.font = 'bold 18px Arial';
	ctx.textAlign = 'center';
	ctx.fillText('✦ ▬▭▬ ▬▭▬ ✧ ▬▭▬ ▬▭▬ ✦', canvas.width / 2, 45);

	// Horodatage
	ctx.fillStyle = '#ffffff';
	ctx.font = 'bold 16px Arial';
	ctx.textAlign = 'right';
	ctx.fillText(`🕒 ${timeString}`, canvas.width - 45, 48);

	// Dessin Avatar (ou Avatar Anonyme générique)
	if (avatarBuffer && !isAnonymous) {
		try {
			const img = await loadImage(avatarBuffer);
			ctx.save();
			ctx.beginPath();
			ctx.arc(110, 115, 45, 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.clip();
			ctx.drawImage(img, 65, 70, 90, 90);
			ctx.restore();
		} catch(_) {}
	} else {
		// Rond mystérieux si anonyme ou pas d'image
		ctx.fillStyle = '#1f2937';
		ctx.beginPath();
		ctx.arc(110, 115, 45, 0, Math.PI * 2, true);
		ctx.fill();
		ctx.fillStyle = '#ffffff';
		ctx.font = 'bold 30px Arial';
		ctx.textAlign = 'center';
		ctx.fillText('?', 110, 125);
	}

	// Contour Avatar
	ctx.strokeStyle = primaryNeon;
	ctx.lineWidth = 3;
	ctx.beginPath();
	ctx.arc(110, 115, 45, 0, Math.PI * 2, true);
	ctx.stroke();

	// Miniature Groupe (Masquée si anonyme)
	if (groupBuffer && !isAnonymous) {
		try {
			const groupImg = await loadImage(groupBuffer);
			ctx.save();
			ctx.beginPath();
			ctx.arc(145, 145, 22, 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.clip();
			ctx.drawImage(groupImg, 123, 123, 44, 44);
			ctx.restore();

			ctx.strokeStyle = secondaryNeon;
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(145, 145, 22, 0, Math.PI * 2, true);
			ctx.stroke();
		} catch(_) {}
	}

	// En-têtes textuels
	ctx.fillStyle = '#ffffff';
	ctx.font = 'bold 28px Arial';
	ctx.textAlign = 'left';
	ctx.fillText(isAnonymous ? "📬 MESSAGE ANONYME" : title, 190, 105);

	ctx.fillStyle = '#8892b0';
	ctx.font = 'italic 18px Arial';
	ctx.fillText(isAnonymous ? "Identité protégée" : subText, 190, 135);

	// Bulle de dialogue
	const bubbleX = 60;
	const bubbleY = 180;
	const bubbleWidth = 680;
	const bubbleHeight = 190;

	ctx.fillStyle = bubbleBg;
	roundRect(ctx, bubbleX, bubbleY, bubbleWidth, bubbleHeight, 15);
	ctx.fill();

	ctx.strokeStyle = primaryNeon;
	ctx.lineWidth = 2;
	roundRect(ctx, bubbleX, bubbleY, bubbleWidth, bubbleHeight, 15);
	ctx.stroke();

	// Flèche de la bulle
	ctx.beginPath();
	ctx.moveTo(100, bubbleY);
	ctx.lineTo(110, bubbleY - 12);
	ctx.lineTo(120, bubbleY);
	ctx.fillStyle = bubbleBg;
	ctx.fill();
	ctx.strokeStyle = primaryNeon;
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(100, bubbleY);
	ctx.lineTo(110, bubbleY - 12);
	ctx.lineTo(120, bubbleY);
	ctx.stroke();

	// Corps du texte
	ctx.fillStyle = '#e6f1ff';
	ctx.font = '22px Arial';
	ctx.textAlign = 'left';
	
	const words = mainContent.split(' ');
	let line = '';
	let textX = bubbleX + 25;
	let textY = bubbleY + 40;
	const maxTextWidth = bubbleWidth - 50;
	const lineHeight = 32;

	for (let n = 0; n < words.length; n++) {
		let testLine = line + words[n] + ' ';
		let metrics = ctx.measureText(testLine);
		if (metrics.width > maxTextWidth && n > 0) {
			ctx.fillText(line, textX, textY);
			line = words[n] + ' ';
			textY += lineHeight;
		} else {
			line = testLine;
		}
	}
	ctx.fillText(line, textX, textY);

	// Compteur statistique en bas à droite de la bulle
	ctx.fillStyle = '#8892b0';
	ctx.font = '12px Arial';
	ctx.textAlign = 'right';
	ctx.fillText(`Caractères: ${mainContent.length} | Mots: ${words.length}`, bubbleX + bubbleWidth - 20, bubbleY + bubbleHeight - 15);

	// OS Info à gauche du footer
	ctx.textAlign = 'left';
	ctx.fillText(`[OS: Secure_Line v4.8]`, 40, canvas.height - 32);

	// Pied de page global
	ctx.fillStyle = primaryNeon;
	ctx.font = '14px Arial';
	ctx.textAlign = 'center';
	ctx.fillText('🇨🇩 𝘚𝘺𝘴𝘵𝘦̀𝘮𝘦 𝘥𝘦 𝘚𝘶𝘱𝘱𝘰𝘳𝘵 🛀', canvas.width / 2, canvas.height - 32);

	const cacheDir = path.join(__dirname, 'cache');
	if (!fs.existsSync(cacheDir)) {
		fs.mkdirSync(cacheDir, { recursive: true });
	}

	const cachePath = path.join(cacheDir, `canvas_${Date.now()}.png`);
	const buffer = canvas.toBuffer('image/png');
	fs.writeFileSync(cachePath, buffer);
	
	return cachePath;
}

module.exports = {
	config: {
		name: "callad",
		version: "5.0",
		author: "NTKhang x AI",
		countDown: 5,
		role: 0,
		description: {
			fr: "Envoyer un rapport complet avec mode anonyme optionnel via /anon."
		},
		category: "contacts admin",
		guide: {
			fr: "   {pn} <votre message> (ou utilisez {pn} /anon <message> pour rester masqué)"
		}
	},

	langs: {
		fr: {
			missingMessage: "💙 𝘝𝘦𝘶𝘪𝘭𝘭𝘦𝘻 𝘦𝘯𝘵𝘳𝘦𝘳 𝘭𝘦 𝘮𝘦𝘴𝘴𝘢𝘨𝘦 𝘲𝘶𝘦 𝘷𝘰𝘶𝘴 𝘴𝘰𝘶𝘩𝘢𝘪𝘵𝘦𝘻 𝘦𝘯𝘷𝘰𝘺𝘦𝘳.",
			sendByGroup: "\n🔹 𝘌𝘯𝘷𝘰𝘺𝘦́ 𝘥𝘦𝘱𝘶ਿ𝘴 𝘭𝘦 𝘨𝘳𝘰𝘶𝘱𝒆 : %1\n🔹 𝘐𝘋 : %2",
			sendByUser: "\n🔹 𝘌𝘯𝘷𝘰ย𝘦́ 𝘱𝘢𝘳 𝘮𝘦𝘴𝘴𝘢𝘨𝘦 𝘱𝘳𝘪𝘷𝘦́",
			content: "\n\n╔═════ 📬 𝘊𝘖𝘕𝘛𝘌𝘕𝘜 ═════╗\n%1\n╚═════════════════════╝\n\n💬 𝘙𝘦́𝘱𝘰𝘯𝘥𝘦𝘻 𝘢̀ 𝘤𝘦 𝘮𝘦𝘴𝘴าะ𝘨𝘦 𝘱𝘰𝘶𝘳 𝘦𝘯𝘷𝘰𝘺𝘦𝘳 𝘶𝘯𝘦 𝘳𝘦́𝘱𝘰𝘯𝘴𝒆.",
			success: "💙 𝘝𝘰𝘵𝘳𝘦 𝘮𝘦𝘴𝘴𝘢𝘨𝘦 𝘢 𝘦́𝘵𝘦́ 𝘵𝘳𝘢𝘯𝘴𝘮𝘪𝖘 𝘢𝘷𝘦𝘤 <b>𝘴𝘶𝘤𝘤𝘦̀𝖘</b> !",
			failed: "❌ 𝘐𝘮𝘱𝘰𝓼𝓼𝘪𝘣𝘭e 𝘥'𝘦𝘯𝘷𝘰𝘺𝘦𝘳 𝘭𝘦 𝘮𝘦𝘴𝘴𝘢𝘨𝘦.",
			reply: "✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧\n💙 𝘙𝘌́𝘗𝘖𝘕𝘚𝘌 𝘋𝘌 𝘓'𝘈𝘋𝘔𝘐𝘕𝘐𝘚𝘛𝘙𝘈𝘛𝘌𝘜𝘙 %1 :\n✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧\n\n%2\n\n🛀 𝘙𝘦́𝘱𝘰𝘯𝘥𝘦𝘻 𝘱𝘰𝘶𝘳 𝘤𝘰𝘯𝘵𝘪𝘯𝘶𝘦𝘳 𝘭𝘢 𝘥𝘪𝘴𝘤𝘶𝓼𝘴𝘪ону.",
			replySuccess: "💙 𝘝𝘰𝘵𝘳𝘦 𝘳𝘦́𝘱𝘰𝘯𝘴𝒆 𝘢 𝘦́𝘵𝘦́ 𝘵𝘳𝘢𝘯𝘴𝘮𝘪𝖘𝘦 !",
			feedback: "✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧\n🛀 𝘙𝘌𝘛𝘖𝘜𝘙 𝘋𝘌 𝘓'𝘜𝘛𝘐𝘓𝘐𝘚𝘈𝘛𝘌𝘜𝘙 %1 :\n🔹 𝘐𝘋 : %2%3\n✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧\n\n📬 𝘊𝘰𝘯𝘵𝘦𝘯𝘶 :\n%4",
			replyUserSuccess: "💙 𝘝𝘰𝘵𝘳𝘦 𝘳𝘦́𝘱ону𝘦 𝘢 𝘦́𝘵𝘦́ 𝘵𝘳𝘢𝘯𝘴𝘮𝘪𝖘𝘦 !"
		}
	},

	onStart: async function ({ args, message, event, usersData, threadsData, api, commandName, getLang }) {
		try {
			if (!args[0]) return message.reply(getLang("missingMessage"));
			const { senderID, threadID, isGroup } = event;
			
			let mainMsg = args.join(" ");
			let isAnonymous = false;

			// Détection du mode anonyme déclenché par le flag /anon
			if (mainMsg.startsWith("/anon ")) {
				isAnonymous = true;
				mainMsg = mainMsg.replace("/anon ", "");
			}

			const senderName = isAnonymous ? "Anonyme" : await usersData.getName(senderID);
			const locationText = isGroup ? getLang("sendByGroup", (await threadsData.get(threadID)).threadName, threadID) : getLang("sendByUser");

			const avatarBuffer = isAnonymous ? null : await getAvatarBuffer(senderID, api);
			const groupBuffer = (isGroup && !isAnonymous) ? await getGroupImageBuffer(threadID, api) : null;
			
			const canvasImagePath = await createCustomCanvas("📬 CALL ADMIN", `De : ${senderName}`, mainMsg, avatarBuffer, groupBuffer, isAnonymous);

			const msg = `💙 ═══ 🇨🇩 CALL ADMIN ${isAnonymous ? '[ANONYME]' : ''} ═══ 💙`
				+ `\n🔹 Nom : ${senderName}`
				+ `\n🔹 ID : ${isAnonymous ? 'Masqué' : senderID}`
				+ (isAnonymous ? "\n🔹 Provenance : Message Sécurisé" : locationText);

			const attachments = await getStreamsFromAttachment(
				[...event.attachments, ...(event.messageReply?.attachments || [])].filter(item => mediaTypes.includes(item.type))
			);
			
			if (fs.existsSync(canvasImagePath)) {
				attachments.push(fs.createReadStream(canvasImagePath));
			}

			const formMessage = {
				body: msg + getLang("content", mainMsg),
				mentions: isAnonymous ? [] : [{ id: senderID, tag: senderName }],
				attachment: attachments
			};

			try {
				const messageSend = await api.sendMessage(formMessage, TARGET_GROUP_ID);
				global.GoatBot.onReply.set(messageSend.messageID, {
					commandName,
					messageID: messageSend.messageID,
					threadID,
					messageIDSender: event.messageID,
					type: "userCallAdmin"
				});

				if (fs.existsSync(canvasImagePath)) {
					setTimeout(() => { try { fs.unlinkSync(canvasImagePath); } catch(_) {} }, 5000);
				}
				return message.reply(getLang("success"));
			} catch (err) {
				if (fs.existsSync(canvasImagePath)) {
					setTimeout(() => { try { fs.unlinkSync(canvasImagePath); } catch(_) {} }, 5000);
				}
				log.err("CALL ADMIN", err);
				return message.reply(getLang("failed"));
			}
		} catch (error) {
			console.error(error);
			return message.reply("❌ Une erreur est survenue.");
		}
	},

	onReply: async ({ args, event, api, message, Reply, usersData, commandName, getLang }) => {
		try {
			const { type, threadID, messageIDSender } = Reply;
			const senderName = await usersData.getName(event.senderID);
			const { isGroup } = event;
			const replyMsg = args.join(" ");

			const avatarBuffer = await getAvatarBuffer(event.senderID, api);
			const groupBuffer = isGroup ? await getGroupImageBuffer(event.threadID, api) : null;

			switch (type) {
				case "userCallAdmin": {
					const canvasImagePath = await createCustomCanvas("⌖ L'ADMIN RÉPOND", `Par : ${senderName}`, replyMsg, avatarBuffer, groupBuffer);
					const attachments = await getStreamsFromAttachment(event.attachments.filter(item => mediaTypes.includes(item.type)));
					if (fs.existsSync(canvasImagePath)) attachments.push(fs.createReadStream(canvasImagePath));

					const formMessage = {
						body: getLang("reply", senderName, replyMsg),
						mentions: [{ id: event.senderID, tag: senderName }],
						attachment: attachments
					};

					api.sendMessage(formMessage, threadID, (err, info) => {
						if (fs.existsSync(canvasImagePath)) {
							setTimeout(() => { try { fs.unlinkSync(canvasImagePath); } catch(_) {} }, 5000);
						}
						if (err) return message.err(err);
						message.reply(getLang("replyUserSuccess"));
						global.GoatBot.onReply.set(info.messageID, {
							commandName,
							messageID: info.messageID,
							messageIDSender: event.messageID,
							threadID: event.threadID,
							type: "adminReply"
						});
					}, messageIDSender);
					break;
				}
				case "adminReply": {
					let sendByGroup = "";
					if (isGroup) {
						try {
							const threadInfo = await api.getThreadInfo(event.threadID);
							sendByGroup = getLang("sendByGroup", threadInfo.threadName, event.threadID);
						} catch(_) {}
					}

					const canvasImagePath = await createCustomCanvas("✎ NOUVEAU MESSAGE", `De : ${senderName}`, replyMsg, avatarBuffer, groupBuffer);
					const attachments = await getStreamsFromAttachment(event.attachments.filter(item => mediaTypes.includes(item.type)));
					if (fs.existsSync(canvasImagePath)) attachments.push(fs.createReadStream(canvasImagePath));

					const formMessage = {
						body: getLang("feedback", senderName, event.senderID, sendByGroup, replyMsg),
						mentions: [{ id: event.senderID, tag: senderName }],
						attachment: attachments
					};

					api.sendMessage(formMessage, TARGET_GROUP_ID, (err, info) => {
						if (fs.existsSync(canvasImagePath)) {
							setTimeout(() => { try { fs.unlinkSync(canvasImagePath); } catch(_) {} }, 5000);
						}
						if (err) return message.err(err);
						message.reply(getLang("replySuccess"));
						global.GoatBot.onReply.set(info.messageID, {
							commandName,
							messageID: info.messageID,
							messageIDSender: event.messageID,
							threadID: event.threadID,
							type: "userCallAdmin"
						});
					}, messageIDSender);
					break;
				}
				default:
					break;
			}
		} catch (error) {
			console.error(error);
		}
	}
};
