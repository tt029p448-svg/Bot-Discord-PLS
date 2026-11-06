
const { updateConfig } = require("../../handler/antiraid");

module.exports = {
    name: "antispam",
    description: "Active ou désactive l'anti-spam.",

    async execute(message, args) {
        if (!message.guild) return;

        if (!message.member.permissions.has("Administrator")) {
            return message.reply(
                "Tu dois être administrateur pour modifier cette protection."
            );
        }

        const choix = args[0]?.toLowerCase();

        if (!["on", "off"].includes(choix)) {
            return message.reply(
                "Utilisation : `+antispam on` ou `+antispam off`"
            );
        }

        updateConfig(message.guild.id, {
            antispam: choix === "on"
        });

        return message.reply(
            `Anti-spam ${choix === "on" ? "activé" : "désactivé"}.`
        );
    }
};
