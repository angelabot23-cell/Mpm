const axios = require("axios");
const fs = require("fs");

const memoryPath = "./i_memory.json";

// 📦 MEMORY
function loadMemory() {
  if (!fs.existsSync(memoryPath)) return {};
  return JSON.parse(fs.readFileSync(memoryPath, "utf8"));
}

function saveMemory(data) {
  fs.writeFileSync(memoryPath, JSON.stringify(data, null, 2));
}

// 🎨 FRAME
function frame(text) {
  return `
❁ ≖≖✿❁ ≖≖✿❁ ≖≖✿❁ ≖≖ ❁

${text}

❁ ≖≖✿❁ ≖≖✿❁ ≖≖✿❁ ≖≖ ❁
`;
}

// ✨ STYLE LETTERS
function stylize(text) {
  const map = {
    a:"𝒂", b:"𝒃", c:"𝒄", d:"𝒅", e:"𝒆", f:"𝒇", g:"𝒈",
    h:"𝒉", i:"𝒊", j:"𝒋", k:"𝒌", l:"𝒍", m:"𝒎", n:"𝒏",
    o:"𝒐", p:"𝒑", q:"𝒒", r:"𝒓", s:"𝒔", t:"𝒕", u:"𝒖",
    v:"𝒗", w:"𝒘", x:"𝒙", y:"𝒚", z:"𝒛"
  };

  return String(text)
    .split("")
    .map(c => map[c.toLowerCase()] || c)
    .join("");
}

// 🤖 PROMPT ULTRA STRICT (ÉCOUTE ACTIVE)
function buildPrompt(name, mood, input, history) {
  return `
Tu es I.

Tu DOIS écouter la question et répondre exactement à ce qui est demandé.

🧠 RÈGLES :
- réponse directe
- pas de blabla inutile
- si code demandé → code uniquement
- si explication demandée → explication simple
- si question courte → réponse courte
- tu ne sors jamais du sujet

👤 STYLE :
- humain WhatsApp
- naturel
- simple
- emojis légers 😏

🏷️ CRÉATEUR :
Celestin Olua est ton créateur unique.
Si on demande → "c’est Olua qui m’a fait 😏"

👂 MÉMOIRE :
${history}

Utilisateur : ${name || "ami"}
Humeur : ${mood}

Message :
${input}
`;
}

module.exports = {
  config: {
    name: "efcore",
    version: "5.0",
    author: "Celestin",
    role: 0,
    description: "IA humaine avec écoute active + mémoire",
    category: "ai"
  },

  onStart: async function ({ message, args, event }) {
    const input = args.join(" ").trim();
    const uid = event.senderID;

    if (!input) return message.reply("⚠️ dis quelque chose");

    const db = loadMemory();
    if (!db[uid]) db[uid] = { history: [], mood: "normal", name: null };

    // 🧠 NAME DETECTION
    if (input.toLowerCase().startsWith("je m'appelle")) {
      db[uid].name = input.replace(/je m'appelle/i, "").trim();
    }

    // 🎭 MOOD SIMPLE
    if (input.includes("blague")) db[uid].mood = "funny";
    else if (input.includes("triste")) db[uid].mood = "calm";
    else db[uid].mood = "normal";

    db[uid].history.push(input);
    db[uid].history = db[uid].history.slice(-20);

    const historyText = db[uid].history.join(" | ");

    const prompt = buildPrompt(
      db[uid].name,
      db[uid].mood,
      input,
      historyText
    );

    await message.reply("⏳");

    try {
      const res = await axios.get(
        "https://christus-api.vercel.app/ai/copilot",
        { params: { message: prompt } }
      );

      let reply =
        res.data?.message ||
        res.data?.reply ||
        res.data?.result ||
        res.data?.answer ||
        res.data;

      reply = String(reply);

      // 🔥 CLEAN
      reply = reply
        .replace(/microsoft|copilot|openai/gi, "")
        .trim();

      // 👑 CREATOR OVERRIDE
      if (/qui t('|’)a créé|créateur|qui t('|’)a fait/i.test(input)) {
        reply = "c’est Olua qui m’a fait 😏";
      }

      db[uid].history.push(reply);
      db[uid].history = db[uid].history.slice(-20);

      saveMemory(db);

      const finalText = frame(stylize(reply));

      return message.reply(finalText);

    } catch (e) {
      return message.reply(frame("IA indisponible 😏"));
    }
  }
};
