/***** Partie serveur.go : mise en place des différentes fonctionnalitées du serveur *****/

package serveurchat

/*** Liste des imports ***/
import (
	"./../db" // importation du package db contenant la structure Message notamment
	"encoding/json"
	"fmt"
	"golang.org/x/net/websocket" // importation des websockets
	"log"
	"strings"
	"sync"
	"time"
)

/*** Implémentation de l'interface error avec la structure ErrorServeur pour gérer les possibles erreurs coté serveur ***/
type ErrorServeur struct {
	What   string // Contenu de l'erreur
	Reason string // Raison de cette erreur
}

func (e *ErrorServeur) Error() string {
	return fmt.Sprintf("[ERREUR] %s : %s", e.What, e.Reason)
}

/*** Variables globales ***/
var JSON = websocket.JSON       // Utilisation du type JSON des websockets pour l'envoi de type structuré
var MESSAGE = websocket.Message // Utilisation du type MESSAGE des websockets pour l'envoi de chaines de caractères
var mutex = &sync.Mutex{}       // Protege l'acces critique aux variables partagees (attributs du serveur)

/*** Constante pour le salon général ***/
const salonGeneral = "general"

/*** Définition de la structure InfoClient qui regroupe le salon sur lequel l'utilisateur est présent ainsi que sa websocket ***/
type InfoClient struct {
	Salon  string
	Socket *websocket.Conn
}

/*** Définition de la structure Serveur qui regroupe une liste de Client connectés, la liste IPClient avec les pseudos correspondant et la liste des salons de ce serveur ***/
type Serveur struct {
	ClientActif    map[string]*InfoClient //Dictionnaire avec : Key = pseudo de l'utilisateur et Valeur = instance de la structure InfoClient associé à ce client
	ClientIpPseudo map[string]string      //Dictionnaire avec : Key = IP de l'utilisateur et Valeur = pseudo de cet utilisateur
	Salons         []string               //Collection des salons
}

/*** Fonction de création et d'intialisation du serveur ***/
func New() *Serveur {
	return &Serveur{make(map[string]*InfoClient), make(map[string]string), []string{salonGeneral}}
}

/*** Fonction gérant la connection d'un client ainsi que le traitement de ses messages ***/
func (s *Serveur) GestionServeur(ws *websocket.Conn) {
	client := ws.Request().RemoteAddr //On récupère l'adresse IP du client venant de se connecter
	log.Println("Un client ", client, " s'est connecté")
	defer func() {
		if err := ws.Close(); err != nil {
			log.Println("[ERREUR] WebSocket ne peut pas se fermer " + err.Error())
		}
	}()

	var m db.Message

	//Boucle infini pour les requêtes du client
	for {
		err := JSON.Receive(ws, &m) //Reception du message
		if err != nil {             //Gestion du cas de la deconnection du client
			mutex.Lock()
			log.Println("Websocket Disconnected waiting " + err.Error())

			// On stocke le nom du salon ou etait connecte le client
			nomSalon := s.ClientActif[s.ClientIpPseudo[client]].Salon

			delete(s.ClientActif, s.ClientIpPseudo[client]) //Le serveur supprime le client de la liste des utilisateurs connectés
			delete(s.ClientIpPseudo, client)

			// On verifie si le salon n'est pas vide
			if nomSalon != "general" {
				s.verificationSalonUtilise(nomSalon, m)
			}

			log.Println("Nombre de Client connectés = ", len(s.ClientActif))

			if len(s.ClientActif) > 0 {
				err3 := s.envoiListeUsers(m) //Le serveur envoie la mise à jour de cette liste à tous les clients
				if err3 != nil {
					log.Println(err.Error())
				}
			}
			mutex.Unlock()
			break
		} else { //Gestion du cas où il faut traiter le message
			mutex.Lock()
			log.Println("Message recu client " + client)
			s.TraitementMessage(m, ws) //Traitement du message
			mutex.Unlock()
		}
	}
}

