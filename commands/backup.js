
const {
    PermissionsBitField,
    AttachmentBuilder,
    ChannelType
} = require("discord.js");

module.exports = {
    name: "backup",
    description: "Sauvegarder la structure complète du serveur",

    async execute(message) {
        if (!message.guild) return;

        // Réserver la commande aux administrateurs
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("❌ Cette commande est réservée aux administrateurs.");
        }

        try {
            await message.reply("⏳ Préparation de la sauvegarde du serveur...");

            const guild = message.guild;

            // Récupérer les données les plus récentes
            await guild.roles.fetch();
            await guild.channels.fetch();

            // Sauvegarde des rôles
            const roles = guild.roles.cache
                .filter(role => role.id !== guild.id)
                .map(role => ({
                    id: role.id,
                    name: role.name,
                    color: role.color,
                    hoist: role.hoist,
                    mentionable: role.mentionable,
                    permissions: role.permissions.bitfield.toString(),
                    position: role.position,
                    managed: role.managed
                }));

            // Sauvegarde des salons, catégories et permissions
            
const channels = guild.channels.cache.map(channel => ({
    id: channel.id,
    name: channel.name,
    type: channel.type,
    parentId: channel.parentId ?? null,
    position: channel.position ?? 0,
    topic: channel.topic ?? null,
    nsfw: channel.nsfw ?? false,
    bitrate: channel.bitrate ?? null,
    userLimit: channel.userLimit ?? null,
    rateLimitPerUser: channel.rateLimitPerUser ?? null,

    permissionOverwrites: channel.permissionOverwrites
        ? channel.permissionOverwrites.cache.map(overwrite => ({
            id: overwrite.id,
            type: overwrite.type,
            allow: overwrite.allow.bitfield.toString(),
            deny: overwrite.deny.bitfield.toString()
        }))
        : []
}));

            const backup = {
                backupVersion: 1,
                createdAt: new Date().toISOString(),
                server: {
                    id: guild.id,
                    name: guild.name,
                    description: guild.description ?? null,
                    preferredLocale: guild.preferredLocale
                },
                roles,
                channels
            };

            const buffer = Buffer.from(
                JSON.stringify(backup, null, 2),
                "utf8"
            );

            const date = new Date().toISOString().replace(/[:.]/g, "-");
            const file = new AttachmentBuilder(buffer, {
                name: `backup-${guild.id}-${date}.json`
            });

            await message.channel.send({
                content:
                    `✅ **Sauvegarde terminée !**\n` +
                    `🏠 Serveur : **${guild.name}**\n` +
                    `🎭 Rôles sauvegardés : **${roles.length}**\n` +
                    `📁 Salons sauvegardés : **${channels.length}**\n` +
                    `📄 Conserve ce fichier pour une éventuelle restauration.`,
                files: [file]
            });
        } catch (error) {
            console.error("[Backup] Erreur :", error);

            await message.channel.send(
                "❌ La sauvegarde a échoué. Vérifie les permissions du bot et la taille du fichier."
            ).catch(() => {});
        }
    }
};
