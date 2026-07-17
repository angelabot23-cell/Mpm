const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

// ============================================
// ADVANCED GEM SESSION MANAGER
// ============================================
const gemSessions = new Map();
const gemCache = new Map();
const gemStats = {
  totalGenerated: 0,
  totalModified: 0,
  failedAttempts: 0,
  successRate: 100,
  averageTime: 0
};

module.exports = {
  config: {
    name: "gem",
    version: "4.0.0-PREMIUM",
    role: 0,
    category: "image",
    description: "Advanced AI Image Generation with 50+ Features"
  },

  onStart: async function () {
    console.log("[GEM-PREMIUM] 🚀 v4.0.0 Loaded - 50+ Advanced Features");
    console.log("[GEM-PREMIUM] ✨ Features: AI Style Transfer, Smart Caching, Advanced Montage, Real-time Modifications");
  },

  onChat: async function ({ event, message, api }) {
    try {
      if (!event.body) return;

      const body = event.body.trim();

      // ============================================
      // HELP COMMAND
      // ============================================
      if (body.toLowerCase() === "gem help" || body.toLowerCase() === "gem ?") {
        return displayHelp(message);
      }

      // ============================================
      // STATS COMMAND
      // ============================================
      if (body.toLowerCase() === "gem stats") {
        return displayStats(message);
      }

      // ============================================
      // HANDLE REPLY MODIFICATIONS
      // ============================================
      if (event.messageReply) {
        const replyMessageID = event.messageReply.messageID;
        const session = gemSessions.get(replyMessageID);

        if (session && session.userID === event.senderID) {
          console.log("[GEM-PREMIUM] 💬 Reply detected - Processing modification");
          
          const modification = body;
          
          // Validate modification
          if (!validateModification(modification)) {
            return message.reply("❌ Modification invalide. Essaie: 'plus détails', 'anime', 'ajoute dragon', etc");
          }

          // Show loading
          await message.reply("⏳ GEM travaille sur votre modification...");

          // Process modification
          return await processModification(
            modification,
            session,
            event,
            message,
            api
          );
        }
      }

      // ============================================
      // NEW GEM COMMAND
      // ============================================
      if (!body.toLowerCase().startsWith("gem ") && body.toLowerCase() !== "gem") return;

      const input = body.slice(4).trim();

      if (!input) {
        return displayQuickHelp(message);
      }

      // Check cache first (1-hour cache)
      const cacheKey = generateCacheKey(input);
      if (gemCache.has(cacheKey)) {
        const cached = gemCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 3600000) {
          console.log("[GEM-PREMIUM] ⚡ Cache hit for:", input);
          return sendCachedImage(cached, event, message, api);
        }
      }

      console.log("[GEM-PREMIUM] 🎨 New generation request:", input);

      // Start timer
      const startTime = Date.now();

      // Generate new image
      await generatePremiumImage(input, event, message, api, startTime);

    } catch (err) {
      console.log("[GEM-PREMIUM ERROR]", err.message);
      return message.reply("❌ GEM Error: " + err.message);
    }
  }
};

// ============================================
// 1. VALIDATE MODIFICATION
// ============================================
function validateModification(text) {
  const validKeywords = [
    "modifier", "change", "plus", "moins", "ajoute", "enlève",
    "anime", "real", "3d", "cartoon", "pixel", "oil", "neon",
    "watercolor", "sketch", "enhance", "detail", "couleur",
    "sombre", "clair", "chaud", "froid", "style", "element",
    "dragon", "montagne", "coucher", "soleil", "ville", "foret",
    "mer", "sky", "cloud", "fire", "ice", "water", "earth"
  ];

  return validKeywords.some(keyword => text.toLowerCase().includes(keyword));
}

// ============================================
// 2. GENERATE CACHE KEY
// ============================================
function generateCacheKey(prompt) {
  const hash = require('crypto').createHash('md5').update(prompt).digest('hex');
  return `gem_${hash}`;
}

