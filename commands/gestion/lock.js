
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
    name: 'lock',
    description: 'Verrouille le salon actuel.',

    async execute(message, args) {
        if (!message.guild) return;

        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return message.reply('❌ Tu n’as pas la permission de verrouiller ce salon.');
        }

        const channel = message.channel;

        try {
            await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                SendMessages: false
            });

            await message.reply('🔒 Ce salon est maintenant verrouillé.');

            const logs = message.guild.channels.cache.get(config.logChannelId);

            if (logs?.isTextBased()) {
                const embed = new EmbedBuilder()
                    .setColor(config.color)
                    .setTitle('🔒 Salon verrouillé')
                    .setDescription(`**Salon :** ${channel}\n**Modérateur :** ${message.author}`)
                    .setTimestamp();

                await logs.send({ embeds: [embed] }).catch(console.error);
            }

        } catch (error) {
            console.error(error);
            message.reply('❌ Impossible de verrouiller ce salon.');
        }
    }
};
