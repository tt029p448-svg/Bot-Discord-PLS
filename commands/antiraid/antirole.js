
const { PermissionFlagsBits } = require("discord.js");
const { getConfig, updateConfig } = require("../../handler/antiraid");

module.exports = {
    name: "antirole",
    description: "Configure le retrait des rôles après une invitation Discord.",

    async execute(message, args) {
        if (!message.guild) return;

        if (!message.member.permissions.has(
            PermissionFlagsBits.Administrator
        )) {
            return message.reply(
                "Tu dois être administrateur pour utiliser cette commande."
            );
        }

        const action = args[0]?.toLowerCase();

        if (action === "on" || action === "off") {
            const active = action === "on";

            updateConfig(message.guild.id, {
                antirole: active
            });

            return message.reply(
                `Protection antirole ${active ? "activée" : "désactivée"}.`
            );
        }

        if (action === "role") {
            const role =
                message.mentions.roles.first() ||
                message.guild.roles.cache.get(args[1]);

            if (!role || role.id === message.guild.id) {
                return message.reply(
                    "Utilisation : `+antirole role @Membres`"
                );
            }

            updateConfig(message.guild.id, {
                roleMembresId: role.id
            });

            return message.reply(
                `Le rôle conservé sera désormais ${role}.`
            );
        }

        const config = getConfig(message.guild.id);

        return message.reply(
            [
                "**Configuration AntiRole**",
                `État : ${config.antirole ? "Activé" : "Désactivé"}`,
                `Rôle conservé : ${
                    config.roleMembresId
                        ? `<@&${config.roleMembresId}>`
                        : "Non configuré"
                }`,
                "",
                "`+antirole on` — Activer",
                "`+antirole off` — Désactiver",
                "`+antirole role @Membres` — Choisir le rôle conservé"
            ].join("\n")
        );
    }
};