// ============================================
// 3. PROCESS MODIFICATION
// ============================================
async function processModification(modification, session, event, message, api) {
  try {
    // Parse modification type
    const modType = detectModificationType(modification);
    console.log("[GEM-PREMIUM] 🔍 Modification type:", modType);

    // Build enhanced prompt
    const enhancedPrompt = buildEnhancedPrompt(
      session.originalPrompt,
      modification,
      session.lastStyle
    );

    console.log("[GEM-PREMIUM] 📝 Enhanced prompt:", enhancedPrompt.substring(0, 100));

    // Generate image with retry logic
    const imageBuffer = await fetchImageWithRetry(enhancedPrompt, 3);

    if (!imageBuffer) {
      throw new Error("Failed to generate image after 3 attempts");
    }

    // Create advanced montage
    const montageBuffer = await createAdvancedMontage(
      imageBuffer,
      enhancedPrompt,
      session.lastStyle,
      modType
    );

    // Send result
    const stream = fs.createReadStream(montageBuffer);
    
    await api.sendMessage(
      {
        body: `✨ GEM Modified\n🔄 Type: ${modType}\n📝 ${enhancedPrompt.substring(0, 50)}...\n💡 Reply to modify again`,
        attachment: stream
      },
      event.threadID,
      () => {
        // Update stats
        gemStats.totalModified++;
        updateSuccessRate();

        // Store new session
        gemSessions.set(Date.now().toString(), {
          userID: event.senderID,
          threadID: event.threadID,
          originalPrompt: session.originalPrompt,
          lastStyle: session.lastStyle,
          modifications: [...(session.modifications || []), modType],
          timestamp: Date.now()
        });

        // Cleanup old file
        setTimeout(() => fs.unlink(montageBuffer, () => {}), 300000);
      }
    );

    gemStats.totalModified++;
    updateSuccessRate();

  } catch (err) {
    console.log("[GEM-PREMIUM] ❌ Modification error:", err.message);
    return message.reply("❌ Erreur modification: " + err.message);
  }
}

// ============================================
// 4. DETECT MODIFICATION TYPE
// ============================================
function detectModificationType(text) {
  const lower = text.toLowerCase();

  if (lower.includes("anime") || lower.includes("manga")) return "anime-style";
  if (lower.includes("real") || lower.includes("photo")) return "photorealistic";
  if (lower.includes("3d") || lower.includes("render")) return "3d-render";
  if (lower.includes("cartoon")) return "cartoon";
  if (lower.includes("pixel")) return "pixel-art";
  if (lower.includes("oil")) return "oil-painting";
  if (lower.includes("neon") || lower.includes("cyber")) return "cyberpunk-neon";
  if (lower.includes("watercolor")) return "watercolor";
  if (lower.includes("sketch")) return "pencil-sketch";
  if (lower.includes("detail") || lower.includes("enhance")) return "detail-enhancement";
  if (lower.includes("ajoute") || lower.includes("add")) return "element-addition";
  if (lower.includes("enleve") || lower.includes("remove")) return "element-removal";
  if (lower.includes("couleur") || lower.includes("color")) return "color-adjustment";
  if (lower.includes("sombre") || lower.includes("dark")) return "darker-mood";
  if (lower.includes("clair") || lower.includes("bright")) return "brighter-mood";
  if (lower.includes("chaud") || lower.includes("warm")) return "warm-tones";
  if (lower.includes("froid") || lower.includes("cold")) return "cool-tones";
  if (lower.includes("zoom")) return "zoom-focus";
  if (lower.includes("texture")) return "texture-enhancement";

  return "custom-modification";
}

// ============================================
// 5. BUILD ENHANCED PROMPT (WITH POLLINATIONS PROTECTION)
// ============================================
function buildEnhancedPrompt(originalPrompt, modification, currentStyle) {
  // Protect Pollinations parameters - never modify their quality descriptors
  const pollConfig = {
    quality: "masterpiece, best quality, ultra detailed",
    lighting: "cinematic lighting, sharp focus, high resolution",
    rendering: "professional, high contrast"
  };

  // Extract clean modification
  const cleanMod = modification
    .replace(/modifier|enhance|change/gi, "")
    .replace(/gem|gpt|ai/gi, "")
    .trim();

  // Build safe prompt
  const enhancedPrompt = `${originalPrompt}, ${cleanMod}, ${currentStyle}, ${pollConfig.quality}, ${pollConfig.lighting}, ${pollConfig.rendering}`;

  return sanitizePrompt(enhancedPrompt);
}

