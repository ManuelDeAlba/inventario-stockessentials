// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, onSnapshot, orderBy, query, setDoc, where } from "firebase/firestore";
import { obtenerFecha } from "./utils";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

//? Utils

async function obtenerColeccion(coleccion, ordenar, callback){
    let q = query(collection(db, coleccion), orderBy(...ordenar));
    
    let unsub = onSnapshot(q, (querySnapshot) => {
        let docs = querySnapshot.docs.map((doc) => doc.data());
        callback(docs);
    });

    return unsub;
}

async function actualizarDocumento(coleccion, documento){
    let docRef = doc(db, coleccion, documento.id);

    await setDoc(docRef, documento);
}

async function borrarDocumento(coleccion, id){
    let docRef = doc(db, coleccion, id);

    await deleteDoc(docRef);
}

// Borra documentos con cierta condición
async function borrarConCondicion(coleccion, condicion){
    let q = query(collection(db, coleccion), where(...condicion));
    let docs = await getDocs(q);
    docs.forEach(async doc => await deleteDoc(doc.ref));
}

//! Productos
export async function crearProducto(producto){
    // Se obtiene la fecha para poner como id
    const fecha = Date.now().toString();

    // Se crea la referencia para saber donde insertar
    const docRef = doc(db, "productos", fecha);

    // Se crea el documento en la base de datos
    //? Automáticamente se agrega el id y la cantidad
    let prod = {
        id: fecha,
        cantidad: 0,
        ...producto
    }

    await setDoc(docRef, prod);

    return prod;
}

export async function obtenerProductos(callback) {
    return await obtenerColeccion("productos", ["nombre"], callback);
}

export async function obtenerProducto(id){
    let docRef = doc(db, "productos", id);

    let documento = await getDoc(docRef);

    return documento.data();
}

export async function actualizarProducto(producto){
    await actualizarDocumento("productos", producto);
}

export async function borrarProducto(id){
    await borrarDocumento("productos", id);
}

//! Compras
export async function guardarCompra(compra){
    // Se obtiene la fecha para poner como id
    const fecha = Date.now().toString();

    let docRef = doc(db, "compras", fecha);

    let docCompra = {
        id: fecha,
        ...compra
    }

    await setDoc(docRef, docCompra);

    return docCompra;
}

export async function actualizarCompra(compra){
    await actualizarDocumento("compras", compra);
}

export async function obtenerCompras(callback){
    await obtenerColeccion("compras", ["fecha"], callback);
}

export async function borrarCompra(id){
    await borrarDocumento("compras", id);
}

//! Ventas
export async function guardarVenta(venta){
    // Se obtiene la fecha para poner como id
    const fecha = Date.now().toString();

    let docRef = doc(db, "ventas", fecha);

    let docVenta = {
        id: fecha,
        ...venta
    }

    await setDoc(docRef, docVenta);

    return docVenta;
}

export async function actualizarVenta(venta){
    await actualizarDocumento("ventas", venta);
}

export async function obtenerVentas(callback){
    await obtenerColeccion("ventas", ["fecha"], callback);
}

export async function borrarVenta(id){
    await borrarDocumento("ventas", id);
}

//! Apartados
export async function guardarApartado(apartado){
    // Se obtiene la fecha para poner como id
    const fecha = Date.now().toString();

    let docRef = doc(db, "apartados", fecha);

    let docApartado = {
        id: fecha,
        ...apartado
    }

    await setDoc(docRef, docApartado);

    return docApartado;
}

export async function actualizarApartado(apartado){
    await actualizarDocumento("apartados", apartado);
}

export async function obtenerApartados(callback){
    await obtenerColeccion("apartados", ["fecha"], callback);
}

export async function borrarApartado(id){
    await borrarDocumento("apartados", id);
}

//! Movimientos
export async function guardarMovimiento(msg){
    // Se obtiene la fecha para poner como id
    const fecha = Date.now().toString();

    let docRef = doc(db, "movimientos", fecha);

    let docMensaje = {
        id: fecha,
        fecha: obtenerFecha(),
        msg
    }

    await setDoc(docRef, docMensaje);

    return docMensaje;
}

export async function obtenerMovimientos(callback){
    await obtenerColeccion("movimientos", ["fecha", "desc"], callback);
}

//! Transacciones
export async function guardarTransaccion(datos){
    // Se obtiene la fecha para poner como id
    const fecha = Date.now().toString();

    let docRef = doc(db, "transacciones", fecha);

    let docTransaccion = {
        id: fecha,
        fecha: obtenerFecha(),
        ...datos
    }

    await setDoc(docRef, docTransaccion);

    return docTransaccion;
}

export async function obtenerTransacciones(callback){
    await obtenerColeccion("transacciones", ["fecha"], callback);
}

export async function borrarTransaccion(id){
    await borrarDocumento("transacciones", id);
}

// Borra las transacciones que coincidan con el id de la compra o venta
export async function borrarTransaccionesConCondicion(condicion){
    //? condicion -> ["id_venta", "==", venta.id]
    await borrarConCondicion("transacciones", condicion);
}