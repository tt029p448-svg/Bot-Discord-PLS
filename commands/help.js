
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const { prefix, color } = require("../config.json");

const categories = [
    "Utilitaire",
    "Modération",
    "AntiRaid",
    "Gestion",
    "Tickets",
    "Giveaway",
    "Owner",
    "Autres"
];

function getCategory(command) {
    const name = (
        command.name ||
        command.data?.name ||
        ""
    ).toLowerCase();

    // Toutes les commandes Anti-Raid
    const antiRaidCommands = [
        "antispam",
        "antieveryone",
        "antilink",
        "bypass",
        "blrank",
        "antiadmin",
        "antiban",
        "antibot",
        "antichannel",
        "antirole",
        "antiaddbot",
        "antiraid",
        "antiwebhook",
        "antimassban",
        "security",
        "securitylogs"
    ];

    if (antiRaidCommands.includes(name)) {
        return "AntiRaid";
    }

    // Catégories définies directement dans les commandes
    if (
        command.category &&
        categories.includes(command.category)
    ) {
        return command.category;
    }

    const categoryByName = {
        // Utilitaire
        ping: "Utilitaire",
        help: "Utilitaire",
        avatar: "Utilitaire",
        userinfo: "Utilitaire",
        serverinfo: "Utilitaire",
        uptime: "Utilitaire",

        // Modération
        clear: "Modération",
        ban: "Modération",
        kick: "Modération",
        unban: "Modération",
        mute: "Modération",
        unmute: "Modération",
        warn: "Modération",
        unrank: "Modération",
        timeout: "Modération",
        purge: "Modération",

        // Gestion
        addrole: "Gestion",
        delrole: "Gestion",
        removerole: "Gestion",
        autorole: "Gestion",
        annonce: "Gestion",
        lock: "Gestion",
        lockall: "Gestion",
        unlock: "Gestion",
        unlockall: "Gestion",
        slowmode: "Gestion",
        renew: "Gestion",
        message: "Gestion",
        reglement: "Gestion",
        hierarchie: "Gestion",
        giveaway: "Giveaway",

        // Tickets
        ticket: "Tickets",
        tickets: "Tickets",

        // Owner
        wl: "Owner",
        wllist: "Owner",
        reload: "Owner",
        color: "Owner",
        setprefix: "Owner"
    };

    return categoryByName[name] || "Autres";
}

function buildPage(client, category) {
    const commands = [...client.commands.values()]
        .filter(command => getCategory(command) === category)
        .sort((a, b) => {
            const nameA = a.name || a.data?.name || "";
            const nameB = b.name || b.data?.name || "";
            return nameA.localeCompare(nameB);
        });

    const description = commands.length
        ? commands.map(command => {
            const name = command.name || command.data?.name;
            const desc =
                command.description ||
                command.data?.description ||
                "Aucune description";

            return `**\`${prefix}${name}\`** — ${desc}`;
        }).join("\n")
        : "Aucune commande chargée dans cette catégorie pour le moment.";

    return new EmbedBuilder()
        .setColor(color || "#ADD8E6")
        .setTitle(`🛡️ Palais2Fivem — ${category}`)
        .setDescription(description.slice(0, 4000))
        .addFields({
            name: "📚 Total des commandes chargées",
            value: `${commands.length}`,
            inline: true
        })
        .setFooter({
            text: "Palais2Fivem • Centre d'aide"
        })
        .setTimestamp();
}

function buildRows(category) {
    const row1 = new ActionRowBuilder();
    const row2 = new ActionRowBuilder();

    categories.forEach((cat, index) => {
        const button = new ButtonBuilder()
            .setCustomId(`BPalais2Fivem_help_cat_${cat}`)
            .setLabel(cat)
            .setStyle(
                category === cat
                    ? ButtonStyle.Primary
                    : ButtonStyle.Secondary
            );

        if (index < 4) {
            row1.addComponents(button);
        } else {
            row2.addComponents(button);
        }
    });

    return [row1, row2];
}

module.exports = {
    name: "help",
    description: "Affiche le menu d'aide de Palais2Fivem.",
    category: "Utilitaire",

    async execute(message, args, client) {
        const category = "Utilitaire";

        await message.reply({
            embeds: [buildPage(client, category)],
            components: buildRows(category)
        });
    },

    buildPage,
    buildRows,
    getCategory
};
