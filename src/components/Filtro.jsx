import { useState, useEffect } from "react";

function Filtro({ elementos, handleElementosFiltrados, funcionFiltro, placeholder="Buscar" }){
    const [filtro, setFiltro] = useState(undefined);

    // Cada que cambie el texto del filtro
    // O cada que cambien los elementos de las props, se actualizan los elementos
    useEffect(() => {
        // Se aplica el filtro si existe en el input, si no, se ponen los elementos completos
        let filtrados = filtro ? elementos.filter(elemento => funcionFiltro(filtro, elemento)) : elementos;

        handleElementosFiltrados(filtrados);
    }, [filtro, elementos])

    const handleFiltro = (e) => {
        setFiltro(e.target.value.toLowerCase());
    }

    return(
        <input type="text" className="form__input" placeholder={placeholder} onInput={handleFiltro} />
    )
}

export default Filtro;