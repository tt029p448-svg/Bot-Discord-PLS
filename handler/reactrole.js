
const {
    PermissionFlagsBits,
    MessageFlags
} = require("discord.js");

const store = require("../data/config-store");

module.exports = {
    async execute(interaction) {
        if (!interaction.inGuild()) {
            return interaction.reply({
                content: "Cette commande doit être utilisée sur un serveur.",
                flags: MessageFlags.Ephemeral
            });
        }

        if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.reply({
                content: "Tu dois avoir la permission Gérer les rôles.",
                flags: MessageFlags.Ephemeral
            });
        }

        const channel = interaction.options.getChannel("salon", true);
        const messageId = interaction.options.getString("message_id", true).trim();
        const emojiInput = interaction.options.getString("emoji", true).trim();
        const role = interaction.options.getRole("role", true);
        const botMember = interaction.guild.members.me;

        if (!/^\d{17,20}$/.test(messageId)) {
            return interaction.reply({
                content: "L'identifiant du message est invalide. Copie l'ID du message Discord.",
                flags: MessageFlags.Ephemeral
            });
        }

        if (!channel.isTextBased() || typeof channel.messages?.fetch !== "function") {
            return interaction.reply({
                content: "Choisis un salon texte accessible.",
                flags: MessageFlags.Ephemeral
            });
        }

        if (
            !botMember ||
            role.id === interaction.guild.id ||
            role.managed ||
            role.position >= botMember.roles.highest.position ||
            !botMember.permissions.has(PermissionFlagsBits.ManageRoles)
        ) {
            return interaction.reply({
                content: "Je ne peux pas gérer ce rôle. Vérifie ma permission Gérer les rôles et la position de mon rôle.",
                flags: MessageFlags.Ephemeral
            });
        }

        const permissions = channel.permissionsFor(botMember);

        if (
            !permissions?.has(PermissionFlagsBits.ViewChannel) ||
            !permissions?.has(PermissionFlagsBits.ReadMessageHistory) ||
            !permissions?.has(PermissionFlagsBits.AddReactions)
        ) {
            return interaction.reply({
                content: "Il me faut les permissions Voir le salon, Voir les anciens messages et Ajouter des réactions.",
                flags: MessageFlags.Ephemeral
            });
        }

        try {
            const message = await channel.messages.fetch(messageId);

            if (message.guildId !== interaction.guildId) {
                return interaction.reply({
                    content: "Ce message n'appartient pas à ce serveur.",
                    flags: MessageFlags.Ephemeral
                });
            }

            let emoji;
            let emojiKey;

            const customEmoji = emojiInput.match(/^<a?:([a-zA-Z0-9_]+):(\d+)>$/);

            if (customEmoji) {
                emoji = interaction.client.emojis.cache.get(customEmoji[2]);

                if (!emoji) {
                    return interaction.reply({
                        content: "Cet emoji personnalisé n'est pas accessible au bot.",
                        flags: MessageFlags.Ephemeral
                    });
                }

                emojiKey = emoji.id;
            } else if (/\p{Extended_Pictographic}/u.test(emojiInput)) {
                emoji = emojiInput;
                emojiKey = emojiInput;
            } else {
                return interaction.reply({
                    content: "Emoji invalide. Utilise par exemple 🎉 ou un emoji personnalisé accessible au bot.",
                    flags: MessageFlags.Ephemeral
                });
            }

            // Vérifie que le bot peut réagir avant d'enregistrer la configuration.
            await message.react(emoji);

            const config = store.get(interaction.guildId);
            const reactionRoles = Array.isArray(config.reactionRoles)
                ? config.reactionRoles
                : [];

            const existing = reactionRoles.findIndex(item =>
                item.messageId === message.id && item.emojiKey === emojiKey
            );

            const newEntry = {
                channelId: channel.id,
                messageId: message.id,
                emojiKey,
                emoji: emojiInput,
                roleId: role.id
            };

            if (existing >= 0) {
                reactionRoles[existing] = newEntry;
            } else {
                reactionRoles.push(newEntry);
            }

            store.set(interaction.guildId, { reactionRoles });

            return interaction.reply({
                content: `✅ Réaction-rôle configurée !\nMessage : ${message.url}\nEmoji : ${emojiInput}\nRôle : ${role}`,
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            console.error("[REACTION ROLE CONFIG]", error);

            return interaction.reply({
                content: "Impossible de configurer ce message. Vérifie l'ID, les permissions du bot et l'emoji.",
                flags: MessageFlags.Ephemeral
            });
        }
    }
};
