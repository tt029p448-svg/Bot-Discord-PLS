
const fs = require("fs");
const path = require("path");
const { PermissionFlagsBits, EmbedBuilder } = require("discord.js");

const warningsFile = path.join(process.cwd(), "warnings.json");

function readWarnings() {
    try {
        if (!fs.existsSync(warningsFile)) return {};
        return JSON.parse(fs.readFileSync(warningsFile, "utf8"));
    } catch (error) {
        console.error("[warn] Lecture des avertissements impossible :", error);
        throw error;
    }
}

function saveWarnings(data) {
    fs.writeFileSync(warningsFile, JSON.stringify(data, null, 2));
}

module.exports = {
    name: "warn",
    description: "Avertir un membre et conserver l'avertissement",

    async execute(message, args) {
        if (!message.guild) return;

        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply("❌ Tu n'as pas la permission d'avertir des membres.");
        }

        const member = message.mentions.members.first();

        if (!member) {
            return message.reply("Utilisation : `!warn @membre [raison]`");
        }

        if (member.id === message.author.id || member.id === message.guild.ownerId) {
            return message.reply("❌ Tu ne peux pas avertir cette personne.");
        }

        if (
            message.guild.ownerId !== message.author.id &&
            message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0
        ) {
            return message.reply("❌ Ton rôle doit être supérieur à celui du membre.");
        }

        const reason = args.slice(1).join(" ") || "Aucune raison précisée";

        try {
            const warnings = readWarnings();
            const key = `${message.guild.id}_${member.id}`;

            if (!warnings[key]) warnings[key] = [];

            warnings[key].push({
                reason,
                moderatorId: message.author.id,
                date: new Date().toISOString()
            });

            saveWarnings(warnings);

            const embed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle("⚠️ Avertissement")
                .setDescription(`**Membre :** ${member.user.tag}\n**Raison :** ${reason}`)
                .addFields({
                    name: "Nombre total d'avertissements",
                    value: String(warnings[key].length),
                    inline: true
                })
                .setFooter({ text: `Modérateur : ${message.author.tag}` })
                .setTimestamp();

            return message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error("[warn]", error);
            return message.reply("❌ Impossible d'enregistrer cet avertissement.");
        }
    }
};
