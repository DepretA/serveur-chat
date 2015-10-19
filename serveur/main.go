/***** Partie main.go : mise en place de l'execution du serveur *****/
package main

import (
	"./db"
	"./serveurchat"
	"flag"
	"golang.org/x/net/websocket" //importation des websockets
	"log"
	"net/http"
)

/*** Constantes ***/
const listenAddr = "127.0.0.1:8000"

/*** Flag permettant de supprimer tous les messages stockes dans la base de donnees ***/
var boolFlagReinit = flag.Bool("reinit", false, "Supprime tous les messages stockes dans la BDD")

/*** Instance du serveur en variable globales ***/
var s = serveurchat.New()

/*** Fonction qui va permettre la liaison entre le serveur et les clients ***/
func RootHandler(w http.ResponseWriter, req *http.Request) {

	s := websocket.Server{Handler: websocket.Handler(SockServer)}
	s.ServeHTTP(w, req)
}

/*** Fonction qui va se charger d'executer la fonction coté serveur qui s'occuppe des traitements du client ***/
func SockServer(ws *websocket.Conn) {

	s.GestionServeur(ws)
}

/*** Fonction main qui execute le serveur et établit l'écoute des connections des clients***/
func main() {

	flag.Parse()
	if *boolFlagReinit {
		_, err := db.DeleteAllMessages()
		if err != nil {
			log.Println("[ERREUR] Impossible de supprimer l'historique des messages !" + err.Error())
		} else {
			log.Println("L'historique des messages a bien été supprimé")
		}
	}

	http.Handle("/", http.FileServer(http.Dir("../client/")))
	http.HandleFunc("/sock", RootHandler)
	log.Println("Serveur en écoute sur l'adresse", listenAddr)
	err := http.ListenAndServe(listenAddr, nil)
	if err != nil {
		panic("ListenAndServe: " + err.Error())
	}

}