/*** Fonction de traitement du message en fonction ***/
func (s *Serveur) TraitementMessage(m db.Message, ws *websocket.Conn) {

	//Le serveur attribue la date du message
	date := time.Now()

	m.Date = fmt.Sprintf("%s", date.Format("2006-01-02 15:04:05.000"))

	if m.Contenu == "" { //Si le message est vide (cas de la connection au chat)

		m.Createur = s.creationPseudo(m.Createur) //Verification si le pseudo n'a pas déjà était attriué et si il existe déjà, génération d'un nouveau pseudo unique

		err := s.envoiPseudo(m, ws) //Envoi d'un message contenant le pseudo à attribuer
		if err != nil {
			log.Println(err.Error())
		}

		err2 := s.envoiHistoriqueMessagesSalon(m, salonGeneral) //Le serveur envoie l'historique des messages du salon "general" au nouveau client
		if err2 != nil {
			log.Println(err.Error())
		}

		err3 := s.envoiListeUsers(m) //Le serveur envoie la liste des utilisateurs connectés au nouveau client
		if err3 != nil {
			log.Println(err.Error())
		}

		err4 := s.envoiListeSalons(m) //Le serveur envoie la liste des salons au nouveau client
		if err4 != nil {
			log.Println(err.Error())
		}

		err1 := s.envoiPreventionConnection(m) //Le serveur prévient de la connection du nouveau client aux autres clients du chat
		if err1 != nil {
			log.Println(err.Error())
		}

	} else if m.Contenu[0] == '/' { //Si le message est une commande (de type "/maCommande")

		err := s.envoiResultatCommande(m) //Le serveur envoie le résultat de cette commande
		if err != nil {
			log.Println(err.Error())
		}

	} else { //Sinon si c'est un message simple
		err := s.envoiSimpleMessage(m) //Le serveur achemine le message du client
		if err != nil {
			log.Println(err.Error())
		}
	}
}

/*** Liste des fonctions pour le traitement ***/

/*** Fonction qui permet de vérifier si le pseudo choisi par l'utilisateur au moment de la connection n'existe pas et si ce n'est pas le cas,
le serveur génère un pseudo de la forme "pseudoChoisi_NbOccurenceDuPseudoChoisi" ***/
func (s *Serveur) creationPseudo(pseudo string) string {

	var nouveauPseudo string = pseudo
	var cpt int = 0

	for {
		if s.ClientActif[nouveauPseudo] == nil {
			break
		} else {
			cpt++
			nouveauPseudo = fmt.Sprintf("%v_%d", pseudo, cpt)
		}
	}

	return nouveauPseudo
}

/*** Fonction permettant l'envoi du pseudo au client venant de se connecter au chat ***/
func (s *Serveur) envoiPseudo(m db.Message, ws *websocket.Conn) error {

	//Création du client coté serveur
	s.ClientIpPseudo[ws.Request().RemoteAddr] = m.Createur
	s.ClientActif[m.Createur] = &InfoClient{salonGeneral, ws}

	//Envoi d'une instance de db.Message contenant le pseudo attribué
	messageInitialisation := db.New(m.Createur, m.Date, salonGeneral, "serveur", "", m.Type)

	err := JSON.Send(s.ClientActif[m.Createur].Socket, messageInitialisation)

	if err != nil {
		return &ErrorServeur{"Envoi impossible premier message connection pour le client " + m.Createur, err.Error()}
	}

	return nil
}

/*** Fonction qui permet l'envoi de la liste des utilisateurs connectes sur le chat ***/
func (s *Serveur) envoiListeUsers(m db.Message) error {

	//On crée un tableau de string qui va contenir la liste des clés (pseudos) du dictionnaire s.ClientActif
	var listeUtilisateurs []string

	for pseudoClient, _ := range s.ClientActif {
		listeUtilisateurs = append(listeUtilisateurs, pseudoClient)
	}

	//On rassemble les valeurs du tableau crée dans une string, chaque pseudo est séparé par un espace
	contenuListeUtilisateurs := listeUtilisateurs[0]

	for i := 1; i < len(listeUtilisateurs); i++ {

		contenuListeUtilisateurs = contenuListeUtilisateurs + " " + listeUtilisateurs[i]
	}

	//On crée un message dont le contenu est la liste des pseudos
	messageListeUtilisateurs := db.New(contenuListeUtilisateurs, m.Date, m.Salon, "serveur", "", "listeClients")

	//Broadcast du message
	for pseudoClient, _ := range s.ClientActif {

		err := JSON.Send(s.ClientActif[pseudoClient].Socket, messageListeUtilisateurs)

		if err != nil {
			return &ErrorServeur{"Envoi impossible liste des utilisateurs pour le client " + pseudoClient, err.Error()}
		}
	}

	return nil
}

