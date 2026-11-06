
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits
} = require("discord.js");

module.exports = {
    name: "leak",
    description: "Ouvre le panneau de publication d'un pack.",

    async execute(message, args, client) {
        if (!message.guild) return;

        if (!message.member.permissions.has(
            PermissionFlagsBits.Administrator
        )) {
            return message.reply("❌ Administrateur uniquement.");
        }

        const embed = new EmbedBuilder()
            .setColor("#ADD8E6")
            .setTitle("📦 Publication d'un pack")
            .setDescription(
                "Clique sur le bouton pour créer une publication.\n\n" +
                "Tu pourras renseigner :\n" +
                "• Le nom du pack\n" +
                "• La bannière\n" +
                "• La vidéo YouTube ou vidéo directe\n" +
                "• Le lien de téléchargement"
            );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("leak_open")
                .setLabel("Créer une publication")
                .setEmoji("📦")
                .setStyle(ButtonStyle.Primary)
        );

        await message.reply({
            embeds: [embed],
            components: [row]
        });
    }
};
