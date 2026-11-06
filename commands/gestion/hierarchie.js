
const {
    EmbedBuilder,
    PermissionFlagsBits
} = require('discord.js');

const { color, prefix } = require('../../config.json');

module.exports = {
    name: 'hierarchie',
    aliases: ['hiérarchie', 'roles'],
    description: 'Affiche la hiérarchie des rôles du serveur.',
    usage: `${prefix}hiérarchie`,

    async execute(message, args) {
        if (!message.guild) return;

        try {
            const guild = message.guild;

            // Récupérer les membres du serveur
            await guild.members.fetch();

            // Trier les rôles du plus haut au plus bas
            const roles = guild.roles.cache
                .filter(role =>
                    role.id !== guild.id &&
                    !role.managed
                )
                .sort((a, b) => b.position - a.position);

            const embeds = [];

            let embed = new EmbedBuilder()
                .setColor(color || '#ADD8E6')
                .setTitle('👑 Hiérarchie de ' + guild.name)
                .setDescription('Classement des rôles du plus haut au plus bas.')
                .setTimestamp();

            let fieldsCount = 0;

            for (const role of roles.values()) {
                const members = role.members
                    .map(member => member.toString());

                let memberList = members.length
                    ? members.join(', ')
                    : '*Aucun membre*';

                // Limite Discord : 1024 caractères par champ
                if (memberList.length > 950) {
                    memberList = memberList.slice(0, 947) + '...';
                }

                // Maximum 25 champs par embed
                if (fieldsCount >= 20) {
                    embeds.push(embed);

                    embed = new EmbedBuilder()
                        .setColor(color || '#ADD8E6')
                        .setTitle('👑 Hiérarchie de ' + guild.name + ' (suite)')
                        .setTimestamp();

                    fieldsCount = 0;
                }

                embed.addFields({
                    name: `${role.name} (${members.length})`,
                    value: memberList,
                    inline: false
                });

                fieldsCount++;
            }

            embeds.push(embed);

            // Discord accepte maximum 10 embeds par message
            for (let i = 0; i < embeds.length; i += 10) {
                await message.channel.send({
                    embeds: embeds.slice(i, i + 10),
                    allowedMentions: {
                        parse: []
                    }
                });
            }

        } catch (error) {
            console.error('[HIERARCHIE] Erreur :', error);

            await message.reply(
                '❌ Impossible de récupérer la hiérarchie du serveur.'
            ).catch(() => {});
        }
    }
};
