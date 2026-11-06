
const fs = require("fs");
const path = require("path");

const {
    SlashCommandBuilder,
    ActionRowBuilder,
    AttachmentBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    EmbedBuilder,
    PermissionFlagsBits,
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require("discord.js");

const config = require("../config.json");

const DATA_DIR = path.join(__dirname, "..", "data");
const CONFIG_FILE = path.join(DATA_DIR, "ticket-config.json");

const DEFAULT_TYPES = [
    { label: "Support général", value: "support", description: "Obtenir de l'aide", emoji: "🎧" },
    { label: "Achat / Boutique", value: "boutique", description: "Question sur un achat", emoji: "🛒" },
    { label: "Partenariat", value: "partenariat", description: "Proposer un partenariat", emoji: "🤝" },
    { label: "Recrutement", value: "recrutement", description: "Rejoindre l'équipe", emoji: "👥" },
    { label: "Signalement", value: "signalement", description: "Signaler un problème", emoji: "🛡️" }
];


const setupCommand = new SlashCommandBuilder()
    .setName("configsetup")
    .setDescription("Configure le panneau de tickets.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

const configTicketCommand = new SlashCommandBuilder()
    .setName("configticket")
    .setDescription("Configure les catégories, salons et rôles des tickets.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
        option.setName("categorie")
            .setDescription("Catégorie où créer les tickets")
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(false)
    )
    .addChannelOption(option =>
        option.setName("salon_panneau")
            .setDescription("Salon où publier le panneau")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
    )
    .addChannelOption(option =>
        option.setName("salon_transcripts")
            .setDescription("Salon où envoyer les transcripts")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
    )
    .addRoleOption(option =>
        option.setName("role_support")
            .setDescription("Rôle autorisé à voir et gérer les tickets")
            .setRequired(false)
    )
    .addRoleOption(option =>
        option.setName("role_ping")
            .setDescription("Rôle à mentionner à l'ouverture")
            .setRequired(false)
    );


function ensureData() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(CONFIG_FILE)) {
        fs.writeFileSync(CONFIG_FILE, "{}", "utf8");
    }
}

function readAllConfigs() {
    ensureData();

    try {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
    } catch {
        return {};
    }
}

function getGuildConfig(guildId) {
    const all = readAllConfigs();

    return all[guildId] || {
        categoryId: config.ticketCategoryId || "",
        supportRoleIds: Array.isArray(config.ticketStaffRoleIds)
            ? config.ticketStaffRoleIds
            : [],
        transcriptChannelId: config.ticketTranscriptChannelId || "",
        panelChannelId: "",
        panelMessageId: "",
        bannerUrl: "",
        title: "Centre de tickets",
        description: "Choisis le motif de ton ticket ci-dessous.",
        types: DEFAULT_TYPES
    };
}

function saveGuildConfig(guildId, data) {
    const all = readAllConfigs();
    all[guildId] = data;

    ensureData();
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(all, null, 2), "utf8");
}

function isStaff(member, ticketConfig) {
    if (!member) return false;

    if (member.permissions.has(PermissionFlagsBits.Administrator)) {
        return true;
    }

    return (ticketConfig.supportRoleIds || []).some(id =>
        member.roles.cache.has(id)
    );
}

function ticketOwnerId(channel) {
    const match = channel.topic?.match(/ticket-owner:(\d+)/);
    return match?.[1] || null;
}

function isTicket(channel) {
    return Boolean(channel?.topic?.includes("ticket-owner:"));
}

function safeName(value) {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80) || "ticket";
}

function buildPanel(ticketConfig) {
    const embed = new EmbedBuilder()
        .setColor(config.color || "#ADD8E6")
        .setTitle(ticketConfig.title || "Centre de tickets")
        .setDescription(ticketConfig.description || "Choisis le motif de ton ticket.")
        .setFooter({ text: "Palais2Fivem • Assistance" });

    if (ticketConfig.bannerUrl) {
        try {
            new URL(ticketConfig.bannerUrl);
            if (/^https?:$/.test(new URL(ticketConfig.bannerUrl).protocol)) {
                embed.setImage(ticketConfig.bannerUrl);
            }
        } catch {}
    }

    const options = (ticketConfig.types || DEFAULT_TYPES).slice(0, 25).map(type => ({
        label: type.label.slice(0, 100),
        value: type.value,
        description: (type.description || type.label).slice(0, 100),
        ...(type.emoji ? { emoji: type.emoji } : {})
    }));

    const menu = new StringSelectMenuBuilder()
        .setCustomId("ticket:open")
        .setPlaceholder("Sélectionne le motif de ton ticket")
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions(options);

    return {
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(menu)]
    };
}

