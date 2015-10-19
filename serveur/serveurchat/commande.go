/***** Partie commande.go : liste des commandes et traitement en fonction *****/

package serveurchat

import (
	"./../db" // importation du package db contenant la structure Message notamment
	"fmt"
	"runtime"
	"strings"
	"time"
)

/*** Fonction qui permet d'obtenir le résultat de la commande "/info" ***/
func getInformations() string {
	var resultat string
	fmt.Print("Le serveur tourne sous ")
	switch os := runtime.GOOS; os {
	case "darwin":
		resultat = "OS X"
	case "linux":
		resultat = "Linux"
	default:
		resultat = os
	}
	resultat += " avec une architecture " + runtime.GOARCH + " et la version de Go : " + runtime.Version() + "."
	return resultat
}

/*** Fonction principale qui en fonction de la commande en paramètre effectue le traitement correspondant ***/
func commande(cmd db.Message, s *Serveur) (string, error) {
	var resultat string
	var err error

	//On casse la chaine en un tableau de string
	elems := strings.Split(cmd.Contenu, " ")

	//On regarde le premier élément qui est censé être le nom de la commande et on traitre en fonction
	switch elems[0] {
	case "/time":
		t := time.Now()
		resultat = t.Format("Monday _2 January 2006 - 15:04")
	case "/list":
		resultat = "</br>Liste des commandes :"
		resultat = resultat + "</br>/time : Donne la date et l'heure courante </br>/list : Liste les commandes disponibles </br>/info : Affiche des informations sur le serveur</br>/names : Affiche la liste des personnes connectees </br>/nbclients : Affiche le nombre de clients connectes actuellement </br>/allUsers : Affiche l'historique des utilisateurs du chat </br>/msg &#39pseudo&#39 &#39contenu&#39 : Envoie un message privé &#39contenu&#39 à l'utilisateur &#39pseudo&#39"
	case "/info":
		resultat = getInformations()
	case "/nbclients":
		resultat = fmt.Sprintf("Nombre de clients connectes : %d", len(s.ClientActif))
	case "/names":
		resultat = "</br>Liste des clients connectes : </br>"
		for cl, _ := range s.ClientActif {
			resultat = resultat + cl + "</br>"
		}
	case "/join":
		if cmd.Type == "salon" { //Si l'on veut rejoindre un salon

			//On vérifie l'existance du salon
			var salonExistant bool = false

			for i := 0; i < len(s.Salons); i++ {
				if elems[1] == s.Salons[i] {
					salonExistant = true
					break
				}
			}

			// On stocke le nom du salon ou etait connecte le client
			nomSalon := cmd.Salon

			// On change le salon auquel l'utilisateur appartient
			s.ClientActif[cmd.Createur].Salon = elems[1]

			// On verifie si le salon ou etait le client n'est pas vide
			if nomSalon != "general" {
				s.verificationSalonUtilise(nomSalon, cmd)
			}

			//Si le salon existe alors on envoie l'historique des messages du salon, sinon on ajoute le nouveau salon et on envoie la nouvelle liste de salons à l'ensemble des utilisateurs
			if salonExistant {
				err = s.envoiHistoriqueMessagesSalon(cmd, elems[1])

			} else {
				s.Salons = append(s.Salons, elems[1])
				err = s.envoiListeSalons(cmd)
			}
		}
	case "/allUsers":
		allUsersEver := s.getHistoriqueUtilisateurs()
		contentAllUsersEverSplitted := strings.Split(allUsersEver, " ")
		for i := 0; i < len(contentAllUsersEverSplitted); i++ {
			resultat += contentAllUsersEverSplitted[i] + ", "
		}

	default:
		resultat = "Commande incorrecte. Taper /list pour voir les commandes disponibles."

	}
	return resultat, err
}
