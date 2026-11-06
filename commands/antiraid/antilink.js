
const { updateConfig, getConfig } = require("../../handler/antiraid");

module.exports = {
    name: "antilink",
    description: "Configure le filtre anti-liens.",

    async execute(message, args) {
        if (!message.guild) return;

        if (!message.member.permissions.has("Administrator")) {
            return message.reply("Permission administrateur nécessaire.");
        }

        const choix = args[0]?.toLowerCase();

        if (choix === "on" || choix === "off") {
            updateConfig(message.guild.id, {
                antilink: choix === "on"
            });

            return message.reply(
                `Anti-link ${choix === "on" ? "activé" : "désactivé"}.`
            );
        }

        if (choix === "allow") {
            const domain = args[1]?.toLowerCase();

            if (
                !domain ||
                !/^(?:[a-z0-9-]+\.)+[a-z]{2,}$/.test(domain)
            ) {
                return message.reply(
                    "Utilisation : `+antilink allow exemple.com`"
                );
            }

            const config = getConfig(message.guild.id);
            const allowedLinks = [...new Set([
                ...config.allowedLinks,
                domain
            ])];

            updateConfig(message.guild.id, { allowedLinks });

            return message.reply(`Domaine autorisé : \`${domain}\`.`);
        }

        if (choix === "list") {
            const config = getConfig(message.guild.id);

            return message.reply(
                `Anti-link : **${config.antilink ? "ON" : "OFF"}**\n` +
                `Domaines autorisés : ${
                    config.allowedLinks.join(", ") || "aucun"
                }`
            );
        }

        return message.reply(
            "Utilisation : `+antilink on`, `+antilink off`, " +
            "`+antilink allow exemple.com` ou `+antilink list`"
        );
    }
};
