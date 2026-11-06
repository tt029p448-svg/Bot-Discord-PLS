
const fs = require("fs");
const path = require("path");

const configPath = path.join(process.cwd(), "config.json");

module.exports = {
    name: "color",
    description: "Modifier la couleur des embeds du bot",

    async execute(message, args, client) {
        if (!message.guild) return;

        let config;

        try {
            config = JSON.parse(fs.readFileSync(configPath, "utf8"));
        } catch (error) {
            console.error("[color] Lecture de config.json impossible :", error);
            return message.reply("❌ Impossible de lire config.json.");
        }

        if (!config.ownerId) {
            return message.reply(
                "❌ Configure ownerId dans config.json avant d'utiliser cette commande."
            );
        }

        if (message.author.id !== config.ownerId) {
            return message.reply("⛔ Seul le propriétaire du bot peut utiliser cette commande.");
        }

        const hex = args[0]?.replace(/^#/, "");

        if (!hex || !/^[0-9a-fA-F]{6}$/.test(hex)) {
            return message.reply(
                "Utilisation : `!color #5865F2`\nLa couleur doit être un code hexadécimal à 6 caractères."
            );
        }

        config.color = `#${hex.toUpperCase()}`;

        try {
            fs.writeFileSync(
                configPath,
                JSON.stringify(config, null, 4) + "\n",
                "utf8"
            );

            // Mettre à jour la configuration en mémoire si elle est utilisée
            client.config = config;

            return message.reply(
                `✅ La couleur des embeds est maintenant **${config.color}**.\n` +
                "Les commandes qui utilisent cette configuration devront lire `client.config.color` pour appliquer la nouvelle couleur."
            );
        } catch (error) {
            console.error("[color] Écriture de config.json impossible :", error);
            return message.reply("❌ Impossible d'enregistrer la nouvelle couleur.");
        }
    }
};
