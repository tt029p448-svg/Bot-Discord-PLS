
const { PermissionsBitField } = require("discord.js");

module.exports = {
    name: "delrole",
    description: "Retirer un rôle à un membre",

    async execute(message, args) {
        // Vérifier que la commande est utilisée sur un serveur
        if (!message.guild) return;

        // Vérifier les permissions de l'utilisateur
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return message.reply("❌ Tu dois avoir la permission **Gérer les rôles**.");
        }

        // Vérifier les permissions du bot
        const botMember = message.guild.members.me;

        if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return message.reply("❌ Je n'ai pas la permission **Gérer les rôles**.");
        }

        // Récupérer la personne mentionnée
        const member = message.mentions.members.first();

        if (!member) {
            return message.reply(
                "❌ Utilisation : `+delrole @personne @rôle`\n" +
                "Exemple : `+delrole @personne 123456789012345678`"
            );
        }

        // Récupérer le rôle mentionné ou son ID
        const roleId = args.find(arg => /^\d{17,20}$/.test(arg));

        if (!roleId) {
            return message.reply("❌ Mentionne le rôle ou indique son ID.");
        }

        const role = await message.guild.roles.fetch(roleId).catch(() => null);

        if (!role) {
            return message.reply("❌ Ce rôle est introuvable sur ce serveur.");
        }

        if (!member.roles.cache.has(role.id)) {
            return message.reply("❌ Cette personne ne possède pas ce rôle.");
        }

        // Vérifier la hiérarchie des rôles
        if (role.position >= botMember.roles.highest.position) {
            return message.reply(
                "❌ Ce rôle est au-dessus ou au même niveau que mon rôle le plus élevé."
            );
        }

        if (
            message.guild.ownerId !== message.author.id &&
            role.position >= message.member.roles.highest.position
        ) {
            return message.reply(
                "❌ Tu ne peux pas retirer un rôle égal ou supérieur à ton rôle le plus élevé."
            );
        }

        try {
            await member.roles.remove(role, `Rôle retiré par ${message.author.tag}`);

            return message.reply(
                `✅ Le rôle **${role.name}** a été retiré à **${member.user.tag}**.`
            );
        } catch (error) {
            console.error("[DelRole] Erreur :", error);
            return message.reply("❌ Impossible de retirer ce rôle. Vérifie mes permissions.");
        }
    }
};
