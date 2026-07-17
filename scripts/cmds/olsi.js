const { createCanvas } = require('canvas');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

if (!global.olsieStatus) global.olsieStatus = new Map();

module.exports = {
	config: {
		name: "olsie",
		version: "3.6",
		author: "Célestin",
		editor: "Célestin 🌌",
		countDown: 5,
		role: 0,
		description: "Génère un conseil pro textuel sur une image via l'API Copilot de Christus (sans préfixe)",
		category: "ia",
		guide: `◤◢◣◥◤◢◣◥ OLSIE CONFIG ◤◢◣◥◤◢◣◥\n│\n│ 🔹 olsie on -> Activer dans ce groupe\n│ 🔹 olsie off -> Désactiver dans ce groupe\n│ 🔹 olsie [sujet] -> Demander un conseil\n│\n◤◢◣◥◤◢◣◥◤◢◣◥◤◢◣◥◤◢◣◥◤◢◣◥`,
		usePrefix: false,
		noPrefix: true
	},

	onStart: async function({ api, message, args, event }) {
		const { threadID } = event;
		const action = args[0]?.toLowerCase();

		if (action === "on") {
			global.olsieStatus.set(threadID, true);
			return message.reply("◤◢◣◥ SYSTEM ◤◢◣◥\n\n🟢 𝘓'𝘐𝘈 𝘖𝘭𝘴𝘪𝘦 𝘦𝘴𝒕 𝘥𝘦́𝘴𝘰𝘳𝘮𝘢𝘪𝖘 𝘈𝘊𝘛𝘐𝘝𝘌́𝘌 𝘥𝘢𝘯𝘴 𝘤𝘦 𝘨𝘳𝘰𝘶𝘱𝘦.");
		}
		
		if (action === "off") {
			global.olsieStatus.set(threadID, false);
			return message.reply("◤◢◣◥ SYSTEM ◤◢◣◥\n\n🔴 𝘓'𝘐𝘈 𝘖𝘭𝘴𝘪𝘦 𝘦𝘴𝒕 𝘥𝘦́𝘴𝘢𝘤𝘵𝘪𝘷𝘦́𝘦 𝘥𝘢𝘯𝘴 𝘤𝘦 𝘨𝘳𝘰𝘶𝘱𝘦.");
		}

		const isEnabled = global.olsieStatus.has(threadID) ? global.olsieStatus.get(threadID) : true;
		if (!isEnabled) {
			return; 
		}

		const query = args.join(" ");
		if (!query) {
			return message.reply("◤◢◣◥ ERROR ◤◢◣◥\n\n𝘚𝘱𝘦́𝘤𝘪𝘧𝘪𝘦 𝘶𝘯 𝘴𝘶𝘫𝘦𝘵 𝘰𝘶 𝘶𝘯𝘦 𝘲𝘶𝘦𝘴𝘵𝘪𝘰ၼ် 𝘱𝘰𝘶𝘳 𝘰𝘣𝘵𝘦𝘯𝘪𝘳 𝘶𝘯 𝘤𝘰𝘯𝘴𝘦𝘪𝘭.");
		}

		const systemPrompt = "Tu es Olsie, une IA experte en motivation, développement personnel et gestion professionnelle. Donne des conseils courts, percutants, très professionnels, inspirants et tournés vers le zen. Reste concis (maximum 2 à 3 phrases). Sujet de l'utilisateur : ";
		const fullPrompt = `${systemPrompt}${query}`;

		try {
			// 1. Appel API
			const response = await axios.get(`https://christus-api.vercel.app/ai/copilot?message=${encodeURIComponent(fullPrompt)}&model=default`);
			
			let advice = "";
			
			// Extraction sécurisée de la réponse
			if (response.data) {
				if (typeof response.data === "string") {
					advice = response.data;
				} else if (response.data.reply) {
					advice = response.data.reply;
				} else {
					advice = response.data.result || response.data.message || JSON.stringify(response.data);
				}
			}

			if (!advice) advice = "L'API a renvoyé une réponse vide.";
			advice = advice.trim();

			// 2. Rendu Canvas
			const width = 800;
			const height = 450;
			const canvas = createCanvas(width, height);
			const ctx = canvas.getContext('2d');

			ctx.fillStyle = '#060913';
			ctx.fillRect(0, 0, width, height);

			ctx.strokeStyle = '#0a152d';
			ctx.lineWidth = 1;
			for (let i = 0; i < width; i += 40) {
				ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
			}
			for (let j = 0; j < height; j += 40) {
				ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(width, j); ctx.stroke();
			}

			ctx.strokeStyle = '#0055ff';
			ctx.lineWidth = 5;
			ctx.strokeRect(25, 25, width - 50, height - 50);

			ctx.fillStyle = '#00d2ff';
			ctx.font = 'bold 24px sans-serif';
			ctx.fillText('◤ OLSIE MOTIVATION - CONSEIL PRO ◢', 50, 70);

			ctx.strokeStyle = '#0033aa';
			ctx.lineWidth = 2;
			ctx.beginPath(); ctx.moveTo(50, 90); ctx.lineTo(width - 50, 90); ctx.stroke();

			ctx.fillStyle = '#ffffff';
			ctx.font = 'italic 22px sans-serif';
			
			const words = advice.split(' ');
			let line = '';
			let x = 60;
			let y = 150;
			const maxWidth = width - 120;
			const lineHeight = 38;

			for (let n = 0; n < words.length; n++) {
				let testLine = line + words[n] + ' ';
				let metrics = ctx.measureText(testLine);
				let testWidth = metrics.width;
				if (testWidth > maxWidth && n > 0) {
					ctx.fillText(line, x, y);
					line = words[n] + ' ';
					y += lineHeight;
				} else {
					line = testLine;
				}
			}
			ctx.fillText(line, x, y);

			ctx.fillStyle = '#5577aa';
			ctx.font = '14px monospace';
			ctx.fillText('Olsie Zen Intelligence • Édité par Célestin 🌌', 50, height - 50);

			// 3. Sauvegarde de l'image
			const cacheDir = path.join(__dirname, 'cache');
			await fs.ensureDir(cacheDir); 
			const cachePath = path.join(cacheDir, `olsie_${threadID}.png`);
			
			await fs.writeFile(cachePath, canvas.toBuffer('image/png'));

			await message.reply({
				body: "◤◢◣◥ OLSIE DECISION ◤◢◣◥\n\n✨ 𝘓'𝘐𝘈 𝘢 𝘨𝘦́𝘯𝘦́𝘳𝘦́ 𝘵𝘰𝘯 𝘷𝘪𝘴𝘶𝘦𝘭 :",
				attachment: fs.createReadStream(cachePath)
			});

			setTimeout(() => {
				if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
			}, 5000);

		} catch (err) {
			console.error(err);
			return message.reply(`◤◢◣◥ FAULT ◤◢◣◥\n\n𝘌́𝘤𝘩𝘦́c 𝘥𝘦 𝘭𝘢 𝘤𝘰𝘮𝘮𝘢𝘯𝘥𝘦. 𝘌𝘳𝘳𝘦𝘶𝘳 : ${err.message}`);
		}
	}
};