function attachTickets(client) {
    // Évite de charger le système plusieurs fois.
    if (client.__ticketsAttached) return;
    client.__ticketsAttached = true;

    client.on("interactionCreate", async interaction => {
        try {
            if (!interaction.guild) return;


            // Configuration des salons et rôles des tickets.
            if (
                interaction.isChatInputCommand() &&
                interaction.commandName === "configticket"
            ) {
                if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
                    return interaction.reply({
                        content: "❌ Cette commande est réservée aux administrateurs.",
                        ephemeral: true
                    });
                }

                const ticketConfig = getGuildConfig(interaction.guild.id);

                const category = interaction.options.getChannel("categorie");
                const panelChannel = interaction.options.getChannel("salon_panneau");
                const transcriptChannel = interaction.options.getChannel("salon_transcripts");
                const supportRole = interaction.options.getRole("role_support");
                const pingRole = interaction.options.getRole("role_ping");

                if (category) ticketConfig.categoryId = category.id;
                if (panelChannel) ticketConfig.panelChannelId = panelChannel.id;
                if (transcriptChannel) ticketConfig.transcriptChannelId = transcriptChannel.id;
                if (supportRole) ticketConfig.supportRoleIds = [supportRole.id];
                if (pingRole) ticketConfig.pingRoleId = pingRole.id;

                saveGuildConfig(interaction.guild.id, ticketConfig);

                return interaction.reply({
                    content:
                        "✅ Configuration des tickets enregistrée.\n" +
                        `📁 Catégorie : ${category || (ticketConfig.categoryId ? `<#${ticketConfig.categoryId}>` : "Non définie")}\n` +
                        `📝 Panneau : ${panelChannel || (ticketConfig.panelChannelId ? `<#${ticketConfig.panelChannelId}>` : "Non défini")}\n` +
                        `📄 Transcripts : ${transcriptChannel || (ticketConfig.transcriptChannelId ? `<#${ticketConfig.transcriptChannelId}>` : "Non défini")}\n` +
                        `🛠️ Support : ${supportRole || (ticketConfig.supportRoleIds?.[0] ? `<@&${ticketConfig.supportRoleIds[0]}>` : "Non défini")}\n` +
                        `🔔 Rôle ping : ${pingRole || (ticketConfig.pingRoleId ? `<@&${ticketConfig.pingRoleId}>` : "Non défini")}`,
                    ephemeral: true
                });
            }

             // Configuration de départ : crée un panneau dans le salon actuel.
            if (
                interaction.isChatInputCommand() &&
                interaction.commandName === "setupticket"
            ) {
                if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
                    return interaction.reply({
                        content: "❌ Cette commande est réservée aux administrateurs.",
                        ephemeral: true
                    });
                }

                const ticketConfig = getGuildConfig(interaction.guild.id);

                const modal = new ModalBuilder()
                    .setCustomId("ticket:setup")
                    .setTitle("Configuration des tickets");

                const titleInput = new TextInputBuilder()
                    .setCustomId("title")
                    .setLabel("Titre du panneau")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMaxLength(100)
                    .setValue(ticketConfig.title || "Centre de tickets");

                const descriptionInput = new TextInputBuilder()
                    .setCustomId("description")
                    .setLabel("Description du panneau")
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true)
                    .setMaxLength(1000)
                    .setValue(ticketConfig.description || "Choisis le motif de ton ticket.");

                const bannerInput = new TextInputBuilder()
                    .setCustomId("banner")
                    .setLabel("URL de la bannière (facultatif)")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)
                    .setMaxLength(500)
                    .setValue(ticketConfig.bannerUrl || "");

                modal.addComponents(
                    new ActionRowBuilder().addComponents(titleInput),
                    new ActionRowBuilder().addComponents(descriptionInput),
                    new ActionRowBuilder().addComponents(bannerInput)
                );

                return interaction.showModal(modal);
            }

            // Enregistrement du panneau.
            if (
                interaction.isModalSubmit() &&
                interaction.customId === "ticket:setup"
            ) {
                if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
                    return interaction.reply({
                        content: "❌ Permission administrateur nécessaire.",
                        ephemeral: true
                    });
                }

                const ticketConfig = getGuildConfig(interaction.guild.id);
                const banner = interaction.fields.getTextInputValue("banner").trim();

                if (banner) {
                    try {
                        const parsed = new URL(banner);
                        if (!["http:", "https:"].includes(parsed.protocol)) {
                            throw new Error("URL invalide");
                        }
                    } catch {
                        return interaction.reply({
                            content: "❌ L'URL de la bannière est invalide. Utilise une URL HTTP ou HTTPS.",
                            ephemeral: true
                        });
                    }
                }

                
