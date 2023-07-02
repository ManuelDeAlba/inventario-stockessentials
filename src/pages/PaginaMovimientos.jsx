import { useEffect, useState } from "react";
import { obtenerMovimientos } from "../firebase";
import { timestampAFecha } from "../utils";

function PaginaMovimientos(){
    const [movimientos, setMovimientos] = useState(null);

    useEffect(() => {
        let unsubscribe;
        const obtenerMovimientosDB = async () => {
            unsubscribe = await obtenerMovimientos((docs) => {
                setMovimientos(docs);
            })
        }

        obtenerMovimientosDB();

        return () => {
            if(unsubscribe) unsubscribe();
        }
    }, [])

    if(movimientos === null) return <h2 className="titulo contenedor">Cargando...</h2>

    if(!movimientos || movimientos.length == 0) return <h2 className="titulo contenedor">No hay movimientos</h2>

    return(
        <>
            <h1 className="titulo contenedor">Movimientos</h1>

            <p className="contenedor"><b>Movimientos:</b> {movimientos.length}</p>

            <div className="contenedor movimientos">
                {
                    movimientos.map(movimiento => (
                        <p key={movimiento.id}><b>({timestampAFecha(movimiento.fecha)})</b> {movimiento.msg}</p>
                    ))
                }
            </div>
        </>
    )
}

export default PaginaMovimientos;