# Projet Serveur de chat

# Auteurs
- Depret Axel
- Malmassari Pierre
- Brisset Fabien

## Fonctionnalités

- Salles de discussions
- Sauvegarde des discussions par salle. Les discussions précédentes sont restaurées quand on se reconnecte à la salle.
- Support de commandes préfixées par / 
- Emoticons
- Sauvegarde de l'historique des conversations 
- Avatar (icône) des utilisateurs dans le fil de discussion en utilisant Gravatar
- Messages privés

## Instructions
Clone project
``` sh
$ git clone git@gitlab.info-ufr.univ-montp2.fr:HMIN302/go-BriMaDe.git
$ cd go-BriMaDe
```

Install dependencies
``` sh
$ go get github.com/mattn/go-sqlite3
$ go get golang.org/x/net/websocket
```
### Run
``` sh
$ go run serveur/main.go
```

### Options
Pour supprimer l'historique des messages stockés dans la base de données
``` sh
$ go run serveur/main.go --reinit
```

## Analyse
Le projet fonctionne sur le modèle Client-Serveur. 

Tout client peut s'identifier avec un pseudo (plus, optionnellement un avatar), choisir un salon et émettre des messages publics. Les clients ont aussi la possibilité de communiquer par messages privés. Ils peuvent aussi connaître la liste des utilisateurs et des salons et en créer de nouveaux.

Le serveur est à l'écoute des requêtes clients et fait transiter les messsages entre ces derniers. Il supporte les commandes basées sur le modèle des chats IRC et sauvegarde l'historique des messages envoyés.

Pour améliorer la lisiblité du code côté serveur, ce dernier a été divisé en deux packages, "db" et "serveurchat". Le package "db" contient la structure qui décrit un message et les opérations qui s'y rapportent en base de données. Le package "serveurchat" contient le code du serveur dans le fichier "serveur.go" et la liste des commandes disponibles aux clients dans le fichier "commande.go".

La gestion des avatars se fait grâce à l'outil Gravatar. L'utilisateur a juste à rentrer son mail WordPress lors de sa connexion.

La struct "Serveur" contient la liste des clients actifs, de leur pseudo respectif ainsi que la liste des salons en cours d'utilisation.

La struct "InfoClient" contient pour chacun des clients leur salon et webSocket.

La struct "Message" contient pour chaque message, le contenu même de celui-ci, la date de réception par le serveur, le salon auquel est destiné le message, le créateur/émetteur, le mail pour l'affichage Gravatar et le type de message (pouvant être par exemple 'message', 'pseudo', etc ...).

## Concepts utilisés
Websocket : Communication évènementielle entre le client et le serveur. Utilisation des webSockets côté client en Javascript.

Base de données relationnelle SQLite. Les messages reçus par le serveur sont conservés pour la durée de vie du salon depuis lequel ils ont été envoyés.

Utilisation de Javascript pour la manipulation, mise en page des données et l'interaction avec l'utilisateur. 

## Difficultés rencontrées
Concurrence : La réception simultanée de plusieurs messages nous a amené à une réflexion sur la manière de traiter les secteurs critiques du serveur. Ainsi il a été mis en place une exclusion mutuelle à l'aide du package 'sync' et de ses opérations mutex.

Duplication pseudo : Le chat étant basé sur le modèle IRC, il n'est pas nécessaire de créer un compte pour pouvoir se connecter. Ainsi le seul choix d'un pseudo au moment de la connexion suffit. Si un utilisateur veut se connecter avec un pseudo déjà utilisé par un autre en ligne, un suffixe est ajouté et le résultat lui est affiché dans le salon de discussion.




