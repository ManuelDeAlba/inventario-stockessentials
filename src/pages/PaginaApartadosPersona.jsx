import { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { ROLES } from "../constantes";
import { useModal } from "../context/ModalConfirmProvider";

import { actualizarProducto, guardarTransaccion, borrarApartado, guardarMovimiento, guardarVenta, obtenerApartados, obtenerProducto, actualizarApartado, borrarTransaccionesConCondicion } from "../firebase";
import { filtrarElementos, timestampAFecha } from "../utils";

import Filtro from "../components/Filtro";
import { Link, useParams } from "react-router-dom";

function PaginaApartadosPersona(){
    const { nombre_persona } = useParams();
    const [totales, setTotales] = useState({
        totalSinDescuento: 0,
        totalDescuentos: 0,
        totalAbonos: 0,
        totalGanancia: 0
    });
    const [apartados, setApartados] = useState(null);
    const [apartadosFiltrados, setApartadosFiltrados] = useState(apartados);
    
    const [apartadoAbono, setApartadoAbono] = useState(null);
    const [abonando, setAbonando] = useState(false);
    const [abono, setAbono] = useState(0);

    const { abrirModal, cerrarModal } = useModal();
    const { usuario } = useAuth();

    useEffect(() => {
        // Se suscribe al evento "obtenerApartados" y con el callback guardamos los datos
        // Nos devuelve una función para desuscribirnos
        let unsubscribe;
        const obtenerApartadosDB = async () => {
            unsubscribe = await obtenerApartados(async (docs) => {
                let totalSinDescuento = 0;
                let totalDescuentos = 0;
                let totalAbonos = 0;
                let totalGanancia = 0;

                // Calcular totales
                let documentos = docs.map(async doc => {
                    totalSinDescuento += doc.precio_venta * doc.cantidad;
                    totalDescuentos += doc.descuento;
                    totalAbonos += doc.abono || 0;
                    totalGanancia += ((doc.precio_venta - doc.precio_compra) * doc.cantidad) - doc.descuento;

                    // El nombre sí lo obtenemos desde el producto porque puede que haya cambiado de nombre
                    let { nombre } = await obtenerProducto(doc.id_producto);

                    return{
                        ...doc,
                        nombre
                    }
                });

                documentos = await Promise.all(documentos);
                documentos = documentos.filter(doc => doc.nombre_persona == nombre_persona)

                setApartados(documentos);
                setTotales({
                    totalSinDescuento,
                    totalDescuentos,
                    totalAbonos,
                    totalGanancia
                });
            });
        }
        obtenerApartadosDB();

        // Se desuscribe del evento al desmontar el componente
        return () => {
            if(unsubscribe) unsubscribe();
        }
    }, [])

    const handleAbrirModalApartado = (apartado) => {
        setApartadoAbono(apartado);
        setAbonando(true);
    }

    const handleCerrarModalApartado = () => {
        setApartadoAbono(null);
        setAbonando(false);
        setAbono(0);
    }

    const handleAbonar = async () => {
        if(abono && !isNaN(abono) && parseFloat(abono) > 0){
            // Se actualiza el apartado con el nuevo abono
            let nuevoApartado = {
                ...apartadoAbono,
                abono: (apartadoAbono.abono || 0) + parseFloat(abono)
            }
            
            await actualizarApartado(nuevoApartado);

            await guardarTransaccion({
                descripcion: `Abono de ${nuevoApartado.nombre} ($${parseFloat(abono)})`,
                dinero: parseFloat(abono),
                id_apartado: nuevoApartado.id
            });

            await guardarMovimiento(`${usuario.nombre} guardó el abono de $${parseFloat(abono)} para ${nuevoApartado.nombre} de ${nuevoApartado.nombre_persona} - Total abonado: $${nuevoApartado.abono} de $${nuevoApartado.precio_venta * parseInt(nuevoApartado.cantidad) - nuevoApartado.descuento}`);
        }

        handleCerrarModalApartado();
    }

    const handleApartadosFiltrados = filtrados => {
        let totalSinDescuento = 0;
        let totalDescuentos = 0;
        let totalAbonos = 0;
        let totalGanancia = 0;

        filtrados.forEach(filtrado => {
            totalSinDescuento += filtrado.precio_venta * filtrado.cantidad;
            totalDescuentos += filtrado.descuento;
            totalAbonos += filtrado.abono || 0;
            totalGanancia += ((filtrado.precio_venta - filtrado.precio_compra) * filtrado.cantidad) - filtrado.descuento;
        })

        setTotales({
            totalSinDescuento,
            totalDescuentos,
            totalAbonos,
            totalGanancia
        });
        setApartadosFiltrados(filtrados);
    }

    const handleCompletar = async (apartado) => {
        abrirModal({
            texto: "¿Quieres completar el apartado? (Se registrará como una venta y se eliminarán los abonos)",
            onResult: async (res) => {
                if(res){
                    // Pasar los datos a la venta
                    let venta = {
                        id_producto: apartado.id_producto,
                        cantidad: apartado.cantidad,
                        descuento: apartado.descuento,
                        nombre: apartado.nombre,
                        precio_compra: apartado.precio_compra,
                        precio_venta: apartado.precio_venta,

                        //? Solo lo puede ver el admin
                        creador: usuario.nombre,
                        nombre_persona: apartado.nombre_persona
                    }
                    
                    let docVenta = await guardarVenta(venta);

                    // Si se completa, se borran los abonos y se deja solamente la venta total
                    await borrarTransaccionesConCondicion(["id_apartado", "==", apartado.id]);

                    await guardarTransaccion({
                        descripcion: `Venta de ${apartado.nombre} (${apartado.cantidad})`,
                        dinero: (apartado.precio_venta * apartado.cantidad) - apartado.descuento,
                        id_venta: docVenta.id
                    });

                    // Se borra después para cerrar la ventana modal hasta que desaparezca el apartado
                    await borrarApartado(apartado.id);

                    await guardarMovimiento(`${usuario.nombre} completó el producto apartado ${apartado.nombre} para ${apartado.nombre_persona} - cantidad: ${apartado.cantidad} - descuento: $${apartado.descuento} - total: $${apartado.precio_venta * apartado.cantidad - apartado.descuento}`);
                }

                cerrarModal();
            }
        });
    }

    const handleBorrar = async (apartado) => {
        abrirModal({
            texto: "¿Quieres borrar el producto apartado? (Se regresarán los productos al inventario y se eliminarán los abonos)",
            onResult: async (res) => {
                if(res){
                    let producto = await obtenerProducto(apartado.id_producto);

                    if(producto){
                        await actualizarProducto({
                            ...producto,
                            cantidad: parseInt(producto.cantidad) + parseInt(apartado.cantidad)
                        });
                    }

                    // Si se cancela, se borran los abonos también
                    await borrarTransaccionesConCondicion(["id_apartado", "==", apartado.id]);

                    // Se borra después para cerrar la ventana modal hasta que desaparezca el apartado
                    await borrarApartado(apartado.id);

                    await guardarMovimiento(`${usuario.nombre} borró el producto apartado "${apartado.nombre}" para ${apartado.nombre_persona} - cantidad: ${apartado.cantidad} - descuento: $${apartado.descuento} - total: $${apartado.precio_venta * apartado.cantidad - apartado.descuento}`);
                }

                cerrarModal();
            }
        });
    }

    if(apartados === null) return <h2 className="titulo contenedor">Cargando...</h2>

    return(
        <>
            <h1 className="titulo contenedor">Apartados {nombre_persona.toUpperCase()}</h1>

            <dialog className="modal--dialog" open={abonando}>
                <div className="modal__contenedor">
                    <p className="modal__texto" style={{marginBottom: "2rem"}}>¿Cuanto quieres abonar?</p>

                    <input className="modal--dialog__input" type="number" value={abono} onChange={(e) => setAbono(e.target.value)} />

                    <div className="modal__botones">
                        <button className="boton boton--verde" onClick={() => handleAbonar()}>Aceptar</button>
                        <button className="boton boton--rojo" onClick={() => handleCerrarModalApartado()}>Cancelar</button>
                    </div>
                </div>
            </dialog>

            <div className="contenedor">
                <Link to="/apartados" style={{display:"flex",gap:"0.5rem",alignItems:"center"}}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><path fill="none" stroke="none" d="M0 0h24v24H0z"/><path d="M5 12h14M5 12l4 4m-4-4 4-4"/></svg>
                    Regresar a apartados
                </Link>
            </div>

            {
                apartados.length > 0 ? (
                    <div className="contenedor">
                        <Filtro
                            elementos={apartados}
                            handleElementosFiltrados={handleApartadosFiltrados}
                            funcionFiltro={filtrarElementos}
                        />

                        {
                            apartadosFiltrados?.length > 0 ? (
                                <table className="tabla">

                                    <thead className="tabla__titulos">
                                        <tr>
                                            <th>Producto</th>
                                            <th>Fecha</th>
                                            <th>Nombre</th>
                                            <th>Telefono</th>
                                            <th>Cantidad</th>
                                            <th>Subtotal</th>
                                            <th>Descuento</th>
                                            <th>Abono</th>
                                            <th>Total</th>
                                            <th>Restante</th>
                                            <th>Ganancia</th>
                                            <th></th>
                                            <th></th>
                                            <th></th>
                                            {
                                                usuario.rol == ROLES.ADMIN && (
                                                    <>
                                                        <th>Creador</th>
                                                        <th>ID</th>
                                                    </>
                                                )
                                            }
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            apartadosFiltrados.map(apartado => (
                                                <tr className="tabla__fila" key={apartado.id}>
                                                    <td>{apartado.nombre}</td>
                                                    <td>{timestampAFecha(apartado.fecha)}</td>
                                                    <td><a href={`/apartados/${apartado.id}`}>{apartado.nombre_persona}</a></td>
                                                    <td>{apartado.telefono_persona || "-"}</td>
                                                    <td>{apartado.cantidad}</td>
                                                    <td className="tabla__precio">${apartado.cantidad * apartado.precio_venta}</td>
                                                    <td className="tabla__precio">${apartado.descuento}</td>
                                                    <td className="tabla__precio">${apartado.abono || 0}</td>
                                                    <td className="tabla__precio">${apartado.cantidad * apartado.precio_venta - apartado.descuento}</td>
                                                    <td className="tabla__precio">${(apartado.cantidad * apartado.precio_venta - apartado.descuento) - (apartado.abono || 0)}</td>
                                                    <td className="tabla__precio">${(apartado.precio_venta - apartado.precio_compra) * apartado.cantidad - apartado.descuento}</td>
                                                    
                                                    {
                                                        <>
                                                            <td><button className="tabla__boton boton" onClick={() => handleAbrirModalApartado(apartado)}>Abonar</button></td>
                                                            <td><button className="tabla__boton boton" onClick={() => handleCompletar(apartado)}>Completar</button></td>
                                                            <td><button className="tabla__boton boton" onClick={() => handleBorrar(apartado)}>Borrar</button></td>
                                                        </>
                                                    }

                                                    {
                                                        usuario.rol == ROLES.ADMIN && (
                                                            <>
                                                                <td>{apartado.creador || "-"}</td>
                                                                <td>{apartado.id}</td>
                                                            </>
                                                        )
                                                    }
                                                </tr>
                                            ))
                                        }
                                    </tbody>

                                    <tfoot className="tabla__footer">
                                        <tr>
                                            <td>Total</td>
                                            <td></td>
                                            <td></td>
                                            <td></td>
                                            <td></td>
                                            <td className="tabla__precio">${totales.totalSinDescuento}</td>
                                            <td className="tabla__precio">${totales.totalDescuentos}</td>
                                            <td className="tabla__precio">${totales.totalAbonos}</td>
                                            <td className="tabla__precio">${totales.totalSinDescuento - totales.totalDescuentos}</td>
                                            <td className="tabla__precio">${totales.totalSinDescuento - totales.totalDescuentos - totales.totalAbonos}</td>
                                            <td className="tabla__precio">${totales.totalGanancia}</td>
                                            <td></td>
                                            <td></td>
                                            <td></td>
                                            {
                                                usuario.rol == ROLES.ADMIN && (
                                                    <>
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
                    </div>
                ) : (
                    <h2 className="titulo contenedor">No hay productos apartados</h2>
                )
            }
        </>
    )
}

export default PaginaApartadosPersona;