
const fs = require("fs");
const path = require("path");

const { PermissionFlagsBits } = require("discord.js");

const file = path.join(__dirname, "../data/soutien.json");

function read() {
    if (!fs.existsSync(path.dirname(file))) {
        fs.mkdirSync(path.dirname(file), { recursive: true });
    }

    if (!fs.existsSync(file)) return {};

    return JSON.parse(fs.readFileSync(file, "utf8"));
}

function save(data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

module.exports = {
    name: "soutien",
    description: "Configure le rôle soutien du serveur.",
    category: "Gestion",

    async execute(message, args) {
        if (!message.guild) return;

        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply("❌ Commande réservée aux administrateurs.");
        }

        const data = read();
        const guildId = message.guild.id;
        const action = args[0]?.toLowerCase();

        if (action === "off") {
            delete data[guildId];
            save(data);

            return message.reply("✅ Système de soutien désactivé.");
        }

        if (action === "list") {
            const config = data[guildId];

            if (!config) {
                return message.reply("❌ Aucun soutien configuré.");
            }

            return message.reply(
                `📢 **Configuration soutien**\n` +
                `Lien : \`${config.invite}\`\n` +
                `Rôle : <@&${config.roleId}>`
            );
        }

        if (action === "set") {
            const invite = args[1]
                ?.replace(/^https?:\/\/(www\.)?(discord\.gg\/|discord\.com\/invite\/)/i, "")
                .replace(/^\.gg\//i, "")
                .replace(/\/$/, "");

            const role =
                message.mentions.roles.first() ||
                message.guild.roles.cache.get(args[2]);

            if (!invite || !/^[a-zA-Z0-9-]+$/.test(invite) || !role) {
                return message.reply(
                    "❌ Utilisation : `+soutien set .gg/tonserveur @Soutien`"
                );
            }

            if (role.id === guildId || role.managed) {
                return message.reply("❌ Ce rôle ne peut pas être attribué.");
            }

            const botMember = await message.guild.members.fetchMe();

            if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
                return message.reply("❌ Il me manque la permission Gérer les rôles.");
            }

            if (role.position >= botMember.roles.highest.position) {
                return message.reply(
                    "❌ Place mon rôle au-dessus du rôle soutien."
                );
            }

            data[guildId] = {
                invite,
                roleId: role.id
            };

            save(data);

            return message.reply(
                `✅ **Soutien configuré !**\n\n` +
                `🔗 Statut demandé : \`.gg/${invite}\`\n` +
                `🎭 Rôle attribué : ${role}\n\n` +
                `Le bot surveillera automatiquement les changements de statut.`
            );
        }

        return message.reply(
            "**Configuration du soutien :**\n\n" +
            "`+soutien set .gg/tonserveur @Soutien`\n" +
            "`+soutien list`\n" +
            "`+soutien off`"
        );
    }
};
