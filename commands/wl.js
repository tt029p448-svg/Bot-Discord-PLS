
const fs = require("fs");
const path = require("path");
const { PermissionsBitField } = require("discord.js");

const whitelistPath = path.join(__dirname, "../data/whitelist.json");

function loadWhitelist() {
    if (!fs.existsSync(path.dirname(whitelistPath))) {
        fs.mkdirSync(path.dirname(whitelistPath), { recursive: true });
    }

    if (!fs.existsSync(whitelistPath)) {
        fs.writeFileSync(whitelistPath, "{}", "utf8");
    }

    const data = JSON.parse(fs.readFileSync(whitelistPath, "utf8"));

    // Compatibilité avec un ancien fichier contenant un tableau
    if (Array.isArray(data)) return {};

    return data && typeof data === "object" ? data : {};
}

function saveWhitelist(data) {
    fs.writeFileSync(whitelistPath, JSON.stringify(data, null, 2), "utf8");
}

module.exports = {
    name: "wl",
    description: "Gère la whitelist du serveur.",
    category: "Gestion",

    async execute(message, args) {
        if (!message.guild) {
            return message.reply("❌ Utilise cette commande dans un serveur.");
        }

        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("❌ Cette commande est réservée aux administrateurs du serveur.");
        }

        try {
            const allWhitelists = loadWhitelist();
            const guildId = message.guild.id;

            if (!Array.isArray(allWhitelists[guildId])) {
                allWhitelists[guildId] = [];
            }

            const whitelist = allWhitelists[guildId];
            const action = (args[0] || "list").toLowerCase();

            if (action === "list") {
                if (whitelist.length === 0) {
                    return message.reply("📋 La whitelist de ce serveur est vide.");
                }

                const members = whitelist.map(
                    (id, index) => `${index + 1}. <@${id}> — \`${id}\``
                );

                return message.reply({
                    content: `📋 **Whitelist de ${message.guild.name} (${whitelist.length})**\n${members.join("\n")}`
                });
            }

            if (action === "add") {
                const userId = message.mentions.users.first()?.id || args[1];

                if (!userId || !/^\d{17,20}$/.test(userId)) {
                    return message.reply("❌ Utilisation : `+wl add @membre`");
                }

                if (whitelist.includes(userId)) {
                    return message.reply("ℹ️ Cet utilisateur est déjà dans la whitelist.");
                }

                whitelist.push(userId);
                saveWhitelist(allWhitelists);

                return message.reply(`✅ <@${userId}> a été ajouté à la whitelist de ce serveur.`);
            }

            if (action === "remove") {
                const userId = message.mentions.users.first()?.id || args[1];

                if (!userId || !/^\d{17,20}$/.test(userId)) {
                    return message.reply("❌ Utilisation : `+wl remove @membre`");
                }

                if (!whitelist.includes(userId)) {
                    return message.reply("ℹ️ Cet utilisateur n'est pas dans la whitelist.");
                }

                allWhitelists[guildId] = whitelist.filter(id => id !== userId);
                saveWhitelist(allWhitelists);

                return message.reply(`✅ <@${userId}> a été retiré de la whitelist de ce serveur.`);
            }

            return message.reply(
                "❌ Commandes disponibles : `+wl`, `+wl add @membre`, `+wl remove @membre`"
            );
        } catch (error) {
            console.error("[Palais2Fivem WL]", error);
            return message.reply("❌ Impossible de modifier la whitelist. Vérifie les logs du bot.");
        }
    }
};
