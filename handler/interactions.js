
const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    ChannelType
} = require("discord.js");

const config = require("../config.json");
const { slashCommand } = require("./security");
const reactrole = require("./reactrole");
const reactionRole = require("./reactrole");
const { setupCommand, configTicketCommand } = require("./tickets");

const categories = [
    "Utilitaire",
    "Modération",
    "AntiRaid",
    "Gestion",
    "Tickets",
    "Giveaway",
    "Owner",
    "Autres"
];

const commands = [
    setupCommand,
    configTicketCommand,

    new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Affiche la latence du bot."),

    new SlashCommandBuilder()
        .setName("help")
        .setDescription("Affiche le menu d'aide de Palais2Fivem."),

    new SlashCommandBuilder()
        .setName("clear")
        .setDescription("Supprime des messages.")
        .addIntegerOption(option =>
            option.setName("nombre")
                .setDescription("Nombre de messages à supprimer (1 à 100)")
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Bannit un membre.")
        .addUserOption(option =>
            option.setName("membre")
                .setDescription("Membre à bannir")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("raison")
                .setDescription("Raison du bannissement")
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    new SlashCommandBuilder()
        .setName("kick")
        .setDescription("Expulse un membre.")
        .addUserOption(option =>
            option.setName("membre")
                .setDescription("Membre à expulser")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("raison")
                .setDescription("Raison de l'expulsion")
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    new SlashCommandBuilder()
        .setName("ticket")
        .setDescription("Crée un ticket privé.")
        
    ,
    new SlashCommandBuilder()
        .setName("join")
        .setDescription("Connecte le bot à ton salon vocal"),

    new SlashCommandBuilder()
        .setName("leave")
        .setDescription("Déconnecte le bot du vocal"),

    new SlashCommandBuilder()
        .setName("setup-logs")
        .setDescription("Configure le salon des logs de ce serveur")
        .addChannelOption(option =>
            option
                .setName("salon")
                .setDescription("Salon texte pour recevoir les logs")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

        new SlashCommandBuilder()
        .setName("logs-off")
        .setDescription("Désactive les logs de ce serveur")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
        
new SlashCommandBuilder()
    .setName("reactrole")
    .setDescription("Crée un panel de réaction-rôle")
    .addRoleOption(option =>
        option.setName("role")
            .setDescription("Rôle à attribuer")
            .setRequired(true))
    .addChannelOption(option =>
        option.setName("salon")
            .setDescription("Salon où publier le panel")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("titre")
            .setDescription("Titre du panel")
            .setRequired(false))
    .addStringOption(option =>
        option.setName("description")
            .setDescription("Description du panel")
            .setRequired(false)),
new SlashCommandBuilder()
    .setName("reactrole-reaction")
    .setDescription("Configure un rôle attribué avec une réaction à un message existant.")
    .addChannelOption(option =>
        option
            .setName("salon")
            .setDescription("Salon contenant ton message")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
    )
    .addStringOption(option =>
        option
            .setName("message_id")
            .setDescription("Identifiant du message déjà envoyé")
            .setRequired(true)
    )
    .addStringOption(option =>
        option
            .setName("emoji")
            .setDescription("Emoji qui donnera le rôle")
            .setRequired(true)
    )
    .addRoleOption(option =>
        option
            .setName("role")
            .setDescription("Rôle à attribuer")
            .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    
    
    new SlashCommandBuilder()
        .setName("antihack-setup")
        .setDescription("Configure le message ANTI-HACK du serveur.")
        .addChannelOption(option =>
            option
                .setName("salon")
                .setDescription("Salon où publier le message ANTI-HACK")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("titre")
                .setDescription("Titre du message ANTI-HACK")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("description")
                .setDescription("Description du message ANTI-HACK")
                .setRequired(true)
                .setMaxLength(4000)
        )
        .addStringOption(option =>
            option
                .setName("banniere")
                .setDescription("URL directe de l'image de la bannière")
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName("antihack-message")
        .setDescription("Modifie le titre et le texte du message ANTI-HACK.")
        .addStringOption(option =>
            option.setName("titre")
                .setDescription("Nouveau titre")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("description")
                .setDescription("Nouvelle description")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

 slashCommand
 
];






function getCategory(command) {
    const name = (command.name || "").toLowerCase();

    const antiRaidCommands = [
        "antispam",
        "antieveryone",
        "antilink",
        "bypass",
        "blrank",
        "antiadmin",
        "antiban",
        "antibot",
        "antichannel",
        "antirole",
        "protection"
    ];

    if (antiRaidCommands.includes(name)) {
        return "AntiRaid";
    }

    if (command.category && categories.includes(command.category)) {
        return command.category;
    }

   const categoryByName = {
    ping: "Utilitaire",
    help: "Utilitaire",
    clear: "Modération",
    ban: "Modération",
    kick: "Modération",
    ticket: "Tickets",
    reactrole: "Gestion",
    setprefix: "Owner",
    color: "Owner",
    unrank: "Owner"
};

    return categoryByName[name] || "Autres";
}


function buildHelpPage(client, category) {
    const prefixCommands = [...client.commands.values()]
        .filter(command => getCategory(command) === category)
        .sort((a, b) => a.name.localeCompare(b.name));

    const slashCommands = commands
        .filter(command => {
            const name = command.name;
            const prefixCommand = client.commands.get(name);

            if (prefixCommand) {
                return getCategory(prefixCommand) === category;
            }

            if (["ping", "help"].includes(name)) {
                return category === "Utilitaire";
            }

            if (["clear", "ban", "kick"].includes(name)) {
                return category === "Modération";
            }

            if (name === "ticket") {
                return category === "Tickets";
            }
if (name === "reactrole") {
    return category === "Gestion";
}
            return false;
        })
        .map(command => command.name);

    const lines = [];

    for (const command of prefixCommands) {
        const description = command.description || "Aucune description";
        lines.push(`**${config.prefix || "+"}${command.name}** — ${description}`);
    }

    for (const name of slashCommands) {
        lines.push(`**/${name}** — Commande slash`);
    }

    const uniqueLines = [...new Set(lines)];

    const description = uniqueLines.length
        ? uniqueLines.join("\n").slice(0, 4000)
        : "Aucune commande enregistrée dans cette catégorie.";

    return new EmbedBuilder()
        .setColor(config.color || "#ADD8E6")
        .setTitle(`🛡️ Palais2Fivem — ${category}`)
        .setDescription(description)
        .addFields({
            name: "📚 Commandes préfixées chargées",
            value: String(client.commands.size),
            inline: true
        })
        .setFooter({ text: "Palais2Fivem • Centre d'aide" })
        .setTimestamp();
}

function buildHelpRows(category) {
    const rows = [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("Palais2Fivem_help_cat_Utilitaire")
                .setLabel("Utilitaire")
                .setStyle(category === "Utilitaire" ? ButtonStyle.Primary : ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId("Palais2Fivemhelp_cat_Modération")
                .setLabel("Modération")
                .setStyle(category === "Modération" ? ButtonStyle.Primary : ButtonStyle.Secondary),

            new ButtonBuilder()
    .setCustomId("Palais2Fivem_help_cat_AntiRaid")
    .setLabel("AntiRaid")
    .setStyle(
        category === "AntiRaid"
            ? ButtonStyle.Primary
            : ButtonStyle.Secondary
    ),

            new ButtonBuilder()
                .setCustomId("Palais2Fivem_help_cat_Gestion")
                .setLabel("Gestion")
                .setStyle(category === "Gestion" ? ButtonStyle.Primary : ButtonStyle.Secondary)
        ),
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("Palais2Fivem_help_cat_Tickets")
                .setLabel("Tickets")
                .setStyle(category === "Tickets" ? ButtonStyle.Primary : ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId("Palais2Fivem_help_cat_Giveaway")
                .setLabel("Giveaway")
                .setStyle(category === "Giveaway" ? ButtonStyle.Primary : ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId("Palais2Fivem_help_cat_Owner")
                .setLabel("Owner")
                .setStyle(category === "Owner" ? ButtonStyle.Primary : ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId("Palais2Fivem_help_cat_Autres")
                .setLabel("Autres")
                .setStyle(category === "Autres" ? ButtonStyle.Primary : ButtonStyle.Secondary)
        )
    ];

    return rows;
}

function attachInteractions(client) {
    client.on("interactionCreate", async interaction => {
        try {
                        // Boutons de confirmation de la commande delete
            if (
                interaction.isButton() &&
                (
                    interaction.customId.startsWith("delete_confirm_") ||
                    interaction.customId.startsWith("delete_cancel_")
                )
            ) {
                const ownerId = interaction.customId.split("_").pop();

                if (interaction.user.id !== ownerId) {
                    return interaction.reply({
                        content: "❌ Ces boutons ne te sont pas destinés.",
                        ephemeral: true
                    });
                }

                if (interaction.customId.startsWith("delete_cancel_")) {
                    return interaction.update({
                        content: "❎ Opération annulée.",
                        embeds: [],
                        components: []
                    });
                }

                return interaction.update({
                    content: "⚠️ Confirmation reçue, mais aucune suppression n'a été lancée.",
                    embeds: [],
                    components: []
                });
            }
            // Boutons du système réaction-rôle
            if (
                interaction.isButton() &&
                interaction.customId.startsWith("reactrole_")
            ) {
                return reactrole.handleButton(interaction);
            }

            // Commande slash réaction-rôle
            if (
                interaction.isChatInputCommand() &&
                interaction.commandName === "reactrole"
            ) {
                return reactrole.execute(interaction);
            }
// Configuration des rôles par réaction sur un message existant
if (
    interaction.isChatInputCommand() &&
    interaction.commandName === "reactrole-reaction"
) {
    return reactionRole.execute(interaction);
}
            // Boutons du menu d'aide
            if (
                interaction.isButton() &&
                interaction.customId.startsWith("Palais2Fivem_help_cat_")
            ) {
                const category = interaction.customId.slice(
                    "Palais2Fivem_help_cat_".length
                );

                if (!categories.includes(category)) {
                    return interaction.reply({
                        content: "Cette catégorie est inconnue.",
                        ephemeral: true
                    });
                }

  try {
    await interaction.update({
        embeds: [buildHelpPage(client, category)],
        components: buildHelpRows(category)
    });
} catch (error) {
    if (error.code === 10008 || error.code === 10062) {
        console.log("[HELP] Message introuvable ou interaction expirée.");
        return;
    }

    console.error("[HELP]", error);
}
            }

            // Ancien menu déroulant : conservé pour les anciens messages
            if (
                interaction.isStringSelectMenu() &&
                interaction.customId === "Palais2Fivem_help_menu"
            ) {
                const oldCategories = {
                    utile: "Utilitaire",
                    moderation: "Modération",
                    securite: "Sécurité",
                    owner: "Owner"
                };

                const category = oldCategories[interaction.values[0]];

                if (!category) {
                    return interaction.reply({
                        content: "Cette catégorie est inconnue.",
                        ephemeral: true
                    });
                }

                return interaction.update({
                    embeds: [buildHelpPage(client, category)],
                    components: buildHelpRows(category)
                });
            }
if (
    interaction.isChatInputCommand() &&
    interaction.commandName === "securite"
) {
    const { configure } = require("./security");
    return configure(interaction, interaction.guild);
}
            if (!interaction.isChatInputCommand()) return;
            
            // ANTI-HACK : configuration du message par serveur
            const { getConfig, updateConfig } = require("./antiraid");

            if (
                interaction.isChatInputCommand() &&
                ["antihack-setup", "antihack-message", "antihack-off"]
                    .includes(interaction.commandName)
            ) {
                if (!interaction.guild) {
                    return interaction.reply({
                        content: "Cette commande doit être utilisée sur un serveur.",
                        ephemeral: true
                    });
                }

                if (!interaction.memberPermissions?.has(
                    PermissionFlagsBits.Administrator
                )) {
                    return interaction.reply({
                        content: "Tu dois être administrateur pour utiliser cette commande.",
                        ephemeral: true
                    });
                }

                const guildId = interaction.guild.id;
                const configAntiHack = getConfig(guildId);

                if (interaction.commandName === "antihack-setup") {
                    const salon = interaction.options.getChannel("salon", true);
                    const titre = interaction.options.getString("titre", true);
                    const description = interaction.options.getString("description", true);
                    const couleur = interaction.options.getString("couleur") || "#8A2BE2";

                    if (!/^#[0-9A-Fa-f]{6}$/.test(couleur)) {
                        return interaction.reply({
                            content: "Couleur invalide. Utilise un format comme #8A2BE2.",
                            ephemeral: true
                        });
                    }

                    const embed = new EmbedBuilder()
                        .setColor(couleur)
                        .setTitle(titre)
                        .setDescription(description)
                        .setFooter({ text: "Protection ANTI-HACK" })
                        .setTimestamp();

                    const message = await salon.send({ embeds: [embed] }).catch(() => null);

                    if (!message) {
                        return interaction.reply({
                            content: "Impossible d'envoyer le message. Vérifie les permissions du bot dans ce salon.",
                            ephemeral: true
                        });
                    }

                    updateConfig(guildId, {
                        antiHackEnabled: true,
                        antiHackChannelId: salon.id,
                        antiHackMessageId: message.id,
                        antiHackTitle: titre,
                        antiHackDescription: description,
                        antiHackColor: couleur
                    });

                    return interaction.reply({
                        content: `Message ANTI-HACK publié dans ${salon} et configuration sauvegardée.`,
                        ephemeral: true
                    });
                }

                if (interaction.commandName === "antihack-message") {
                    if (
                        !configAntiHack.antiHackEnabled ||
                        !configAntiHack.antiHackChannelId ||
                        !configAntiHack.antiHackMessageId
                    ) {
                        return interaction.reply({
                            content: "Configure d'abord le message avec /antihack-setup.",
                            ephemeral: true
                        });
                    }

                    const titre = interaction.options.getString("titre", true);
                    const description = interaction.options.getString("description", true);

                    const salon = await interaction.guild.channels
                        .fetch(configAntiHack.antiHackChannelId)
                        .catch(() => null);

                    const message = salon
                        ? await salon.messages.fetch(configAntiHack.antiHackMessageId).catch(() => null)
                        : null;

                    if (!message) {
                        return interaction.reply({
                            content: "Message introuvable. Relance /antihack-setup.",
                            ephemeral: true
                        });
                    }

                    const couleur = configAntiHack.antiHackColor || "#8A2BE2";
                    const embed = new EmbedBuilder()
                        .setColor(couleur)
                        .setTitle(titre)
                        .setDescription(description)
                        .setFooter({ text: "Protection ANTI-HACK" })
                        .setTimestamp();

                    await message.edit({ embeds: [embed] });

                    updateConfig(guildId, {
                        antiHackTitle: titre,
                        antiHackDescription: description
                    });

                    return interaction.reply({
                        content: "Message ANTI-HACK modifié avec succès.",
                        ephemeral: true
                    });
                }

                if (interaction.commandName === "antihack-off") {
                    updateConfig(guildId, { antiHackEnabled: false });

                    return interaction.reply({
                        content: "Configuration ANTI-HACK désactivée.",
                        ephemeral: true
                    });
                }
            }


            if (interaction.commandName === "ping") {
                return interaction.reply({
                    content: `🏓 Pong ! ${client.ws.ping} ms`,
                    ephemeral: true
                });
            }

            if (interaction.commandName === "help") {
                return interaction.reply({
                    embeds: [buildHelpPage(client, "Utilitaire")],
                    components: buildHelpRows("Utilitaire"),
                    ephemeral: true
                });
            }

            if (!interaction.guild) {
                return interaction.reply({
                    content: "Utilise cette commande sur un serveur.",
                    ephemeral: true
                });
            }

            if (interaction.commandName === "clear") {
                if (!interaction.memberPermissions?.has(
                    PermissionFlagsBits.ManageMessages
                )) {
                    return interaction.reply({
                        content: "Tu n'as pas la permission Gérer les messages.",
                        ephemeral: true
                    });
                }

                const amount = interaction.options.getInteger("nombre", true);
                const deleted = await interaction.channel.bulkDelete(amount, true);

                return interaction.reply({
                    content: `🧹 ${deleted.size} message(s) supprimé(s). Les messages de plus de 14 jours sont ignorés.`,
                    ephemeral: true
                });
            }

            if (
                interaction.commandName === "ban" ||
                interaction.commandName === "kick"
            ) {
                const isBan = interaction.commandName === "ban";
                const permission = isBan
                    ? PermissionFlagsBits.BanMembers
                    : PermissionFlagsBits.KickMembers;

                if (!interaction.memberPermissions?.has(permission)) {
                    return interaction.reply({
                        content: "Tu n'as pas la permission nécessaire.",
                        ephemeral: true
                    });
                }

                const user = interaction.options.getUser("membre", true);
                const reason = interaction.options.getString("raison") ||
                    "Aucune raison précisée";

                const member = await interaction.guild.members
                    .fetch(user.id)
                    .catch(() => null);

                if (!member) {
                    return interaction.reply({
                        content: "Ce membre n'est pas sur le serveur.",
                        ephemeral: true
                    });
                }

                if (member.id === interaction.user.id) {
                    return interaction.reply({
                        content: "Tu ne peux pas appliquer cette action sur toi-même.",
                        ephemeral: true
                    });
                }

                if (isBan) {
                    await member.ban({ reason });
                } else {
                    await member.kick(reason);
                }

                return interaction.reply({
                    content: `${isBan ? "🔨 Membre banni" : "👢 Membre expulsé"} : ${user.tag}\nRaison : ${reason}`,
                    ephemeral: true
                });
            }

            if (interaction.commandName === "ticket") {
                const guild = interaction.guild;
                const overwrites = [
                    {
                        id: guild.roles.everyone.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: interaction.user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory
                        ]
                    },
                    {
                        id: client.user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ManageChannels,
                            PermissionFlagsBits.ReadMessageHistory
                        ]
                    }
                ];

                if (config.ticketSupportRoleId) {
                    overwrites.push({
                        id: config.ticketSupportRoleId,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory
                        ]
                    });
                }

                const channel = await guild.channels.create({
                    name: `ticket-${interaction.user.username}`
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, "-")
                        .slice(0, 90),
                    type: ChannelType.GuildText,
                    parent: config.ticketCategoryId || undefined,
                    permissionOverwrites: overwrites,
                    reason: `Ticket créé par ${interaction.user.tag}`
                });

                return interaction.reply({
                    content: `🎫 Ton ticket est créé : ${channel}`,
                    ephemeral: true
                });
            }
            
            const store = require("../data/config-store");

            if (interaction.commandName === "join") {
                const member = await interaction.guild.members.fetch(
                    interaction.user.id
                );

                const channel = member.voice.channel;

                if (!channel) {
                    return interaction.reply({
                        content: "Rejoins d'abord un salon vocal.",
                        ephemeral: true
                    });
                }

                const permissions = channel.permissionsFor(
                    interaction.guild.members.me
                );

                if (
                    !permissions?.has(PermissionFlagsBits.Connect) ||
                    !permissions?.has(PermissionFlagsBits.Speak)
                ) {
                    return interaction.reply({
                        content: "Je n'ai pas les permissions Se connecter et Parler.",
                        ephemeral: true
                    });
                }

                const {
                    joinVoiceChannel,
                    getVoiceConnection
                } = require("@discordjs/voice");

                getVoiceConnection(interaction.guildId)?.destroy();

                joinVoiceChannel({
                    channelId: channel.id,
                    guildId: interaction.guildId,
                    adapterCreator: interaction.guild.voiceAdapterCreator,
                    selfDeaf: true
                });

                return interaction.reply({
                    content: `Connecté dans ${channel}.`,
                    ephemeral: true
                });
            }

            if (interaction.commandName === "leave") {
                const { getVoiceConnection } = require("@discordjs/voice");
                const connection = getVoiceConnection(interaction.guildId);

                if (!connection) {
                    return interaction.reply({
                        content: "Je ne suis connecté à aucun vocal sur ce serveur.",
                        ephemeral: true
                    });
                }

                connection.destroy();

                return interaction.reply({
                    content: "Déconnecté du vocal.",
                    ephemeral: true
                });
            }

            if (interaction.commandName === "setup-logs") {
                const channel = interaction.options.getChannel("salon", true);
                const permissions = channel.permissionsFor(
                    interaction.guild.members.me
                );

                if (
                    !permissions?.has(PermissionFlagsBits.ViewChannel) ||
                    !permissions?.has(PermissionFlagsBits.SendMessages) ||
                    !permissions?.has(PermissionFlagsBits.EmbedLinks)
                ) {
                    return interaction.reply({
                        content: "Je dois pouvoir voir ce salon, envoyer des messages et des embeds.",
                        ephemeral: true
                    });
                }

                store.set(interaction.guildId, {
                    logChannelId: channel.id,
                    logsEnabled: true
                });

                return interaction.reply({
                    content: `Les logs seront envoyés dans ${channel}.`,
                    ephemeral: true
                });
            }

            if (interaction.commandName === "logs-off") {
                store.set(interaction.guildId, {
                    logsEnabled: false
                });

                return interaction.reply({
                    content: "Les logs sont désactivés sur ce serveur.",
                    ephemeral: true
                });
            }

        } catch (error) {
            console.error("[Palais2Fivem interactions]", error);

            if (interaction.isRepliable()) {
                const response = {
                    content: "Une erreur est survenue. Vérifie les permissions du bot et la console VS Code.",
                    ephemeral: true
                };

                if (interaction.deferred || interaction.replied) {
                    await interaction.followUp(response).catch(() => {});
                } else {
                    await interaction.reply(response).catch(() => {});
                }
            }
        }
    });
}

module.exports = { attachInteractions, commands };
