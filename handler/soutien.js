
const fs = require("fs");
const path = require("path");


const { ActivityType, PermissionFlagsBits } = require("discord.js");

const file = path.join(__dirname, "../data/soutien.json");

function getConfigs() {
if (!fs.existsSync(file)) return {};

try {
return JSON.parse(fs.readFileSync(file, "utf8"));
} catch (error) {
console.error("[SOUTIEN] Configuration invalide :", error);
return {};
}
}

function attachSoutien(client) {
client.on("presenceUpdate", async (oldPresence, newPresence) => {
if (!newPresence?.guild) return;

const guild = newPresence.guild;
const config = getConfigs()[guild.id];

if (!config) return;

try {
const member = await guild.members.fetch(newPresence.userId);

if (!member || member.user.bot) return;

const role = guild.roles.cache.get(config.roleId);

if (!role) return;

const botMember = await guild.members.fetchMe();

if (
!botMember.permissions.has(PermissionFlagsBits.ManageRoles) ||
role.position >= botMember.roles.highest.position
) {
return;
}

const customStatus = newPresence.activities
.filter(activity => activity.type === ActivityType.Custom)
.map(activity => activity.state || "")
.join(" ");

const expected = ".gg/" + config.invite;

const hasSupport = customStatus
                .toLowerCase()
                .includes(expected.toLowerCase());

            const hasRole = member.roles.cache.has(role.id);

// Ajouter le rôle
            if (hasSupport && !hasRole) {
                await member.roles.add(role, "Lien soutien présent dans le statut");

console.log(`[SOUTIEN] Rôle ajouté à ${member.user.tag}`);
}

// Retirer le rôle
            if (!hasSupport && hasRole) {
                await member.roles.remove(role, "Lien soutien retiré du statut");

console.log(`[SOUTIEN] Rôle retiré à ${member.user.tag}`);
}

} catch (error) {
console.error("[SOUTIEN] Erreur :", error);
}
});

console.log("✅ Système de soutien chargé !");
}

module.exports = { attachSoutien };
