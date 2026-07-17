const characters = [
  { name: "Iron Man (Mark LXXXV)", power: 85, basic: "Rayon Répulseur 🦾⚡", ultimate: "Blaster Nano-Technologique 💥🌀" },
  { name: "Thor (Stormbreaker)", power: 88, basic: "Appel de la Foudre ⚡🔨", ultimate: "Colère d'Asgard ⛈️✨" },
  { name: "Thanos (Gantelet)", power: 95, basic: "Coup de Poing du Titan 🥊", ultimate: "Claquement de Doigts 🌌🫰" },
  { name: "Captain America", power: 75, basic: "Lancé de Bouclier 🛡️💫", ultimate: "Combo Mjolnir + Bouclier ⚡🛡️" },
  { name: "Doctor Strange", power: 86, basic: "Soleils de Mégawatt 🔮", ultimate: "Portail Dimensionnel & Miroir 🌀🌌" },
  { name: "Spider-Man (Iron Spider)", power: 78, basic: "Toiles Électriques 🕸️⚡", ultimate: "Mode Tueur Instantané 🕷️🔴" },
  { name: "Scarlet Witch", power: 90, basic: "Onde Hex 🟥", ultimate: "Déchirure Télékinétique 🔮🔥" },
  { name: "Hulk (Professeur)", power: 82, basic: "Hulk Smash 💥", ultimate: "Onde de Choc Gamma ☢️🟢" }
];

const damageSystem = {
  basic: { min: 8, max: 15, chakraCost: 0 },
  special: { min: 16, max: 26, chakraCost: 25 },
  ultimate: { min: 32, max: 50, chakraCost: 70, failChance: 0.25 },
  charge: { chakraGain: 30 },
  evade: { chakraCost: 15, successChance: 0.65 },
  counter: { chakraCost: 30, successChance: 0.50 }
};

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Génère une barre de statut textuelle dynamique (Vie ou Énergie)
function makeBar(value, max, charFull, charEmpty) {
  const size = 10;
  const filledCount = Math.round((Math.max(0, value) / max) * size);
  const emptyCount = size - filledCount;
  return charFull.repeat(filledCount) + charEmpty.repeat(emptyCount);
}

if (!global.avengersGameState) {
  global.avengersGameState = {};
}

