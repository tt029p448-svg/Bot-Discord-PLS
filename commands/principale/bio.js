
const { ownerId } = require("../../config.json");

module.exports = {
    name: "bio",
    description: "Informations pour modifier la description du bot.",

    async execute(message, args, client) {
        if (message.author.id !== ownerId) return;

        const texte = args.join(" ").trim();

        if (!texte) {
            return message.reply("❌ Utilisation : `+bio <texte>`");
        }

        await message.reply(
            "📝 Description souhaitée :\n" +
            texte +
            "\n\nPour modifier la description de l'application, ouvre : https://discord.com/developers/applications"
        );
    }
};