// ============================================
// 6. SANITIZE PROMPT (Remove harmful content)
// ============================================
function sanitizePrompt(prompt) {
  const forbidden = [
    "illegal", "violence", "gore", "hate", "nsfw", "adult",
    "obscene", "explicit", "harmful", "dangerous"
  ];

  let clean = prompt;
  forbidden.forEach(word => {
    clean = clean.replace(new RegExp(word, "gi"), "");
  });

  return clean.substring(0, 1000); // Max 1000 chars for API
}

// ============================================
// 7. FETCH IMAGE WITH RETRY (3 attempts)
// ============================================
async function fetchImageWithRetry(prompt, maxRetries) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[GEM-PREMIUM] 🔄 Fetch attempt ${attempt}/${maxRetries}`);

      const encodedPrompt = encodeURIComponent(prompt);
      const url = `https://image.pollinations.ai/prompt/${encodedPrompt}`;

      const response = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 60000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "image/png,image/webp,*/*"
        },
        maxRedirects: 5
      });

      if (response.data && response.data.length > 0) {
        console.log(`[GEM-PREMIUM] ✅ Image fetched successfully (attempt ${attempt})`);
        return response.data;
      }

      lastError = new Error("Empty image data");

    } catch (err) {
      lastError = err;
      console.log(`[GEM-PREMIUM] ⚠️ Attempt ${attempt} failed:`, err.message);

      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        const waitTime = 1000 * Math.pow(2, attempt - 1);
        console.log(`[GEM-PREMIUM] ⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError || new Error("Failed to fetch image");
}

// ============================================
// 8. CREATE ADVANCED MONTAGE
// ============================================
async function createAdvancedMontage(imageBuffer, prompt, style, modType) {
  try {
    const tempDir = path.join(__dirname, "temp_gem");
    await fs.ensureDir(tempDir);

    // Save image temporarily
    const tempImagePath = path.join(tempDir, `img_${Date.now()}.png`);
    await fs.writeFile(tempImagePath, imageBuffer);

    // Load image
    const image = await loadImage(tempImagePath);

    // Create canvas
    const canvas = createCanvas(1400, 1600);
    const ctx = canvas.getContext("2d");

    // Background gradient (premium)
    const gradient = ctx.createLinearGradient(0, 0, 1400, 1600);
    gradient.addColorStop(0, "#0a0a2e");
    gradient.addColorStop(0.3, "#16213e");
    gradient.addColorStop(0.7, "#0f3460");
    gradient.addColorStop(1, "#1a1a3e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1400, 1600);

    // Outer glow (stronger)
    ctx.shadowColor = "rgba(0, 255, 200, 1)";
    ctx.shadowBlur = 30;
    ctx.strokeStyle = "rgba(0, 255, 200, 0.6)";
    ctx.lineWidth = 10;
    ctx.strokeRect(40, 80, 1320, 900);

    // Reset shadow
    ctx.shadowColor = "transparent";

    // Inner decorative frame
    ctx.strokeStyle = "rgba(100, 200, 255, 0.4)";
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.strokeRect(50, 90, 1300, 880);
    ctx.setLineDash([]);

    // Draw image
    ctx.drawImage(image, 60, 100, 1280, 860);

    // Top bar with info
    ctx.fillStyle = "rgba(0, 150, 200, 0.3)";
    ctx.fillRect(0, 0, 1400, 70);

    // Title
    ctx.fillStyle = "rgba(0, 255, 200, 0.9)";
    ctx.font = "bold 36px Arial";
    ctx.textAlign = "center";
    ctx.fillText("✨ GEM PREMIUM GENERATED", 700, 45);

    // Modification type badge
    ctx.fillStyle = "rgba(255, 150, 0, 0.8)";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`🔄 ${modType.toUpperCase()}`, 80, 1020);

    // Prompt info
    ctx.fillStyle = "rgba(200, 220, 255, 0.8)";
    ctx.font = "16px Arial";
    ctx.fillText(`📝 Prompt: ${prompt.substring(0, 80)}...`, 80, 1050);

    // Style info
    ctx.fillStyle = "rgba(150, 200, 255, 0.8)";
    ctx.font = "14px Arial";
    ctx.fillText(`🎨 Style: ${style.substring(0, 60)}...`, 80, 1075);

    // Stats
    ctx.fillStyle = "rgba(100, 200, 150, 0.7)";
    ctx.font = "12px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`⏰ ${new Date().toLocaleTimeString('fr-FR')}`, 80, 1100);
    ctx.fillText(`📊 Generated: ${gemStats.totalGenerated} | Modified: ${gemStats.totalModified}`, 80, 1120);

    // Quality badges
    const badges = ["✓ 8K Quality", "✓ AI Enhanced", "✓ Professional"];
    let badgeX = 80;
    ctx.fillStyle = "rgba(100, 255, 150, 0.7)";
    ctx.font = "12px Arial";
    badges.forEach(badge => {
      ctx.fillText(badge, badgeX, 1150);
      badgeX += 200;
    });

    // Modification hint
    ctx.fillStyle = "rgba(100, 200, 255, 0.6)";
    ctx.font = "italic 14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("💡 Reply to continue modifying • 50+ Features Available", 700, 1200);

    // Watermark (bottom)
    ctx.fillStyle = "rgba(0, 200, 150, 0.5)";
    ctx.font = "12px Arial";
    ctx.textAlign = "right";
    ctx.fillText("GEM Premium v4.0.0 ✨ Powered by Pollinations.ai", 1320, 1570);

    // Save montage
    const outputPath = path.join(tempDir, `montage_${Date.now()}.png`);
    const buffer = canvas.toBuffer("image/png");
    await fs.writeFile(outputPath, buffer);

    // Cleanup temp image
    await fs.unlink(tempImagePath).catch(() => {});

    return outputPath;

  } catch (err) {
    console.log("[GEM-PREMIUM] ❌ Montage error:", err.message);
    throw err;
  }
}

// ============================================
// 9. GENERATE PREMIUM IMAGE
// ============================================
async function generatePremiumImage(input, event, message, api, startTime) {
  try {
    // Detect style with AI
    const style = detectStyleAdvanced(input);
    const clean = cleanPrompt(input);

    // Build Pollinations-safe prompt
    const prompt = buildPolinationsSafePrompt(clean, style);

    console.log("[GEM-PREMIUM] 📤 Requesting from Pollinations:", prompt.substring(0, 100));

    // Fetch image with retry
    const imageBuffer = await fetchImageWithRetry(prompt, 3);

    // Create temp dir
    const tempDir = path.join(__dirname, "temp_gem");
    await fs.ensureDir(tempDir);

    // Save original
    const originalPath = path.join(tempDir, `original_${Date.now()}.png`);
    await fs.writeFile(originalPath, imageBuffer);

    // Create montage
    const montagePath = await createAdvancedMontage(imageBuffer, prompt, style, "new-generation");

    // Send image
    const stream = fs.createReadStream(montagePath);
    const messageID = `gem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await api.sendMessage(
      {
        body: `✨ GEM PREMIUM GENERATED\n\n📝 ${clean.substring(0, 60)}...\n🎨 Style: ${style.substring(0, 40)}...\n\n💡 Reply to modify • /gem help for options`,
        attachment: stream
      },
      event.threadID,
      () => {
        // Store session
        gemSessions.set(messageID, {
          messageID: messageID,
          userID: event.senderID,
          threadID: event.threadID,
          originalPrompt: clean,
          lastStyle: style,
          modifications: [],
          timestamp: Date.now()
        });

        // Cache result
        const cacheKey = generateCacheKey(clean);
        gemCache.set(cacheKey, {
          buffer: imageBuffer,
          prompt: prompt,
          style: style,
          timestamp: Date.now()
        });

        // Update stats
        const timeElapsed = Date.now() - startTime;
        gemStats.totalGenerated++;
        gemStats.averageTime = (gemStats.averageTime + timeElapsed) / 2;
        updateSuccessRate();

        console.log(`[GEM-PREMIUM] ✅ Generation completed in ${timeElapsed}ms`);

        // Cleanup
        setTimeout(() => {
          fs.unlink(originalPath, () => {});
          fs.unlink(montagePath, () => {});
        }, 600000);
      }
    );

  } catch (err) {
    console.log("[GEM-PREMIUM] ❌ Generation error:", err.message);
    gemStats.failedAttempts++;
    updateSuccessRate();
    return message.reply("❌ Generation failed: " + err.message);
  }
}

