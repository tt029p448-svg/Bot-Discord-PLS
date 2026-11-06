
require("dotenv").config();

const { REST, Routes } = require("discord.js");
const { commands } = require("./handler/interactions");

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !clientId || !guildId) {
    console.error("❌ DISCORD_TOKEN, DISCORD_CLIENT_ID ou DISCORD_GUILD_ID manquant dans .env");
    process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
    try {
        const body = commands.map(command => command.toJSON());

        console.log(`Déploiement de ${body.length} commandes sur le serveur ${guildId}...`);

        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body }
        );

        console.log("✅ Commandes slash enregistrées sur le serveur !");
        console.log("🔎 Vérifie maintenant /setupticket dans Discord.");
    } catch (error) {
        console.error("❌ Erreur de déploiement :", error);
    }
})();
