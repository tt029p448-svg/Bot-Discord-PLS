
const { ownerId } = require("../../config.json");

module.exports = {
    name: "pfp",
    description: "Change la photo de profil du bot.",

    async execute(message, args, client) {
        if (message.author.id !== ownerId) return;

        const lien = args[0];

        if (!lien) {
            return message.reply("❌ Utilisation : `+pfp <lien_image>`");
        }

        try {
            const url = new URL(lien);

            if (!["https:", "http:"].includes(url.protocol)) {
                return message.reply("❌ Le lien doit être HTTP ou HTTPS.");
            }

            const response = await fetch(url, {
                signal: AbortSignal.timeout(10000)
            });

            if (!response.ok) {
                return message.reply("❌ Impossible de récupérer l'image.");
            }

            const type = response.headers.get("content-type") || "";

            if (!type.startsWith("image/")) {
                return message.reply("❌ Le lien doit pointer vers une image.");
            }

            const buffer = Buffer.from(await response.arrayBuffer());

            if (buffer.length > 8 * 1024 * 1024) {
                return message.reply("❌ Image trop volumineuse.");
            }

            await client.user.setAvatar(buffer);

            await message.reply("✅ Photo de profil Palais2Fivem modifiée !");
        } catch (error) {
            console.error("[PFP]", error);
            await message.reply("❌ Impossible de modifier la photo de profil.");
        }
    }
};
