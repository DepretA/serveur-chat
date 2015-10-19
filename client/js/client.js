// Variables globales utiles pour la session de chat

var pseudo = ""; // Stocke le pseudo client attribue par le serveur
var socket; // Stocke la webSocket 
var mailGravatar = ""; // Stocke le mail Gravatar client
var salonCourant = ""; // Stocke le nom du salon courant client

// ---------------------------------------------------------------------- FONCTIONS RELATIVES AUX CONNEXIONS CLIENT SERVEUR ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Connexion au serveur et envoi du pseudo desire
function connexionServeur()
{		
	// Teste si le navigateur du client supporte les webSockets
	if (("WebSocket" in window) && pseudo == "")
	{
		// CONNEXION AU SERVEUR
		socket = new WebSocket("ws://127.0.0.1:8000/sock");

		// Si la connexion retourne une erreur, une alert est affichee avec possibilite de recharger la page
		socket.onerror = function(error) 
		{
			var reponse = confirm("ECHEC : Une erreur s'est produite sur la webSocket (Etat = " + socket.readyState + "). Voulez-vous recharger la page ?");
			if (reponse == true) 
			{
				// Force le reload sans se baser sur le cache
			    location.reload(true);
			} 
		};

		// Gere l'evenement d'ouverture de connexion
		socket.onopen = function() 
		{
	    	console.log("Connexion reussie au serveur.")	
	    	document.getElementById("choixPseudo").style.display = "none";
			document.getElementById("tableau3Cols").style.display = "";
			document.getElementById('champMessage').focus();
			
			// Creation du message a envoyer
			var messagePseudo = {
				contenu: "",
				date: "1992-02-10 10:20:00.000",
				salon: "",
				createur : document.getElementById("champsPseudo").value.toString().toLowerCase(),
				mail: mailGravatar,
				type: "pseudo"
			};
			
			// Envoi du message precedent pour faire une demande de pseudo en parsant le message en string
			socket.send(JSON.stringify(messagePseudo));

			// Stockage du salon courant dans la variable globale
			salonCourant = "general"
			document.getElementById("NomSalonTop").innerHTML = "SALON ACTUEL : " + salonCourant +"<div id = 'ZoneMessages'></div>";
			document.getElementById("ZoneMessages").innerHTML = "Connexion réussie, en attente d'une réponse du serveur ...</br>";
  		};

  		// Gere l'evenement de reception de message
  		socket.onmessage = function (event) 
  		{
  			// Parse la chaine de caractere recue en JSON
			var messageRecu = JSON.parse(event.data);
			affichageMessages(messageRecu);
		}
			
	}
	else
	{
		alert("WebSocket n'est pas compatible avec votre navigateur.");
	}
}

// Gere l'envoi de message par l'utilisateur
function envoiMessage()
{
	if(pseudo != "")
	{
		var valeurMessage = document.getElementById("champMessage").value.toString();

		if (valeurMessage != "")
		{
			document.getElementById("send").disabled='';

			// Creation du message a envoyer
			var messageAEnvoyer = {
			contenu: valeurMessage,
			date: "1992-02-10 10:20:00.000",
			salon: salonCourant,
			createur: pseudo,
			mail: mailGravatar,
			type: "message"
			};

			// Parse du message en  string
			socket.send(JSON.stringify(messageAEnvoyer));
			document.getElementById("champMessage").value = "";
		}
		else
		{
			document.getElementById("send").disabled='disabled';
		}
	}

}

// Gere la fermeture de la connexion
function fermetureConnexion()
{
	// Ferme proprement la connexion client
	socket.close();

	// Force le reload sans se baser sur le cache
	location.reload(true); 
}

// Gere le changement de salon en cliquant dans le panneau de gauche
function changementSalon(nomSalon)
{
			// Creation du message a envoyer
			var messageAEnvoyer = {
			contenu: "/join " + nomSalon,
			date: "1992-02-10 10:20:00.000",
			salon: salonCourant,
			createur: pseudo,
			mail: mailGravatar,
			type: "salon"
			};

			// Parse du message en string
			socket.send(JSON.stringify(messageAEnvoyer));

			// Stockage du salon courant dans la variable globale
			salonCourant = nomSalon;

			// Changement de l'affichage du salon courant, suppression des messages du salon precedent
			document.getElementById("NomSalonTop").innerHTML = "SALON ACTUEL : " + salonCourant +"<div id = 'ZoneMessages'></div>";
			document.getElementById("ZoneMessages").innerHTML = "Changement de salon effectué ...</br>";
}

