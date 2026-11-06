
const { updateConfig, getConfig } = require("../../handler/antiraid");

const protections = [
    "antiadmin",
    "antiban",
    "antibot",
    "antichannel",
    "anticreateinvite",
    "antideco",
    "antidown",
    "antiemote",
    "antifast",
    "antijoin",
    "antimassmention",
    "antimassping",
    "antimassthread",
    "antimassvoice",
    "antimove",
    "antinewaccount",
    "antirole",
    "antisoundboard",
    "antisticker",
    "antithread",
    "antitimeout",
    "antitransfer",
    "antiunban",
    "antiupdate",
    "antiwebhook"
];

module.exports = {
    name: "antiadmin",
    aliases: protections.filter(name => name !== "antiadmin"),
    description: "Configure les protections Anti-Raid.",

    async execute(message, args) {
        if (!message.guild) return;

        if (!message.member.permissions.has("Administrator")) {
            return message.reply(
                "Tu dois être administrateur pour configurer l'Anti-Raid."
            );
        }

        const protection = message.content
            .trim()
            .split(/\s+/)[0]
            .slice(1)
            .toLowerCase();

        const choix = args[0]?.toLowerCase();

        if (!protections.includes(protection)) {
            return message.reply("Protection inconnue.");
        }

        if (choix === "on" || choix === "off") {
            updateConfig(message.guild.id, {
                [protection]: choix === "on"
            });

            return message.reply(
                `Configuration de **${protection}** : **${choix.toUpperCase()}**.`
            );
        }

        const config = getConfig(message.guild.id);

        return message.reply(
            `État configuré de **${protection}** : **${config[protection] ? "ON" : "OFF"}**.\n` +
            `Utilisation : \`+${protection} on\` ou \`+${protection} off\``
        );
    }
};
