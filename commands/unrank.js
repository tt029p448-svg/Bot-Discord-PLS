const { PermissionFlagsBits } = require("discord.js");
const config = require("../config.json");

module.exports = {
    name: "unrank",
    description: "Retire les rôles d'un membre avec une raison obligatoire.",
    category: "Gestion",

    async execute(message, args) {
        if (!message.guild) return;

        if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return message.reply("❌ Tu dois avoir la permission Gérer les rôles.");
        }

        const mentionedMember = message.mentions.members.first();
        const memberId = mentionedMember ? mentionedMember.id : args[0];
        const reason = (mentionedMember ? args.slice(1) : args.slice(1)).join(" ").trim();

        if (!memberId || !reason) {
            return message.reply(
                "❌ Utilisation : `+unrank @membre raison`\n" +
                "Exemple : `+unrank @membre Abus de permissions`"
            );
        }

        const member = mentionedMember ||
            await message.guild.members.fetch(memberId).catch(() => null);

        if (!member) {
            return message.reply("❌ Membre introuvable sur ce serveur.");
        }

        if (member.id === message.author.id) {
            return message.reply("❌ Tu ne peux pas utiliser cette commande sur toi-même.");
        }

        if (member.id === message.guild.ownerId) {
            return message.reply("❌ Impossible de retirer les rôles du propriétaire du serveur.");
        }

        const botMember = message.guild.members.me;

        if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return message.reply("❌ Je dois avoir la permission Gérer les rôles.");
        }

        if (member.roles.highest.position >= botMember.roles.highest.position) {
            return message.reply("❌ Les rôles de ce membre sont trop élevés pour le bot.");
        }

        if (
            message.author.id !== message.guild.ownerId &&
            member.roles.highest.position >= message.member.roles.highest.position
        ) {
            return message.reply("❌ Tu ne peux pas modifier les rôles d'un membre égal ou supérieur à toi.");
        }

        const protectedRoleId = config.memberRoleId;

        const rolesToRemove = member.roles.cache.filter(role =>
            role.id !== message.guild.id &&
            role.id !== protectedRoleId &&
            !role.managed &&
            role.position < botMember.roles.highest.position
        );

        if (rolesToRemove.size === 0) {
            return message.reply("ℹ️ Aucun rôle retirable trouvé sur ce membre.");
        }

        try {
            await member.roles.remove(
                rolesToRemove,
                `Unrank par ${message.author.tag} | Raison : ${reason}`
            );

            return message.reply(
                `✅ **Unrank effectué**\n` +
                `👤 Membre : ${member}\n` +
                `🛡️ Modérateur : ${message.author}\n` +
                `📝 Raison : ${reason}\n` +
                `🎭 Rôles retirés : ${rolesToRemove.size}`
            );
        } catch (error) {
            console.error("[Palais2Fivem unrank]", error);
            return message.reply("❌ Erreur lors du retrait des rôles. Vérifie les permissions du bot.");
        }
    }
};