// Gere la creation ou le changement de salon par le client A FAIRE
function creationChangementSalon()
{
	if(pseudo != "")
	{
		var valeurNomSalon = document.getElementById("inputNomSalon").value.toString().toLowerCase();

		if (valeurNomSalon != "")
		{
			document.getElementById("buttonCreateSaloon").disabled='';

			// Creation du message a envoyer
			var messageAEnvoyer = {
			contenu: "/join " + valeurNomSalon,
			date: "1992-02-10 10:20:00.000",
			salon: salonCourant,
			createur: pseudo,
			mail: mailGravatar,
			type: "salon"
			};

			// Parse du message en string
			socket.send(JSON.stringify(messageAEnvoyer));
			document.getElementById("inputNomSalon").value = "";

			// Stockage du salon courant dans la variable globale
			salonCourant = valeurNomSalon;

			// Changement de l'affichage du salon courant, suppression des messages du salon precedent
			document.getElementById("NomSalonTop").innerHTML = "SALON ACTUEL : " + salonCourant +"<div id = 'ZoneMessages'></div>";
			document.getElementById("ZoneMessages").innerHTML = "Changement de salon effectué ...</br>";
			document.getElementById("buttonCreateSaloon").disabled='disabled';
		}
		else
		{
			document.getElementById("buttonCreateSaloon").disabled='disabled';
		}
	}
}

