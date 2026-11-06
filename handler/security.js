const {
    PermissionFlagsBits,
    ChannelType,
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const dataDir = path.join(process.cwd(), "data");
const filePath = path.join(dataDir, "security.json");

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

function readConfig() {
    try {
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (error) {
        return {};
    }
}

function getConfig(guildId) {
    return readConfig()[guildId] || {};
}

function setConfig(guildId, values) {
    const data = readConfig();

    data[guildId] = {
        ...(data[guildId] || {}),
        ...values
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

const slashCommand = new SlashCommandBuilder()
    .setName("securite")
    .setDescription("Configure les salons de sécurité")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
        sub.setName("configurer")
            .setDescription("Configure les salons anti-hack et les logs")
            .addChannelOption(option =>
                option.setName("antihack")
                    .setDescription("Salon anti-hack")
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(true))
            .addChannelOption(option =>
                option.setName("logs")
                    .setDescription("Salon des logs de sécurité")
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(true))
            .addStringOption(option =>
                option.setName("banniere")
                    .setDescription("URL HTTPS de la bannière (facultatif)")
                    .setRequired(false)))
    .addSubcommand(sub =>
        sub.setName("voir")
            .setDescription("Affiche la configuration actuelle"));

async function configure(interaction, guild) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
            content: "❌ Réservé aux administrateurs.",
            ephemeral: true
        });
    }

    const sub = interaction.options.getSubcommand();
    const cfg = getConfig(guild.id);

    if (sub === "voir") {
        return interaction.reply({
            content: cfg.antiHackChannelId && cfg.logChannelId
                ? `Salon anti-hack : <#${cfg.antiHackChannelId}>\nSalon des logs : <#${cfg.logChannelId}>`
                : "⚠️ La sécurité n'est pas encore configurée.",
            ephemeral: true
        });
    }

    const antiHack = interaction.options.getChannel("antihack", true);
    const logs = interaction.options.getChannel("logs", true);
    const banner = interaction.options.getString("banniere");

    for (const channel of [antiHack, logs]) {
        const permissions = channel.permissionsFor(guild.members.me);

        if (
            !permissions?.has(PermissionFlagsBits.ViewChannel) ||
            !permissions?.has(PermissionFlagsBits.SendMessages) ||
            !permissions?.has(PermissionFlagsBits.EmbedLinks)
        ) {
            return interaction.reply({
                content: `❌ Je dois pouvoir voir et écrire dans ${channel}, et y intégrer des liens.`,
                ephemeral: true
            });
        }
    }

    if (banner && !/^https:\/\/\S+\.(png|jpe?g|gif|webp)(\?\S*)?$/i.test(banner)) {
        return interaction.reply({
            content: "❌ L'URL de la bannière doit être une URL HTTPS d'image en PNG, JPG, GIF ou WEBP.",
            ephemeral: true
        });
    }

    setConfig(guild.id, {
        antiHackChannelId: antiHack.id,
        logChannelId: logs.id,
        bannerUrl: banner || cfg.bannerUrl || null
    });

    const embed = new EmbedBuilder()
        .setColor("#B9A0FF")
        .setTitle("🛡️ SÉCURITÉ — SALON ANTI-HACK")
        .setDescription(
            "**NE PAS ÉCRIRE DANS CE SALON.**\n\n" +
            "Ce salon est un système de détection automatique des comptes potentiellement compromis. " +
            "Il permet d’identifier les comptes et programmes malveillants qui envoient automatiquement des messages dans tous les salons du serveur.\n\n" +
            "**Si vous envoyez un message ici :**\n" +
            "• Un timeout de 60 minutes pourra être appliqué.\n" +
            "• Vos messages des 5 dernières minutes seront recherchés et supprimés dans les salons accessibles au bot.\n" +
            "• Une alerte sera envoyée à l’équipe de modération.\n" +
            "• L’incident sera enregistré dans notre système de sécurité.\n\n" +
            "**N’ÉCRIVEZ PAS ICI, MÊME POUR TESTER.**\n" +
            "Ce dispositif est automatique et vise à protéger les membres du serveur."
        )
        .setFooter({ text: "Palais2Fivem • Système de sécurité" })
        .setTimestamp();

    const bannerUrl = banner || cfg.bannerUrl;

    if (bannerUrl) {
        embed.setImage(bannerUrl);
    }

    try {
        await antiHack.send({ embeds: [embed] });

        return interaction.reply({
            content: `✅ Configuration enregistrée !\n📢 Panel publié dans ${antiHack}.\n📋 Salon des logs : ${logs}`,
            ephemeral: true
        });
    } catch (error) {
        console.error("[SECURITE] Erreur lors de la publication du panel :", error);

        return interaction.reply({
            content: "⚠️ Configuration enregistrée, mais je n'ai pas réussi à publier le panel. Vérifie mes permissions dans le salon anti-hack.",
            ephemeral: true
        });
    }
}

function attachSecurity(client) {
    client.on("messageCreate", async message => {
        if (!message.guild || message.author.bot) return;

        const cfg = getConfig(message.guild.id);

        if (!cfg.antiHackChannelId || message.channel.id !== cfg.antiHackChannelId) {
            return;
        }

        // Ne pas sanctionner les administrateurs.
        if (message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
            return;
        }

        try {
            await message.delete().catch(() => null);

            const member = await message.guild.members.fetch(message.author.id).catch(() => null);

            if (!member || !member.kickable) {
                console.warn(`[SECURITE] Impossible d'expulser ${message.author.tag}.`);
                return;
            }

            await member.kick("Message envoyé dans le salon anti-hack");

            const logChannel = await message.guild.channels
                .fetch(cfg.logChannelId)
                .catch(() => null);

            if (logChannel?.isTextBased()) {
                await logChannel.send(
                    `🚨 **Sécurité anti-hack**\nMembre expulsé : ${message.author.tag} (${message.author.id})\nSalon : <#${message.channel.id}>\nRaison : message envoyé dans le salon anti-hack.`
                ).catch(() => null);
            }
        } catch (error) {
            console.error("[SECURITE]", error);
        }
    });
}

module.exports = { attachSecurity, slashCommand, configure };