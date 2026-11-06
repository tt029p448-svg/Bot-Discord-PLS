
const fs = require("fs");
const path = require("path");
const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const config = require("../config.json");

const whitelistPath = path.join(__dirname, "../whitelist.json");

module.exports = {
    name: "wllist",
    description: "Affiche les utilisateurs de la whitelist.",
    category: "Owner",

    async execute(message) {
        const allowedIds = [
            config.ownerId,
            ...(Array.isArray(config.ownerIds) ? config.ownerIds : [])
        ].filter(Boolean);

        if (!allowedIds.includes(message.author.id)) {
            return message.reply("⛔ Tu n'es pas autorisé à utiliser cette commande.");
        }

        if (!fs.existsSync(whitelistPath)) {
            return message.reply("📋 La whitelist est vide : aucun fichier whitelist.json trouvé.");
        }

        try {
            const data = JSON.parse(
                fs.readFileSync(whitelistPath, "utf8")
            );

            if (!Array.isArray(data) || data.length === 0) {
                return message.reply("📋 Aucun utilisateur dans la whitelist.");
            }

            const ids = [...new Set(data.map(String))];
            const lines = ids.map((id, index) => `**${index + 1}.** \`${id}\``);

            // Discord limite la description d'un embed à 4096 caractères.
            const pages = [];
            let current = "";

            for (const line of lines) {
                if ((current + "\n" + line).length > 3800) {
                    pages.push(current);
                    current = "";
                }
                current += (current ? "\n" : "") + line;
            }

            if (current) pages.push(current);

            const embeds = pages.slice(0, 10).map((page, index) =>
                new EmbedBuilder()
                    .setColor(config.color || "#ADD8E6")
                    .setTitle(`📋 Whitelist Palais2Fivem (${ids.length})`)
                    .setDescription(page)
                    .setFooter({ text: `Page ${index + 1}/${Math.min(pages.length, 10)}` })
            );

            return message.reply({ embeds });
        } catch (error) {
            console.error("[Palais2Fivem WLLIST]", error);
            return message.reply("❌ Impossible de lire whitelist.json. Vérifie que le fichier contient un tableau JSON valide.");
        }
    }
};
