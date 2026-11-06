
const { ActivityType } = require("discord.js");
const { ownerId } = require("../../config.json");

module.exports = {
    name: "status",
    description: "Change le statut personnalisé du bot.",

    async execute(message, args, client) {
        if (message.author.id !== ownerId) return;

        const texte = args.join(" ").trim();

        if (!texte) {
            return message.reply("❌ Utilisation : `+status <texte>`");
        }

        if (texte.length > 128) {
            return message.reply("❌ Le statut est trop long (128 caractères maximum).");
        }

        client.user.setPresence({
            status: "online",
            activities: [
                {
                    name: "Custom Status",
                    type: ActivityType.Custom,
                    state: texte
                }
            ]
        });

        await message.reply(`✅ Nouveau statut : ${texte}`);
    }
};
