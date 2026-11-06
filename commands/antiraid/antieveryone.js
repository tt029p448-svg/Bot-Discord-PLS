
const { updateConfig } = require("../../handler/antiraid");

module.exports = {
    name: "antieveryone",
    description: "Protège contre les mentions globales.",

    async execute(message, args) {
        if (!message.guild) return;

        if (!message.member.permissions.has("Administrator")) {
            return message.reply("Permission administrateur nécessaire.");
        }

        const choix = args[0]?.toLowerCase();

        if (!["on", "off"].includes(choix)) {
            return message.reply(
                "Utilisation : `+antieveryone on` ou `+antieveryone off`"
            );
        }

        updateConfig(message.guild.id, {
            antieveryone: choix === "on"
        });

        return message.reply(
            `Anti-everyone ${choix === "on" ? "activé" : "désactivé"}.`
        );
    }
};
