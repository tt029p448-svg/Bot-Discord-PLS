
const { PermissionFlagsBits } = require("discord.js");

module.exports = {
    name: "ban",
    description: "Bannir un membre du serveur",

    async execute(message, args) {
        if (!message.guild) return;

        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return message.reply("❌ Tu n'as pas la permission de bannir des membres.");
        }

        const target = message.mentions.members.first();
        const userId = target?.id || args[0];

        if (!userId) {
            return message.reply("Utilisation : `!ban @membre [raison]`");
        }

        const reason = args.slice(target ? 1 : 1).join(" ") || "Aucune raison précisée";

        try {
            const member = target || await message.guild.members.fetch(userId).catch(() => null);

            if (member) {
                if (member.id === message.author.id) {
                    return message.reply("❌ Tu ne peux pas te bannir toi-même.");
                }

                if (member.id === message.guild.ownerId) {
                    return message.reply("❌ Tu ne peux pas bannir le propriétaire du serveur.");
                }

                if (!member.bannable) {
                    return message.reply("❌ Je ne peux pas bannir ce membre. Vérifie la hiérarchie des rôles du bot.");
                }

                if (message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0
                    && message.guild.ownerId !== message.author.id) {
                    return message.reply("❌ Ton rôle doit être supérieur à celui du membre.");
                }

                await member.ban({ reason: `${reason} | Par ${message.author.tag}` });
            } else {
                await message.guild.members.ban(userId, {
                    reason: `${reason} | Par ${message.author.tag}`
                });
            }

            return message.reply(`🔨 Membre banni. Raison : ${reason}`);
        } catch (error) {
            console.error("[ban]", error);
            return message.reply("❌ Impossible de bannir ce membre. Vérifie son ID et mes permissions.");
        }
    }
};
