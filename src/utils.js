const ACENTOS = {'á':'a','é':'e','í':'i','ó':'o','ú':'u'};

export function timestampAFecha(timestamp){
    let fecha = new Date(timestamp.toDate());
    return obtenerFecha(fecha);
}

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

export function eliminarAcentos(str){
    return str.split("").map(letra => ACENTOS[letra] || letra).join("");
}

export function filtrarProductos(textoFiltro, producto){
    // Obtenemos cada palabra del nombre del producto y de lo buscado
    // Quitamos acentos para que sea menos estricto el filtrado
    let palabras = eliminarAcentos(producto.nombre.toLowerCase()).split(/\s+/);
    let buscado = eliminarAcentos(textoFiltro.toLowerCase()).split(/\s+/);

    // Si todas las palabras buscadas tienen algo en común con alguna de las de los nombres,
    // se muestra el producto
    return buscado.every(palabraB => {
        if(!palabraB) return true;

        return palabras.some(palabra => palabra.includes(palabraB));
    });
}