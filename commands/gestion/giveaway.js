
const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const { color } = require('../../config.json');

function parseDuration(value) {
    const match = value.trim().match(/^(\d+)\s*(s|m|h|d)$/i);
    if (!match) return null;

    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();

    const multipliers = {
        s: 1000,
        m: 60000,
        h: 3600000,
        d: 86400000
    };

    const duration = amount * multipliers[unit];

    if (duration < 10000 || duration > 604800000) return null;

    return duration;
}

module.exports = {
    name: 'giveaway',
    description: 'Ouvre un menu interactif de giveaway.',

    async execute(message, args) {
        if (!message.guild) return;

        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ Cette commande est réservée aux administrateurs.');
        }

        const menuId = `gw_open_${message.id}`;

        const embed = new EmbedBuilder()
            .setColor(color || '#ADD8E6')
            .setTitle('🎉 Gestion des giveaways')
            .setDescription(
                'Bienvenue dans le gestionnaire de giveaways de Palais2Fivem !\n\n' +
                'Clique sur le bouton ci-dessous pour créer un nouveau concours.'
            )
            .setFooter({ text: 'Palais2Fivem • Giveaway Manager' });

        const button = new ButtonBuilder()
            .setCustomId(menuId)
            .setLabel('Créer un giveaway')
            .setEmoji('🎉')
            .setStyle(ButtonStyle.Primary);

        const menu = await message.reply({
            embeds: [embed],
            components: [
                new ActionRowBuilder().addComponents(button)
            ]
        });

        const menuCollector = menu.createMessageComponentCollector({
            filter: i =>
                i.customId === menuId &&
                i.user.id === message.author.id,
            time: 120000,
            max: 1
        });

        menuCollector.on('collect', async interaction => {
            const modalId = `gw_modal_${message.id}`;

            const modal = new ModalBuilder()
                .setCustomId(modalId)
                .setTitle('Créer un giveaway');

            const prize = new TextInputBuilder()
                .setCustomId('prize')
                .setLabel('Lot à gagner')
                .setPlaceholder('Exemple : Discord Nitro')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(150)
                .setRequired(true);

            const duration = new TextInputBuilder()
                .setCustomId('duration')
                .setLabel('Durée (10s, 30m, 2h, 1d)')
                .setPlaceholder('Exemple : 1h')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const winners = new TextInputBuilder()
                .setCustomId('winners')
                .setLabel('Nombre de gagnants')
                .setPlaceholder('Exemple : 1')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const channel = new TextInputBuilder()
                .setCustomId('channel')
                .setLabel('ID ou mention du salon')
                .setPlaceholder('Colle l’ID du salon Discord')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(prize),
                new ActionRowBuilder().addComponents(duration),
                new ActionRowBuilder().addComponents(winners),
                new ActionRowBuilder().addComponents(channel)
            );

            await interaction.showModal(modal);

            let submission;

            try {
                submission = await interaction.awaitModalSubmit({
                    filter: i =>
                        i.customId === modalId &&
                        i.user.id === message.author.id,
                    time: 120000
                });
            } catch {
                return;
            }

            await submission.deferReply({
                flags: MessageFlags.Ephemeral
            });

            try {
                const prizeValue = submission.fields.getTextInputValue('prize').trim();
                const durationValue = submission.fields.getTextInputValue('duration');
                const winnersValue = submission.fields.getTextInputValue('winners').trim();
                const channelValue = submission.fields.getTextInputValue('channel');

                const durationMs = parseDuration(durationValue);
                const winnersCount = Number(winnersValue);

                const channelId = channelValue.replace(/\D/g, '');
                const targetChannel = await message.guild.channels.fetch(channelId).catch(() => null);

                if (!durationMs) {
                    return submission.editReply('❌ Durée invalide. Utilise par exemple `30m`, `2h` ou `1d`. Minimum : 10 secondes. Maximum : 7 jours.');
                }

                if (!/^\d+$/.test(winnersValue) ||
                    !Number.isSafeInteger(winnersCount) ||
                    winnersCount < 1 ||
                    winnersCount > 20) {
                    return submission.editReply('❌ Le nombre de gagnants doit être compris entre 1 et 20.');
                }

                if (!targetChannel || !targetChannel.isTextBased() || !targetChannel.send) {
                    return submission.editReply('❌ Salon introuvable ou incompatible.');
                }

                const botMember = await message.guild.members.fetchMe();

                if (!targetChannel.permissionsFor(botMember)?.has([
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.EmbedLinks
                ])) {
                    return submission.editReply('❌ Palais2Fivem ne possède pas les permissions nécessaires dans ce salon.');
                }

                const endTime = Date.now() + durationMs;
                const participants = new Set();

                const giveawayId = `gw_join_${message.id}`;

                const giveawayEmbed = new EmbedBuilder()
                    .setColor(color || '#ADD8E6')
                    .setTitle('🎉 GIVEAWAY')
                    .setDescription(
                        `**Lot :** ${prizeValue}\n\n` +
                        `🏆 **Gagnants :** ${winnersCount}\n` +
                        `⏰ **Fin :** <t:${Math.floor(endTime / 1000)}:R>\n` +
                        `👤 **Organisateur :** ${message.author}\n\n` +
                        'Clique sur le bouton pour participer !'
                    )
                    .addFields({
                        name: 'Participants',
                        value: '0',
                        inline: true
                    })
                    .setTimestamp();

                const joinButton = new ButtonBuilder()
                    .setCustomId(giveawayId)
                    .setLabel('Participer (0)')
                    .setEmoji('🎉')
                    .setStyle(ButtonStyle.Success);

                const giveawayMessage = await targetChannel.send({
                    embeds: [giveawayEmbed],
                    components: [
                        new ActionRowBuilder().addComponents(joinButton)
                    ],
                    allowedMentions: { parse: [] }
                });

                await submission.editReply(
                    `✅ Giveaway créé avec succès dans ${targetChannel} !\n${giveawayMessage.url}`
                );

                const collector = giveawayMessage.createMessageComponentCollector({
                    filter: i => i.customId === giveawayId,
                    time: durationMs
                });

                collector.on('collect', async i => {
                    if (i.user.bot) {
                        return i.reply({
                            content: '❌ Les bots ne peuvent pas participer.',
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    if (participants.has(i.user.id)) {
                        participants.delete(i.user.id);

                        await i.reply({
                            content: '↩️ Tu as quitté le giveaway.',
                            flags: MessageFlags.Ephemeral
                        });
                    } else {
                        participants.add(i.user.id);

                        await i.reply({
                            content: '🎉 Ta participation a bien été enregistrée !',
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    joinButton.setLabel(`Participer (${participants.size})`);

                    giveawayEmbed.setFields({
                        name: 'Participants',
                        value: String(participants.size),
                        inline: true
                    });

                    await giveawayMessage.edit({
                        embeds: [giveawayEmbed],
                        components: [
                            new ActionRowBuilder().addComponents(joinButton)
                        ]
                    }).catch(console.error);
                });

                collector.on('end', async () => {
                    const disabledButton = new ButtonBuilder()
                        .setCustomId(giveawayId)
                        .setLabel('Giveaway terminé')
                        .setEmoji('🎉')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true);

                    await giveawayMessage.edit({
                        components: [
                            new ActionRowBuilder().addComponents(disabledButton)
                        ]
                    }).catch(console.error);

                    const entries = [...participants];

                    // Mélange aléatoire des participants
                    for (let j = entries.length - 1; j > 0; j--) {
                        const k = Math.floor(Math.random() * (j + 1));
                        [entries[j], entries[k]] = [entries[k], entries[j]];
                    }

                    const selected = entries.slice(0, winnersCount);

                    if (selected.length === 0) {
                        return targetChannel.send(
                            `🎉 Le giveaway **${prizeValue}** est terminé.\nAucun participant.`
                        ).catch(console.error);
                    }

                    const mentions = selected.map(id => `<@${id}>`).join(', ');

                    const resultEmbed = new EmbedBuilder()
                        .setColor(color || '#ADD8E6')
                        .setTitle('🏆 GIVEAWAY TERMINÉ')
                        .setDescription(
                            `**Lot :** ${prizeValue}\n\n` +
                            `**Gagnant(s) :** ${mentions}\n\n` +
                            `🎉 Félicitations !`
                        )
                        .setTimestamp();

                    await targetChannel.send({
                        content: `🎉 Félicitations ${mentions} !`,
                        embeds: [resultEmbed],
                        allowedMentions: {
                            users: selected
                        }
                    }).catch(console.error);
                });

            } catch (error) {
                console.error('[GIVEAWAY] Erreur :', error);

                await submission.editReply(
                    '❌ Une erreur est survenue pendant la création du giveaway.'
                ).catch(() => {});
            }
        });

        menuCollector.on('end', async () => {
            await menu.edit({ components: [] }).catch(() => {});
        });
    }
};