// ---------------------------------------------------------------------- FONCTIONS RELATIVES AUX AFFICHAGES DE CONTENU --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Gere l'affichage des messages recus
function affichageMessages(messageRecu)
{
	// Decoupe de l'heure recue pour en obtenir une version condensee
	var heureComplete = messageRecu.date.split(" ");
	var heureSimple = heureComplete[1].split(".");

	// Switch selon le type de message recu 
	switch (messageRecu.type)
	{

		// Si le message est de type 'pseudo', ce qui indique l'envoi du pseudo attribue par le serveur (pour éviter d'avoir plusieurs fois le meme pseudo)
		case "pseudo" :
			if(messageRecu.createur == "serveur" && pseudo == "")
			{
				console.log("Le serveur vous a attribué le pseudo : " + messageRecu.contenu);

				// Stockage du pseudo attribue par le serveur dans la variable globale
				pseudo = messageRecu.contenu;

				document.getElementById("ZoneMessages").innerHTML +=
				"<div class='messageServeur'>" +
				"<img class='logo' src='img/server.png' alt='avatar' />" +
				"<b> Serveur, à " + heureSimple[0] + " : </b> Pseudo attribué  '<b>" + messageRecu.contenu + "</b>'</br>" +
				"</div>";
			}
			else
			{
				console.log("Message INCONNU de type pseudo reçu : " + messageRecu);
			}
			break;

		// Si le message est de type 'message', message n'ayant pas une fonction particuliere
		case "message" :
			if(messageRecu.createur == "serveur")
			{
				document.getElementById("ZoneMessages").innerHTML +=
				"<div class='messageServeur'>" +
				"<img class='logo' src='img/server.png' alt='avatar' />" +
				"<b> Serveur, à " + heureSimple[0] + " : </b> " + affichageEmoticonesChat(messageRecu.contenu) + "</br>" +
				"</div>";
			}
			else
			{
				document.getElementById("ZoneMessages").innerHTML +=
				"<div class='messageClient'>" +
				"<img class='logo' src=" + getGravatar(messageRecu.mail, 30) + " alt='avatar' />" +
				"<b> " + messageRecu.createur + ", à " + heureSimple[0] + " : </b> " + affichageEmoticonesChat(messageRecu.contenu)  + "</br>" +
				"</div>";
			}
			break;

				// Si le message est de type "msgPrive", message contenant le nom d'un utilisateur destinataire et un contenu associé
		case "msgPrive" :
			var messagePrive = messageRecu.contenu.split(" ");

			var contenuMessagePrive = "";
			for(var i = 2; i < messagePrive.length; i++) 
			{
				contenuMessagePrive += messagePrive[i] + " ";
			}

			if(messagePrive[0] == pseudo)
				{
					document.getElementById("ZoneMessages").innerHTML +=
					"<div class='messagePriveFrom' onclick='messagePrive(&#39" + messagePrive[1] + "&#39)'>" +
					"<img class='logo' src=" + getGravatar(messageRecu.mail, 30) + " alt='avatar' />" +
					"<b> De " + messagePrive[0] + " à " + messagePrive[1] + ", à " + heureSimple[0] + " : </b>" + affichageEmoticonesChat(contenuMessagePrive) + "</br></div>";
					
				}
				else
				{
					document.getElementById("ZoneMessages").innerHTML +=
					"<div class='messagePriveTo' onclick='messagePrive(&#39" + messagePrive[0] + "&#39)'>" +
					"<img class='logo' src=" + getGravatar(messageRecu.mail, 30) + " alt='avatar' />" +
					"<b> De " + messagePrive[0] + " à " + messagePrive[1] + ", à " + heureSimple[0] + " : </b>" + affichageEmoticonesChat(contenuMessagePrive) + "</br></div>";
				}
			break;
				
		// Si le message est de type "msgPriveInconnu", message contenant un message d'erreur exprimant que l'utilisateur demandé n'est pas reconnu
		case "msgPriveInconnu" :
			var messagePriveInconnu = messageRecu.contenu.split(" ");

			var contenuMessagePrive = "";
			for(var i = 1; i < messagePriveInconnu.length; i++) 
			{
				contenuMessagePrive += messagePriveInconnu[i] + " ";

			}

			if(messagePriveInconnu[0] == pseudo)
				{
					document.getElementById("ZoneMessages").innerHTML +=
					"<div class='messagePriveFromError'>" + affichageEmoticonesChat(contenuMessagePrive) + "</br></div>";
				}
			break;

		// Si le message est de type historique, message contenant tous les messages precedents du salon courant
		case "historique" :
			// Parse une nouvelle fois le champ contenu du message recu
			var listeMessages = JSON.parse(messageRecu.contenu);

			// Parcours de l'ensemble des messages pour afficher l'historique
			for(var m in listeMessages)
			{
				var heureCompleteHistorique = listeMessages[m].date.split(" ");
				var heureSimpleHistorique = heureCompleteHistorique[1].split(".");
				document.getElementById("ZoneMessages").innerHTML +=
				"<div class='messageClient'>" +
				"<img id='logo' src=" + getGravatar(listeMessages[m].mail, 30) + " alt='avatar' />" +
				"<b> " + listeMessages[m].createur + ", à " + heureSimpleHistorique[0] + " : </b> " + affichageEmoticonesChat(listeMessages[m].contenu) + "</br>" +
				"</div>";				
			}
			break;

		// Si le message est de type 'listeClients', message contenant la liste mise a jour des utilisateurs connectes
		case "listeClients" :
			var listeClients = messageRecu.contenu.split(" ");
			document.getElementById("ZoneClients").innerHTML = "";

			// Parcours de l'ensemble des utilisateurs connectes
			for(var client in listeClients)
			{
				// Mise en evidence du pseudo du client connecte
				if(listeClients[client] == pseudo)
				{
					document.getElementById("ZoneClients").innerHTML +=
					"<div class='listeClients'><b>" +
					listeClients[client] + " (vous)</b></br></div>";
				}
				else
				{
					document.getElementById("ZoneClients").innerHTML +=
					"<div class='listeClients' onclick='messagePrive(&#39" + listeClients[client] + "&#39)'>" +
					listeClients[client] + "</br></div>";
				}
			}
			break;

		// Si le message est de type 'listeSalons', message contenant la liste mise a jour des salons actuellement ouverts
		case "listeSalons" :
			var listeSalons = messageRecu.contenu.split(" ");
			document.getElementById("ZoneSalons").innerHTML = "";

			// Parcours de l'ensemble des salons actuellement ouverts
			for(var salon in listeSalons)
			{
				document.getElementById("ZoneSalons").innerHTML +=
				"<div class='listeSalons' onclick='changementSalon(&#39" + listeSalons[salon] + "&#39)'>" +
				listeSalons[salon] + "</br></div>";													
			}
			break;

		// Si un message incorrect est recu, il n'est pas affiche au client
		default :
			console.log("Message INCONNU reçu : " + messageRecu);
			break;
	}

	// Placement de la barre de scroll en bas
	element = document.getElementById("ZoneMessages");
	element.scrollTop = element.scrollHeight;
}

