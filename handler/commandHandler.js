
const fs = require("fs");
const path = require("path");

module.exports = (client) => {
    const commandsDir = path.join(process.cwd(), "commands");

    if (!fs.existsSync(commandsDir)) {
        console.error(`[ERREUR] Dossier introuvable : ${commandsDir}`);
        return;
    }

    const loadCommands = (dir, category = "") => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const filePath = path.join(dir, entry.name);

            // Explorer les sous-dossiers
            if (entry.isDirectory()) {
                loadCommands(
                    filePath,
                    category || entry.name
                );
                continue;
            }

            if (!entry.isFile() || !entry.name.endsWith(".js")) {
                continue;
            }

            try {
                // Ignorer les fichiers vides
                const content = fs.readFileSync(filePath, "utf8");

                if (!content.trim()) {
                    console.warn(`[IGNORÉ] Fichier vide : ${filePath}`);
                    continue;
                }

                // Charger la commande
                const exported = require(filePath);

                // Accepter les deux formats d'exportation courants
                const command = exported?.default ?? exported;

                // Déterminer le nom de la commande
                const commandName =
                    command?.name ??
                    command?.data?.name ??
                    command?.data?.toJSON?.()?.name;

                if (
                    !command ||
                    typeof command !== "object" ||
                    !commandName
                ) {
                    console.warn(
                        `[IGNORÉ] Export de commande invalide : ${filePath}`
                    );
                    continue;
                }

                // Ne pas remplacer silencieusement une commande existante
                if (client.commands.has(commandName)) {
                    console.warn(
                        `[DOUBLON] "${commandName}" ignorée : ${filePath}`
                    );
                    continue;
                }

                client.commands.set(commandName, command);

                // Charger aussi les alias s'ils existent
                if (Array.isArray(command.aliases)) {
                    for (const alias of command.aliases) {
                        if (
                            typeof alias === "string" &&
                            alias.trim() &&
                            !client.commands.has(alias)
                        ) {
                            client.commands.set(alias, command);
                        }
                    }
                }

                console.log(
                    `[OK] Commande chargée : ${commandName} | Catégorie : ${category || "principale"}`
                );
            } catch (error) {
                console.error(
                    `[ERREUR] Impossible de charger ${filePath} :`,
                    error.message
                );
            }
        }
    };

    loadCommands(commandsDir);
};
