const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "sing",
    aliases: ["song", "music"],
    version: "2.3",
    author: "Mueid Mursalin Rifat",
    countDown: 5,
    role: 0,
    shortDescription: "Download music from YouTube",
    longDescription: "Search and download audio from YouTube using multiple APIs",
    category: "media",
    guide: {
      en: "{pn} <song name>\nReply with 1-5 to download"
    }
  },

  onStart: async function ({ message, event, args, api }) {
    const query = args.join(" ");
    if (!query) return message.reply("Please enter a song name");

    try {
      const res = await yts(query);
      const videos = res.videos.slice(0, 5);
      if (videos.length === 0) return message.reply("No songs found");

      let body = `🎵 Search Results: "${query}"\nReply with 1-5 to download\n\n`;
      for (let i = 0; i < videos.length; i++) {
        body += `${i + 1}. ${videos[i].title}\nDuration: ${videos[i].timestamp} | By: ${videos[i].author.name}\n\n`;
      }

      const attachments = [];
      for (let i = 0; i < videos.length; i++) {
        try {
          const img = await axios.get(videos[i].thumbnail, { responseType: "stream" });
          const tempPath = path.join(__dirname, "cache", `thumb-${i}-${Date.now()}.jpg`);
          const writer = fs.createWriteStream(tempPath);
          img.data.pipe(writer);
          await new Promise(resolve => writer.on("finish", resolve));
          attachments.push(fs.createReadStream(tempPath));
        } catch (e) {
          console.error("Error downloading thumbnail:", e);
        }
      }

      api.sendMessage({
        body: body,
        attachment: attachments
      }, event.threadID, (err, info) => {
        // Clean up temp files after sending
        attachments.forEach(file => {
          try { 
            fs.unlinkSync(file.path); 
          } catch (e) {}
        });

        if (err) return;

        const sentMsgID = info.messageID;
        
        // Auto delete search result after 30 seconds
        setTimeout(() => {
          try {
            api.unsendMessage(sentMsgID);
          } catch (e) {}
        }, 30000);

        global.GoatBot.onReply.set(sentMsgID, {
          commandName: "sing",
          messageID: sentMsgID,
          author: event.senderID,
          data: videos
        });
      });

    } catch (e) {
      console.error("Search error:", e);
      message.reply("Failed to search songs");
    }
  },

  onReply: async function ({ event, message, Reply, api }) {
    const { author, data, messageID } = Reply;
    if (event.senderID !== author) return;

    const index = parseInt(event.body);
    if (isNaN(index) || index < 1 || index > data.length)
      return message.reply("Please reply with a number from 1 to 5");

    const selected = data[index - 1];

    // Remove search message
    try {
      api.unsendMessage(messageID);
    } catch (e) {}

    const wait = await message.reply("⏳ Downloading your song...");
    await handleDownload(selected.url, message, wait.messageID);
  }
};

// Download Handler with multiple API fallback
async function handleDownload(url, message, waitMsgID) {
  try {
    // First try the ShadowX API
    const shadowxApiURL = `https://shadowx-api.onrender.com/api/yt?url=${encodeURIComponent(url)}&quality=128&format=mp3`;
    
    try {
      const { data: shadowxData } = await axios.get(shadowxApiURL, { timeout: 15000 });
      
      if (shadowxData.success && shadowxData.download_info && shadowxData.download_info.fileUrl) {
        await downloadAndSend(
          shadowxData.download_info.fileUrl,
          shadowxData.video_info,
          message,
          waitMsgID,
          "ShadowX-API"
        );
        return;
      }
    } catch (shadowxError) {
      console.log("ShadowX API failed, trying backup API...");
    }

    // Fallback to original API
    const backupApiURL = `https://koja-api.web-server.xyz/ytmp3?url=${encodeURIComponent(url)}`;
    const { data: backupData } = await axios.get(backupApiURL);
    
    if (backupData.success && backupData.download && backupData.download.url) {
      await downloadAndSend(
        backupData.download.url,
        backupData.metadata,
        message,
        waitMsgID,
        "Koja-API"
      );
    } else {
      throw new Error("Both APIs failed");
    }

  } catch (err) {
    console.error("Download failed:", err);
    try {
      await message.unsend(waitMsgID);
    } catch (e) {}
    message.reply("❌ Error downloading song. Please try again later.");
  }
}

// Helper function to download and send audio
async function downloadAndSend(downloadUrl, metadata, message, waitMsgID, apiSource) {
  try {
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`;
    const filePath = path.join(__dirname, "cache", fileName);

    const res = await axios.get(downloadUrl, { 
      responseType: "stream",
      timeout: 60000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const writer = fs.createWriteStream(filePath);
    res.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
      res.data.on("error", reject);
    });

    // Remove "Downloading..." message
    try {
      await message.unsend(waitMsgID);
    } catch (e) {}

    // Format metadata based on API source
    let title = metadata.title || "Unknown Title";
    let artist = metadata.author?.name || metadata.channel || "Unknown Artist";
    let duration = metadata.duration?.timestamp || metadata.duration || "Unknown";

    await message.reply({
      body: `🎵 ${title}\n🎤 Artist: ${artist}\n⏱ Duration: ${duration}\n🔧 API: ${apiSource}\n\nDownloaded successfully!`,
      attachment: fs.createReadStream(filePath)
    });

    // Clean up
    fs.unlinkSync(filePath);

  } catch (downloadErr) {
    console.error(`Download error from ${apiSource}:`, downloadErr);
    throw downloadErr;
  }
}
