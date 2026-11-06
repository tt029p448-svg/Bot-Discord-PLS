
const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    EmbedBuilder,
    MessageFlags,
    PermissionFlagsBits
} = require("discord.js");

const config = require("../config.json");

module.exports = {
    name: "annonce",
    description: "Créer une annonce avec un formulaire.",
    category: "Owner",

    async execute(message, args) {

        // Vérifier les propriétaires autorisés
        const owners = [
            config.ownerId,
            ...(config.ownerIds || [])
        ].filter(Boolean);

        if (!owners.includes(message.author.id)) {
            return message.reply(
                "⛔ Tu n'es pas autorisé à créer une annonce."
            );
        }

        const botMember = message.guild.members.me;

        if (!botMember.permissionsIn(message.channel).has([
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.MentionEveryone
        ])) {
            return message.reply(
                "❌ Palais2Fivem doit avoir les permissions Envoyer des messages, Intégrer des liens et Mentionner @everyone."
            );
        }

        const uniqueId = `${message.id}_${message.author.id}`;

        // Bouton pour ouvrir le formulaire
        const button = new ButtonBuilder()
            .setCustomId(`annonce_open_${uniqueId}`)
            .setLabel("Créer une annonce")
            .setEmoji("📢")
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button);

        const panel = new EmbedBuilder()
            .setColor(config.color || "#ADD8E6")
            .setTitle("📢 Palais2Fivem — Création d'annonce")
            .setDescription(
                "Clique sur le bouton ci-dessous pour rédiger ton annonce.\n\n" +
                "Le bot publiera ton message avec une mention @everyone."
            )
            .setFooter({ text: "Palais2Fivem • Système d'annonces" })
            .setTimestamp();

        const panelMessage = await message.reply({
            embeds: [panel],
            components: [row],
            allowedMentions: { parse: [] }
        });

        const collector = panelMessage.createMessageComponentCollector({
            filter: i =>
                i.customId === `annonce_open_${uniqueId}` &&
                i.user.id === message.author.id,
            time: 120000,
            max: 1
        });

        collector.on("collect", async interaction => {

            const modalId = `annonce_modal_${uniqueId}`;

            // Création du formulaire
            const modal = new ModalBuilder()
                .setCustomId(modalId)
                .setTitle("Créer une annonce Palais2Fivem");

            const annonceInput = new TextInputBuilder()
                .setCustomId("annonce_message")
                .setLabel("Message de ton annonce")
                .setPlaceholder("Écris ton annonce ici...")
                .setStyle(TextInputStyle.Paragraph)
                .setMinLength(1)
                .setMaxLength(1900)
                .setRequired(true);

            const modalRow = new ActionRowBuilder()
                .addComponents(annonceInput);

            modal.addComponents(modalRow);

            await interaction.showModal(modal);

            try {
                // Attendre l'envoi du formulaire
                const submission = await interaction.awaitModalSubmit({
                    filter: i =>
                        i.customId === modalId &&
                        i.user.id === message.author.id,
                    time: 300000
                });

                await submission.deferReply({
                    flags: MessageFlags.Ephemeral
                });

                const annonce = submission.fields
                    .getTextInputValue("annonce_message");

                // Publier l'annonce dans le salon
                await message.channel.send({
                    content: `@everyone\n\n📢 **ANNONCE Palais2Fivem**\n\n${annonce}`,
                    allowedMentions: {
                        parse: ["everyone"]
                    }
                });

                await submission.editReply({
                    content: "✅ Ton annonce a été publiée avec succès !"
                });

                await panelMessage.delete().catch(() => {});

            } catch (error) {
                if (error.code !== "InteractionCollectorError") {
                    console.error("[Palais2Fivem Annonce]", error);
                }

                await panelMessage.edit({
                    content: "Le formulaire a expiré ou n'a pas pu être envoyé.",
                    embeds: [],
                    components: []
                }).catch(() => {});
            }
        });

        collector.on("end", async (collected, reason) => {
            if (reason === "time" && collected.size === 0) {
                await panelMessage.edit({
                    content: "⌛ Le panel d'annonce a expiré. Refais `+annonce`.",
                    embeds: [],
                    components: []
                }).catch(() => {});
            }
        });
    }
};
