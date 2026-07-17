const { spawn } = require("child_process");
const express = require("express");

const app = express();

// 🔥 serveur obligatoire pour Render
app.get("/", (req, res) => {
  res.send("Goat Bot Running ✅");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🌍 Server running on port " + PORT);
});

// 💥 sécurité anti crash
process.on("uncaughtException", err => console.error("💥", err));
process.on("unhandledRejection", err => console.error("💥", err));

// 🚀 lancement bot
function startBot() {
  const child = spawn("node", ["Goat.js"], {
    stdio: "inherit",
    shell: true
  });

  child.on("close", (code) => {
    console.log("🔁 Bot arrêté avec code:", code);

    // restart seulement si erreur
    if (code !== 0) {
      setTimeout(() => {
        console.log("♻️ Redémarrage...");
        startBot();
      }, 5000);
    }
  });

  child.on("error", (err) => {
    console.error("❌ Spawn error:", err);
  });
}

startBot();
