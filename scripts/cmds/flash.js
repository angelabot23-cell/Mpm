const axios = require("axios");

const CREATOR_ID = "ID_CELESTIN_OLUA";
const memory = {};
const moods = {};
const moodList = ["fun", "cool", "froid", "sarcastique", "énergique"];
const lastMoodChange = {};

function normalizeText(text) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

function frameMessage(content) {
  return `࿇ ══━━✥🌸✥━━══ ࿇
${content}
࿇ ══━━✥🌸✥━━══ ࿇`;
}

module.exports = {
  config: {
    name: "flash",
    version: "3.0",
    author: "Célestin Olua",
    role: 0,
    category: "ai",
    shortDescription: "Flash V3 : Chat + Images + Mémoire + Humeur",
    guide: "{pn} [message] | imagine | clear"
  },

  onStart: async function({ message }) {
    await message.reply(frameMessage("⚡ Système Flash V3 initialisé.\nInteraction activée.\n\n💬 flash [message]\n🖼️ flash imagine [idée]"));
  },

  onChat: async function({ event, message, usersData }) {
    const userID = event.senderID;
    const userName = await usersData.getName(userID);
    const userMsg = event.body?.trim();
    if (!userMsg) return;

    const text = normalizeText(userMsg);
    if (userID !== CREATOR_ID && !text.startsWith("flash")) return;

    const args = userMsg.split(" ");
    const command = args[1]?.toLowerCase();

    if (command === "clear" && userID === CREATOR_ID) {
      memory[userID] = "";
      return message.reply(frameMessage("🧹 Mémoire effacée."));
    }

    if (command === "imagine" && userID === CREATOR_ID) {
      const promptImg = args.slice(2).join(" ");
      if (!promptImg) return message.reply(frameMessage("⚠️ Donne une idée."));
      try {
        const res = await axios.get(`https://arychauhann.onrender.com/api/gemini-proxy2?prompt=${encodeURIComponent(promptImg)}`);
        const imgUrl = res.data.image || res.data.url || null;
        if (!imgUrl) return message.reply(frameMessage("❌ Aucune image générée."));
        return message.reply(frameMessage(`🖼️ Image :\n${imgUrl}`));
      } catch {
        return message.reply(frameMessage("❌ Erreur API."));
      }
    }

    const now = Date.now();
    if (!moods[userID]) {
      moods[userID] = moodList[Math.floor(Math.random() * moodList.length)];
      lastMoodChange[userID] = now;
    }
    if (now - lastMoodChange[userID] > 120000) {
      moods[userID] = moodList[Math.floor(Math.random() * moodList.length)];
      lastMoodChange[userID] = now;
    }

    const mood = moods[userID];
    const userPrompt = args.slice(1).join(" ");
    const memoryText = memory[userID] || "";

    const prompt = `
Tu es Flash V3 ⚡ IA avancée.
Mode : ${mood}
Créateur : Célestin Olua
Mémoire : ${memoryText}
Utilisateur : ${userName}
Message : ${userPrompt}

Réponds avec style, intelligence et fluidité.
`;

    try {
      const res = await axios.get(`https://arychauhann.onrender.com/api/gemini-proxy2?prompt=${encodeURIComponent(prompt)}`);
      const reply = res.data.reply || res.data.result || "⚠️ Erreur.";
      memory[userID] = reply;
      return message.reply(frameMessage(reply));
    } catch {
      return message.reply(frameMessage("❌ Système indisponible."));
    }
  }
};
