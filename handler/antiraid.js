
const fs = require("fs");
const path = require("path");

const configPath = path.join(
    __dirname,
    "../data/antiraid-config.json"
);

function readAll() {
    try {
        return JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch {
        return {};
    }
}

function writeAll(data) {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
}

const defaultConfig = {
    antispam: true,
    antieveryone: true,
    antilink: false,
    antirole: false,
    roleMembresId: null,
    spamLimit: 5,
    spamWindow: 5000,
    allowedLinks: [],
    bypass: []
};

function getConfig(guildId) {
    const all = readAll();

    return {
        ...defaultConfig,
        ...(all[guildId] || {})
    };
}

function updateConfig(guildId, changes) {
    const all = readAll();

    all[guildId] = {
        ...defaultConfig,
        ...(all[guildId] || {}),
        ...changes
    };

    writeAll(all);
    return all[guildId];
}

function contientInvitationDiscord(content) {
    return /(?:https?:\/\/)?(?:www\.)?(?:discord\.gg\/[a-z0-9-]+|discord(?:app)?\.com\/invite\/[a-z0-9-]+)/i.test(content);
}

const messages = new Map();

function attachAntiRaid(client) {
    client.on("messageCreate", async message => {
        if (!message.guild || message.author.bot) return;

        const config = getConfig(message.guild.id);

        if (
            message.member?.permissions.has("Administrator") ||
            config.bypass.includes(message.author.id)
        ) {
            return;
        }

        // Blocage de @everyone et @here
        if (
            config.antieveryone &&
            /@(everyone|here)\b/i.test(message.content)
        ) {
            await message.delete().catch(() => {});
            return;
        }

        // Invitations Discord : blocage et retrait des rôles configurables
        if (
            config.antilink &&
            contientInvitationDiscord(message.content)
        ) {
            await message.delete().catch(() => {});

            if (config.antirole && config.roleMembresId) {
                const membre = await message.guild.members
                    .fetch(message.author.id)
                    .catch(() => null);

                const roleMembres = message.guild.roles.cache.get(
                    config.roleMembresId
                );

                if (membre && roleMembres) {
                    const rolesASupprimer = membre.roles.cache.filter(role =>
                        role.id !== message.guild.id &&
                        role.id !== roleMembres.id &&
                        role.editable
                    );

                    await membre.roles.remove(
                        rolesASupprimer,
                        "Envoi d'une invitation Discord interdite"
                    ).catch(error => {
                        console.error(
                            "[AntiRaid] Retrait des rôles impossible :",
                            error.message
                        );
                    });
                }
            }

            await message.channel.send(
                `${message.author}, les invitations Discord sont interdites ici.`
            ).then(msg => {
                setTimeout(() => msg.delete().catch(() => {}), 5000);
            }).catch(() => {});

            return;
        }

        // Blocage des autres liens non autorisés
        if (config.antilink) {
            const match = message.content.match(
                /(?:https?:\/\/|www\.)\S+/i
            );

            if (match) {
                let allowed = false;

                try {
                    const url = new URL(
                        match[0].startsWith("www.")
                            ? `https://${match[0]}`
                            : match[0]
                    );

                    allowed = config.allowedLinks.some(domain =>
                        url.hostname === domain ||
                        url.hostname.endsWith(`.${domain}`)
                    );
                } catch {}

                if (!allowed) {
                    await message.delete().catch(() => {});
                    return;
                }
            }
        }

        // Anti-spam
        if (config.antispam) {
            const key = `${message.guild.id}:${message.author.id}`;
            const now = Date.now();

            const recent = (messages.get(key) || [])
                .filter(time => now - time < config.spamWindow);

            recent.push(now);
            messages.set(key, recent);

            if (recent.length >= config.spamLimit) {
                await message.delete().catch(() => {});

                await message.member?.timeout(
                    60_000,
                    "Anti-spam automatique"
                ).catch(error => {
                    console.error("[AntiSpam]", error.message);
                });

                messages.set(key, []);
            }
        }
    });

    console.log("[Anti-Raid] Moteur chargé.");
}

module.exports = {
    attachAntiRaid,
    getConfig,
    updateConfig
};