// Gere l'affichage des emoticones dans la fenetre de chat
function affichageEmoticonesChat(contenuAReplace)
{
	// Remplacement des expressions correspondantes aux emoticones par les images associees
	var chaine = ':anger:';
	var regexChaine = new RegExp(chaine, 'g');
	contenuAReplace = contenuAReplace.replace(regexChaine,"<img class = 'smileyMessage' src = './img/smileys/anger.PNG' style='width: 5%; height: 5%'/>");

	chaine = ':burn:';
	regexChaine = new RegExp(chaine, 'g');
	contenuAReplace = contenuAReplace.replace(regexChaine,"<img class = 'smileyMessage' src = './img/smileys/burn.PNG' style='width: 5%; height: 5%'/>");

	chaine = ':confused:';
	regexChaine = new RegExp(chaine, 'g');
	contenuAReplace = contenuAReplace.replace(regexChaine,"<img class = 'smileyMessage' src = './img/smileys/confused.PNG' style='width: 5%; height: 5%'/>");

	chaine = ':cool:';
	regexChaine = new RegExp(chaine, 'g');
	contenuAReplace = contenuAReplace.replace(regexChaine,"<img class = 'smileyMessage' src = './img/smileys/cool.PNG' style='width: 5%; height: 5%'/>");

	chaine = ':cry:';
	regexChaine = new RegExp(chaine, 'g');
	contenuAReplace = contenuAReplace.replace(regexChaine,"<img class = 'smileyMessage' src = './img/smileys/cry.PNG' style='width: 5%; height: 5%'/>");

	chaine = ':fire:';
	regexChaine = new RegExp(chaine, 'g');
	contenuAReplace = contenuAReplace.replace(regexChaine,"<img class = 'smileyMessage' src = './img/smileys/fire.PNG' style='width: 5%; height: 5%'/>");

	chaine = ':grimace:';
	regexChaine = new RegExp(chaine, 'g');
	contenuAReplace = contenuAReplace.replace(regexChaine,"<img class = 'smileyMessage' src = './img/smileys/grimace.PNG' style='width: 5%; height: 5%'/>");

	chaine = ':love:';
	regexChaine = new RegExp(chaine, 'g');
	contenuAReplace = contenuAReplace.replace(regexChaine,"<img class = 'smileyMessage' src = './img/smileys/love.PNG' style='width: 5%; height: 5%'/>");

	chaine = ':miao:';
	regexChaine = new RegExp(chaine, 'g');
	contenuAReplace = contenuAReplace.replace(regexChaine,"<img class = 'smileyMessage' src = './img/smileys/miao.PNG' style='width: 5%; height: 5%'/>");

	chaine = ':prettiness:';
	regexChaine = new RegExp(chaine, 'g');
	contenuAReplace = contenuAReplace.replace(regexChaine,"<img class = 'smileyMessage' src = './img/smileys/prettiness.PNG' style='width: 5%; height: 5%'/>");

	chaine = ':question:';
	regexChaine = new RegExp(chaine, 'g');
	contenuAReplace = contenuAReplace.replace(regexChaine,"<img class = 'smileyMessage' src = './img/smileys/question.PNG' style='width: 5%; height: 5%'/>");

	chaine = ':shout:';
	regexChaine = new RegExp(chaine, 'g');
	contenuAReplace = contenuAReplace.replace(regexChaine,"<img class = 'smileyMessage' src = './img/smileys/shout.PNG' style='width: 5%; height: 5%'/>");

	chaine = ':slobber:';
	regexChaine = new RegExp(chaine, 'g');
	contenuAReplace = contenuAReplace.replace(regexChaine,"<img class = 'smileyMessage' src = './img/smileys/slobber.PNG' style='width: 5%; height: 5%'/>");

	chaine = ':smile:';
	regexChaine = new RegExp(chaine, 'g');
	contenuAReplace = contenuAReplace.replace(regexChaine,"<img class = 'smileyMessage' src = './img/smileys/smile.PNG' style='width: 5%; height: 5%'/>");

	chaine = ':spook:';
	regexChaine = new RegExp(chaine, 'g');
	contenuAReplace = contenuAReplace.replace(regexChaine,"<img class = 'smileyMessage' src = './img/smileys/spook.PNG' style='width: 5%; height: 5%'/>");

	chaine = ':startle:';
	regexChaine = new RegExp(chaine, 'g');
	contenuAReplace = contenuAReplace.replace(regexChaine,"<img class = 'smileyMessage' src = './img/smileys/startle.PNG' style='width: 5%; height: 5%'/>");

	chaine = ':surprise:';
	regexChaine = new RegExp(chaine, 'g');
	contenuAReplace = contenuAReplace.replace(regexChaine,"<img class = 'smileyMessage' src = './img/smileys/surprise.PNG' style='width: 5%; height: 5%'/>");

	chaine = ':sweat:';
	regexChaine = new RegExp(chaine, 'g');
	contenuAReplace = contenuAReplace.replace(regexChaine,"<img class = 'smileyMessage' src = './img/smileys/sweat.PNG' style='width: 5%; height: 5%'/>");

	chaine = ':thirst:';
	regexChaine = new RegExp(chaine, 'g');
	contenuAReplace = contenuAReplace.replace(regexChaine,"<img class = 'smileyMessage' src = './img/smileys/thirst.PNG' style='width: 5%; height: 5%'/>");

	chaine = ':vomit:';
	regexChaine = new RegExp(chaine, 'g');
	contenuAReplace = contenuAReplace.replace(regexChaine,"<img class = 'smileyMessage' src = './img/smileys/vomit.PNG' style='width: 5%; height: 5%'/>");

	return contenuAReplace;
}

