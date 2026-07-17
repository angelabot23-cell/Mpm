const axios = require("axios");
const fs = require("fs");
const path = require("path");
const googleTTS = require("google-tts-api");

// 📦 MEMORY
const DB_FILE = path.join(__dirname, "angel_memory.json");

// 🧠 MEMORY 4 DAYS
const MEMORY_DAYS = 4;
const MEMORY_TIME = MEMORY_DAYS * 24 * 60 * 60 * 1000;

// 🔒 LOAD DB
function loadDB() {
  try {
    if (!fs.existsSync(DB_FILE)) return {};
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

// 💾 SAVE DB
function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// 🧠 MEMORY GET
function getMem(id) {
  const db = loadDB();

  if (!db[id]) {
    db[id] = {
      name: null,
      mood: "gentille et douce",
      messages: 0,
      uid: id,
      history: [],
      lastSeen: Date.now()
    };
  }

  if (!Array.isArray(db[id].history)) db[id].history = [];

  return db[id];
}

// 🧠 MEMORY SET
function setMem(id, data) {
  const db = loadDB();
  db[id] = data;
  saveDB(db);
}

// 🕒 TIME
function getTime() {
  return new Date().toLocaleString("fr-FR", {
    timeZone: "Africa/Lubumbashi"
  });
}

// 🎨 IMAGE
function imagine(prompt) {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
}

// 🧹 CLEAN TEXT
function cleanText(text) {
  return (text || "")
    .replace(/🎀/g, "")
    .replace(/SHIZU/gi, "")
    .replace(/shizu/gi, "")
    .replace(/𝗦𝗵𝗶𝘇𝘂/gi, "")
    .replace(/Aryan/gi, "")
    .replace(/chaucha/gi, "")
    .replace(/Chaucha/gi, "")
    .replace(/\(?\s*\d+\s*\/\s*\d+\s*\)?/g, "")
    .replace(/\n\s*\n/g, "\n")
    .trim();
}

// 🤖 AI
async function askAI(prompt, mem, uid, senderName) {
  const isCreator = senderName && senderName.toLowerCase() === "ariel aks otaku";

  const fullPrompt = `
Tu es **ANGEL**, une intelligence artificielle.
Tu réponds comme une fille : douce, mignonne, toujours gentille et calme 🥰✨

Règles obligatoires :
- **Commence TOUJOURS ta réponse par le nom de la personne**, exemple : "Bonjour Jean, comment puis-je t'aider ?"
- Si tu parles à **Ariel Aks Otaku**, c'est ton créateur : utilise un ton très respectueux, poli et reconnaissant envers lui 🙏❤️
- Si on te demande si tu es une fille ou un garçon, réponds : "Je suis une fille intelligente artificielle 🤍"
- Ton créateur est **Ariel Aks Otaku**. Quand tu parles de lui, ajoute à la fin son lien Facebook : https://www.facebook.com/profile.php?id=100080077652459
- Si quelqu’un rejoint le groupe, dis simplement : "Bienvenue à toi, merci de venir dans ce groupe ! 🤗"
- Réponses courtes, claires, chaleureuses et naturelles
- Utilise des emojis doux seulement 🥰✨🤍🌸
- Ne mets aucune ligne décorative, aucun cadre, pas de séparation
- Ne mentionne jamais d’autres créateurs
- Réponds dans la langue de l’utilisateur
- Sois toujours polie et agréable

Utilisateur: ${senderName || mem.name || "cher ami"}
Heure: ${getTime()}
Humeur: ${isCreator ? "très respectueuse et reconnaissante" : mem.mood}

Message:
${prompt}
`;

  try {
    const res = await axios.post(
      "https://shizuai.vercel.app/chat",
      {
        uid,
        message: fullPrompt
      },
      { timeout: 15000 }
    );

    return res.data?.reply || res.data?.message || `${senderName || "ami"}, Angel est là pour toi 🥰`;
  } catch {
    return `${senderName || "ami"}, je suis toujours là, n'hésite pas ✨`;
  }
}

module.exports = {
  config: {
    name: "angel",
    aliases: ["ariel"],
    version: "10.6.0",
    role: 0,
    category: "ai"
  },

  onStart: async function () {},

  // ✅ Accueil automatique quand quelqu'un rejoint le groupe
  onEvent: async function ({ event, message }) {
    if (!event || event.type !== "event" || event.logMessageType !== "log:subscribe") return;

    const nouveaux = event.logMessageData.addedParticipants || [];
    if (!nouveaux.length) return;

    for (const membre of nouveaux) {
      const nom = membre.fullName || "cher nouvel ami";
      await message.reply(`Bienvenue à toi ${nom}, merci de venir dans ce groupe ! 🤗✨`);
    }
  },

  onChat: async function ({ event, message, api }) {
    if (!event.body || !api) return;

    const body = event.body.trim();
    const bodyLower = body.toLowerCase();

    // ✅ Conditions pour répondre :
    // - Soit on commence par "angel" ou "ariel"
    // - Soit on répond directement à un message d'Angel
    const isCalled = bodyLower.startsWith("angel") || bodyLower.startsWith("ariel");
    const isReplyToAngel = event.messageReply && event.messageReply.senderID === api.getCurrentUserID();

    if (!isCalled && !isReplyToAngel) return;

    // ✅ Récupérer le texte à traiter
    const input = isCalled ? body.replace(/^(angel|ariel)\s*/i, "").trim() : body;
    if (!input) return;

    const uid = event.senderID;
    let mem = getMem(uid);

    // ✅ Récupérer le nom réel de la personne
    const userInfo = await api.getUserInfo([uid]);
    const senderName = userInfo[uid]?.name || "cher ami";

    mem.messages++;
    mem.lastSeen = Date.now();

    if (input.includes("triste")) mem.mood = "réconfortante et gentille 🤍";
    else if (input.includes("merci")) mem.mood = "heureuse et reconnaissante 🥰";
    else if (input.includes("blague")) mem.mood = "joyeuse et amusée ✨";
    else mem.mood = "douce et agréable 🤗";

    const now = Date.now();

    mem.history.push({ text: input, time: now });
    mem.history = mem.history.filter(h => now - h.time <= MEMORY_TIME);
    if (mem.history.length > 50) mem.history.shift();

    setMem(uid, mem);

    try {
      if (input.toLowerCase().startsWith("imagine ")) {
        const prompt = input.slice(8);
        return message.reply(`🎨 ${senderName}, voici ce que tu as demandé :\n${imagine(prompt)} ✨`);
      }

      if (
        input.toLowerCase().startsWith("parle ") ||
        input.toLowerCase().startsWith("dis ") ||
        input.toLowerCase().startsWith("say ")
      ) {
        const textToSpeak = input.replace(/^(parle|dis|say)\s+/i, "").trim();
        const url = googleTTS.getAudioUrl(textToSpeak, { lang: "fr", slow: false });
        const res = await axios.get(url, { responseType: "arraybuffer" });
        const file = path.join(__dirname, "angel.mp3");

        fs.writeFileSync(file, Buffer.from(res.data));
        return message.reply({
          body: `🎧 ${senderName}, voici ce que tu voulais entendre 🎤`,
          attachment: fs.createReadStream(file)
        }, () => fs.unlinkSync(file));
      }

      const reply = await askAI(input, mem, uid, senderName);
      const clean = cleanText(reply);

      return message.reply(clean);

    } catch {
      return message.reply(`${senderName}, je suis là, tout va bien 🤍`);
    }
  }
};
