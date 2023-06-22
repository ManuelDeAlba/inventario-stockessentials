import { useEffect, useState } from "react";
import { borrarTransaccion, guardarMovimiento, guardarTransaccion, obtenerTransacciones } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../constantes";
import { useModal } from "../context/ModalConfirmProvider";

function PaginaIngresosEgresos(){
    const { usuario } = useAuth();
    const { abrirModal, cerrarModal } = useModal();

    const [datos, setDatos] = useState({
        descripcion: "",
        dinero: 0
    });
    const [ingresos, setIngresos] = useState(null);
    const [egresos, setEgresos] = useState(null);
    const [totales, setTotales] = useState({
        totalIng: 0,
        totalEgr: 0
    });

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
    
    const handleIngreso = () => {
        handleTransacciones({
            ...datos,
            dinero: Math.abs(datos.dinero)
        });
    }
    
    const handleEgreso = () => {
        handleTransacciones({
            ...datos,
            dinero: -Math.abs(datos.dinero)
        });
    }

    const handleTransacciones = async (datos) => {
        if(datos.precio == 0) return;

        await guardarTransaccion({
            ...datos,
            
            //? Solo lo puede ver el admin
            creador: usuario.nombre
        });

        setDatos({
            descripcion: "",
            dinero: 0
        });
    }

    const handleInput = e => {
        setDatos({
            ...datos,
            [e.target.name]: e.target.value
        });
    }

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
                <div className="form">
                    <div className="form__apartado">
                        <label htmlFor="descripcion">Descripción</label>
                        <input
                            type="text"
                            className="form__input"
                            name="descripcion"
                            id="descripcion"
                            onInput={handleInput}
                            value={datos.descripcion}
                            required
                        />
                    </div>

                    <div className="form__apartado">
                        <label htmlFor="dinero">Dinero</label>
                        <input
                            type="number"
                            className="form__input"
                            name="dinero"
                            id="dinero"
                            min={0}
                            step={.01}
                            inputMode="numeric"
                            onInput={handleInput}
                            value={datos.dinero}
                            required
                        />
                    </div>

                    <button onClick={handleIngreso} className="boton boton--verde">Ingreso</button>
                    <button onClick={handleEgreso} className="boton boton--rojo">Egreso</button>
                </div>

                <div className="transacciones__tablas">
                    <div className="transacciones__tabla">
                        <h2 className="titulo contenedor">Ingresos</h2>

                        {/* Tabla ingresos */}
                        {
                            ingresos.length == 0 ? (
                                <h3 className="titulo contenedor">No hay ingresos</h3>
                                ) : (
                                    <>
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
                                                                <th></th>
                                                            </>
                                                        )
                                                    }
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {
                                                    ingresos.map(ingreso => (
                                                        <tr className="tabla__fila" key={ingreso.id}>
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
                                                                    </>
                                                                )
                                                            }
                                                        </tr>
                                                    ))
                                                }
                                            </tbody>
                                        </table>

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
                                                            <th></th>
                                                        </>
                                                    )
                                                }
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {
                                                egresos.map(egreso => (
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
                                                                    </>
                                                            )
                                                        }
                                                    </tr>
                                                ))
                                            }
                                        </tbody>
                                    </table>

                                    <h3 className="titulo contenedor transacciones__total">Total egresos: ${totales.totalEgr}</h3>
                                </>
                            )
                        }
                    </div>
                </div>
                
                <h3 className="titulo" style={{
                    color: totales.totalIng - totales.totalEgr > 0 ? "green" : "red"
                }}>Caja: ${totales.totalIng - totales.totalEgr}</h3>
            </div>
        </>
    )
}

export default PaginaIngresosEgresos;