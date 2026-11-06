
const {
    Events,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require("discord.js");

function input(id, label, required = true) {
    return new ActionRowBuilder().addComponents(
        new TextInputBuilder()
            .setCustomId(id)
            .setLabel(label)
            .setStyle(TextInputStyle.Short)
            .setRequired(required)
            .setMaxLength(500)
    );
}

function validUrl(value) {
    if (!value) return false;

    try {
        const url = new URL(value);
        return ["http:", "https:"].includes(url.protocol);
    } catch {
        return false;
    }
}

function attachLeak(client) {
    client.on(Events.InteractionCreate, async interaction => {

        // Ouvrir le formulaire
        if (
            interaction.isButton() &&
            interaction.customId === "leak_open"
        ) {
            if (!interaction.memberPermissions?.has(
                PermissionFlagsBits.Administrator
            )) {
                return interaction.reply({
                    content: "❌ Administrateur uniquement.",
                    flags: MessageFlags.Ephemeral
                });
            }

            const modal = new ModalBuilder()
                .setCustomId("leak_modal")
                .setTitle("📦 Publication d'un pack");

            modal.addComponents(
                input("nom", "Nom du pack"),
                input("banniere", "URL de la bannière", false),
                input("youtube", "Lien YouTube (facultatif)", false),
                input("video", "Lien vidéo direct (facultatif)", false),
                input("download", "Lien de téléchargement")
            );

            return interaction.showModal(modal);
        }

        // Publication
        if (
            !interaction.isModalSubmit() ||
            interaction.customId !== "leak_modal"
        ) return;

        if (!interaction.guild || !interaction.memberPermissions?.has(
            PermissionFlagsBits.Administrator
        )) {
            return interaction.reply({
                content: "❌ Permission refusée.",
                flags: MessageFlags.Ephemeral
            });
        }

        const get = id =>
            interaction.fields.getTextInputValue(id).trim();

        const nom = get("nom");
        const banniere = get("banniere");
        const youtube = get("youtube");
        const video = get("video");
        const download = get("download");

        if (
            !validUrl(download) ||
            (banniere && !validUrl(banniere)) ||
            (youtube && !validUrl(youtube)) ||
            (video && !validUrl(video))
        ) {
            return interaction.reply({
                content: "❌ Un des liens est invalide. Utilise une URL HTTPS.",
                flags: MessageFlags.Ephemeral
            });
        }

     

        await interaction.deferReply({
            flags: MessageFlags.Ephemeral
        });

        const embed = new EmbedBuilder()
            .setColor("#ADD8E6")
            .setTitle(`💼 ${nom}`)
            .setDescription(
    "━━━━━━━━━━━━━━━━━━━━\n\n" +
    "❗ **INFORMATION**\n\n" +
    (youtube || video
        ? `🎥 Vidéo : **[PREVIEW](${youtube || video})**\n`
        : "") +
    `📦 Disponible ici : **[DOWNLOAD](${download})**\n\n` +
    "🧰 **ASSISTANCE**\n\n" +
    "SUPPORT ACTIF\n\n" +
    "━━━━━━━━━━━━━━━━━━━━"
)
            .setTimestamp();

        if (banniere) {
            embed.setImage(banniere);
        }

        
const buttons = new ActionRowBuilder();

const previewUrl = youtube || video;

if (previewUrl) {
    buttons.addComponents(
        new ButtonBuilder()
            .setLabel("PREVIEW")
            .setStyle(ButtonStyle.Link)
            .setURL(previewUrl)
            .setEmoji("🎥")
    );
}

buttons.addComponents(
    new ButtonBuilder()
        .setLabel("DOWNLOAD")
        .setStyle(ButtonStyle.Link)
        .setURL(download)
        .setEmoji("📦")
);


        try {
            await interaction.channel.send({
                embeds: [embed],
                components: [buttons],
                allowedMentions: { parse: [] }
            });

            await interaction.editReply({
                content: "✅ Ton pack a été publié avec succès !"
            });
        } catch (error) {
            console.error("[LEAK]", error);

            await interaction.editReply({
                content: "❌ Impossible de publier le pack."
            });
        }
    });
}

module.exports = { attachLeak };
