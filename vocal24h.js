
const {
    joinVoiceChannel,
    getVoiceConnection,
    VoiceConnectionStatus,
    entersState
} = require("@discordjs/voice");

// Remplace par l'ID de ton salon vocal
const VOCAL_ID = "1561438298788991056";

module.exports = function lancerVocal24h(client) {
    let reconnexionEnCours = false;

    async function connecter() {
        if (reconnexionEnCours) return;
        reconnexionEnCours = true;

        try {
            const salon = await client.channels.fetch(VOCAL_ID);

            if (!salon || !salon.isVoiceBased() || !salon.guild) {
                console.log("❌ Salon vocal introuvable.");
                return;
            }

            const ancienneConnexion = getVoiceConnection(salon.guild.id);

            if (ancienneConnexion) {
                ancienneConnexion.destroy();
            }

            const connexion = joinVoiceChannel({
                channelId: salon.id,
                guildId: salon.guild.id,
                adapterCreator: salon.guild.voiceAdapterCreator,
                selfDeaf: true,
                selfMute: true
            });

            connexion.on(VoiceConnectionStatus.Ready, () => {
                console.log("🎤 Palais2Fivem est connecté au vocal !");
            });

            connexion.on(VoiceConnectionStatus.Disconnected, async () => {
                try {
                    await Promise.race([
                        entersState(
                            connexion,
                            VoiceConnectionStatus.Signalling,
                            5000
                        ),
                        entersState(
                            connexion,
                            VoiceConnectionStatus.Connecting,
                            5000
                        )
                    ]);
                } catch {
                    if (
                        connexion.state.status !==
                        VoiceConnectionStatus.Destroyed
                    ) {
                        connexion.destroy();
                    }
                }
            });

            connexion.on("error", console.error);

        } catch (erreur) {
    if (erreur.code === 50001 || erreur.code === 10003) {
        console.error("❌ Le bot n'a pas accès au salon vocal. Vérifie son ID et ses permissions.");
        return;
    }

    console.error("❌ Erreur vocal :", erreur);
} finally {
            reconnexionEnCours = false;
        }
    }

    // Vérification toutes les 30 secondes
    setInterval(async () => {
        try {
            const salon = await client.channels.fetch(VOCAL_ID);
            if (!salon?.guild) return;

            const connexion = getVoiceConnection(salon.guild.id);

            if (
                !connexion ||
                connexion.state.status === VoiceConnectionStatus.Destroyed
            ) {
                await connecter();
            }
        } catch (erreur) {
    if (erreur.code !== 50001 && erreur.code !== 10003) {
        console.error("Erreur verification vocal :", erreur);
    }
}
    }, 30000);

    connecter();
};