// Ouvre la div affichant les emoticones disponibles
cpt = 0;
function affichageDivEmoticones()
{
	var display = document.getElementById("zoneSmileys").style.display;
	
	if (cpt == 0) 
	{
		document.getElementById("zoneSmileys").style.display = 'block';
		cpt++;
	}
	else if (display == 'none') 
	{
		document.getElementById("zoneSmileys").style.display = 'block';
	}
	else 
	{
		document.getElementById("zoneSmileys").style.display = 'none';
	}
}

// Recupere l'image associée au compte gravatar
function getGravatar(email, taille)
{
	// -->> Fonction MD5 realisee par WebToolkit
	var MD5=function(s){function L(k,d){return(k<<d)|(k>>>(32-d))}function K(G,k){var I,d,F,H,x;F=(G&2147483648);H=(k&2147483648);I=(G&1073741824);d=(k&1073741824);x=(G&1073741823)+(k&1073741823);if(I&d){return(x^2147483648^F^H)}if(I|d){if(x&1073741824){return(x^3221225472^F^H)}else{return(x^1073741824^F^H)}}else{return(x^F^H)}}function r(d,F,k){return(d&F)|((~d)&k)}function q(d,F,k){return(d&k)|(F&(~k))}function p(d,F,k){return(d^F^k)}function n(d,F,k){return(F^(d|(~k)))}function u(G,F,aa,Z,k,H,I){G=K(G,K(K(r(F,aa,Z),k),I));return K(L(G,H),F)}function f(G,F,aa,Z,k,H,I){G=K(G,K(K(q(F,aa,Z),k),I));return K(L(G,H),F)}function D(G,F,aa,Z,k,H,I){G=K(G,K(K(p(F,aa,Z),k),I));return K(L(G,H),F)}function t(G,F,aa,Z,k,H,I){G=K(G,K(K(n(F,aa,Z),k),I));return K(L(G,H),F)}function e(G){var Z;var F=G.length;var x=F+8;var k=(x-(x%64))/64;var I=(k+1)*16;var aa=Array(I-1);var d=0;var H=0;while(H<F){Z=(H-(H%4))/4;d=(H%4)*8;aa[Z]=(aa[Z]|(G.charCodeAt(H)<<d));H++}Z=(H-(H%4))/4;d=(H%4)*8;aa[Z]=aa[Z]|(128<<d);aa[I-2]=F<<3;aa[I-1]=F>>>29;return aa}function B(x){var k="",F="",G,d;for(d=0;d<=3;d++){G=(x>>>(d*8))&255;F="0"+G.toString(16);k=k+F.substr(F.length-2,2)}return k}function J(k){k=k.replace(/rn/g,"n");var d="";for(var F=0;F<k.length;F++){var x=k.charCodeAt(F);if(x<128){d+=String.fromCharCode(x)}else{if((x>127)&&(x<2048)){d+=String.fromCharCode((x>>6)|192);d+=String.fromCharCode((x&63)|128)}else{d+=String.fromCharCode((x>>12)|224);d+=String.fromCharCode(((x>>6)&63)|128);d+=String.fromCharCode((x&63)|128)}}}return d}var C=Array();var P,h,E,v,g,Y,X,W,V;var S=7,Q=12,N=17,M=22;var A=5,z=9,y=14,w=20;var o=4,m=11,l=16,j=23;var U=6,T=10,R=15,O=21;s=J(s);C=e(s);Y=1732584193;X=4023233417;W=2562383102;V=271733878;for(P=0;P<C.length;P+=16){h=Y;E=X;v=W;g=V;Y=u(Y,X,W,V,C[P+0],S,3614090360);V=u(V,Y,X,W,C[P+1],Q,3905402710);W=u(W,V,Y,X,C[P+2],N,606105819);X=u(X,W,V,Y,C[P+3],M,3250441966);Y=u(Y,X,W,V,C[P+4],S,4118548399);V=u(V,Y,X,W,C[P+5],Q,1200080426);W=u(W,V,Y,X,C[P+6],N,2821735955);X=u(X,W,V,Y,C[P+7],M,4249261313);Y=u(Y,X,W,V,C[P+8],S,1770035416);V=u(V,Y,X,W,C[P+9],Q,2336552879);W=u(W,V,Y,X,C[P+10],N,4294925233);X=u(X,W,V,Y,C[P+11],M,2304563134);Y=u(Y,X,W,V,C[P+12],S,1804603682);V=u(V,Y,X,W,C[P+13],Q,4254626195);W=u(W,V,Y,X,C[P+14],N,2792965006);X=u(X,W,V,Y,C[P+15],M,1236535329);Y=f(Y,X,W,V,C[P+1],A,4129170786);V=f(V,Y,X,W,C[P+6],z,3225465664);W=f(W,V,Y,X,C[P+11],y,643717713);X=f(X,W,V,Y,C[P+0],w,3921069994);Y=f(Y,X,W,V,C[P+5],A,3593408605);V=f(V,Y,X,W,C[P+10],z,38016083);W=f(W,V,Y,X,C[P+15],y,3634488961);X=f(X,W,V,Y,C[P+4],w,3889429448);Y=f(Y,X,W,V,C[P+9],A,568446438);V=f(V,Y,X,W,C[P+14],z,3275163606);W=f(W,V,Y,X,C[P+3],y,4107603335);X=f(X,W,V,Y,C[P+8],w,1163531501);Y=f(Y,X,W,V,C[P+13],A,2850285829);V=f(V,Y,X,W,C[P+2],z,4243563512);W=f(W,V,Y,X,C[P+7],y,1735328473);X=f(X,W,V,Y,C[P+12],w,2368359562);Y=D(Y,X,W,V,C[P+5],o,4294588738);V=D(V,Y,X,W,C[P+8],m,2272392833);W=D(W,V,Y,X,C[P+11],l,1839030562);X=D(X,W,V,Y,C[P+14],j,4259657740);Y=D(Y,X,W,V,C[P+1],o,2763975236);V=D(V,Y,X,W,C[P+4],m,1272893353);W=D(W,V,Y,X,C[P+7],l,4139469664);X=D(X,W,V,Y,C[P+10],j,3200236656);Y=D(Y,X,W,V,C[P+13],o,681279174);V=D(V,Y,X,W,C[P+0],m,3936430074);W=D(W,V,Y,X,C[P+3],l,3572445317);X=D(X,W,V,Y,C[P+6],j,76029189);Y=D(Y,X,W,V,C[P+9],o,3654602809);V=D(V,Y,X,W,C[P+12],m,3873151461);W=D(W,V,Y,X,C[P+15],l,530742520);X=D(X,W,V,Y,C[P+2],j,3299628645);Y=t(Y,X,W,V,C[P+0],U,4096336452);V=t(V,Y,X,W,C[P+7],T,1126891415);W=t(W,V,Y,X,C[P+14],R,2878612391);X=t(X,W,V,Y,C[P+5],O,4237533241);Y=t(Y,X,W,V,C[P+12],U,1700485571);V=t(V,Y,X,W,C[P+3],T,2399980690);W=t(W,V,Y,X,C[P+10],R,4293915773);X=t(X,W,V,Y,C[P+1],O,2240044497);Y=t(Y,X,W,V,C[P+8],U,1873313359);V=t(V,Y,X,W,C[P+15],T,4264355552);W=t(W,V,Y,X,C[P+6],R,2734768916);X=t(X,W,V,Y,C[P+13],O,1309151649);Y=t(Y,X,W,V,C[P+4],U,4149444226);V=t(V,Y,X,W,C[P+11],T,3174756917);W=t(W,V,Y,X,C[P+2],R,718787259);X=t(X,W,V,Y,C[P+9],O,3951481745);Y=K(Y,h);X=K(X,E);W=K(W,v);V=K(V,g)}var i=B(Y)+B(X)+B(W)+B(V);return i.toLowerCase()};
	
	return 'http://www.gravatar.com/avatar/' + MD5(email) + '.jpg?s=' + taille;
}

