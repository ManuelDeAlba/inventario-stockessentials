import { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { ROLES } from "../constantes";
import { useModal } from "../context/ModalConfirmProvider";

import { borrarTransaccion, guardarMovimiento, obtenerTransacciones } from "../firebase";
import { filtrarElementos, timestampAFecha } from "../utils";

import FormularioIngresosEgresos from "../components/FormularioIngresosEgresos";
import Filtro from "../components/Filtro";

const FilaIngreso = ({ ingreso, handleBorrar }) => {
    const { usuario } = useAuth();

    return(
        <tr className="tabla__fila">
            <td>{ingreso.descripcion}</td>
            <td>{ingreso.fecha}</td>
            <td className="tabla__precio">${ingreso.dinero}</td>
            {
                usuario.rol == ROLES.ADMIN && (
                    <>
                        <td>{ingreso.creador || "Sistema"}</td>
                        {
                            ingreso.creador ? (
                                <td><button className="tabla__boton boton" onClick={() => handleBorrar(ingreso)}>Borrar</button></td>
                            ) : (
                                <td>-</td>
                            )
                        }
                        <td>{ingreso.id}</td>
                    </>
                )
            }
        </tr>
    )

}

const FilaEgreso = ({ egreso, handleBorrar }) => {
    const { usuario } = useAuth();

    return(
        <tr className="tabla__fila" key={egreso.id}>
            <td>{egreso.descripcion}</td>
            <td>{egreso.fecha}</td>
            <td className="tabla__precio">${Math.abs(egreso.dinero)}</td>
            {
                usuario.rol == ROLES.ADMIN && (
                    <>
                        <td>{egreso.creador || "Sistema"}</td>
                        {
                            egreso.creador ? (
                                <td><button className="tabla__boton boton" onClick={() => handleBorrar(egreso)}>Borrar</button></td>
                            ) : (
                                <td>-</td>
                            )
                        }
                        <td>{egreso.id}</td>
                    </>
                )
            }
        </tr>
    )
}

function PaginaIngresosEgresos(){
    const { usuario } = useAuth();
    const { abrirModal, cerrarModal } = useModal();

    const [ingresos, setIngresos] = useState(null);
    const [egresos, setEgresos] = useState(null);
    const [ingresosFiltrados, setIngresosFiltrados] = useState(ingresos);
    const [egresosFiltrados, setEgresosFiltrados] = useState(egresos);
    const [totales, setTotales] = useState({
        totalIng: 0,
        totalEgr: 0,
        totalIngFiltrados: 0,
        totalEgrFiltrados: 0
    });

    // Actualizar ingresos y egresos
    useEffect(() => {
        let unsubscribe;
        const obtenerTransaccionesDB = async () => {
            unsubscribe = await obtenerTransacciones((docs) => {
                const ing = docs.filter(doc => doc.dinero > 0);
                const egr = docs.filter(doc => doc.dinero < 0);

                let totalIng = 0;
                let totalEgr = 0;

                ing.forEach(ingreso => totalIng += ingreso.dinero);
                egr.forEach(egreso => totalEgr += egreso.dinero);

                totalEgr = Math.abs(totalEgr);

                setIngresos(ing);
                setEgresos(egr);
                setTotales({
                    totalIng,
                    totalEgr
                });
            })
        }

        obtenerTransaccionesDB();

        return () => {
            if(unsubscribe) unsubscribe();
        }
    }, [])

    // Filtro
    const handleIngresosFiltrados = (filtrados) => {
        let total = 0;
        
        filtrados.forEach(filtrado => {
            total += filtrado.dinero;
        })

        setTotales(totales => {
            return {
                ...totales,
                totalIngFiltrados: total
            }
        })
        setIngresosFiltrados(filtrados);
    }

    const handleEgresosFiltrados = (filtrados) => {
        let total = 0;

        filtrados.forEach(filtrado => {
            total += filtrado.dinero;
        })

        setTotales(totales => {
            return {
                ...totales,
                totalEgrFiltrados: total
            }
        })
        setEgresosFiltrados(filtrados);
    }

    // Botones de las tablas
    const handleBorrar = (transaccion) => {
        abrirModal({
            texto: "¿Quieres borrar la transacción?",
            onResult: async (res) => {
                if(res){
                    await borrarTransaccion(transaccion.id);

                    await guardarMovimiento(`${usuario.nombre} borró el ${transaccion.dinero > 0 ? "ingreso" : "egreso"}: "${transaccion.descripcion}" - dinero: $${transaccion.dinero}`);
                }

                cerrarModal();
            }
        });
    }

    if(ingresos === null || egresos === null) return <h2 className="titulo contenedor">Cargando...</h2>

    return(
        <>
            <h1 className="titulo contenedor">Ingresos y Egresos</h1>

            <div className="contenedor">
                <FormularioIngresosEgresos />

                <div className="transacciones__tablas">
                    <div className="transacciones__tabla">
                        <h2 className="titulo contenedor">Ingresos</h2>

                        {/* Tabla ingresos */}
                        {
                            ingresos.length == 0 ? (
                                <h3 className="titulo contenedor">No hay ingresos</h3>
                            ) : (
                                <>
                                    <Filtro
                                        elementos={ingresos}
                                        handleElementosFiltrados={handleIngresosFiltrados}
                                        funcionFiltro={filtrarElementos}
                                        propiedad="descripcion"
                                    />

                                    {
                                        ingresosFiltrados?.length > 0 ? (
                                            <table className="tabla">
                                                <thead className="tabla__titulos">
                                                    <tr>
                                                        <th>Descripción</th>
                                                        <th>Fecha</th>
                                                        <th>Dinero</th>
                                                        {
                                                            usuario.rol == ROLES.ADMIN && (
                                                                <>
                                                                    <th>Creador</th>
                                                                    <th>Acción</th>
                                                                    <th>ID</th>
                                                                </>
                                                            )
                                                        }
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {
                                                        ingresosFiltrados.map(ingreso => (
                                                            <FilaIngreso
                                                                key={ingreso.id}
                                                                ingreso={{
                                                                    ...ingreso,
                                                                    fecha: timestampAFecha(ingreso.fecha)
                                                                }}
                                                                handleBorrar={handleBorrar}
                                                            />
                                                        ))
                                                    }
                                                </tbody>
                                                <tfoot className="tabla__footer">
                                                    <tr>
                                                        <td>Total</td>
                                                        <td></td>
                                                        <td className="tabla__precio">${totales.totalIngFiltrados}</td>
                                                        {
                                                            usuario.rol == ROLES.ADMIN && (
                                                                <>
                                                                    <td></td>
                                                                    <td></td>
                                                                    <td></td>
                                                                </>
                                                            )
                                                        }
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        ) : (
                                            <h3 className="titulo" style={{marginTop: "20px"}}>Ningún elemento coincide con el filtro</h3>
                                        )
                                    }

                                    <h3 className="titulo contenedor transacciones__total">Total ingresos: ${totales.totalIng}</h3>
                                </>
                            )
                        }
                    </div>

                    <div className="transacciones__tabla">
                        <h2 className="titulo contenedor">Egresos</h2>

                        {/* Tabla egresos */}
                        {
                            egresos.length == 0 ? (
                                <h3 className="titulo contenedor">No hay egresos</h3>
                            ) : (
                                <>
                                    <Filtro
                                        elementos={egresos}
                                        handleElementosFiltrados={handleEgresosFiltrados}
                                        funcionFiltro={filtrarElementos}
                                        propiedad="descripcion"
                                    />

                                    {
                                        egresosFiltrados?.length > 0 ? (
                                            <table className="tabla">
                                                <thead className="tabla__titulos">
                                                    <tr>
                                                        <th>Descripción</th>
                                                        <th>Fecha</th>
                                                        <th>Dinero</th>
                                                        {
                                                            usuario.rol == ROLES.ADMIN && (
                                                                <>
                                                                    <th>Creador</th>
                                                                    <th>Acción</th>
                                                                    <th>ID</th>
                                                                </>
                                                            )
                                                        }
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {
                                                        egresosFiltrados.map(egreso => (
                                                            <FilaEgreso
                                                                key={egreso.id}
                                                                egreso={{
                                                                    ...egreso,
                                                                    fecha: timestampAFecha(egreso.fecha)
                                                                }}
                                                                handleBorrar={handleBorrar}
                                                            />
                                                        ))
                                                    }
                                                </tbody>
                                                <tfoot className="tabla__footer">
                                                    <tr>
                                                        <td>Total</td>
                                                        <td></td>
                                                        <td className="tabla__precio">${Math.abs(totales.totalEgrFiltrados)}</td>
                                                        {
                                                            usuario.rol == ROLES.ADMIN && (
                                                                <>
                                                                    <td></td>
                                                                    <td></td>
                                                                    <td></td>
                                                                </>
                                                            )
                                                        }
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        ) : (
                                            <h3 className="titulo" style={{marginTop: "20px"}}>Ningún elemento coincide con el filtro</h3>
                                        )
                                    }

                                    <h3 className="titulo contenedor transacciones__total">Total egresos: ${totales.totalEgr}</h3>
                                </>
                            )
                        }
                    </div>
                </div>
                
                <h3 className="titulo" style={{
                    color: totales.totalIng - totales.totalEgr > 0 ? "green" : (
                        totales.totalIng - totales.totalEgr < 0 ? "red" : "black"
                    )
                }}>Caja: ${totales.totalIng - totales.totalEgr}</h3>
            </div>
        </>
    )
}

export default PaginaIngresosEgresos;