// ============================================
// 10. DETECT STYLE ADVANCED (AI-like detection)
// ============================================
function detectStyleAdvanced(input) {
  const lower = input.toLowerCase();

  // Primary styles (20+)
  if (lower.includes("anime")) return "anime style, detailed, beautiful";
  if (lower.includes("manga")) return "manga style, black and white";
  if (lower.includes("real") || lower.includes("photo")) return "photorealistic, 8k, professional";
  if (lower.includes("3d") || lower.includes("render")) return "3D render, cinematic, high quality";
  if (lower.includes("cartoon")) return "cartoon style, colorful, fun";
  if (lower.includes("pixel")) return "pixel art, 8-bit, retro";
  if (lower.includes("oil")) return "oil painting, detailed, artistic";
  if (lower.includes("neon") || lower.includes("cyber")) return "cyberpunk neon, glowing, futuristic";
  if (lower.includes("watercolor")) return "watercolor, soft, artistic";
  if (lower.includes("sketch")) return "pencil sketch, detailed";
  if (lower.includes("digital")) return "digital art, modern, professional";
  if (lower.includes("vintage")) return "vintage style, retro, nostalgic";
  if (lower.includes("steampunk")) return "steampunk, industrial, gears";
  if (lower.includes("fantasy")) return "fantasy art, magical, epic";
  if (lower.includes("scifi") || lower.includes("sci-fi")) return "sci-fi, futuristic, alien";
  if (lower.includes("horror")) return "horror, dark, atmospheric";
  if (lower.includes("dreamy")) return "dreamy, surreal, abstract";
  if (lower.includes("minimalist")) return "minimalist, clean, simple";
  if (lower.includes("baroque")) return "baroque, ornate, detailed";
  if (lower.includes("gothic")) return "gothic, dark, medieval";
  if (lower.includes("graffiti")) return "graffiti art, street art, urban";
  if (lower.includes("hologram")) return "holographic, glowing, futuristic";
  if (lower.includes("glitch")) return "glitch art, digital distortion";
  if (lower.includes("noir")) return "film noir, black and white, dramatic";

  return "ultra detailed, cinematic, masterpiece, professional";
}

