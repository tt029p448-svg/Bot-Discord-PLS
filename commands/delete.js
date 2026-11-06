
const { PermissionsBitField } = require("discord.js");

module.exports = {
    name: "delete",
    description: "Supprime le salon actuel",
    category: "Gestion",

    async execute(message) {
        if (!message.guild) return;

        if (message.author.id !== message.guild.ownerId) {
            return message.reply("❌ Seul le propriétaire peut utiliser cette commande.");
        }

        if (!message.guild.members.me.permissions.has(
            PermissionsBitField.Flags.ManageChannels
        )) {
            return message.reply("❌ Le bot doit avoir la permission Gérer les salons.");
        }

        if (message.channel.deletable) {
            await message.channel.delete("Suppression demandée par le propriétaire.");
        }
    }
};
