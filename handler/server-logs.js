
const { Events, EmbedBuilder } = require("discord.js");
const store = require("../data/config-store");

function attachServerLogs(client) {
    async function sendLog(guild, title, description, color = 0xADD8E6) {
        const config = store.get(guild.id);

        if (!config.logsEnabled || !config.logChannelId) return;

        const channel = await guild.channels.fetch(config.logChannelId)
            .catch(() => null);

        if (!channel || !channel.isTextBased() || !channel.send) return;

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(title)
            .setDescription(description.slice(0, 4000))
            .setTimestamp();

        await channel.send({ embeds: [embed] }).catch(error => {
            console.error("[ServerLogs] Envoi impossible :", error);
        });
    }

    client.on(Events.MessageDelete, async message => {
        if (!message.guild || message.author?.bot) return;

        await sendLog(
            message.guild,
            "🗑️ Message supprimé",
            `Auteur : ${message.author?.tag || "Inconnu"}\n` +
            `Salon : #${message.channel?.name || "inconnu"}\n` +
            `Contenu : ${(message.content || "Contenu indisponible").slice(0, 1500)}`,
            0xE74C3C
        );
    });

    client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
        if (!newMessage.guild || newMessage.author?.bot) return;
        if (oldMessage.partial || newMessage.partial) return;
        if (oldMessage.content === newMessage.content) return;

        await sendLog(
            newMessage.guild,
            "✏️ Message modifié",
            `Auteur : ${newMessage.author?.tag || "Inconnu"}\n` +
            `Salon : #${newMessage.channel?.name || "inconnu"}\n` +
            `Avant : ${(oldMessage.content || "Vide").slice(0, 1200)}\n` +
            `Après : ${(newMessage.content || "Vide").slice(0, 1200)}`
        );
    });

    client.on(Events.GuildMemberAdd, member => {
        return sendLog(
            member.guild,
            "📥 Nouveau membre",
            `${member.user.tag} a rejoint le serveur.\nID : ${member.id}`,
            0x2ECC71
        );
    });

    client.on(Events.GuildMemberRemove, member => {
        return sendLog(
            member.guild,
            "📤 Départ d'un membre",
            `${member.user.tag} a quitté le serveur.\nID : ${member.id}`,
            0xE67E22
        );
    });

    client.on(Events.ChannelCreate, channel => {
        if (!channel.guild) return;
        return sendLog(
            channel.guild,
            "➕ Salon créé",
            `Nom : ${channel.name}\nID : ${channel.id}`
        );
    });

    client.on(Events.ChannelDelete, channel => {
        if (!channel.guild) return;
        return sendLog(
            channel.guild,
            "➖ Salon supprimé",
            `Nom : ${channel.name}\nID : ${channel.id}`,
            0xE74C3C
        );
    });

    client.on(Events.ChannelUpdate, (oldChannel, newChannel) => {
        if (!newChannel.guild) return;
        if (oldChannel.name === newChannel.name) return;

        return sendLog(
            newChannel.guild,
            "✏️ Salon renommé",
            `${oldChannel.name} → ${newChannel.name}`
        );
    });

    client.on(Events.GuildRoleCreate, role => {
        return sendLog(
            role.guild,
            "➕ Rôle créé",
            `Nom : ${role.name}\nID : ${role.id}`
        );
    });

    client.on(Events.GuildRoleDelete, role => {
        return sendLog(
            role.guild,
            "➖ Rôle supprimé",
            `Nom : ${role.name}\nID : ${role.id}`,
            0xE74C3C
        );
    });

    client.on(Events.GuildRoleUpdate, (oldRole, newRole) => {
        if (
            oldRole.name === newRole.name &&
            oldRole.hexColor === newRole.hexColor &&
            oldRole.permissions.bitfield === newRole.permissions.bitfield
        ) return;

        return sendLog(
            newRole.guild,
            "✏️ Rôle modifié",
            `Ancien nom : ${oldRole.name}\nNouveau nom : ${newRole.name}\nID : ${newRole.id}`
        );
    });
}

module.exports = { attachServerLogs };
