
const fs = require("fs");
const path = require("path");
const { Events } = require("discord.js");

const configPath = path.join(__dirname, "../data/welcome.json");

function readConfig() {
    try {
        return JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch {
        return {};
    }
}

function saveConfig(data) {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
}

function attachWelcome(client) {
    client.on(Events.GuildMemberAdd, async member => {
        const config = readConfig();
        const channelId = config[member.guild.id];

        if (!channelId) return;

        const channel = await member.guild.channels
            .fetch(channelId)
            .catch(() => null);

        if (!channel || !channel.isTextBased()) return;

        await channel.send({
            content: `${member} vient de rejoindre le serveur, nous sommes maintenant ${member.guild.memberCount}`,
            allowedMentions: {
                users: [member.id]
            }
        }).catch(console.error);
    });
}

module.exports = {
    attachWelcome,
    readConfig,
    saveConfig
};