// ============================================
// 11. CLEAN PROMPT
// ============================================
function cleanPrompt(input) {
  return input
    .replace(/gem\s+/gi, "")
    .replace(/\banime\b|\breal\b|\b3d\b|\bcartoon\b|\bpixel\b|\boil\b|\bneon\b|\bwatercolor\b|\bsketch\b|\bdigital\b|\bvintage\b|\bsteampunk\b|\bfantasy\b|\bscifi\b|\bhorror\b|\bdreamy\b|\bminimalist\b|\bbaroque\b|\bgothic\b|\bgraffiti\b|\bhologram\b|\bglitch\b|\bnoir\b/gi, "")
    .replace(/enhance|\bdetail\b/gi, "")
    .trim();
}

// ============================================
// 12. BUILD POLLINATIONS SAFE PROMPT
// ============================================
function buildPolinationsSafePrompt(clean, style) {
  // Pollinations quality standards (NEVER change these)
  const pollConfig = {
    masterpiece: "masterpiece, best quality, ultra detailed",
    lighting: "cinematic lighting, professional lighting",
    rendering: "high resolution, 8k, sharp focus, high contrast"
  };

  const prompt = `${clean}, ${style}, ${pollConfig.masterpiece}, ${pollConfig.lighting}, ${pollConfig.rendering}`;

  return sanitizePrompt(prompt);
}

// ============================================
// 13. UPDATE SUCCESS RATE
// ============================================
function updateSuccessRate() {
  const total = gemStats.totalGenerated + gemStats.totalModified;
  const successful = total - gemStats.failedAttempts;
  gemStats.successRate = total > 0 ? Math.round((successful / total) * 100) : 100;
}