// ---------------------------------------------------------------------- FONCTIONS RELATIVES AUX INTERACTIONS SUR LES FORMULAIRES -----------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Gere l'envoi de messages prives
function messagePrive(nomUtilisateur)
{
	document.getElementById("champMessage").value = "/msg " + nomUtilisateur + " ";
	document.getElementById('champMessage').focus();
}

// Teste la syntaxe du pseudo
function testPseudo(event)
{
	var toucheUtilisateur = event.keyCode;
	if (toucheUtilisateur != 17 && toucheUtilisateur != 116 && toucheUtilisateur != 9) 
	{
		if(pseudo == "")
		{
			var valeurPseudo = document.getElementById("champsPseudo").value.toString().toLowerCase();
			var reg = new RegExp('^[0-9a-z_]+$', 'i');

			if (reg.test(valeurPseudo) && valeurPseudo != "serveur" && valeurPseudo != "server")
			{
				// Le pseudo respecte le regex et n'est pas vide, on active le bouton RENTRER
				document.getElementById("boutonRentrer").disabled='';
				document.getElementById("zoneErreur").innerHTML = '';
				document.getElementById("zoneErreur").style.border = "";
			}
			else
			{
				if (valeurPseudo != "") 
				{
					// Le pseudo ne respecte par le regex, on desactive le bouton RENTRER et on affiche un message d'erreur
					var erreur= "Le pseudo '" + valeurPseudo + "' est incorrect ! </br> Caractères autorisés : 0-9 a-z A-Z _."
					document.getElementById("zoneErreur").innerHTML = erreur;
					document.getElementById("zoneErreur").style.border = "1px solid rgba(173,40,40,100)";
					document.getElementById("boutonRentrer").disabled='disabled';
					return false;
				}
				else 
				{
					// Le champ pseudo est vide
					document.getElementById("zoneErreur").innerHTML = '';
					document.getElementById("zoneErreur").style.border = "";
					document.getElementById("boutonRentrer").disabled='disabled';
					return false;
				}
			}
		}
		return true;
	}
	return false;
}

