
const {
    EmbedBuilder,
    AuditLogEvent
} = require("discord.js");

const config = require("../config.json");

module.exports = function attachLogs(client) {
    const recentLogs = new Map();

    async function sendLog(guild, title, description) {
        try {
            if (!guild) return;

            const channel = guild.channels.cache.get(config.logChannelId);
            if (!channel || !channel.isTextBased()) {
                console.log("[LOGS] Salon de logs introuvable.");
                return;
            }

            const embed = new EmbedBuilder()
                .setColor(config.color || "#ADD8E6")
                .setTitle(title)
                .setDescription(description)
                .setTimestamp();

            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error("[LOGS] Erreur :", error.message);
        }
    }

    // Arrivée d'un membre
    client.on("guildMemberAdd", async member => {
        await sendLog(
            member.guild,
            "📥 Nouveau membre",
            `**Membre :** ${member.user.tag}\n**ID :** ${member.id}\n**Membres :** ${member.guild.memberCount}`
        );
    });

    // Départ ou expulsion d'un membre
    client.on("guildMemberRemove", async member => {
        let kickEntry = null;

        try {
            const audit = await member.guild.fetchAuditLogs({
                type: AuditLogEvent.MemberKick,
                limit: 5
            });

            kickEntry = audit.entries.find(entry =>
                entry.target?.id === member.id &&
                Date.now() - entry.createdTimestamp < 10000
            );
        } catch (error) {
            console.error("[LOGS] Lecture du journal impossible :", error.message);
        }

        if (kickEntry) {
            await sendLog(
                member.guild,
                "👢 Membre expulsé",
                `**Membre :** ${member.user.tag}\n**Par :** ${kickEntry.executor?.tag || "Inconnu"}\n**Raison :** ${kickEntry.reason || "Aucune raison indiquée"}`
            );
        } else {
            await sendLog(
                member.guild,
                "📤 Départ d'un membre",
                `**Membre :** ${member.user.tag}\n**ID :** ${member.id}`
            );
        }
    });

    // Bannissement
    client.on("guildBanAdd", async ban => {
        await sendLog(
            ban.guild,
            "🔨 Membre banni",
            `**Membre :** ${ban.user.tag}\n**ID :** ${ban.user.id}`
        );
    });

    // Débannissement
    client.on("guildBanRemove", async ban => {
        await sendLog(
            ban.guild,
            "🔓 Membre débanni",
            `**Membre :** ${ban.user.tag}\n**ID :** ${ban.user.id}`
        );
    });

    // Suppression d'un salon
    client.on("channelDelete", async channel => {
        if (!channel.guild) return;

        await sendLog(
            channel.guild,
            "🗑️ Salon supprimé",
            `**Salon :** #${channel.name}\n**ID :** ${channel.id}`
        );
    });

    // Suppression d'un rôle
    client.on("roleDelete", async role => {
        await sendLog(
            role.guild,
            "🗑️ Rôle supprimé",
            `**Rôle :** ${role.name}\n**ID :** ${role.id}`
        );
    });

    // Suppression d'un message
    client.on("messageDelete", async message => {
        if (!message.guild) return;

        let content = message.content || "";
        if (message.partial) content = "(Message non disponible en cache)";
        if (!content) content = "(Aucun texte ou contenu non disponible)";

        await sendLog(
            message.guild,
            "🗑️ Message supprimé",
            `**Auteur :** ${message.author?.tag || "Inconnu"}\n**Salon :** <#${message.channel.id}>\n**Contenu :**\n${content.slice(0, 1500)}`
        );
    });

    // Modification d'un message
    client.on("messageUpdate", async (oldMessage, newMessage) => {
        if (!newMessage.guild) return;
        if (oldMessage.partial || newMessage.partial) return;
        if (oldMessage.author?.bot) return;
        if (oldMessage.content === newMessage.content) return;

        await sendLog(
            newMessage.guild,
            "✏️ Message modifié",
            `**Auteur :** ${newMessage.author?.tag || "Inconnu"}\n**Salon :** <#${newMessage.channel.id}>\n**Avant :** ${(oldMessage.content || "(vide)").slice(0, 700)}\n**Après :** ${(newMessage.content || "(vide)").slice(0, 700)}`
        );
    });

    // Modifications de rôles et actions de modération
    client.on("guildAuditLogEntryCreate", async (entry, guild) => {
        const key = `${guild.id}-${entry.id}`;
        if (recentLogs.has(key)) return;

        recentLogs.set(key, Date.now());
        setTimeout(() => recentLogs.delete(key), 30000);

        const executor = entry.executor?.tag || "Inconnu";
        const target = entry.target;
        const reason = entry.reason || "Aucune raison indiquée";

        switch (entry.action) {
            case AuditLogEvent.MemberRoleUpdate:
                await sendLog(
                    guild,
                    "🎭 Rôles d'un membre modifiés",
                    `**Membre :** ${target?.tag || target?.id || "Inconnu"}\n**Par :** ${executor}\n**Raison :** ${reason}`
                );
                break;

            case AuditLogEvent.MemberUpdate:
                await sendLog(
                    guild,
                    "🛡️ Membre modéré",
                    `**Membre :** ${target?.tag || target?.id || "Inconnu"}\n**Par :** ${executor}\n**Raison :** ${reason}`
                );
                break;

            case AuditLogEvent.MemberBanAdd:
            case AuditLogEvent.MemberBanRemove:
            case AuditLogEvent.MemberKick:
            case AuditLogEvent.RoleDelete:
            case AuditLogEvent.ChannelDelete:
                // Ces événements sont déjà traités ailleurs
                break;
        }
    });

    console.log("[LOGS] Système de logs chargé.");
};