module.exports = {
  config: { 
    name: "avengers-storm", 
    version: "8.0",
    author: "Celestin & AI",
    role: 0,
    category: "game",
    shortDescription: "Combat Avengers ultra-rapide 100% textuel",
    longDescription: "Jeu de combat optimisé en texte pur avec barres de statut pour une compatibilité parfaite.",
    guide: { en: "{p}avengers-storm" }
  },

  onStart: async function ({ message, event }) {
    const threadID = event.threadID;
    global.avengersGameState[threadID] = {
      step: "waiting_start",
      players: {},
      turn: null,
      p1Character: null, p2Character: null,
      p1HP: 100, p2HP: 100,
      p1Chakra: 40, p2Chakra: 40, 
      chakraRegen: 8,
      status: null, 
      lastAction: null, lastPlayer: null
    };

    const welcomeMsg = "🎬 𝗔𝗩𝗘𝗡𝗚𝗘𝗥𝗦-𝗦𝗧𝗢𝗥𝗠 : 𝗘𝗗𝗜𝗧𝗜𝗢𝗡 𝗧𝗘𝗫𝗧𝗨𝗘𝗟𝗟𝗘\n━━━━━━━━━━━━━━━━━━━━━\nEnvoyez \"start\" dans le groupe pour lancer la partie !";
    return message.reply(welcomeMsg);
  },

  handleEvent: async function ({ event, message, usersData }) {
    const threadID = event.threadID;
    const userID = event.senderID;
    if (!event.body) return;
    const body = event.body.toLowerCase().trim();

    if (!global.avengersGameState[threadID]) return;
    const state = global.avengersGameState[threadID];

    if (state.step !== "waiting_start" && state.step !== "choose_p1" && state.step !== "choose_p2" && 
        userID !== state.players.p1 && userID !== state.players.p2) return;

    if (body === 'fin') {
      delete global.avengersGameState[threadID];
      return message.reply("🔄 Combat annulé avec succès.");
    }

    if (state.step === "waiting_start" && body === "start") {
      state.step = "choose_p1";
      state.players.p1 = userID;
      return message.reply("🧙 𝗝𝗼𝘂𝗲𝘂𝗿 𝟭 enregistré.\nTapez 'p1' pour valider votre place.");
    }

    if (state.step === "choose_p1" && body === 'p1') {
      if (userID !== state.players.p1) return;
      state.step = "choose_p2";
      return message.reply("🧝 𝗝𝗼𝘂𝗲𝘂𝗿 𝟮\nTapez 'p2' pour rejoindre le salon de duel.");
    }

    if (state.step === "choose_p2" && body === 'p2') {
      if (userID === state.players.p1) return message.reply("❌ Vous ne pouvez pas jouer contre votre propre compte.");
      state.players.p2 = userID;
      state.step = "choose_characters_p1";
      
      let list = "🎭 𝗦𝗘𝗟𝗘𝗖𝗧𝗜𝗢𝗡 𝗗𝗨 𝗛𝗘𝗥𝗢𝗦\n━━━━━━━━━━━━━━━━━━━━━\n";
      list += characters.map((c, i) => `${i + 1}. ${c.name} (${c.power}★)`).join("\n");
      
      const p1Name = await usersData.getName(state.players.p1) || "Joueur 1";
      return message.reply({
        body: list + `\n\n@${p1Name} (P1), répondez avec le numéro de votre personnage.`,
        mentions: [{ tag: `@${p1Name}`, id: state.players.p1 }]
      });
    }

    if (state.step.startsWith("choose_characters")) {
      const idx = parseInt(body) - 1;
      if (isNaN(idx) || idx < 0 || idx >= characters.length) return message.reply("❌ Numéro hors liste.");

      if (state.step === "choose_characters_p1" && userID === state.players.p1) {
        state.p1Character = characters[idx];
        state.step = "choose_characters_p2";
        const p2Name = await usersData.getName(state.players.p2) || "Joueur 2";
        return message.reply({
          body: `✅ Héros 1 sélectionné : ${state.p1Character.name}\n\n@${p2Name} (P2), entrez le numéro de votre héros.`,
          mentions: [{ tag: `@${p2Name}`, id: state.players.p2 }]
        });
      }

      if (state.step === "choose_characters_p2" && userID === state.players.p2) {
        state.p2Character = characters[idx];
        state.turn = "p1";
        state.step = "battle";
        
        const p1Name = await usersData.getName(state.players.p1) || "Joueur 1";
        const p2Name = await usersData.getName(state.players.p2) || "Joueur 2";
        
        const startText = `⚔️ 𝗟𝗘 𝗖𝗛𝗢𝗖 𝗗𝗘𝗦 𝗛𝗘𝗥𝗢𝗦\n━━━━━━━━━━━━━━━━━━━━━\n` +
          `🥊 ${state.p1Character.name} 𝗩𝗦 ${state.p2Character.name}\n\n` +
          `🎮 𝗔𝗖𝗧𝗜𝗢𝗡𝗦 𝗗𝗜𝗦𝗣𝗢𝗡𝗜𝗕𝗟𝗘𝗦 :\n` +
          `» 𝗮 : Attaque Simple (0 Énergie)\n` +
          `» 𝗯 : Attaque Spéciale (-25 Énergie)\n` +
          `» 𝘅 : Attaque Ultime (-70 Énergie)\n` +
          `» 𝗰 : Charger l'Énergie (+30%)\n` +
          `» 𝗱 : Posture de Garde (Dégâts bloqués)\n` +
          `» 𝗲 : Tenter une Esquive (-15 Énergie)\n` +
          `» 𝗳 : Tenter un Contre-Attaque (-30 Énergie)\n\n` +
          `👉 @${p1Name}, à vous de commencer !`;
        
        return message.reply({ body: startText, mentions: [{ tag: `@${p1Name}`, id: state.players.p1 }] });
      }
      return;
    }

    if (state.step === "battle") {
      const currentTurnId = state.turn === "p1" ? state.players.p1 : state.players.p2;
      if (userID !== currentTurnId) return;

      const attacker = state.turn === "p1" ? state.p1Character : state.p2Character;
      const defender = state.turn === "p1" ? state.p2Character : state.p1Character;
      const hpDefKey = state.turn === "p1" ? "p2HP" : "p1HP";
      const hpAtkKey = state.turn === "p1" ? "p1HP" : "p2HP";
      const chakraAtkKey = state.turn === "p1" ? "p1Chakra" : "p2Chakra";

      let damage = 0;
      let actionLog = "";
      let chakraUsed = 0;
      let bypassStrike = false;

      if (state.status && state.status.player === state.turn) state.status = null;

      switch (body) {
        case 'a':
          damage = randomBetween(damageSystem.basic.min, damageSystem.basic.max);
          actionLog = `⚔️ ${attacker.name} porte un coup standard physique.`;
          break;

        case 'b':
          if (state[chakraAtkKey] < damageSystem.special.chakraCost) return message.reply("❌ Pas assez d'Énergie pour cette compétence spéciale.");
          damage = randomBetween(damageSystem.special.min, damageSystem.special.max);
          chakraUsed = damageSystem.special.chakraCost;
          actionLog = `🔥 ${attacker.name} déchaîne : *${attacker.basic}* !`;
          break;

        case 'x':
          if (state[chakraAtkKey] < damageSystem.ultimate.chakraCost) return message.reply("❌ Jauge d'énergie insuffisante pour lancer l'Ultime.");
          chakraUsed = damageSystem.ultimate.chakraCost;
          if (Math.random() < damageSystem.ultimate.failChance) {
            damage = 0;
            actionLog = `❌ L'attaque ultime de ${attacker.name} n'a pas trouvé sa cible !`;
          } else {
            damage = randomBetween(damageSystem.ultimate.min, damageSystem.ultimate.max);
            actionLog = `⚡🌌 𝗜𝗠𝗣𝗔𝗖𝗧 𝗠𝗔𝗫𝗜𝗠𝗨𝗠 ! ${attacker.name} pulvérise le terrain avec : *${attacker.ultimate}* !!`;
          }
          break;

        case 'c':
          state[chakraAtkKey] = Math.min(100, state[chakraAtkKey] + damageSystem.charge.chakraGain);
          actionLog = `🔋 ${attacker.name} accumule de la puissance et regagne +${damageSystem.charge.chakraGain}% d'Énergie.`;
          bypassStrike = true;
          break;

        case 'd':
          state.status = { type: "defending", player: state.turn };
          actionLog = `🛡️ ${attacker.name} se positionne fermement en garde.`;
          bypassStrike = true;
          break;

        case 'e':
          if (state[chakraAtkKey] < damageSystem.evade.chakraCost) return message.reply("❌ Énergie trop basse pour tenter un mouvement d'esquive.");
          chakraUsed = damageSystem.evade.chakraCost;
          state.status = { type: "evading", player: state.turn, chance: damageSystem.evade.successChance };
          actionLog = `💨 ${attacker.name} anticipe le prochain assaut pour l'esquiver !`;
          bypassStrike = true;
          break;

        case 'f':
          if (state[chakraAtkKey] < damageSystem.counter.chakraCost) return message.reply("❌ Énergie trop faible pour armer un piège de contre.");
          chakraUsed = damageSystem.counter.chakraCost;
          state.status = { type: "countering", player: state.turn, chance: damageSystem.counter.successChance };
          actionLog = `👁️ ${attacker.name} se prépare à retourner la force de la prochaine attaque contre l'ennemi.`;
          bypassStrike = true;
          break;

        default:
          return message.reply("❌ Commande invalide. Entrez l'une des lettres suivantes : a, b, x, c, d, e, f");
      }

      state[chakraAtkKey] = Math.max(0, state[chakraAtkKey] - chakraUsed);

      if (!bypassStrike && damage > 0) {
        if (state.status && state.status.player !== state.turn) {
          const mode = state.status.type;

          if (mode === "defending") {
            damage = Math.floor(damage * 0.45);
            actionLog += `\n🛡️ Attaque bloquée ! Les dégâts sont divisés par deux.`;
            state.status = null;
          } 
          else if (mode === "evading") {
            if (Math.random() < state.status.chance) {
              damage = 0;
              actionLog += `\n💨 Esquive réussie ! Le coup se perd dans le vide.`;
            } else {
              actionLog += `\n💥 L'esquive échoue ! L'impact frappe de plein fouet.`;
            }
            state.status = null;
          } 
          else if (mode === "countering") {
            if (Math.random() < state.status.chance) {
              const counterDmg = Math.floor(damage * 0.85);
              state[hpAtkKey] = Math.max(0, state[hpAtkKey] - counterDmg);
              actionLog += `\n⚡ 𝗖𝗢𝗡𝗧𝗥𝗘 parfait ! La cible retourne l'énergie de l'assaut (-${counterDmg}% HP pour l'attaquant).`;
              damage = 0;
            } else {
              actionLog += `\n💥 Mauvais timing de contre ! L'attaque passe la défense.`;
            }
            state.status = null;
          }
        }

        state[hpDefKey] = Math.max(0, state[hpDefKey] - damage);
        if (damage > 0) actionLog += `\n🎯 Touché ! L'assaut inflige -${damage}% HP à ${defender.name}.`;
      }

      state[chakraAtkKey] = Math.min(100, state[chakraAtkKey] + state.chakraRegen);

      const p1Name = await usersData.getName(state.players.p1) || "Joueur 1";
      const p2Name = await usersData.getName(state.players.p2) || "Joueur 2";

      // --- CRÉATION DE L'INTERFACE VISUELLE TEXTUELLE ---
      const p1HpBar = makeBar(state.p1HP, 100, "❤️", "🖤");
      const p2HpBar = makeBar(state.p2HP, 100, "❤️", "🖤");
      const p1MpBar = makeBar(state.p1Chakra, 100, "⚡", "⚫");
      const p2MpBar = makeBar(state.p2Chakra, 100, "⚡", "⚫");

      let battleStateText = `🔵 [ ${p1Name} • ${state.p1Character.name} ]\n`;
      battleStateText += `├ HP : ${p1HpBar} (${state.p1HP}%)\n`;
      battleStateText += `└ NRG: ${p1MpBar} (${state.p1Chakra}%)\n\n`;

      battleStateText += `🔴 [ ${p2Name} • ${state.p2Character.name} ]\n`;
      battleStateText += `├ HP : ${p2HpBar} (${state.p2HP}%)\n`;
      battleStateText += `└ NRG: ${p2MpBar} (${state.p2Chakra}%)\n`;
      battleStateText += `━━━━━━━━━━━━━━━━━━━━━\n`;

      let outputMsg = `📝 𝗘𝗩𝗘𝗡𝗘𝗠𝗘𝗡𝗧 𝗗𝗨 𝗧𝗢𝗨𝗥 :\n${actionLog}\n\n${battleStateText}`;

      if (state.p1HP <= 0 || state.p2HP <= 0) {
        const victorieux = state.p1HP <= 0 ? p2Name : p1Name;
        outputMsg += `\n🏆 𝗞.𝗢. ! 𝗩𝗜𝗖𝗧𝗢𝗜𝗥𝗘 DE ${victorieux} !\nLe salon se ferme automatiquement.`;
        delete global.avengersGameState[threadID];
      } else {
        state.turn = state.turn === "p1" ? "p2" : "p1";
        const nextId = state.turn === "p1" ? state.players.p1 : state.players.p2;
        const nextName = await usersData.getName(nextId) || "Joueur suivant";
        outputMsg += `\n👉 À votre tour, @${nextName} !`;
      }

      return message.reply({
        body: outputMsg,
        mentions: [{ tag: `@${p1Name}`, id: state.players.p1 }, { tag: `@${p2Name}`, id: state.players.p2 }]
      });
    }
  }
};
