
const { ownerId } = require("../../config.json");

module.exports = {
    name: "banner",
    description: "Informations pour modifier la bannière du bot.",

    async execute(message, args, client) {
        if (message.author.id !== ownerId) return;

        const lien = args[0];

        if (!lien) {
            return message.reply("❌ Utilisation : `+banner <lien>`");
        }

        try {
            const url = new URL(lien);

            if (!["https:", "http:"].includes(url.protocol)) {
                return message.reply("❌ Lien invalide.");
            }

            await message.reply(
                "🖼️ Bannière demandée : " + lien +
                "\nLa modification directe de la bannière n'est pas disponible via cette commande. Vérifie les options du Discord Developer Portal."
            );
        } catch {
            await message.reply("❌ Tu dois fournir un lien valide.");
        }
    }
};
