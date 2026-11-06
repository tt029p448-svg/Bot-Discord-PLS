
const { PermissionFlagsBits } = require('discord.js');
const { prefix } = require('../../config.json');

module.exports = {
    name: 'message',
    description: 'Permet au bot d’envoyer un message personnalisé.',
    usage: `${prefix}message <texte>`,

    async execute(message, args) {
        if (!message.guild) return;

        // Commande réservée aux administrateurs
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ Tu n’as pas la permission d’utiliser cette commande.');
        }

        // Récupérer le texte
        const texte = args.join(' ').trim();

        if (!texte) {
            return message.reply(
                `❌ Utilisation : \`${prefix}message Bonjour à tous !\``
            );
        }

        if (texte.length > 2000) {
            return message.reply('❌ Ton message dépasse 2000 caractères.');
        }

        try {
            // Supprimer le message de commande
            if (message.deletable) {
                await message.delete().catch(() => {});
            }

            // Envoyer le texte avec Palais2Fivem
            await message.channel.send({
                content: texte,
                allowedMentions: {
                    parse: []
                }
            });

        } catch (error) {
            console.error('[MESSAGE] Erreur :', error);

            await message.channel.send(
                '❌ Impossible d’envoyer le message.'
            ).catch(() => {});
        }
    }
};
