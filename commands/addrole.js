
const { PermissionFlagsBits } = require("discord.js");

module.exports = {
    name: "addrole",
    description: "Ajoute un rôle sans retirer les autres rôles.",
    category: "Gestion",

    async execute(message, args) {
        if (!message.guild) return;

        // Vérifier les permissions
        if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return message.reply(
                "❌ Tu dois avoir la permission Gérer les rôles."
            );
        }

        // Récupérer le membre
        const member =
            message.mentions.members.first() ||
            await message.guild.members.fetch(
                args[0]?.replace(/[<@!>]/g, "")
            ).catch(() => null);

        // Récupérer le rôle
        const role =
            message.mentions.roles.first() ||
            await message.guild.roles.fetch(
                args[1]?.replace(/[<@&>]/g, "")
            ).catch(() => null);

        if (!member || !role) {
            return message.reply(
                "❌ Utilisation : `+addrole @membre @rôle`\n" +
                "Ou : `+addrole ID_MEMBRE ID_ROLE`"
            );
        }

        const botMember = message.guild.members.me;

        if (!botMember?.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return message.reply(
                "❌ Je n'ai pas la permission Gérer les rôles."
            );
        }

        // Vérifier la hiérarchie
        if (role.id === message.guild.id || role.managed) {
            return message.reply(
                "❌ Ce rôle ne peut pas être attribué."
            );
        }

        if (role.position >= botMember.roles.highest.position) {
            return message.reply(
                "❌ Le rôle de Palais2Fivem doit être au-dessus du rôle à attribuer."
            );
        }

        if (
            message.guild.ownerId !== message.author.id &&
            role.position >= message.member.roles.highest.position
        ) {
            return message.reply(
                "❌ Tu ne peux pas attribuer un rôle égal ou supérieur au tien."
            );
        }

        if (member.roles.cache.has(role.id)) {
            return message.reply(
                "ℹ️ Ce membre possède déjà ce rôle."
            );
        }

        try {
            // Ajouter uniquement le rôle demandé
            await member.roles.add(
                role,
                `Rôle ajouté par ${message.author.tag}`
            );

            return message.reply(
                `✅ Le rôle **${role.name}** a été ajouté à ${member}.\n` +
                "Tous ses anciens rôles ont été conservés."
            );

        } catch (error) {
            console.error("[Palais2Fivem addrole]", error);

            return message.reply(
                "❌ Impossible d'ajouter ce rôle. Vérifie les permissions."
            );
        }
    }
};