ticketConfig.title = interaction.fields.getTextInputValue("title");
ticketConfig.description = interaction.fields.getTextInputValue("description");

ticketConfig.bannerUrl = banner;

const panelChannelId = ticketConfig.panelChannelId || interaction.channelId;

console.log("[TICKETS] Configuration du panneau...");
console.log("[TICKETS] Salon configuré :", panelChannelId);

const panelChannel = await interaction.guild.channels
    .fetch(panelChannelId)
    .catch(error => {
        console.error("[TICKETS] Erreur récupération salon :", error);
        return null;
    });

if (!panelChannel || !panelChannel.isTextBased()) {
    return interaction.reply({
        content: "❌ Salon du panneau introuvable. Vérifie /configticket.",
        ephemeral: true
    });
}

try {
    const panel = buildPanel(ticketConfig);
    const sent = await panelChannel.send(panel);

    ticketConfig.panelMessageId = sent.id;
    saveGuildConfig(interaction.guild.id, ticketConfig);

    console.log("[TICKETS] ✅ Panneau envoyé dans :", panelChannel.id);
    console.log("[TICKETS] 🆔 ID du message :", sent.id);

    return interaction.reply({
        content: `✅ Panneau publié dans ${panelChannel}.`,
        ephemeral: true
    });

} catch (error) {
    console.error("[TICKETS] ❌ Erreur d'envoi :", error);

    return interaction.reply({
        content: "❌ Échec de l'envoi du panneau. Consulte la console du bot.",
        ephemeral: true
    });
}






            }

            // Ouverture du ticket depuis le menu.
            if (
                interaction.isStringSelectMenu() &&
                interaction.customId === "ticket:open"
            ) {
                await interaction.deferReply({ ephemeral: true });

                const ticketConfig = getGuildConfig(interaction.guild.id);
                const selected = (ticketConfig.types || DEFAULT_TYPES)
                    .find(type => type.value === interaction.values[0]);

                if (!selected) {
                    return interaction.editReply("❌ Cette catégorie de ticket n'existe pas.");
                }

                const existing = interaction.guild.channels.cache.find(channel =>
                    channel.type === ChannelType.GuildText &&
                    ticketOwnerId(channel) === interaction.user.id
                );

                if (existing) {
                    return interaction.editReply(`Tu as déjà un ticket ouvert : ${existing}`);
                }

                const overwrites = [
                    {
                        id: interaction.guild.roles.everyone.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: interaction.user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.AttachFiles,
                            PermissionFlagsBits.EmbedLinks
                        ]
                    },
                    {
                        id: client.user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.ManageChannels,
                            PermissionFlagsBits.AttachFiles
                        ]
                    }
                ];

                for (const roleId of ticketConfig.supportRoleIds || []) {
                    const role = interaction.guild.roles.cache.get(roleId);
                    if (role) {
                        overwrites.push({
                            id: role.id,
                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.SendMessages,
                                PermissionFlagsBits.ReadMessageHistory
                            ]
                        });
                    }
                }

                const channel = await interaction.guild.channels.create({
                    name: `ticket-${safeName(interaction.user.username)}`,
                    type: ChannelType.GuildText,
                    parent: interaction.guild.channels.cache.has(ticketConfig.categoryId)
                        ? ticketConfig.categoryId
                        : undefined,
                    topic: `ticket-owner:${interaction.user.id};type:${selected.value}`,
                    permissionOverwrites: overwrites,
                    reason: `Ticket ouvert par ${interaction.user.tag}`
                });

                const embed = new EmbedBuilder()
                    .setColor(config.color || "#ADD8E6")
                    .setTitle(`${selected.emoji || "🎫"} ${selected.label}`)
                    .setDescription(
                        `Bonjour ${interaction.user}, ton ticket est ouvert.\n` +
                        "Explique ta demande à l'équipe. Un membre du support te répondra dès que possible."
                    )
                    .addFields(
                        { name: "Créé par", value: `${interaction.user}`, inline: true },
                        { name: "Motif", value: selected.label, inline: true }
                    )
                    .setTimestamp();

                const closeButton = new ButtonBuilder()
                    .setCustomId("ticket:close")
                    .setLabel("Fermer le ticket")
                    .setEmoji("🔒")
                    .setStyle(ButtonStyle.Danger);

                const rows = [
                    new ActionRowBuilder().addComponents(closeButton)
                ];

                
