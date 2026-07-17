const moment = require("moment-timezone");
const { createCanvas, loadImage } = require("canvas");
const { writeFileSync, createReadStream, unlinkSync } = require("fs-extra");
const path = require("path");

module.exports = {
	config: {
		name: "daily",
		version: "2.0",
		author: "NTKhang x Canvas",
		countDown: 5,
		role: 0,
		description: {
			vi: "Nhận quà hàng ngày bằng hình ảnh Canvas",
			en: "Receive daily gift with a custom Canvas UI"
		},
		category: "game",
		guide: {
			vi: "   {pn}: Nhận quà hàng ngày\n   {pn} info: Xem thông tin quà",
			en: "   {pn}\n   {pn} info: View daily gift info table"
		},
		envConfig: {
			rewardFirstDay: {
				coin: 100,
				exp: 10
			}
		}
	},

	langs: {
		vi: {
			monday: "Thứ 2", tuesday: "Thứ 3", wednesday: "Thứ 4", thursday: "Thứ 5", friday: "Thứ 6", saturday: "Thứ 7", sunday: "Chủ nhật",
			alreadyReceived: "⚠️ Bạn đã nhận quà của ngày hôm nay rồi!",
			received: "Bạn đã nhận được %1 coin và %2 exp"
		},
		en: {
			monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday",
			alreadyReceived: "⚠️ You have already claimed your daily reward today!",
			received: "You have received %1 coin and %2 exp"
		}
	},

	onStart: async function ({ args, message, event, envCommands, usersData, commandName, getLang }) {
		const reward = envCommands[commandName].rewardFirstDay;
		const { senderID, threadID } = event;

		// --- MODE INFO (Affiche le tableau des récompenses de la semaine) ---
		if (args[0] == "info") {
			const width = 500;
			const height = 420;
			const canvas = createCanvas(width, height);
			const ctx = canvas.getContext("2d");

			ctx.fillStyle = "#0d1117";
			ctx.fillRect(0, 0, width, height);
			ctx.strokeStyle = "#00a2ff";
			ctx.lineWidth = 4;
			ctx.strokeRect(2, 2, width - 4, height - 4);

			ctx.fillStyle = "#00a2ff";
			ctx.font = "bold 24px sans-serif";
			ctx.fillText("📆 RECOMPENSES DE LA SEMAINE", 30, 45);

			let y = 90;
			for (let i = 1; i < 8; i++) {
				const getCoin = Math.floor(reward.coin * (1 + 20 / 100) ** ((i == 0 ? 7 : i) - 1));
				const getExp = Math.floor(reward.exp * (1 + 20 / 100) ** ((i == 0 ? 7 : i) - 1));
				const day = i == 7 ? getLang("sunday") : i == 6 ? getLang("saturday") : i == 5 ? getLang("friday") : i == 4 ? getLang("thursday") : i == 3 ? getLang("wednesday") : i == 2 ? getLang("tuesday") : getLang("monday");

				ctx.fillStyle = "#1f242c";
				ctx.beginPath();
				ctx.roundRect(30, y, width - 60, 38, 6);
				ctx.fill();

				ctx.fillStyle = "#ffffff";
				ctx.font = "bold 15px sans-serif";
				ctx.fillText(day, 45, y + 24);

				ctx.fillStyle = "#eab308";
				ctx.font = "14px monospace";
				ctx.fillText(`💰 +${getCoin} Coins`, 200, y + 24);

				ctx.fillStyle = "#38bdf8";
				ctx.fillText(`🧪 +${getExp} EXP`, 360, y + 24);

				y += 45;
			}

			const cacheInfoPath = path.join(__dirname, "cache", `daily-info-${threadID}.png`);
			writeFileSync(cacheInfoPath, canvas.toBuffer("image/png"));
			return message.reply({ attachment: createReadStream(cacheInfoPath) }, () => {
				try { unlinkSync(cacheInfoPath); } catch(e) {}
			});
		}

		// --- MODE COLLECTE JOURNALIÈRE ---
		const dateTime = moment.tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY");
		const date = new Date();
		const currentDay = date.getDay(); 
		const userData = await usersData.get(senderID);

		if (userData.data.lastTimeGetReward === dateTime) {
			return message.reply(getLang("alreadyReceived"));
		}

		const getCoin = Math.floor(reward.coin * (1 + 20 / 100) ** ((currentDay == 0 ? 7 : currentDay) - 1));
		const getExp = Math.floor(reward.exp * (1 + 20 / 100) ** ((currentDay == 0 ? 7 : currentDay) - 1));

		userData.data.lastTimeGetReward = dateTime;
		await usersData.set(senderID, {
			money: userData.money + getCoin,
			exp: userData.exp + getExp,
			data: userData.data
		});

		// Génération de la carte Canvas de succès
		const senderName = await usersData.getName(senderID);
		const avatarUrl = `https://graph.facebook.com/${senderID}/picture?width=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

		const width = 550;
		const height = 230;
		const canvas = createCanvas(width, height);
		const ctx = canvas.getContext("2d");

		// Fond principal
		ctx.fillStyle = "#090d16";
		ctx.fillRect(0, 0, width, height);

		// Contour lumineux néon
		ctx.strokeStyle = "#00d2ff";
		ctx.lineWidth = 4;
		ctx.strokeRect(2, 2, width - 4, height - 4);

		// Titre
		ctx.fillStyle = "#00d2ff";
		ctx.font = "bold 20px sans-serif";
		ctx.fillText("🎁 DAILY REWARD CLAIMED 🎁", 30, 45);

		// Avatar de l'utilisateur en cercle
		try {
			const avatar = await loadImage(avatarUrl);
			ctx.save();
			ctx.beginPath();
			ctx.arc(75, 135, 45, 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.clip();
			ctx.drawImage(avatar, 30, 90, 90, 90);
			ctx.restore();
		} catch (e) {
			ctx.fillStyle = "#00a2ff";
			ctx.beginPath();
			ctx.arc(75, 135, 45, 0, Math.PI * 2, true);
			ctx.fill();
		}

		// Informations utilisateur
		ctx.fillStyle = "#ffffff";
		ctx.font = "bold 22px sans-serif";
		ctx.fillText(senderName, 145, 110);

		ctx.fillStyle = "#a0aec0";
		ctx.font = "15px sans-serif";
		ctx.fillText("Félicitations ! Tu as récupéré ton bonus :", 145, 135);

		// Boîte de Récompense 1 : COINS
		ctx.fillStyle = "#1e293b";
		ctx.beginPath();
		ctx.roundRect(145, 155, 160, 42, 8);
		ctx.fill();
		ctx.fillStyle = "#eab308";
		ctx.font = "bold 16px monospace";
		ctx.fillText(`💰 +${getCoin} Coins`, 160, 181);

		// Boîte de Récompense 2 : EXP
		ctx.fillStyle = "#1e293b";
		ctx.beginPath();
		ctx.roundRect(320, 155, 140, 42, 8);
		ctx.fill();
		ctx.fillStyle = "#38bdf8";
		ctx.font = "bold 16px monospace";
		ctx.fillText(`🧪 +${getExp} EXP`, 335, 181);

		const cachePath = path.join(__dirname, "cache", `daily-success-${senderID}.png`);
		writeFileSync(cachePath, canvas.toBuffer("image/png"));

		return message.reply({
			body: `✨ ${getLang("received", getCoin, getExp)}`,
			attachment: createReadStream(cachePath)
		}, () => {
			try { unlinkSync(cachePath); } catch (e) {}
		});
	}
};
					
