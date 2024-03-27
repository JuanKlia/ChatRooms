import { Router } from "@vaadin/router";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";
import map from "lodash/map";

type Mensaje = { mensaje: string; from: string; userId: string };
const firebaseConfig = {
  apiKey: "AIzaSyCB3-W34665nC0CKGxva9zCzXawGZ333-g",
  authDomain: "chat-definitivo-6346a.firebaseapp.com",
  databaseURL: "https://chat-definitivo-6346a-default-rtdb.firebaseio.com",
  projectId: "chat-definitivo-6346a",
  storageBucket: "chat-definitivo-6346a.appspot.com",
  messagingSenderId: "940760653948",
  appId: "1:940760653948:web:5a3bc328e5775160aa69f9",
};

const app = initializeApp(firebaseConfig);

const dataBase = getDatabase();

const API_BASE = "https://d3f3-2800-810-484-71c-513d-667-5f4e-9a66.ngrok-free.app";

const state = {
  data: {
    mensajes: [] as Mensaje[],
    nombre: "",
    email: "",
    userId: "",
    roomId: "",
    rtdbId: "",
  },
  listeners: [],
  getState() {
    return this.data;
  },
  initState() {
    const lastStorage = localStorage.getItem("state");
    this.setState(lastStorage);
  },
  suscribe(cb) {
    this.listeners.push(cb);
  },
  setState(newState) {
    this.data = newState;

    for (const cb of this.listeners) {
      cb();
    }
    console.log(this.data);

    localStorage.setItem("state", JSON.stringify(newState)); //siempre guarda el state actualizado
  },
  pushMensaje(mensaje) {
    fetch(`${API_BASE}/mesagge?roomId=${this.data.roomId}`, {
      method: "post",
      body: JSON.stringify({
        mensaje: mensaje,
        from: this.data.nombre,
        userId: this.data.userId,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        console.log(data);
      });
  },
  //setEmailAndName(params: { email: string; fullName: string })
  //Para parametros de numero variables y muchos es mejor un objeto solo de parametro
  //Puedo agregar campos y no importa el orden, ademas se le puede poner parametros opcionales?
  setEmailAndName(email: string, nombre: string, callback) {
    const lastState = this.getState();
    lastState.nombre = nombre;
    lastState.email = email;
    this.setState(lastState);
    callback();
  },
  signIn(callback) {
    const cs = this.getState();

    if (cs.email && cs.nombre) {
      //Chequea que el state tenga un email

      fetch(API_BASE + "/auth", {
        method: "post",
        body: JSON.stringify({ email: cs.email, nombre: cs.nombre }),
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => {
          return res.json();
        })
        .then((data) => {
          //trae el id/key
          cs.userId = data.id;
          this.setState(cs);
          //Ejecuta el callback una vez que el estate tiene el ID
          callback();
        });
    } else {
      //Si no tiene email podria arrojar un error y guardarlo en el state para mostrarlo en la IU
      console.error("Falta un campo");
      //Si le pasan algo de parametro es la señal de error
      callback(true);
    }
  },

  asknewRoom(callback) {
    const cs = state.getState();

    if (cs.userId) {
      //Necesita que haya un ID
      fetch(API_BASE + "/rooms", {
        method: "post",
        body: JSON.stringify({ userId: cs.userId }),
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => {
          return res.json();
        })
        .then((data) => {
          //El ID sencillo
          cs.roomId = data.id;
          this.setState(cs);
          callback();
        });
    } else {
      callback(true);
    }
  },

  accessToRoom(callback?) {
    //Necesito el callback para avisar que ya tengo el RTDBid y ya puedo escuchar mensajes,
    const cs = state.getState();
    if (cs.roomId) {
      fetch(`${API_BASE}/rooms/${cs.roomId}?userId=${cs.userId}`, {
        method: "get",
      })
        .then((res) => {
          return res.json();
        })
        .then((data) => {
          //La data del rtdi
          if (data.rtdbId) {
            cs.rtdbId = data.rtdbId;
            state.setState(cs);
            this.listenRoom();
          } else {
            callback();
          }
        });
    }
  },
  setNombre(nombre) {
    const cs = this.getState();
    cs.nombre = nombre;
    this.setState(cs);
  },
  listenRoom() {
    //Es mejor siempre sacar la data del state
    const cs = this.getState();
    const roomRef = ref(dataBase, "/rooms/" + cs.rtdbId);
    onValue(roomRef, (snap) => {
      const mensajesList = map(snap.val().messages);
      cs.mensajes = mensajesList;
      this.setState(cs);
    });
    Router.go("/chat");
  },setRoomId(idRoom){
        const cs = this.getState()
        cs.roomId = idRoom
        this.setState(cs)
  }
};

export { state };
