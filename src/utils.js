import { Timestamp } from "firebase/firestore";

const ACENTOS = {'á':'a','é':'e','í':'i','ó':'o','ú':'u'};

export function obtenerFecha(fecha=new Date()){
    let date = fecha;
    let dia = date.getDate().toString().padStart(2, 0);
    let mes = (date.getMonth() + 1).toString().padStart(2, 0);
    let anio = date.getFullYear();
    
    let hora = date.getHours().toString().padStart(2, 0);
    let minutos = date.getMinutes().toString().padStart(2, 0);
    let segundos = date.getSeconds().toString().padStart(2, 0);
    
    return `${dia}/${mes}/${anio} ${hora}:${minutos}:${segundos}`;
}

export function timestampAFecha(timestamp){
    let fecha = new Date(timestamp.toDate());
    return obtenerFecha(fecha);
}

export function obtenerTimestamp(fecha=new Date()){
    return Timestamp.fromDate(fecha);
}

export function eliminarAcentos(str){
    return str.split("").map(letra => ACENTOS[letra] || letra).join("");
}

export function filtrarElementos(textoFiltro, producto, propiedad){
    // Obtenemos cada palabra del nombre o la propiedad del producto y de lo buscado
    // Quitamos acentos para que sea menos estricto el filtrado
    let texto = producto?.[propiedad]?.toLowerCase();
    // Si texto no existe porque la propiedad es inválida, ningún elemento será válido
    if(!texto) return false;

    let palabras = eliminarAcentos(texto).split(/\s+/);
    let buscado = eliminarAcentos(textoFiltro.toLowerCase()).split(/\s+/);

    // Si todas las palabras buscadas tienen algo en común con alguna de las de los nombres,
    // se muestra el producto
    return buscado.every(palabraB => {
        if(!palabraB) return true;

        return palabras.some(palabra => palabra.includes(palabraB));
    });
}