const { EmbedBuilder } = require('discord.js');
const { prefix, color } = require('../../config.json');

module.exports = {
 name: "slowmode",
 description: "Active le slowmode dans le salon où la commande est exécutée.",
 execute(message, args) {
  // Vérifier les permissions de l'utilisateur
  if (!message.member.permissions.has('MANAGE_CHANNELS')) {
    return message.reply("Vous n'avez pas la permission de définir le slowmode.");
  }

    const slowmodeDelay = parseInt(args[0]);

  message.channel.setRateLimitPerUser(slowmodeDelay)
    .then(() => {
      // Créer un embed pour afficher le résultat
      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle('Slowmode Activé!')
        .setDescription(`Slowmode activé à ${slowmodeDelay} secondes dans ce salon.`);

      // Envoyer l'embed dans le canal de texte
      message.channel.send({ embeds: [embed] });
    })
    .catch(error => {
      console.error('Erreur lors de la définition du slowmode :', error);
      message.reply("Une erreur s'est produite lors de la définition du slowmode.");
    });
 }
}