const pingRoleId = ticketConfig.pingRoleId;
const validPingRole = pingRoleId &&
    interaction.guild.roles.cache.has(pingRoleId);

const roleMentions = validPingRole
    ? `<@&${pingRoleId}>`
    : "";

await channel.send({
    content: `${interaction.user} ${roleMentions}`.trim(),
    embeds: [embed],
    components: rows,
    allowedMentions: {
        users: [interaction.user.id],
        roles: validPingRole ? [pingRoleId] : []
    }
});


                

                return interaction.editReply(`✅ Ton ticket a été créé : ${channel}`);
            }

            // Fermeture via bouton.
            if (
                interaction.isButton() &&
                interaction.customId === "ticket:close"
            ) {
                const channel = interaction.channel;
                if (!isTicket(channel)) {
                    return interaction.reply({
                        content: "❌ Ce salon n'est pas un ticket.",
                        ephemeral: true
                    });
                }

                const ticketConfig = getGuildConfig(interaction.guild.id);
                const ownerId = ticketOwnerId(channel);

                if (
                    interaction.user.id !== ownerId &&
                    !isStaff(interaction.member, ticketConfig)
                ) {
                    return interaction.reply({
                        content: "❌ Seul le créateur du ticket ou le support peut le fermer.",
                        ephemeral: true
                    });
                }

                await interaction.deferReply();

                const messages = await collectMessages(channel);
                const transcript = makeTranscript(messages, channel);
                const attachment = new AttachmentBuilder(
                    Buffer.from(transcript, "utf8"),
                    { name: `${channel.name}-transcript.txt` }
                );

                const transcriptChannel = ticketConfig.transcriptChannelId
                    ? interaction.guild.channels.cache.get(ticketConfig.transcriptChannelId)
                    : null;

                // Envoyer le transcript en MP au créateur du ticket
let dmSent = false;

try {
    const owner = await client.users.fetch(ownerId);

    await owner.send({
        content: `📄 Voici le transcript de ton ticket **${channel.name}** sur **${interaction.guild.name}**.`,
        files: [
            new AttachmentBuilder(
                Buffer.from(transcript, "utf8"),
                { name: `${channel.name}-transcript.txt` }
            )
        ]
    });

    dmSent = true;
} catch (error) {
    console.log("[Tickets] Impossible d'envoyer le transcript en MP :", error.message);
}

// Conserver l'envoi dans le salon des transcripts
if (transcriptChannel?.isTextBased()) {
    await transcriptChannel.send({
        content: `📄 Transcript du ticket **${channel.name}** (fermé par ${interaction.user}).`,
        files: [
            new AttachmentBuilder(
                Buffer.from(transcript, "utf8"),
                { name: `${channel.name}-transcript.txt` }
            )
        ]
    });
}

                await interaction.editReply(
    dmSent
        ? "🔒 Ticket fermé. Le transcript a été envoyé en MP au créateur."
        : "🔒 Ticket fermé. Impossible d'envoyer le transcript en MP (MP désactivés ou erreur)."
);
                setTimeout(async () => {
                    await channel.delete("Ticket fermé").catch(console.error);
                }, 5000);
            }
        } catch (error) {
            console.error("[Tickets] Erreur :", error);

            if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: "❌ Une erreur est survenue dans le système de tickets.",
                    ephemeral: true
                }).catch(() => {});
            }
        }
    });

    // Commandes préfixées : +close, +rename, +add, +remove.
    client.on("messageCreate", async message => {
        if (!message.guild || message.author.bot || !isTicket(message.channel)) return;

        const prefix = config.prefix || "+";
        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/\s+/);
        const command = (args.shift() || "").toLowerCase();
        const ticketConfig = getGuildConfig(message.guild.id);
        const ownerId = ticketOwnerId(message.channel);
        const staff = isStaff(message.member, ticketConfig);

        if (command === "close") {
            if (message.author.id !== ownerId && !staff) {
                return message.reply("❌ Seul le créateur du ticket ou le support peut le fermer.");
            }

            const messages = await collectMessages(message.channel);
            const transcript = makeTranscript(messages, message.channel);
            const transcriptChannel = ticketConfig.transcriptChannelId
                ? message.guild.channels.cache.get(ticketConfig.transcriptChannelId)
                : null;

            if (transcriptChannel?.isTextBased()) {
                const attachment = new AttachmentBuilder(
                    Buffer.from(transcript, "utf8"),
                    { name: `${message.channel.name}-transcript.txt` }
                );

                await transcriptChannel.send({
                    content: `📄 Transcript de **${message.channel.name}** (fermé par ${message.author}).`,
                    files: [attachment]
                });
            }
            try {
    const owner = await client.users.fetch(ownerId);

    await owner.send({
        content: `📄 Voici le transcript de ton ticket **${message.channel.name}** sur **${message.guild.name}**.`,
        files: [
            new AttachmentBuilder(
                Buffer.from(transcript, "utf8"),
                { name: `${message.channel.name}-transcript.txt` }
            )
        ]
    });
} catch (error) {
    console.log("[Tickets] Impossible d'envoyer le transcript en MP :", error.message);
}

            await message.channel.send("🔒 Ticket fermé. Suppression dans 5 secondes.");
            setTimeout(() => {
                message.channel.delete("Ticket fermé").catch(console.error);
            }, 5000);
        }

        if (command === "rename") {
            if (!staff) return message.reply("❌ Réservé au support.");
            const name = args.join("-").trim();

            if (!name) {
                return message.reply(`Utilisation : \`${prefix}rename nouveau-nom\``);
            }

            await message.channel.setName(safeName(name));
            return message.reply("✅ Ticket renommé.");
        }

        if (command === "add" || command === "remove") {
            if (!staff) return message.reply("❌ Réservé au support.");

            const member =
                message.mentions.members.first() ||
                (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);

            if (!member) {
                return message.reply(`Utilisation : \`${prefix}${command} @membre\``);
            }

            if (command === "add") {
                await message.channel.permissionOverwrites.edit(member.id, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true,
                    AttachFiles: true
                });
                return message.reply(`✅ ${member} a été ajouté au ticket.`);
            }

            if (member.id === ownerId) {
                return message.reply("❌ Tu ne peux pas retirer le créateur du ticket.");
            }

            await message.channel.permissionOverwrites.delete(member.id).catch(() => {});
            return message.reply(`✅ ${member} a été retiré du ticket.`);
        }
    });
}

