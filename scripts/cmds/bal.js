const { createCanvas, loadImage } = require("canvas");
const GIFEncoder = require("gifencoder");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

// === CONFIGURATION DES COULEURS ANIMÉES ===
const NEON_HUES = [0, 280, 330, 45]; // Rouge, Violet, Rose, Or démoniaque

module.exports = {
  config: {
    name: "bal",
    aliases: ["bal", "$", "cash"],
    version: "7.0 (Animated)",
    author: "Christus x Célestin 🔥",
    countDown: 3,
    role: 0,
    description: "💰 Système économique cyber-sanctuaire avec transfert et carte noire animée",
    category: "economy",
    guide: {
      fr: "{pn} - voir ton solde\n{pn} @utilisateur - voir le solde d'un autre\n{pn} t @utilisateur montant - transférer de l'argent"
    }
  },

  onStart: async function ({ message, event, args, usersData }) {
    const { senderID, mentions, messageReply } = event;

    // === FORMATTAGE DE L'ARGENT ===
    const formatMoney = (amount) => {
      if (isNaN(amount)) return "0$";
      amount = Number(amount);
      const scales = [
        { value: 1e15, suffix: 'Q' },
        { value: 1e12, suffix: 'T' },
        { value: 1e9, suffix: 'B' },
        { value: 1e6, suffix: 'M' },
        { value: 1e3, suffix: 'k' }
      ];
      const scale = scales.find(s => amount >= s.value);
      if (scale) return `${(amount / scale.value).toFixed(1)}${scale.suffix}$`;
      return `${amount.toLocaleString()}$`;
    };

    // === RÉCUPÉRATION DE L'AVATAR ===
    const fetchAvatar = async (userID) => {
      try {
        let avatarURL = `https://graph.facebook.com/${userID}/picture?type=large&width=500&height=500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const res = await axios.get(avatarURL, { responseType: "arraybuffer", timeout: 10000 });
        return await loadImage(Buffer.from(res.data));
      } catch (e) {
        const size = 120;
        const canvas = createCanvas(size, size);
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#100015";
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = "#fff";
        ctx.font = `bold ${size / 2}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(userID.charAt(0).toUpperCase(), size / 2, size / 2);
        return canvas;
      }
    };

    // ==========================================
    // 1. SYSTÈME DE TRANSFERT D'ARGENT
    // ==========================================
    if (args[0]?.toLowerCase() === "t") {
      let targetID = Object.keys(mentions)[0] || messageReply?.senderID;
      const amountRaw = args.find(a => !isNaN(a));
      const amount = parseFloat(amountRaw);

      if (!targetID || isNaN(amount)) return message.reply("❌ Usage : !bal t @utilisateur montant");
      if (targetID === senderID) return message.reply("❌ Vous ne pouvez pas vous envoyer de l'argent.");
      if (amount <= 0) return message.reply("❌ Le montant doit être supérieur à 0.");

      const sender = await usersData.get(senderID);
      const receiver = await usersData.get(targetID);
      if (!receiver) return message.reply("❌ Utilisateur cible introuvable.");

      const taxRate = 5;
      const tax = Math.ceil(amount * taxRate / 100);
      const total = amount + tax;

      if (sender.money < total) return message.reply(
        `❌ Fonds insuffisants.\nNécessaire : ${formatMoney(total)}\nVous avez : ${formatMoney(sender.money)}`
      );

      await Promise.all([
        usersData.set(senderID, { ...sender, money: sender.money - total }),
        usersData.set(targetID, { ...receiver, money: receiver.money + amount })
      ]);

      const receiverName = await usersData.getName(targetID);
      return message.reply(
        `✅ Transfert réussi ! 💸\n➤ Vers : ${receiverName}\n➤ Montant envoyé : ${formatMoney(amount)}\n➤ Taxe : ${formatMoney(tax)}\n➤ Total débité : ${formatMoney(total)}`
      );
    }

    // ==========================================
    // 2. GÉNÉRATION DE LA CARTE NOIRE ANIMÉE (GIF)
    // ==========================================
    let targetID = Object.keys(mentions)[0] || messageReply?.senderID || senderID;

    const name = await usersData.getName(targetID);
    const money = await usersData.get(targetID, "money") || 0;
    const avatar = await fetchAvatar(targetID);

    const width = 750, height = 350;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Initialisation de l'encodeur GIF
    const encoder = new GIFEncoder(width, height);
    const tmpDir = path.join(__dirname, "..", "cache");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    
    const filePath = path.join(tmpDir, `vault_card_${Date.now()}_${targetID}.gif`);
    const writeStream = fs.createWriteStream(filePath);
    
    encoder.createReadStream().pipe(writeStream);
    encoder.start();
    encoder.setRepeat(0);   // Boucle infinie
    encoder.setDelay(250);  // 250ms entre chaque frame
    encoder.setQuality(10); // Qualité d'encodage

    // Rendu des frames (une frame pour chaque couleur néon)
    for (let h = 0; h < NEON_HUES.length; h++) {
      const neonColor = `hsl(${NEON_HUES[h]}, 100%, 55%)`;

      // Fond Sombre Cyber
      ctx.fillStyle = "#050508";
      ctx.fillRect(0, 0, width, height);

      let darkGrad = ctx.createRadialGradient(width/2, height/2, 100, width/2, height/2, 400);
      darkGrad.addColorStop(0, "rgba(15, 10, 25, 0.2)");
      darkGrad.addColorStop(1, "#000000");
      ctx.fillStyle = darkGrad;
      ctx.fillRect(0, 0, width, height);

      // Grille Techno en arrière-plan
      ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 50) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
      }

      // Conteneur principal de la carte
      ctx.fillStyle = "rgba(20, 20, 30, 0.75)";
      ctx.fillRect(40, 40, width - 80, height - 80);

      // Bordure Néon Dynamique
      ctx.strokeStyle = neonColor;
      ctx.lineWidth = 4;
      ctx.strokeRect(40, 40, width - 80, height - 80);

      // Coins renforcés tactiques
      ctx.fillStyle = neonColor;
      const cornerSize = 15;
      ctx.fillRect(35, 35, cornerSize, 5); ctx.fillRect(35, 35, 5, cornerSize);
      ctx.fillRect(width - 35 - cornerSize, 35, cornerSize, 5); ctx.fillRect(width - 35, 35, 5, cornerSize);
      ctx.fillRect(35, height - 35, cornerSize, 5); ctx.fillRect(35, height - 35 - cornerSize, 5, cornerSize);
      ctx.fillRect(width - 35 - cornerSize, height - 35, cornerSize, 5); ctx.fillRect(width - 35, height - 35 - cornerSize, 5, cornerSize);

      // Dessin de l'Avatar
      const avatarSize = 120;
      const avatarX = 75, avatarY = 115;
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
      ctx.restore();

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 2, 0, Math.PI * 2);
      ctx.stroke();

      // Textes & Éléments Graphiques
      ctx.fillStyle = neonColor;
      ctx.font = "bold 24px 'Impact', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("CASSIDY VAULT SYSTEM", width - 60, 80);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 34px 'Arial', sans-serif";
      ctx.textAlign = "left";
      const cleanName = name.length > 18 ? name.substring(0, 16) + ".." : name;
      ctx.fillText(cleanName.toUpperCase(), 220, 155);

      ctx.font = "14px 'Courier New', monospace";
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.fillText(`ACC. HOLDER // ${targetID}`, 220, 185);

      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(220, 205); ctx.lineTo(width - 60, 205); ctx.stroke();

      ctx.font = "bold 13px 'Arial', sans-serif";
      ctx.fillStyle = neonColor;
      ctx.fillText("SOLDE DISPONIBLE", 220, 230);

      ctx.font = "bold 52px 'Impact', sans-serif";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(`${formatMoney(money)}`, 220, 285);

      // Ajout de la frame actuelle au GIF
      encoder.addFrame(ctx);
    }

    encoder.finish();

    // Attente de la fin de l'écriture du flux de fichier avant l'envoi
    writeStream.on("finish", () => {
      return message.reply({
        body: `🖤 [ ᴍᴀɪsᴏɴ ᴄᴀssɪᴅʏ ] Fiche financière animée de ${name} mise à jour.`,
        attachment: fs.createReadStream(filePath)
      }).then(() => {
        setTimeout(() => {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }, 10000); // 10 secondes de sécurité avant suppression du cache
      });
    });
  }
};
