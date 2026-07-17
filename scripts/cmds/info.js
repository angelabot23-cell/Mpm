const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "info",
    version: "2.5.3",
    author: "ST | Sheikh Tamim",
    role: 0,
    countDown: 20,
    shortDescription: {
      en: "Owner & bot information"
    },
    longDescription: {
      en: "Show detailed information about the bot, owner, uptime and socials"
    },
    category: "owner",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ message }) {

    const ownerName = "STARBOY APHELION";
    const ownerAge = "N/A";
    const ownerFB = "https://facebook.com/star.boy.aphelion";
    const ownerNumber = "+88019XXXXXXX";
    const status = "Active";

    const botName = global.GoatBot?.config?.nickNameBot || "GoatBot";
    const prefix = global.GoatBot?.config?.prefix || "/";

    const totalCommands = global.GoatBot?.commands?.size || 0;

    const images = [
      "https://i.ibb.co/SD8SDxRp/597419756-1433777018750185-6513158348709492396-n-jpg-nc-cat-103-ccb-1-7-nc-sid-9f807c-nc-eui2-Ae-F.jpg"
    ];
    const image = images[Math.floor(Math.random() * images.length)];

    const now = moment().tz("Asia/Dhaka");
    const date = now.format("MMMM Do YYYY");
    const time = now.format("h:mm:ss A");

    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    return message.reply({
      body: `
࿇ ══━━✥🌸✥━━══ ࿇
👑 SYSTÈME D’INFORMATION
࿇ ══━━✥🌸✥━━══ ࿇

🤖 Bot : ${botName}
⚙️ Préfixe : ${prefix}
🧠 Commandes : ${totalCommands}
⚡ Activité : ${uptimeString}

📅 Date : ${date}
⏰ Heure : ${time}

━━━━━━━━━━━━━━━━━━━

👑 Propriétaire : ${ownerName}
🎂 Âge : ${ownerAge}
❤️ Statut : ${status}
📱 Contact : ${ownerNumber}
🌐 Profil : ${ownerFB}

━━━━━━━━━━━━━━━━━━━
Système actif • Données stables
࿇ ══━━✥🌸✥━━══ ࿇
`,
      attachment: await global.utils.getStreamFromURL(image)
    });
  }
};
