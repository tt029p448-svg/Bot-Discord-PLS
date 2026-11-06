
const { PermissionFlagsBits } = require("discord.js");

module.exports = {
    name: "mute",
    description: "Rendre temporairement un membre muet",

    async execute(message, args) {
        if (!message.guild) return;

        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply("❌ Tu n'as pas la permission de modérer les membres.");
        }

        const member = message.mentions.members.first();

        if (!member) {
            return message.reply("Utilisation : `!mute @membre [durée en minutes] [raison]`");
        }

        if (member.id === message.author.id || member.id === message.guild.ownerId) {
            return message.reply("❌ Tu ne peux pas appliquer ce mute à cette personne.");
        }

        if (
            message.guild.ownerId !== message.author.id &&
            message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0
        ) {
            return message.reply("❌ Ton rôle doit être supérieur à celui du membre.");
        }

        if (!member.moderatable) {
            return message.reply("❌ Je ne peux pas modérer ce membre. Vérifie la hiérarchie des rôles.");
        }

        const duration = Number(args[1] || 10);

        if (!Number.isInteger(duration) || duration < 1 || duration > 40320) {
            return message.reply("❌ La durée doit être comprise entre 1 et 40320 minutes (28 jours).");
        }

        const reason = args.slice(2).join(" ") || "Aucune raison précisée";

        try {
            await member.timeout(
                duration * 60 * 1000,
                `${reason} | Par ${message.author.tag}`
            );

            return message.reply(
                `🔇 ${member.user.tag} est en timeout pendant ${duration} minute(s). Raison : ${reason}`
            );
        } catch (error) {
            console.error("[mute]", error);
            return message.reply("❌ Impossible d'appliquer le timeout.");
        }
    }
};
