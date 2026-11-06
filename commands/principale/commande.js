
const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "commande",
    description: "Affiche toutes les commandes du bot.",

    async execute(message, args, client) {

        if (args[0]?.toLowerCase() !== "all") {
            return message.reply("❌ Utilisation : `+commande all`");
        }

        if (!client.commands || client.commands.size === 0) {
            return message.reply("❌ Aucune commande trouvée.");
        }

        const categories = {};

        client.commands.forEach((command) => {
            const categorie = command.category || "Autres";

            if (!categories[categorie]) {
                categories[categorie] = [];
            }

            categories[categorie].push(
                `\`+${command.name}\` — ${command.description || "Aucune description"}`
            );
        });

        const embed = new EmbedBuilder()
            .setColor("#ADD8E6")
            .setTitle("📚 Toutes les commandes Palais2Fivem")
            .setDescription(
                `Voici les **${client.commands.size} commandes** disponibles sur le bot.`
            )
            .setFooter({
                text: "Palais2Fivem • Liste des commandes"
            })
            .setTimestamp();

        for (const [categorie, commandes] of Object.entries(categories)) {
            const texte = commandes.join("\n");

            if (texte.length <= 1024) {
                embed.addFields({
                    name: `📁 ${categorie}`,
                    value: texte
                });
            } else {
                // Découpe les grandes catégories
                let bloc = "";

                for (const ligne of commandes) {
                    if ((bloc + "\n" + ligne).length > 1024) {
                        embed.addFields({
                            name: `📁 ${categorie}`,
                            value: bloc
                        });

                        bloc = "";
                    }

                    bloc += (bloc ? "\n" : "") + ligne;
                }

                if (bloc) {
                    embed.addFields({
                        name: `📁 ${categorie}`,
                        value: bloc
                    });
                }
            }
        }

        await message.reply({ embeds: [embed] });
    }
};
