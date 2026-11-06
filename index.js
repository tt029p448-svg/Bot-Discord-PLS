const fs = require("fs");
const path = require("path");

const prefixesFile = path.join(__dirname, "data", "prefixes.json");

function getPrefix(guildId) {
    try {
        const prefixes = JSON.parse(fs.readFileSync(prefixesFile, "utf8"));
        return prefixes[guildId] || require("./config.json").prefix || "+";
    } catch {
        return require("./config.json").prefix || "+";
    }
}

require("dotenv").config();



const {
    Client,
    Collection,
    ActivityType,
    GatewayIntentBits,
    Partials,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");





const { prefix, autoRoleId } = require("./config.json");
const { attachTickets } = require("./handler/tickets");
const attachLogs = require("./handler/logs");
const { attachServerLogs } = require("./handler/server-logs");
const { attachLeak } = require("./handler/leak");
const { attachWelcome } = require("./handler/welcome");
const { attachSoutien } = require("./handler/soutien");


// Création du bot
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction
    ]
});
const { attachAntiRaid } = require("./handler/antiraid");
const { attachSecurity } = require("./handler/security");
attachSecurity(client);
attachSoutien(client);
attachAntiRaid(client);
attachServerLogs(client);
attachLogs(client);
attachLeak(client);
attachWelcome(client);
client.commands = new Collection();

const { attachInteractions } = require("./handler/interactions");
attachLogs(client);
client.commands = new Collection();


attachInteractions(client);

const {
    attachReactionRoleEvents
} = require("./handler/reactionrole-events");

attachReactionRoleEvents(client);

const commandHandler = require("./handler/commandHandler");
commandHandler(client);

// Connexion réussie
client.once("ready", () => {
    console.log("╭──────────────────────────────╮");
    console.log(`│ Nom : ${client.user.tag}`);
    console.log(`│ ID : ${client.user.id}`);
    console.log("╰──────────────────────────────╯");

    client.user.setActivity("Dev by :*!Palais De Justice", {
        type: ActivityType.Playing
    });
});

// Commandes avec préfixe
client.on("messageCreate", async (message) => {
    console.log("[Message reçu]", message.content);

    if (message.author.bot || !message.guild) return;

const prefix = getPrefix(message.guild.id);

if (!message.content.startsWith(prefix)) return;

const args = message.content
    .slice(prefix.length)
    .trim()
    .split(/\s+/);

    const commandName = args.shift()?.toLowerCase();
    if (!commandName) return;

    const command = client.commands.get(commandName);

    if (!command) {
        console.log(`[Commande inconnue] ${commandName}`);
        return;
    }

    try {
        if (typeof command.execute !== "function") {
            console.error(
                `[ERREUR] La commande ${commandName} ne possède pas execute().`
            );
            return;
        }

        await command.execute(message, args, client);
    } catch (error) {
        console.error(`[ERREUR] Commande ${commandName} :`, error);

        await message.reply(
            "Une erreur est survenue pendant l'exécution de la commande."
        ).catch(console.error);
    }
});

// Rôle automatique

