const axios = require("axios");const fs = require("fs");
const memoryPath = "./capillot_memory.json";

// 🔄 Charger mémoire
function loadMemory() {
  if (!fs.existsSync(memoryPath)) return {};
  return JSON.parse(fs.readFileSync(memoryPath, "utf8"));
}

// 💾 Sauvegarder mémoire
function saveMemory(data) {
  fs.writeFileSync(memoryPath, JSON.stringify(data, null, 2));
}

// ✨ Écriture stylée
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

// 🤖 SAFE REQUEST (ANTI BUG)
async function askAI(prompt) {
  try {
    const res = await axios.get(
      "https://christus-api.vercel.app/ai/copilot",
      {
        params: { message: prompt },
        timeout: 15000
      }
    );

    return (
      res.data?.message ||
      res.data?.reply ||
      res.data?.result ||
      res.data?.answer ||
      res.data ||
      "..."
    );
  } catch (e) {
    return "API indisponible 😏";
  }
}

module.exports = {
  config: {
    name: "i",
    version: "8.1",
    author: "Celestin",
    countDown: 0,
    role: 0,
    description: "I IA humaine avec mémoire avancée",
    category: "ai"
  },

  onStart: async function ({ message, args, event }) {

    const input = args.join(" ");
    const senderID = event.senderID;

    if (!input) return;

    const memory = loadMemory();

    if (!memory[senderID]) {
      memory[senderID] = { messages: [] };
    }

    memory[senderID].messages.push({
      role: "user",
      content: input
    });

    memory[senderID].messages = memory[senderID].messages.slice(-100);

    const history = memory[senderID].messages
      .map(m => `${m.role}: ${m.content}`)
      .join("\n");

    const summary = memory[senderID].messages
      .slice(-30)
      .map(m => m.content)
      .join(" | ");

    const fullPrompt = `
Tu es I.

Tu réponds naturellement comme un humain 😏

Tu écoutes la question et tu réponds exactement.

Mémoire:
${summary}

Historique:
${history}

Message:
${input}
`;

    await message.reply("⏳");

    let reply = await askAI(fullPrompt);

    // 🧹 sécurité string
    reply = String(reply)
      .replace(/microsoft|copilot|openai/gi, "")
      .trim();

    if (/qui t('|’)a créé|créateur|qui t('|’)a fait/i.test(input)) {
      reply = "franchement ? c’est Olua qui m’a fait 😏";
    }

    memory[senderID].messages.push({
      role: "assistant",
      content: reply
    });

    saveMemory(memory);

    const finalText = `
❁ ≖≖✿❁ ≖≖✿❁ ≖≖✿❁ ≖≖ ❁

${stylize(reply)}

❁ ≖≖✿❁ ≖≖✿❁ ≖≖✿❁ ≖≖ ❁
`;

    return message.reply(finalText);
  }
};
