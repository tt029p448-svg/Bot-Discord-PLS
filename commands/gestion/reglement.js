
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const { prefix, color } = require('../../config.json');

module.exports = {
    name: 'reglement',
    aliases: ['réglement', 'règlement'],
    description: 'Ouvre un panel pour publier le règlement.',
    usage: `${prefix}reglement`,

    async execute(message, args) {
        if (!message.guild) return;

        // Réservé aux administrateurs
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply({
                content: '❌ Cette commande est réservée aux administrateurs.'
            });
        }

        const panelId = `reglement_${message.id}`;

        // Panel de configuration
        const panel = new EmbedBuilder()
            .setColor(color || '#ADD8E6')
            .setTitle('📜 Gestion du règlement')
            .setDescription(
                'Bienvenue dans le panel de configuration du règlement.\n\n' +
                'Clique sur le bouton ci-dessous pour écrire et publier le règlement de ton serveur.'
            )
            .setFooter({ text: 'Palais2Fivem • Gestion du règlement' })
            .setTimestamp();

        const button = new ButtonBuilder()
            .setCustomId(panelId)
            .setLabel('Configurer le règlement')
            .setEmoji('📝')
            .setStyle(ButtonStyle.Primary);

        const panelMessage = await message.reply({
            embeds: [panel],
            components: [
                new ActionRowBuilder().addComponents(button)
            ]
        });

        const collector = panelMessage.createMessageComponentCollector({
            filter: interaction =>
                interaction.customId === panelId &&
                interaction.user.id === message.author.id,
            time: 120000
        });

        collector.on('collect', async interaction => {
            const modalId = `reglement_modal_${message.id}`;

            const modal = new ModalBuilder()
                .setCustomId(modalId)
                .setTitle('Configuration du règlement');

            const titleInput = new TextInputBuilder()
                .setCustomId('titre')
                .setLabel('Titre du règlement')
                .setPlaceholder('Exemple : Règlement officiel de Palais2Fivem')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(100)
                .setRequired(true);

            const rulesInput = new TextInputBuilder()
                .setCustomId('regles')
                .setLabel('Écris ton règlement ici')
                .setPlaceholder('1. Respecter les membres...\n2. Pas de spam...')
                .setStyle(TextInputStyle.Paragraph)
                .setMaxLength(4000)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(titleInput),
                new ActionRowBuilder().addComponents(rulesInput)
            );

            await interaction.showModal(modal);

            try {
                const submission = await interaction.awaitModalSubmit({
                    filter: i =>
                        i.customId === modalId &&
                        i.user.id === message.author.id,
                    time: 120000
                });

                const title = submission.fields.getTextInputValue('titre');
                const rules = submission.fields.getTextInputValue('regles');

                const rulesEmbed = new EmbedBuilder()
                    .setColor(color || '#ADD8E6')
                    .setTitle(`📜 ${title}`)
                    .setDescription(rules)
                    .setFooter({
                        text: `${message.guild.name} • Règlement officiel`
                    })
                    .setTimestamp();

                await submission.reply({
                    content: '✅ Ton règlement a été publié avec succès !',
                    flags: MessageFlags.Ephemeral
                });

                await message.channel.send({
                    embeds: [rulesEmbed],
                    allowedMentions: {
                        parse: []
                    }
                });

            } catch (error) {
                console.error('[REGLEMENT] Erreur :', error);
            }
        });

        collector.on('end', async () => {
            await panelMessage.edit({
                components: []
            }).catch(() => {});
        });
    }
};
