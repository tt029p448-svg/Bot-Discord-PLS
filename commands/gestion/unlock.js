
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
    name: 'unlock',
    description: 'Déverrouille le salon actuel.',

    async execute(message, args) {
        if (!message.guild) return;

        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return message.reply('❌ Tu n’as pas la permission de déverrouiller ce salon.');
        }

        const channel = message.channel;

        try {
            await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                SendMessages: null
            });

            await message.reply('🔓 Ce salon est maintenant déverrouillé.');

            const logs = message.guild.channels.cache.get(config.logChannelId);

            if (logs?.isTextBased()) {
                const embed = new EmbedBuilder()
                    .setColor(config.color)
                    .setTitle('🔓 Salon déverrouillé')
                    .setDescription(`**Salon :** ${channel}\n**Modérateur :** ${message.author}`)
                    .setTimestamp();

                await logs.send({ embeds: [embed] }).catch(console.error);
            }

        } catch (error) {
            console.error(error);
            message.reply('❌ Impossible de déverrouiller ce salon.');
        }
    }
};
