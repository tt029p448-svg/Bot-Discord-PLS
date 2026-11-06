
const { PermissionFlagsBits } = require("discord.js");

module.exports = {
    name: "clear",
    description: "Supprime un grand nombre de messages.",
    category: "Modération",

    async execute(message, args) {
        if (!message.guild) return;

        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.reply("❌ Tu dois avoir la permission Gérer les messages.");
        }

        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.reply("❌ Je dois avoir la permission Gérer les messages.");
        }

        const amount = Number.parseInt(args[0], 10);

        if (!Number.isSafeInteger(amount) || amount < 1) {
            return message.reply("❌ Utilisation : `+clear 500`");
        }

        try {
            // Retirer la commande du salon
            await message.delete().catch(() => {});

            let remaining = amount;
            let totalDeleted = 0;

            while (remaining > 0) {
                const batchSize = Math.min(100, remaining);

                const messages = await message.channel.messages.fetch({
                    limit: batchSize
                });

                if (messages.size === 0) break;

                // Ignorer les messages de plus de 14 jours
                const deleted = await message.channel.bulkDelete(messages, true);

                totalDeleted += deleted.size;
                remaining -= messages.size;

                if (messages.size < batchSize || deleted.size === 0) break;
            }

            const confirmation = await message.channel.send(
                `🧹 ${totalDeleted} message(s) supprimé(s).`
            );

            setTimeout(() => confirmation.delete().catch(() => {}), 4000);
        } catch (error) {
            console.error("[Palais2Fivem clear]", error);

            message.channel.send(
                "❌ Erreur : vérifie les permissions du bot."
            ).catch(() => {});
        }
    }
};
