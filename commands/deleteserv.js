
const {
    PermissionsBitField,
    ChannelType
} = require("discord.js");

module.exports = {
    name: "deleteserv",
    description: "Supprimer les salons du serveur après confirmation",

    async execute(message) {
        if (!message.guild) return;

        // Seul le propriétaire du serveur peut lancer cette commande
        if (message.author.id !== message.guild.ownerId) {
            return message.reply(
                "❌ Seul le propriétaire du serveur peut utiliser cette commande."
            );
        }

        const botMember = message.guild.members.me;

        if (!botMember?.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply(
                "❌ J'ai besoin de la permission Administrateur."
            );
        }

        const confirmation = await message.reply(
            "⚠️ **ATTENTION : cette action supprimera tous les salons du serveur.**\n" +
            "Pour confirmer, écris `CONFIRMER-SUPPRESSION` dans les 30 secondes."
        );

        const filter = response =>
            response.author.id === message.author.id &&
            response.content === "CONFIRMER-SUPPRESSION";

        try {
            const collected = await message.channel.awaitMessages({
                filter,
                max: 1,
                time: 30000,
                errors: ["time"]
            });

            if (!collected.size) return;

            await confirmation.edit("⏳ Suppression des salons en cours...");

            const channels = await message.guild.channels.fetch();

            // Supprimer d'abord les salons non-catégories
            const orderedChannels = [...channels.values()]
                .filter(Boolean)
                .sort((a, b) =>
                    Number(a.type === ChannelType.GuildCategory) -
                    Number(b.type === ChannelType.GuildCategory)
                );

            let deleted = 0;

            for (const channel of orderedChannels) {
                try {
                    await channel.delete("Suppression demandée par le propriétaire");
                    deleted++;
                } catch (error) {
                    console.error(
                        `[DeleteServ] Impossible de supprimer ${channel.name}:`,
                        error.message
                    );
                }
            }

            await confirmation.edit(
                `✅ Opération terminée. Salons supprimés : **${deleted}**.\n` +
                "Les rôles et le serveur lui-même n'ont pas été supprimés."
            );
        } catch {
            await confirmation.edit(
                "⌛ Confirmation expirée. Aucun salon n'a été supprimé."
            );
        }
    }
};
