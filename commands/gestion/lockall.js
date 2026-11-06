
const {
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder
} = require('discord.js');

const config = require('../../config.json');

module.exports = {
    name: 'lockall',
    description: 'Verrouille tous les salons textuels.',

    async execute(message, args) {
        if (!message.guild) return;

        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ Cette commande est réservée aux administrateurs.');
        }

        const guild = message.guild;

        if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return message.reply('❌ Palais2Fivem doit avoir la permission Gérer les rôles.');
        }

        await guild.channels.fetch();

        let success = 0;
        let failed = 0;

        const channels = guild.channels.cache.filter(channel =>
            channel.type === ChannelType.GuildText &&
            channel.id !== config.logChannelId
        );

        for (const channel of channels.values()) {
            try {
                await channel.permissionOverwrites.edit(guild.roles.everyone, {
                    SendMessages: false
                });

                success++;
            } catch (error) {
                failed++;
                console.error(`[LOCKALL] ${channel.name}:`, error.message);
            }
        }

        await message.reply(
            `🔒 Verrouillage terminé.\n✅ ${success} salon(s) verrouillé(s).\n❌ ${failed} échec(s).`
        ).catch(() => {});

        const logs = guild.channels.cache.get(config.logChannelId);

        if (logs?.isTextBased()) {
            const embed = new EmbedBuilder()
                .setColor(config.color)
                .setTitle('🔒 LOCKALL exécuté')
                .setDescription(
                    `**Administrateur :** ${message.author}\n**Salons verrouillés :** ${success}\n**Échecs :** ${failed}`
                )
                .setTimestamp();

            await logs.send({ embeds: [embed] }).catch(console.error);
        }
    }
};
