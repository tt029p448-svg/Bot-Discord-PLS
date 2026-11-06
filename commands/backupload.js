
const {
    PermissionsBitField,
    ChannelType
} = require("discord.js");

module.exports = {
    name: "backupload",
    description: "Restaurer une sauvegarde de serveur depuis un fichier JSON",

    async execute(message) {
        if (!message.guild) return;

        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("❌ Tu dois être administrateur pour restaurer une sauvegarde.");
        }

        const botMember = message.guild.members.me;

        if (!botMember?.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("❌ Donne-moi la permission Administrateur pour restaurer la sauvegarde.");
        }

        const attachment = message.attachments.find(file =>
            file.name?.toLowerCase().endsWith(".json")
        );

        if (!attachment) {
            return message.reply(
                "❌ Joins le fichier JSON à ta commande.\n" +
                "Exemple : `+backupload` avec le fichier de backup en pièce jointe."
            );
        }

        if (attachment.size > 8 * 1024 * 1024) {
            return message.reply("❌ Le fichier est trop volumineux (maximum 8 Mo).");
        }

        const status = await message.reply("⏳ Restauration en cours... Ne relance pas la commande.");

        try {
            const response = await fetch(attachment.url);

            if (!response.ok) {
                throw new Error("Impossible de télécharger le fichier JSON.");
            }

            const backup = await response.json();

            if (
                !backup.server ||
                !Array.isArray(backup.roles) ||
                !Array.isArray(backup.channels)
            ) {
                throw new Error("Le fichier ne correspond pas au format de backup Palais2Fivem.");
            }

            const guild = message.guild;

            // Ancien ID => nouvel ID
            const roleIdMap = new Map();
            roleIdMap.set(backup.server.id, guild.id);

            const channelIdMap = new Map();
            const errors = [];
            let rolesCreated = 0;
            let channelsCreated = 0;

            // 1. Créer les rôles
            const savedRoles = backup.roles
                .filter(role => !role.managed)
                .sort((a, b) => a.position - b.position);

            for (const savedRole of savedRoles) {
                try {
                    const newRole = await guild.roles.create({
                        name: savedRole.name,
                        color: savedRole.color ?? 0,
                        hoist: savedRole.hoist ?? false,
                        mentionable: savedRole.mentionable ?? false,
                        permissions: BigInt(savedRole.permissions ?? "0"),
                        reason: "Restauration d'une backup Palais2Fivem"
                    });

                    roleIdMap.set(savedRole.id, newRole.id);
                    rolesCreated++;
                } catch (error) {
                    errors.push(`Rôle "${savedRole.name}" : ${error.message}`);
                }
            }

            // 2. Préparer les salons : catégories en premier
            const supportedTypes = new Set([
                ChannelType.GuildCategory,
                ChannelType.GuildText,
                ChannelType.GuildVoice,
                ChannelType.GuildAnnouncement,
                ChannelType.GuildStageVoice,
                ChannelType.GuildForum,
                ChannelType.GuildMedia
            ]);

            const savedChannels = [...backup.channels]
                .filter(channel => supportedTypes.has(channel.type))
                .sort((a, b) => {
                    if (a.type === ChannelType.GuildCategory) return -1;
                    if (b.type === ChannelType.GuildCategory) return 1;
                    return (a.position ?? 0) - (b.position ?? 0);
                });

            // 3. Créer les salons et restaurer leurs permissions
            for (const savedChannel of savedChannels) {
                try {
                    const overwrites = [];

                    for (const overwrite of savedChannel.permissionOverwrites ?? []) {
                        // Les permissions individuelles des anciens membres
                        // ne peuvent pas être transférées automatiquement.
                        if (overwrite.type === 1) continue;

                        const newTargetId =
                            roleIdMap.get(overwrite.id) ??
                            (overwrite.id === backup.server.id ? guild.id : null);

                        if (!newTargetId) continue;

                        overwrites.push({
                            id: newTargetId,
                            type: 0,
                            allow: BigInt(overwrite.allow ?? "0"),
                            deny: BigInt(overwrite.deny ?? "0")
                        });
                    }

                    const options = {
                        name: savedChannel.name,
                        type: savedChannel.type,
                        permissionOverwrites: overwrites,
                        reason: "Restauration d'une backup Palais2Fivem"
                    };

                    if (
                        savedChannel.parentId &&
                        channelIdMap.has(savedChannel.parentId) &&
                        savedChannel.type !== ChannelType.GuildCategory
                    ) {
                        options.parent = channelIdMap.get(savedChannel.parentId);
                    }

                    if (savedChannel.topic != null) {
                        options.topic = savedChannel.topic;
                    }

                    if (savedChannel.nsfw != null) {
                        options.nsfw = savedChannel.nsfw;
                    }

                    if (savedChannel.bitrate != null) {
                        options.bitrate = savedChannel.bitrate;
                    }

                    if (savedChannel.userLimit != null) {
                        options.userLimit = savedChannel.userLimit;
                    }

                    if (savedChannel.rateLimitPerUser != null) {
                        options.rateLimitPerUser = savedChannel.rateLimitPerUser;
                    }

                    if (savedChannel.rtcRegion != null) {
                        options.rtcRegion = savedChannel.rtcRegion;
                    }

                    if (savedChannel.videoQualityMode != null) {
                        options.videoQualityMode = savedChannel.videoQualityMode;
                    }

                    if (savedChannel.defaultAutoArchiveDuration != null) {
                        options.defaultAutoArchiveDuration =
                            savedChannel.defaultAutoArchiveDuration;
                    }

                    const newChannel = await guild.channels.create(options);

                    channelIdMap.set(savedChannel.id, newChannel.id);
                    channelsCreated++;
                } catch (error) {
                    errors.push(`Salon "${savedChannel.name}" : ${error.message}`);
                }
            }

            const summary =
                `✅ **Restauration terminée**\n` +
                `🎭 Rôles créés : **${rolesCreated}/${savedRoles.length}**\n` +
                `📁 Salons créés : **${channelsCreated}/${savedChannels.length}**\n` +
                `⚠️ Erreurs : **${errors.length}**`;

            await status.edit(summary);

            if (errors.length) {
                const details = errors.slice(0, 10).map(error => `• ${error}`).join("\n");
                await message.channel.send({
                    content:
                        "**Détails des erreurs :**\n" +
                        details +
                        (errors.length > 10 ? `\n… et ${errors.length - 10} autre(s).` : "")
                });
            }
        } catch (error) {
            console.error("[Backupload] Erreur :", error);
            await status.edit(
                "❌ Impossible de restaurer cette backup. Vérifie que le fichier JSON est valide."
            );
        }
    }
};