/*** Fonction qui permet l'envoi d'une notification concernant la connection d'un nouvel utilisateur ***/
func (s *Serveur) envoiPreventionConnection(m db.Message) error {

	//On crée un message dont le contenu est la notification
	messagePreventionConnection := db.New(m.Createur+" vient de se connecter au salon général", m.Date, salonGeneral, "serveur", "", "message")

	//Broadcast du message aux utilisateurs du salon générale
	for pseudoClient, _ := range s.ClientActif {

		if s.ClientActif[pseudoClient].Salon == salonGeneral {
			err := JSON.Send(s.ClientActif[pseudoClient].Socket, messagePreventionConnection)

			if err != nil {
				return &ErrorServeur{"Envoi impossible liste des messages du salon " + salonGeneral + " pour le client " + pseudoClient, err.Error()}
			}
		}
	}

	return nil
}

/*** Fonction qui permet l'envoi de l'historique des messages du salon dès que l'utilisateur s'y connecte ***/
func (s *Serveur) envoiHistoriqueMessagesSalon(m db.Message, salon string) error {

	//On récupère la liste des messages en fonction du salon en BD
	messagesSalon, err := db.GetMessagesBySalon(salon)

	if err != nil {
		return &ErrorServeur{"Requete liste des messages du salon " + salon + " pour le client " + m.Createur, err.Error()}
	}

	//On converti la structure récupérer en format JSON
	jsonMessages, err := json.Marshal(messagesSalon)

	if err != nil {
		return &ErrorServeur{"Création JSON liste des messages du salon " + salon + " pour le client " + m.Createur, err.Error()}
	}

	//Envoi d'une instance de db.Message ayant comme contenu la liste des messages du salon sous format JSON
	messageListeMessagesSalon := db.New(string(jsonMessages), m.Date, salon, "serveur", "", "historique")

	err1 := JSON.Send(s.ClientActif[m.Createur].Socket, messageListeMessagesSalon)

	if err1 != nil {
		return &ErrorServeur{"Envoi impossible liste des messages du salon " + salon + " pour le client " + m.Createur, err.Error()}
	}

	return nil
}

/*** Fonction qui permet l'envoi du résultat d'une commande demandée par l'utilisateur ***/
func (s *Serveur) envoiResultatCommande(m db.Message) error {

	//On récupère le résultat de la commande
	resCommande, err := commande(m, s)

	if err != nil {
		return err
	}

	//Si ce n'est pas une commande spéciale (de type "/cmd param1 param2 ... paramN") alors on envoie le résultat au client
	if !s.commandesSpeciales(m) {

		messageCommande := db.New(resCommande, m.Date, m.Salon, "serveur", "", m.Type)

		err := JSON.Send(s.ClientActif[m.Createur].Socket, messageCommande)

		if err != nil {
			return &ErrorServeur{"Envoi résultat de la commande " + m.Contenu + " pour le client " + m.Createur, err.Error()}
		}
	} else {
		elems := strings.Split(m.Contenu, " ")
		if elems[0] == "/msg" {
			emetteur := m.Createur
			destinataire := elems[1]

			if destinataire != m.Createur {
				destinataireTrouve := false

				//Vérification de l'existence de l'utilisateur demandé
				for pseudoClient, _ := range s.ClientActif {
					if pseudoClient == destinataire {
						destinataireTrouve = true
						break
					}
				}

				if destinataireTrouve == true {
					contenu := elems[2] + " "

					for i := 3; i < len(elems); i++ {
						contenu += elems[i] + " "
					}

					messPrive := emetteur + " " + destinataire + " " + contenu

					messageCommande := db.New(messPrive, m.Date, m.Salon, "serveur", "", "msgPrive")

					err := JSON.Send(s.ClientActif[m.Createur].Socket, messageCommande)
					err2 := JSON.Send(s.ClientActif[destinataire].Socket, messageCommande)

					if err != nil {
						return &ErrorServeur{"Envoi résultat de la commande " + m.Contenu + " pour le client " + m.Createur, err.Error()}
					}

					if err2 != nil {
						return &ErrorServeur{"Envoi résultat de la commande " + m.Contenu + " pour le client " + m.Createur, err.Error()}
					}
				} else {
					var messageErreur string
					messageErreur = m.Createur + " L'utilisateur " + destinataire + " n'est actuellement pas connecté au chat"
					messageCommande := db.New(messageErreur, m.Date, m.Salon, "serveur", "", "msgPriveInconnu")

					err := JSON.Send(s.ClientActif[m.Createur].Socket, messageCommande)

					if err != nil {
						return &ErrorServeur{"Envoi résultat de la commande " + m.Contenu + " pour le client " + m.Createur, err.Error()}
					}
				}
			} else {
				var messageErreur string
				messageErreur = m.Createur + " Vous ne pouvez pas envoyer un message à vous-même"
				messageCommande := db.New(messageErreur, m.Date, m.Salon, "serveur", "", "msgPriveInconnu")

				err := JSON.Send(s.ClientActif[m.Createur].Socket, messageCommande)

				if err != nil {
					return &ErrorServeur{"Envoi résultat de la commande " + m.Contenu + " pour le client " + m.Createur, err.Error()}
				}
			}
		}
	}

	return nil
}

