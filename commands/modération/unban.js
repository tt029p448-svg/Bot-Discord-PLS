
const { PermissionFlagsBits } = require("discord.js");

module.exports = {
    name: "unban",
    description: "Débannir un utilisateur",

    async execute(message, args) {
        if (!message.guild) return;

        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return message.reply("❌ Tu n'as pas la permission de débannir des utilisateurs.");
        }

        const userId = args[0];

        if (!userId || !/^\d{17,20}$/.test(userId)) {
            return message.reply("Utilisation : `!unban ID_UTILISATEUR [raison]`");
        }

        const reason = args.slice(1).join(" ") || "Aucune raison précisée";

        try {
            const ban = await message.guild.bans.fetch(userId).catch(() => null);

            if (!ban) {
                return message.reply("❌ Cet utilisateur n'est pas banni ou son ID est incorrect.");
            }

            await message.guild.members.unban(
                userId,
                `${reason} | Par ${message.author.tag}`
            );

            return message.reply(
                `✅ ${ban.user.tag} a été débanni. Raison : ${reason}`
            );
        } catch (error) {
            console.error("[unban]", error);
            return message.reply("❌ Impossible de débannir cet utilisateur.");
        }
    }
};
