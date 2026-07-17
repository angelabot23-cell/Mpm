const axios = require("axios");
const moment = require("moment");

module.exports = {
  config: {
    name: "age",
    aliases: ["agecalc", "agecalculator"],
    version: "1.0",
    author: "Christus",
    countDown: 5,
    role: 0,
    shortDescription: { fr: "Calculer l'âge à partir de la date de naissance" },
    longDescription: { fr: "Calcule l'âge exact, le temps total vécu et la date du prochain anniversaire." },
    category: "utilitaire",
    guide: { fr: "{pn} JJ-MM-AAAA" }
  },

  onStart: async function({ message, args }) {

    const bold = (text) => text.split('').map(c => {
      if (c >= 'A' && c <= 'Z') return String.fromCodePoint(c.charCodeAt(0) + 0x1D400 - 65);
      if (c >= 'a' && c <= 'z') return String.fromCodePoint(c.charCodeAt(0) + 0x1D41A - 97);
      if (c >= '0' && c <= '9') return String.fromCodePoint(c.charCodeAt(0) + 0x1D7CE - 48);
      return c;
    }).join('');

    try {
      if (!args[0]) {
        return message.reply(`${bold("⚠️ Veuillez fournir votre date de naissance !")}\n\n📝 ${bold("Exemple:")} \n${bold("/age 15-03-2008")}`);
      }

      const inputDate = args[0];
      const birthDate = moment(inputDate, "DD-MM-YYYY", true);

      if (!birthDate.isValid()) {
        return message.reply(`${bold("❌ Format de date invalide !")} \n${bold("Veuillez utiliser : JJ-MM-AAAA")} \n${bold("Exemple : /age 15-03-2008")}`);
      }

      const githubRawUrl = "https://raw.githubusercontent.com/Saim-x69x/sakura/main/ApiUrl.json"; 
      const apiRes = await axios.get(githubRawUrl);
      const baseUrl = apiRes.data.apiv1;
      const apiBirthDate = birthDate.format("YYYY-MM-DD");

      const url = `${baseUrl}/api/age?birthDate=${apiBirthDate}`;
      const res = await axios.get(url);

      if (!res.data || !res.data.message) {
        return message.reply(`${bold("❌ Oups ! Une erreur est survenue. Veuillez réessayer plus tard.")}`);
      }

      return message.reply(res.data.message);

    } catch (err) {
      console.error("❌ Erreur commande /age :", err);
      return message.reply(`${bold("❌ Oups ! Une erreur est survenue. Veuillez réessayer plus tard.")}`);
    }
  }
};
