const { EmbedBuilder } = require('discord.js');
const { color } = require('../../config.json');

module.exports = {
    name: 'ping',
    description: 'Renvoie la latence du bot et de l\'API Discord.',
    execute(message, args, client) {
        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle('Pong!')
            .setDescription(`**Latence du bot:**\n${Date.now() - message.createdTimestamp}ms\n\n**Latence de l\'API Discord:**\n${client.ws.ping}ms`);

        message.channel.send({ embeds: [embed] });
    },
};