client.on("guildMemberAdd", async (member) => {
    // PROTECTION ANTI-ADDBOT
    if (member.user.bot) {
        try {
            let entry = null;

            // Attendre que Discord publie l'entrée dans les logs
            for (let i = 0; i < 3; i++) {
                const logs = await member.guild.fetchAuditLogs({
                    type: AuditLogEvent.BotAdd,
                    limit: 5
                });

                entry = logs.entries.find((log) =>
                    log.target?.id === member.id &&
                    Date.now() - log.createdTimestamp < 15000
                );

                if (entry) break;

                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Owners autorisés : propriétaire du serveur et IDs configurés
            const { ownerId, ownerIds = [] } = require("./config.json");

            const owners = new Set([
                member.guild.ownerId,
                ownerId,
                ...ownerIds
            ].filter(Boolean));

            const executorId = entry?.executor?.id;

            if (executorId && owners.has(executorId)) {
                console.log(
                    `[Anti-AddBot] Bot autorisé : ${member.user.tag}`
                );
                return;
            }

            // Si l'auteur ne peut pas être vérifié, le bot est retiré
            await member.ban({
                reason: "Anti-AddBot Palais2Fivem : ajout non autorisé ou auteur invérifiable."
            });

            console.log(
                `[Anti-AddBot] Bot banni : ${member.user.tag} | ` +
                `Auteur : ${executorId || "inconnu"}`
            );
        } catch (error) {
            console.error("[Anti-AddBot] Impossible de retirer le bot :", error);
        }

        return;
    }

    // AUTOPING : mention puis suppression après 3 secondes
    try {
        const configAutoPing = require("./config.json");
        const channelId = configAutoPing.autoPingChannelId;

        console.log("[AutoPing] Membre détecté :", member.user.tag);

        if (channelId) {
            const channel = await member.guild.channels
                .fetch(channelId)
                .catch(() => null);

            if (channel && channel.isTextBased() && channel.isSendable()) {
                const pingMessage = await channel.send({
                    content: `👋 Bienvenue ${member} !`,
                    allowedMentions: {
                        users: [member.id]
                    }
                });

                setTimeout(() => {
                    pingMessage.delete().catch(() => {});
                }, 3000);

                console.log("[AutoPing] Ping envoyé !");
            } else {
                console.error("[AutoPing] Salon introuvable ou inaccessible.");
            }
        } else {
            console.error("[AutoPing] Aucun salon configuré. Utilise +autoping #salon.");
        }
    } catch (error) {
        console.error("[AutoPing] Erreur :", error);
    }


    // RÔLE AUTOMATIQUE POUR LES MEMBRES HUMAINS
    const { autoRoleId } = require("./config.json");

    if (!autoRoleId) {
        console.error("[AutoRole] Aucun autoRoleId dans config.json.");
        return;
    }

    const role = member.guild.roles.cache.get(autoRoleId);

    if (!role) {
        console.error(`[AutoRole] Rôle introuvable : ${autoRoleId}`);
        return;
    }

    try {
        await member.roles.add(role);
        console.log(`[AutoRole] Rôle ajouté à ${member.user.tag}.`);
    } catch (error) {
        console.error("[AutoRole] Erreur :", error);
    }
});





    const help = client.commands.get("help");

    if (!help || typeof help.buildPage !== "function") {
        return interaction.reply({
            content: "Le système d'aide est introuvable.",
            ephemeral: true
        });
    }

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

    

    
        



// Connexion Discord
if (!process.env.DISCORD_TOKEN) {
    console.error("[ERREUR] DISCORD_TOKEN absent du fichier .env.");
    process.exit(1);
}



async function demarrerVocalPalais2Fivem() {
    console.log("[VOCAL] Initialisation du vocal...");

    try {
        const lancerVocal = require("./vocal24h.js");
        await lancerVocal(client);
    } catch (error) {
        console.error("[VOCAL] Erreur :", error);
    }
}

client.once("ready", async () => {
    console.log("[VOCAL] Événement ready détecté !");
    await demarrerVocalPalais2Fivem();
    client.user.setPresence({
    activities: [
        {
            name: `Palais2Fivem | ${client.guilds.cache.size} serveurs`,
            type: ActivityType.Playing
        }
    ],
    status: "online"
});
});

attachTickets(client);

client.login(process.env.DISCORD_TOKEN).catch((error) => {
    console.error("[ERREUR] Connexion Discord impossible :", error);
});

    
client.on("guildMemberAdd", async (member) => {
    // ANTI-ADDBOT
    if (member.user.bot) {
        try {
            let entry = null;

            for (let i = 0; i < 3; i++) {
                const logs = await member.guild.fetchAuditLogs({
                    type: AuditLogEvent.BotAdd,
                    limit: 5
                });

                entry = logs.entries.find((log) =>
                    log.target?.id === member.id &&
                    Date.now() - log.createdTimestamp < 15000
                );

                if (entry) break;

                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            const { ownerId, ownerIds = [] } = require("./config.json");

            const owners = new Set([
                member.guild.ownerId,
                ownerId,
                ...ownerIds
            ].filter(Boolean));

            const executorId = entry?.executor?.id;

            if (executorId && owners.has(executorId)) {
                console.log(`[Anti-AddBot] Bot autorisé : ${member.user.tag}`);
                return;
            }

            await member.ban({
                reason: "Anti-AddBot Palais2Fivem : ajout non autorisé ou auteur invérifiable."
            });

            console.log(`[Anti-AddBot] Bot banni : ${member.user.tag}`);
        } catch (error) {
            console.error("[Anti-AddBot] Erreur :", error);
        }

        return;
    }

    // AUTOPING : mentionner le membre puis supprimer le message après 3 secondes
    try {
        const config = require("./config.json");
        const channelId = config.autoPingChannelId;

        if (channelId) {
            const channel = await member.guild.channels
                .fetch(channelId)
                .catch(() => null);

            if (channel && channel.isTextBased() && channel.isSendable()) {
                const pingMessage = await channel.send({
                    content: `👋 Bienvenue ${member} !`,
                    allowedMentions: {
                        users: [member.id]
                    }
                }).catch(error => {
                    console.error("[AutoPing] Erreur :", error);
                    return null;
                });

                if (pingMessage) {
                    setTimeout(() => {
                        pingMessage.delete().catch(() => {});
                    }, 3000);
                }
            }
        }
    } catch (error) {
        console.error("[AutoPing] Erreur :", error);
    }

    // AUTOROLE
    const { autoRoleId } = require("./config.json");

    if (!autoRoleId) {
        console.error("[AutoRole] Aucun autoRoleId dans config.json.");
        return;
    }

    const role = member.guild.roles.cache.get(autoRoleId);

    if (!role) {
        console.error(`[AutoRole] Rôle introuvable : ${autoRoleId}`);
        return;
    }

    try {
        await member.roles.add(role);
        console.log(`[AutoRole] Rôle ajouté à ${member.user.tag}.`);
    } catch (error) {
        console.error("[AutoRole] Erreur :", error);
    }
});