/*** Fonction qui permet l'envoi simple du message d'un utilisateur à son salon ***/
func (s *Serveur) envoiSimpleMessage(m db.Message) error {

	_, err := m.AddMessage()

	if err != nil {
		return &ErrorServeur{"Requete ajout du message " + m.ToString(), err.Error()}
	}

	//Broadcast du message aux utilisateurs au salon correspondant
	for pseudoClient, _ := range s.ClientActif {

		if s.ClientActif[pseudoClient].Salon == m.Salon {
			err := JSON.Send(s.ClientActif[pseudoClient].Socket, m)

			if err != nil {
				return &ErrorServeur{"Envoi impossible liste des messages du salon " + m.Salon + " pour le client " + pseudoClient, err.Error()}
			}
		}
	}

	return nil
}

/*** Fonction qui permet l'envoi de la liste des salons ***/
func (s *Serveur) envoiListeSalons(m db.Message) error {

	//On rassemble les valeurs du tableau s.Salons dans une string, chaque salon est séparé par un espace
	contenuListeSalons := s.Salons[0]

	for i := 1; i < len(s.Salons); i++ {

		contenuListeSalons = contenuListeSalons + " " + s.Salons[i]
	}

	//On crée un message dont le contenu est la liste des salons
	messageListeSalons := db.New(contenuListeSalons, m.Date, m.Salon, "serveur", "", "listeSalons")

	//Broadcast du message à tous les utilisateurs
	for pseudoClient, _ := range s.ClientActif {

		err := JSON.Send(s.ClientActif[pseudoClient].Socket, messageListeSalons)

		if err != nil {
			return &ErrorServeur{"Envoi impossible liste des salons pour le client " + pseudoClient, err.Error()}
		}
	}

	return nil
}

/*** Fonction permettant de verifier si le salon est toujours utilise ***/
func (s *Serveur) verificationSalonUtilise(nomSalon string, m db.Message) {
	salonUtilise := false

	// On verifie si un client est dans le salon passe en parametre
	if len(s.ClientActif) > 0 {
		for pseudoClient, _ := range s.ClientActif {

			if s.ClientActif[pseudoClient].Salon == nomSalon {
				salonUtilise = true
				break
			}
		}
	}

	// Dans ce cas on supprime le salon
	if salonUtilise == false {
		s.suppressionSalon(nomSalon, m)
	}
}

/*** Fonction permettant de supprimer un salon et ses messages dans la base ***/
func (s *Serveur) suppressionSalon(nomSalon string, m db.Message) {

	// On recree la liste des salons mise a jour
	listeSalonsTemporaire := s.Salons
	s.Salons = []string{}
	for i := 0; i < len(listeSalonsTemporaire); i++ {
		if listeSalonsTemporaire[i] != nomSalon {
			s.Salons = append(s.Salons, listeSalonsTemporaire[i])
		}
	}

	// On envoie la liste des salons mise a jour
	err := s.envoiListeSalons(m)
	if err != nil {
		log.Println("[ERREUR] Impossible d'envoyer la liste des salons mise a jour " + err.Error())
	}

	// On supprime les messages du salon precedemment supprime
	_, err = db.DeleteMessageBySalon(nomSalon)

	if err != nil {
		log.Println("[ERREUR] Impossible de supprimer les messages du salon " + nomSalon + " : " + err.Error())
	}
}

/*** Fonction qui vérifie si la commande est une commande spéciale (de type "/cmd param1 param2 ... paramN") ***/
func (s *Serveur) commandesSpeciales(m db.Message) bool {

	elems := strings.Split(m.Contenu, " ")
	return (elems[0] == "/join" || elems[0] == "/msg")
}

/*** Fonction qui renvoie l'historique de la liste des utilisateurs du chat ***/
func (s *Serveur) getHistoriqueUtilisateurs() string {
	utilisateursDB := db.GetUsers()

	return utilisateursDB
}
