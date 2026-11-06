
const { PermissionFlagsBits } = require("discord.js");

module.exports = {
    name: "kick",
    description: "Expulser un membre du serveur",

    async execute(message, args) {
        if (!message.guild) return;

        if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return message.reply("❌ Tu n'as pas la permission d'expulser des membres.");
        }

        const member = message.mentions.members.first();

        if (!member) {
            return message.reply("Utilisation : `!kick @membre [raison]`");
        }

        if (member.id === message.author.id) {
            return message.reply("❌ Tu ne peux pas t'expulser toi-même.");
        }

        if (member.id === message.guild.ownerId) {
            return message.reply("❌ Tu ne peux pas expulser le propriétaire du serveur.");
        }

        if (
            message.guild.ownerId !== message.author.id &&
            message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0
        ) {
            return message.reply("❌ Ton rôle doit être supérieur à celui du membre.");
        }

        if (!member.kickable) {
            return message.reply("❌ Je ne peux pas expulser ce membre. Vérifie mes permissions et la hiérarchie des rôles.");
        }

        const reason = args.slice(1).join(" ") || "Aucune raison précisée";

        try {
            await member.kick(`${reason} | Par ${message.author.tag}`);
            return message.reply(`👢 ${member.user.tag} a été expulsé. Raison : ${reason}`);
        } catch (error) {
            console.error("[kick]", error);
            return message.reply("❌ Une erreur est survenue pendant l'expulsion.");
        }
    }
};
