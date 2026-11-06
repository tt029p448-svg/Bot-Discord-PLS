
const fs = require("fs");
const path = require("path");
const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { color } = require("../../config.json");

const file = path.join(__dirname, "../../data/prefixes.json");

module.exports = {
    name: "setprefix",
    description: "Change le préfixe du bot",

    async execute(message, args) {
        if (!message.guild) {
            return message.reply("Cette commande doit être utilisée sur un serveur.");
        }

        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            return message.reply("❌ Tu dois avoir la permission Gérer le serveur.");
        }

        const newPrefix = args[0];

        if (!newPrefix || newPrefix.length > 5 || /\s/.test(newPrefix)) {
            return message.reply("Utilisation : `+setprefix !` (1 à 5 caractères, sans espace).");
        }

        try {
            fs.mkdirSync(path.dirname(file), { recursive: true });

            let prefixes = {};
            if (fs.existsSync(file)) {
                prefixes = JSON.parse(fs.readFileSync(file, "utf8"));
            }

            prefixes[message.guild.id] = newPrefix;
            fs.writeFileSync(file, JSON.stringify(prefixes, null, 2), "utf8");

            const embed = new EmbedBuilder()
                .setColor(color || "#ADD8E6")
                .setDescription(`✅ Le préfixe de ce serveur est maintenant \`${newPrefix}\`.`);

            return message.reply({ embeds: [embed] });
        } catch (error) {
            console.error("[Prefix] Erreur :", error);
            return message.reply("❌ Impossible de sauvegarder le préfixe.");
        }
    }
};
