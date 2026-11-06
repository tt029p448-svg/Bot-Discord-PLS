
module.exports = {
    name: "ghostping",
    description: "Envoie une notification générale temporaire.",

    async execute(message, args, client) {
        if (!message.guild) return;

        if (!message.member.permissions.has("Administrator")) {
            return message.reply("❌ Commande réservée aux administrateurs.");
        }

        const botMember = message.guild.members.me;

        if (!botMember.permissions.has("MentionEveryone")) {
            return message.reply("❌ Palais2Fivem doit avoir la permission Mentionner @everyone.");
        }

        if (!botMember.permissions.has("ManageMessages")) {
            return message.reply("❌ Palais2Fivem doit avoir la permission Gérer les messages.");
        }

        // Supprime le message de commande
        await message.delete().catch(() => {});

        // Notification générale
        const notification = await message.channel.send({
            content: "@everyone",
            allowedMentions: { parse: ["everyone"] }
        });

        // Supprime le message après une seconde
        setTimeout(async () => {
            await notification.delete().catch(console.error);
        }, 1000);
    }
};
