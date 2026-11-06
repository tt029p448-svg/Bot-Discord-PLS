
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "guild-config.json");

function readAll() {
    try {
        if (!fs.existsSync(file)) {
            fs.writeFileSync(file, "{}", "utf8");
        }

        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (error) {
        console.error("[Config] Erreur de lecture :", error);
        return {};
    }
}

function get(guildId) {
    return readAll()[guildId] || {};
}

function set(guildId, values) {
    const all = readAll();

    all[guildId] = {
        ...all[guildId],
        ...values
    };

    fs.writeFileSync(file, JSON.stringify(all, null, 2), "utf8");
}

module.exports = { get, set };
