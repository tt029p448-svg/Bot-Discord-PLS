const { updateConfig, getConfig } = require("../../handler/antiraid");

module.exports = {
    name: "bypass",
    description: "Gère la liste des membres exemptés.",

    async execute(message, args) {
        if (!message.guild) return;

        if (!message.member.permissions.has("Administrator")) {
            return message.reply(
                "Permission administrateur nécessaire."
            );
        }

        const config = getConfig(message.guild.id);
        const action = args[0]?.toLowerCase();

        if (action === "reset") {
            updateConfig(message.guild.id, { bypass: [] });
            return message.reply("Liste bypass réinitialisée.");
        }

        if (action === "list") {
            return message.reply(
                config.bypass.length
                    ? `Membres bypass : ${config.bypass.map(id => `\`${id}\``).join(", ")}`
                    : "La liste bypass est vide."
            );
        }

        if (action !== "set" || !args[1]) {
            return message.reply(
                "Utilisation :\n" +
                "`+bypass set <ID_du_membre>`\n" +
                "`+bypass list`\n" +
                "`+bypass reset`"
            );
        }

        const userId = args[1].replace(/[<@!>]/g, "");

        if (!/^\d{17,20}$/.test(userId)) {
            return message.reply("ID de membre invalide.");
        }

        if (config.bypass.includes(userId)) {
            return message.reply("Ce membre est déjà bypassé.");
        }

        updateConfig(message.guild.id, {
            bypass: [...config.bypass, userId]
        });

        return message.reply(
            `Le membre \`${userId}\` a été ajouté au bypass.`
        );
    }
};