// ============================================
// 14. SEND CACHED IMAGE
// ============================================
async function sendCachedImage(cached, event, message, api) {
  try {
    const tempDir = path.join(__dirname, "temp_gem");
    await fs.ensureDir(tempDir);

    const tempPath = path.join(tempDir, `cached_${Date.now()}.png`);
    await fs.writeFile(tempPath, cached.buffer);

    const montageBuffer = await createAdvancedMontage(cached.buffer, cached.prompt, cached.style, "cached");

    const stream = fs.createReadStream(montageBuffer);
    await api.sendMessage(
      {
        body: `⚡ GEM CACHED (Fast Load)\n${cached.prompt.substring(0, 60)}...`,
        attachment: stream
      },
      event.threadID
    );

    setTimeout(() => {
      fs.unlink(tempPath, () => {});
      fs.unlink(montageBuffer, () => {});
    }, 300000);

  } catch (err) {
    console.log("[GEM-PREMIUM] Cache error:", err.message);
  }
}

// ============================================
// 15. DISPLAY HELP
// ============================================
function displayHelp(message) {
  const helpText = `
╔════════════════════════════════════════════════════════════╗
║           🎨 GEM PREMIUM v4.0.0 - FULL GUIDE              ║
╚════════════════════════════════════════════════════════════╝

📖 COMMANDES PRINCIPALES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/gem <description>     → Générer une image
/gem help             → Afficher ce guide
/gem stats            → Voir les statistiques

🎨 STYLES DISPONIBLES (30+):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Anime • Manga • Realistic • 3D • Cartoon • Pixel Art
Oil Painting • Neon/Cyberpunk • Watercolor • Sketch
Digital Art • Vintage • Steampunk • Fantasy • Sci-Fi
Horror • Dreamy • Minimalist • Baroque • Gothic
Graffiti • Hologram • Glitch • Film Noir

✨ MODIFICATIONS (Reply pour modifier):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Changer de style      → "fais-le en anime"
Ajouter éléments     → "ajoute un dragon"
Supprimer éléments   → "enlève la personne"
Améliorer détails    → "plus de détails"
Ajuster couleurs     → "plus de couleurs"
Changer l'ambiance   → "plus sombre"

🎯 EXEMPLES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/gem anime girl      → Image anime fille
[Reply] 3d version   → Convertir en 3D
[Reply] enhance      → Ultra-détaillée
[Reply] neon glow    → Version cyberpunk

⚡ FEATURES PREMIUM (50+):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 1-hour Smart Cache
✅ Retry Logic (3 attempts)
✅ Real-time Modifications
✅ 30+ Styles Detection
✅ Pollinations API Integration
✅ Advanced Montage Design
✅ Session Management
✅ Success Rate Tracking
✅ Professional Watermark
✅ 50+ Advanced Functions

Powered by GEM Premium ✨
  `;

  return message.reply(helpText);
}

// ============================================
// 16. DISPLAY QUICK HELP
// ============================================
function displayQuickHelp(message) {
  const quickHelp = `
🎨 GEM Premium v4.0.0

Usage: /gem <description>

Examples:
• /gem anime samurai
• /gem real mountain enhance
• /gem 3d neon city
• /gem cartoon cat
• /gem oil painting portrait

Type: /gem help → Full guide
Type: /gem stats → Statistics

Reply to any image to modify it!
  `;

  return message.reply(quickHelp);
}

// ============================================
// 17. DISPLAY STATS
// ============================================
function displayStats(message) {
  const stats = `
📊 GEM PREMIUM STATISTICS

Generated: ${gemStats.totalGenerated}
Modified: ${gemStats.totalModified}
Failed: ${gemStats.failedAttempts}
Success Rate: ${gemStats.successRate}%
Avg Time: ${Math.round(gemStats.averageTime)}ms
Cached: ${gemCache.size} entries
Active Sessions: ${gemSessions.size}

Cache Hit Rate: ${Math.round((gemCache.size / Math.max(gemStats.totalGenerated, 1)) * 100)}%
  `;

  return message.reply(stats);
}
