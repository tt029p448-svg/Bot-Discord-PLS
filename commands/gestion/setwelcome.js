
const { PermissionFlagsBits } = require("discord.js");

const {
    readConfig,
    saveConfig
} = require("../../handler/welcome");

module.exports = {
    name: "setwelcome",
    description: "Configure le salon de bienvenue.",

    async execute(message, args) {
        if (!message.guild) return;

        if (!message.member.permissions.has(
            PermissionFlagsBits.Administrator
        )) {
            return message.reply("❌ Administrateur uniquement.");
        }

        const config = readConfig();

        if (args[0] === "off") {
            delete config[message.guild.id];
            saveConfig(config);

            return message.reply("✅ Messages de bienvenue désactivés.");
        }

        const channel = message.mentions.channels.first();

        if (!channel || !channel.isTextBased()) {
            return message.reply(
                "Utilisation : `+setwelcome #salon` ou `+setwelcome off`"
            );
        }

        config[message.guild.id] = channel.id;
        saveConfig(config);

        return message.reply(
            `✅ Les messages de bienvenue seront envoyés dans ${channel}.`
        );
    }
};
