
const { prefix, logChannelId, color } = require('../../config.json');
const { ChannelType, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'renew',
    description: 'Renouvelle un salon avec les mêmes paramètres.',
    usage: `${prefix}renew`,

    async execute(message, args) {
        if (!message.guild) return;

        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return message.reply('❌ Tu n’as pas la permission de gérer les salons.');
        }

        const channel = message.channel;
        const guild = message.guild;
        
// Protection des salons obligatoires du serveur communautaire
const protectedChannels = [
    guild.rulesChannelId,
    guild.publicUpdatesChannelId,
    guild.systemChannelId
].filter(Boolean);

if (protectedChannels.includes(channel.id)) {
    return message.reply(
        '❌ Impossible de renouveler ce salon : il est utilisé dans les paramètres officiels du serveur Discord.'
    );
}


        if (channel.type !== ChannelType.GuildText) {
            return message.reply('❌ Cette commande fonctionne uniquement dans un salon textuel.');
        }

        if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return message.reply('❌ Palais2Fivem n’a pas la permission de gérer les salons.');
        }

        try {
            // Sauvegarder les paramètres du salon
            const channelName = channel.name;
            const channelParent = channel.parentId;
            const channelPosition = channel.rawPosition;

            const channelPermissions = channel.permissionOverwrites.cache.map(permission => ({
                id: permission.id,
                allow: permission.allow,
                deny: permission.deny
            }));

            // Créer le nouveau salon AVANT de supprimer l'ancien
            const newChannel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: channelParent,
                topic: channel.topic ?? undefined,
                nsfw: channel.nsfw,
                rateLimitPerUser: channel.rateLimitPerUser,
                permissionOverwrites: channelPermissions,
                reason: `Renouvellement demandé par ${message.author.tag}`
            });

            // Remettre le nouveau salon à la même position
            await newChannel.setPosition(channelPosition).catch(console.error);

            // Supprimer l'ancien salon
            try {
                await channel.delete(`Renouvellement par ${message.author.tag}`);
            } catch (error) {
                await newChannel.delete('Annulation du renouvellement').catch(console.error);
                throw error;
            }

            // Confirmation dans le nouveau salon
            await newChannel.send({
                content: `✅ Salon renouvelé avec succès par ${message.author}.`
            });

            // Envoyer un log
            const logChannel = guild.channels.cache.get(logChannelId);

            if (logChannel && logChannel.isTextBased()) {
                const embed = new EmbedBuilder()
                    .setColor(color || '#ADD8E6')
                    .setTitle('🔄 Salon renouvelé')
                    .addFields(
                        { name: 'Salon', value: `${newChannel}`, inline: true },
                        { name: 'Modérateur', value: `${message.author}`, inline: true },
                        { name: 'Ancien ID', value: channel.id },
                        { name: 'Nouvel ID', value: newChannel.id }
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [embed] }).catch(console.error);
            }

        } catch (error) {
            console.error('[RENEW] Erreur :', error);

            // L'ancien salon peut avoir été supprimé entre-temps
            if (message.channel && !message.channel.deleted) {
                await message.reply('❌ Une erreur est survenue pendant le renouvellement.')
                    .catch(() => {});
            }
        }
    }
};