// Teste la syntaxe du nom du pseudo
function testSalon()
{
	if (pseudo != "")
	{
		var valeurSalon = document.getElementById("inputNomSalon").value.toString().toLowerCase();
		var reg = new RegExp('^[0-9a-z_]+$', 'i');

		// Si le nom du salon est correct, le bouton de creation/changement de salon est active
		if (reg.test(valeurSalon))
		{
			document.getElementById("buttonCreateSaloon").disabled="";
		}
		else
		{
			document.getElementById("buttonCreateSaloon").disabled="disabled";
		}
	}
}

// Teste si le message a envoyer n'est pas vide
function testMessage()
{
	if (pseudo != "")
	{
		var valeurMessage = document.getElementById("champMessage").value.toString();

		// Si le message a envoyer n'est pas vide, le bouton d'envoi est active
		if (valeurMessage != "")
		{
			document.getElementById("send").disabled="";
		}
		else
		{
			document.getElementById("send").disabled="disabled";
		}
	}
}

// Teste le champ de l'email Gravatar
function testGravatar()
{
	mailGravatar = document.getElementById("champsEmail").value.toString();
    	document.getElementById("logo").src = getGravatar(mailGravatar, 278);
}

// Ajoute un smiley cliqué à la fin du contenu de l'input permettant de saisir un message dans le chat
function addSmileyToChat(clicked_id) {
	document.getElementById("send").disabled="";
	// Switch selon le smiley cliqué 
	switch (clicked_id)
	{
		case "anger" :
			var champSaisieValue = document.getElementById("champMessage").value;
			if (champSaisieValue == "") {
				document.getElementById("champMessage").value = ":anger: ";
			} 
			else {
				document.getElementById("champMessage").value += " :anger: ";
			}
			break;
			
		case "burn" :
			var champSaisieValue = document.getElementById("champMessage").value;
			if (champSaisieValue == "") {
				document.getElementById("champMessage").value = ":burn: ";
			} 
			else {
				document.getElementById("champMessage").value += " :burn: ";
			}
			break;
			
		case "confused" :
			var champSaisieValue = document.getElementById("champMessage").value;
			if (champSaisieValue == "") {
				document.getElementById("champMessage").value = ":confused: ";
			} 
			else {
				document.getElementById("champMessage").value += " :confused: ";
			}
			break;
			
		case "cool" :
			var champSaisieValue = document.getElementById("champMessage").value;
			if (champSaisieValue == "") {
				document.getElementById("champMessage").value = ":cool: ";
			} 
			else {
				document.getElementById("champMessage").value += " :cool: ";
			}
			break;
			
		case "cry" :
			var champSaisieValue = document.getElementById("champMessage").value;
			if (champSaisieValue == "") {
				document.getElementById("champMessage").value = ":cry: ";
			} 
			else {
				document.getElementById("champMessage").value += " :cry: ";
			}
			break;
			
		case "fire" :
			var champSaisieValue = document.getElementById("champMessage").value;
			if (champSaisieValue == "") {
				document.getElementById("champMessage").value = ":fire: ";
			} 
			else {
				document.getElementById("champMessage").value += " :fire: ";
			}
			break;
			
		case "grimace" :
			var champSaisieValue = document.getElementById("champMessage").value;
			if (champSaisieValue == "") {
				document.getElementById("champMessage").value = ":grimace: ";
			} 
			else {
				document.getElementById("champMessage").value += " :grimace: ";
			}
			break;
			
		case "love" :
			var champSaisieValue = document.getElementById("champMessage").value;
			if (champSaisieValue == "") {
				document.getElementById("champMessage").value = ":love: ";
			} 
			else {
				document.getElementById("champMessage").value += " :love: ";
			}
			break;
			
		case "miao" :
			var champSaisieValue = document.getElementById("champMessage").value;
			if (champSaisieValue == "") {
				document.getElementById("champMessage").value = ":miao: ";
			} 
			else {
				document.getElementById("champMessage").value += " :miao: ";
			}
			break;
			
		case "prettiness" :
			var champSaisieValue = document.getElementById("champMessage").value;
			if (champSaisieValue == "") {
				document.getElementById("champMessage").value = ":prettiness: ";
			} 
			else {
				document.getElementById("champMessage").value += " :prettiness: ";
			}
			break;
			
		case "question" :
			var champSaisieValue = document.getElementById("champMessage").value;
			if (champSaisieValue == "") {
				document.getElementById("champMessage").value = ":question: ";
			} 
			else {
				document.getElementById("champMessage").value += " :question: ";
			}
			break;
			
		case "shout" :
			var champSaisieValue = document.getElementById("champMessage").value;
			if (champSaisieValue == "") {
				document.getElementById("champMessage").value = ":shout: ";
			} 
			else {
				document.getElementById("champMessage").value += " :shout: ";
			}
			break;
			
		case "slobber" :
			var champSaisieValue = document.getElementById("champMessage").value;
			if (champSaisieValue == "") {
				document.getElementById("champMessage").value = ":slobber: ";
			} 
			else {
				document.getElementById("champMessage").value += " :slobber: ";
			}
			break;
			
		case "smile" :
			var champSaisieValue = document.getElementById("champMessage").value;
			if (champSaisieValue == "") {
				document.getElementById("champMessage").value = ":smile: ";
			} 
			else {
				document.getElementById("champMessage").value += " :smile: ";
			}
			break;
			
		case "spook" :
			var champSaisieValue = document.getElementById("champMessage").value;
			if (champSaisieValue == "") {
				document.getElementById("champMessage").value = ":spook: ";
			} 
			else {
				document.getElementById("champMessage").value += " :spook: ";
			}
			break;
			
		case "startle" :
			var champSaisieValue = document.getElementById("champMessage").value;
			if (champSaisieValue == "") {
				document.getElementById("champMessage").value = ":startle: ";
			} 
			else {
				document.getElementById("champMessage").value += " :startle: ";
			}
			break;
			
		case "surprise" :
			var champSaisieValue = document.getElementById("champMessage").value;
			if (champSaisieValue == "") {
				document.getElementById("champMessage").value = ":surprise: ";
			} 
			else {
				document.getElementById("champMessage").value += " :surprise: ";
			}
			break;
			
		case "sweat" :
			var champSaisieValue = document.getElementById("champMessage").value;
			if (champSaisieValue == "") {
				document.getElementById("champMessage").value = ":sweat: ";
			} 
			else {
				document.getElementById("champMessage").value += " :sweat: ";
			}
			break;
			
		case "thirst" :
			var champSaisieValue = document.getElementById("champMessage").value;
			if (champSaisieValue == "") {
				document.getElementById("champMessage").value = ":thirst: ";
			} 
			else {
				document.getElementById("champMessage").value += " :thirst: ";
			}
			break;
	
		case "vomit" :
			var champSaisieValue = document.getElementById("champMessage").value;
			if (champSaisieValue == "") {
				document.getElementById("champMessage").value = ":vomit: ";
			} 
			else {
				document.getElementById("champMessage").value += " :vomit: ";
			}
			break;
	}
}

// Donne le focus a l'element passe en parametre
function donnerFocus(elementAFocus)
{
	document.getElementById(elementAFocus).focus();
}

// Gere l'evenement de la touche Entree du champs de choix du pseudo
function enterPressedFirstForm(event) 
{
    var toucheUtilisateur = event.keyCode;

    // Si l'utilisateur tape la touche Entree
    if (toucheUtilisateur == 13) 
	{
		var pseudoCorrect = testPseudo(event);
		if (pseudoCorrect) 
		{
			connexionServeur();
		}
    }
}

// Gere l'evenement de la touche Entree du champs d'envoi de message
function enterPressedSecondForm(event) 
{
    var toucheUtilisateur = event.keyCode;

	// Si l'utilisateur tape la touche Entree
    if (toucheUtilisateur == 13) 
	{
        envoiMessage();
    }
}

// Gere l'evenement de la touche Entree du champ de changement de salon
function enterPressedThirdForm(event) 
{
    var toucheUtilisateur = event.keyCode;

    // Si l'utilisateur tape la touche Entree
    if (toucheUtilisateur == 13) 
	{
        creationChangementSalon();
    }
}
