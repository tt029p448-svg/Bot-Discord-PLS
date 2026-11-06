
const {
    PermissionFlagsBits,
    ChannelType
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "../config.json");

function readConfig() {
    return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

function saveConfig(config) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

module.exports = {
    name: "autoping",
    description: "Configure le ping automatique des nouveaux membres.",
    usage: "+autoping <#salon ou ID>",

    async execute(message, args, client) {
        if (!message.guild) return;

        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply("❌ Cette commande est réservée aux administrateurs.");
        }

        const input = args[0];

        if (!input) {
            return message.reply(
                "❌ Utilisation : `+autoping #salon` ou `+autoping ID_DU_SALON`"
            );
        }

        const channelId = input.replace(/[<#>]/g, "");
        const channel = await message.guild.channels.fetch(channelId).catch(() => null);

        if (!channel || channel.type !== ChannelType.GuildText) {
            return message.reply("❌ Salon textuel introuvable. Vérifie le salon ou son ID.");
        }

        const botMember = message.guild.members.me;

        if (
            !channel.permissionsFor(botMember)?.has([
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages
            ])
        ) {
            return message.reply("❌ Je n'ai pas la permission de voir ou d'écrire dans ce salon.");
        }

        const config = readConfig();
        config.autoPingChannelId = channel.id;
        saveConfig(config);

        return message.reply(
            `✅ **Autoping activé !**\nChaque nouveau membre sera mentionné dans ${channel}.`
        );
    }
};
