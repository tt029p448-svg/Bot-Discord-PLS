
const { PermissionFlagsBits } = require("discord.js");
const { slashCommand, configure } = require("../handler/security");

module.exports = {
    name: "securite",
    description: "Configure les salons anti-hack.",
    async execute(message, args, client) {
        if (!message.guild) return;

        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply("❌ Réservé aux administrateurs.");
        }

        return message.reply(
            "⚙️ Utilise `/securite configurer` pour sélectionner les deux salons, puis `/securite voir` pour vérifier la configuration."
        );
    }
};
