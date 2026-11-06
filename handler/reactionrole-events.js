
const { PermissionFlagsBits } = require("discord.js");
const store = require("../data/config-store");

async function updateRole(reaction, user, shouldAdd) {
    if (user.bot) return;

    try {
        if (reaction.partial) {
            await reaction.fetch();
        }

        if (reaction.message.partial) {
            await reaction.message.fetch();
        }

        const message = reaction.message;
        const guild = message.guild;

        if (!guild) return;

        const config = store.get(guild.id);
        const entries = Array.isArray(config.reactionRoles)
            ? config.reactionRoles
            : [];

        const emojiKey = reaction.emoji.id || reaction.emoji.name;

        const entry = entries.find(item =>
            item.messageId === message.id &&
            item.channelId === message.channelId &&
            item.emojiKey === emojiKey
        );

        if (!entry) return;

        const role = await guild.roles.fetch(entry.roleId).catch(() => null);
        const botMember = guild.members.me;

        if (
            !role ||
            role.managed ||
            role.id === guild.id ||
            !botMember ||
            !botMember.permissions.has(PermissionFlagsBits.ManageRoles) ||
            role.position >= botMember.roles.highest.position
        ) {
            console.error("[REACTION ROLE] Rôle introuvable ou permissions insuffisantes.");
            return;
        }

        const member = await guild.members.fetch(user.id).catch(() => null);

        if (!member || member.user.bot) return;

        if (shouldAdd) {
            if (!member.roles.cache.has(role.id)) {
                await member.roles.add(role, "Réaction-rôle Palais2Fivem");
            }
        } else {
            if (member.roles.cache.has(role.id)) {
                await member.roles.remove(role, "Réaction-rôle Palais2Fivem");
            }
        }
    } catch (error) {
        console.error("[REACTION ROLE] Erreur :", error);
    }
}

function attachReactionRoleEvents(client) {
    client.on("messageReactionAdd", (reaction, user) =>
        updateRole(reaction, user, true)
    );

    client.on("messageReactionRemove", (reaction, user) =>
        updateRole(reaction, user, false)
    );

    console.log("[REACTION ROLE] Événements chargés.");
}

module.exports = { attachReactionRoleEvents };
