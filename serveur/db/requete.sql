-- Création de la table message

CREATE TABLE `message` (
	`idMessage` INTEGER PRIMARY KEY AUTOINCREMENT,
	`contenuMessage` TEXT,
	`dateHeureMessage` TEXT, -- AU FORMAT : "YYYY-MM-DD HH:MM:SS.SSS"
	`nomSalonMessage` VARCHAR(64),
	`createurMessage` VARCHAR(64),
	`mailGravatarMessage` VARCHAR(64)
);

	
