/***** Partie messageDB.go : structure du message et gestion de la base de données *****/

package db

import (
	"database/sql"
	"fmt"
	_ "github.com/mattn/go-sqlite3" // Importation de librairie permettant d'utiliser SQlite, To install : go get github.com/mattn/go-sqlite3
)

/*** Constantes pour l'utilisation de la base de données ***/
const cheminFichierDB = "./db/chat.db" 
const typeSql = "sqlite3"

/*** Structure du type Message ***/
type Message struct {
	Contenu  string `json:"contenu"` //Le contenu du message
	Date     string `json:"date"` //La date du message
	Salon    string `json:"salon"` //Le salon auquel est destiné le message
	Createur string `json:"createur"` //L'expéditeur du message
	Mail     string `json:"mail"` //Le mail de l'expéditeur
	Type     string `json:"type"` //Le type du message permettant la gestion de l'interface graphique coté client (cf client.js)
}

/*** "Constructeur" du type Message ***/
func New(contenu string, date string, salon string, createur string, mail string, typeMessage string) *Message {
	return &Message{contenu, date, salon, createur, mail, typeMessage}
}

/*** Fonction d'affichage ***/
func (m *Message) Print() {
	fmt.Println("Contenu : " + m.Contenu + "\nDate : " + m.Date + "\nSalon : " + m.Salon + "\nCreateur : " + m.Createur + "\nMail : " + m.Mail + "\nType : " + m.Type + "\n")
}

/*** Fonction ToString pour retourné l'objet sous forme de chaines de caractères ***/
func (m *Message) ToString() string {
	return "{" + m.Contenu + "," + m.Date + "," + m.Salon + "," + m.Createur + "," + m.Mail + "," + m.Type + "}"
}

/*** Fonction permettant l'ajout du message en base de données ***/
func (m *Message) AddMessage() (int, error) {

	db, err := sql.Open(typeSql, cheminFichierDB) //Ouverture du fichier .db

	defer db.Close() //N'oublions pas la fermeture !

	if err != nil {
		return 0, err
	}

	//Préparation de la requête
	stmt, err := db.Prepare("INSERT INTO message(contenuMessage,dateHeureMessage,nomSalonMessage,createurMessage,mailGravatarMessage) VALUES (?,?,?,?,?)")

	if err != nil {
		return 0, err
	}

	//Exécution de la requête avec la liste des données du message
	res, err := stmt.Exec(m.Contenu, m.Date, m.Salon, m.Createur, m.Mail)

	if err != nil {
		return 0, err
	}

	//On récupère le nombre de tuples affectés
	nb, err := res.RowsAffected()

	if err != nil {
		return 0, err
	}

	//on retourne ce nombre
	return int(nb), nil 
}

/*** Fonction permettant la suppression des messages en fonction du salon en base de données ***/
func DeleteMessageBySalon(salon string) (int, error) {

	db, err := sql.Open(typeSql, cheminFichierDB)

	defer db.Close()

	if err != nil {
		return 0, err
	}

	stmt, err := db.Prepare("DELETE FROM message WHERE nomSalonMessage = ?")

	if err != nil {
		return 0, err
	}

	res, err := stmt.Exec(salon)

	if err != nil {
		return 0, err
	}

	nb, err := res.RowsAffected()

	if err != nil {
		return 0, err
	}

	return int(nb), nil
}

/*** Fonction permettant de supprimer tous les messages stockes dans la base de donnees***/
func DeleteAllMessages() (int, error) {
	db, err := sql.Open(typeSql, cheminFichierDB)

	defer db.Close()

	if err != nil {
		return 0, err
	}

	stmt, err := db.Prepare("DELETE FROM message")

	if err != nil {
		return 0, err
	}

	res, err := stmt.Exec()

	if err != nil {
		return 0, err
	}

	nb, err := res.RowsAffected()

	if err != nil {
		return 0, err
	}

	return int(nb), nil	
}

/*** Fonction permettant l'obtention des messages en fonction du salon en base de données ***/
func GetMessagesBySalon(salon string) ([]*Message, error) {

	var messages []*Message

	db, err := sql.Open(typeSql, cheminFichierDB)

	defer db.Close()

	if err != nil {
		return nil, err
	}

	stmt, err := db.Prepare("SELECT * FROM message m WHERE m.nomSalonMessage = ? ORDER BY datetime(m.dateHeureMessage) ASC")

	if err != nil {
		return nil, err
	}

	//On récupère les tuples affectés
	rows, err := stmt.Query(salon)

	if err != nil {
		return nil, err
	}

	//Création des variables pour récupérer les données de chaque tuple
	var idMessage int
	var contenuMessage string
	var dateHeureMessage string
	var nomSalonMessage string
	var createurMessage string
	var mailGravatarMessage string

	//On parcourt les tuples
	for rows.Next() {

		//Pour chaque tuple, on fait correspondre les données avec les variables crées précédemment
		err = rows.Scan(&idMessage, &contenuMessage, &dateHeureMessage, &nomSalonMessage, &createurMessage, &mailGravatarMessage)

		if err != nil {
			return nil, err
		}

		//On ajoute une instance créer à partir du contenu des variables dans la liste des messages à retourner
		messages = append(messages, &Message{contenuMessage, dateHeureMessage, nomSalonMessage, createurMessage, mailGravatarMessage, ""})
	}

	return messages, nil
}

/*** Fonction permettant l'obtention d'un historique de tous les utilisateurs du chat en base de données ***/
func GetUsers() string {

	var users string
	users = ""

	db, err := sql.Open(typeSql, cheminFichierDB)

	defer db.Close()

	if err != nil {
		return ""
	}

	stmt, err := db.Prepare("SELECT DISTINCT m.createurMessage FROM message m ORDER BY m.createurMessage ASC")

	if err != nil {
		return ""
	}

	rows, err := stmt.Query()

	if err != nil {
		return ""
	}

	var createurMessage string

	for rows.Next() {

		err = rows.Scan(&createurMessage)

		if err != nil {
			return ""
		}

		users += createurMessage + " "
	}

	return users
}
