
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "../../data/antiraid-config.json");

function read() {
    try {
        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
        return {};
    }
}

function save(data) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

module.exports = {
    name: "blrank",
    description: "Gère la liste de blocage Anti-Raid.",

    async execute(message, args) {
        if (!message.guild) return;

        if (!message.member.permissions.has("Administrator")) {
            return message.reply(
                "Tu dois être administrateur pour utiliser cette commande."
            );
        }

        const all = read();
        const guildId = message.guild.id;
        const guild = all[guildId] || {};
        const list = Array.isArray(guild.blrank) ? guild.blrank : [];

        const action = args[0]?.toLowerCase();
        const id = args[1]?.replace(/[<@!>]/g, "");

        if (action === "list") {
            return message.reply(
                list.length
                    ? `Membres bloqués : ${list.map(x => `\`${x}\``).join(", ")}`
                    : "La liste de blocage est vide."
            );
        }

        if (action === "clear") {
            guild.blrank = [];
        } else if (action === "add" || action === "remove") {
            if (!id || !/^\d{17,20}$/.test(id)) {
                return message.reply(
                    `Utilisation : \`+blrank ${action} <ID_du_membre>\``
                );
            }

            if (action === "add") {
                if (list.includes(id)) {
                    return message.reply("Ce membre est déjà dans la liste.");
                }

                guild.blrank = [...list, id];
            } else {
                if (!list.includes(id)) {
                    return message.reply("Ce membre n'est pas dans la liste.");
                }

                guild.blrank = list.filter(memberId => memberId !== id);
            }
        } else {
            return message.reply(
                "Commandes disponibles :\n" +
                "`+blrank add <ID>`\n" +
                "`+blrank remove <ID>`\n" +
                "`+blrank list`\n" +
                "`+blrank clear`"
            );
        }

        all[guildId] = guild;
        save(all);

        return message.reply("La liste de blocage a été mise à jour.");
    }
};