async function collectMessages(channel) {
    const all = [];
    let before;

    // Discord renvoie au maximum 100 messages par requête.
    while (all.length < 5000) {
        const batch = await channel.messages.fetch({
            limit: 100,
            ...(before ? { before } : {})
        });

        if (!batch.size) break;

        all.push(...batch.values());
        before = batch.last().id;

        if (batch.size < 100) break;
    }

    return all.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
}

function makeTranscript(messages, channel) {
    const lines = [
        `Transcript du ticket : ${channel.name}`,
        `Salon ID : ${channel.id}`,
        `Date de génération : ${new Date().toLocaleString("fr-FR")}`,
        "=".repeat(60),
        ""
    ];

    for (const message of messages) {
        const date = new Date(message.createdTimestamp).toLocaleString("fr-FR");
        const content = message.content || "[Message sans texte]";
        const files = [...message.attachments.values()]
            .map(file => file.url)
            .join(" ");

        lines.push(`[${date}] ${message.author?.tag || "Utilisateur inconnu"} : ${content}`);
        if (files) lines.push(`Fichiers : ${files}`);
        if (message.embeds.length) lines.push("[Ce message contient un embed]");
        lines.push("");
    }

    return lines.join("\n");
}

module.exports = {
    attachTickets,
    setupCommand,
    configTicketCommand
};