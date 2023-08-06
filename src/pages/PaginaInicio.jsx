import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerProductos } from "../firebase";

import TablaProductos from "../components/TablaProductos";

function PaginaInicio(){
    const navigate = useNavigate();
    const [productos, setProductos] = useState([]);

    useEffect(() => {
        // Se suscribe al evento "obtenerProductos" y con el callback guardamos los datos
        // Nos devuelve una función para desuscribirnos
        let unsubscribe;
        const obtenerProductosDB = async () => {
            let unsub = await obtenerProductos((docs) => {
                setProductos(docs);
            });

            unsubscribe = unsub;
        }

        obtenerProductosDB();

        // Se desuscribe del evento al desmontar el componente
        return () => {
            if(unsubscribe) unsubscribe();
        }
    }, [])

    const handleEditar = async id_producto => {
        navigate(`/editar-producto/${id_producto}`);
    }

    return(
        <>
            <h1 className="titulo titulo--principal contenedor">StockEssentials</h1>

            <div className="contenedor">
                {
                    productos.length > 0 ? (
                        <>
                            <h2 className="titulo contenedor">Inventario</h2>
                            <TablaProductos
                                productos={productos}
                                handleEditar={handleEditar}
                                conAcciones
                                conResultados
                                conFiltro
                            />
                        </>
                    ) : (
                        <h2 className="titulo contenedor">Sin productos</h2>
                    )
                }
            </div>
        </>
    )
}

export default PaginaInicio;