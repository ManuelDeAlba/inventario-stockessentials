import { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { ROLES } from "../constantes";
import { useModal } from "../context/ModalConfirmProvider";

import { actualizarProducto, guardarTransaccion, borrarApartado, guardarMovimiento, guardarVenta, obtenerApartados, obtenerProducto } from "../firebase";
import { filtrarElementos, timestampAFecha } from "../utils";

import Filtro from "../components/Filtro";
import { Link } from "react-router-dom";

function PaginaApartados(){
    const [totales, setTotales] = useState({
        totalSinDescuento: 0,
        totalDescuentos: 0,
        totalGanancia: 0
    });
    const [apartados, setApartados] = useState(null);
    const [apartadosFiltrados, setApartadosFiltrados] = useState(apartados);

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
                let totalGanancia = 0;

                // Calcular totales
                let documentos = docs.map(async doc => {
                    totalSinDescuento += doc.precio_venta * doc.cantidad;
                    totalDescuentos += doc.descuento;
                    totalGanancia += ((doc.precio_venta - doc.precio_compra) * doc.cantidad) - doc.descuento;

                    // El nombre sí lo obtenemos desde el producto porque puede que haya cambiado de nombre
                    let { nombre } = await obtenerProducto(doc.id_producto);

                    return{
                        ...doc,
                        nombre
                    }
                });

                documentos = await Promise.all(documentos);

                setApartados(documentos);
                setTotales({
                    totalSinDescuento,
                    totalDescuentos,
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

    const handleApartadosFiltrados = filtrados => {
        let totalSinDescuento = 0;
        let totalDescuentos = 0;
        let totalGanancia = 0;

        filtrados.forEach(filtrado => {
            totalSinDescuento += filtrado.precio_venta * filtrado.cantidad;
            totalDescuentos += filtrado.descuento;
            totalGanancia += ((filtrado.precio_venta - filtrado.precio_compra) * filtrado.cantidad) - filtrado.descuento;
        })

        setTotales({
            totalSinDescuento,
            totalDescuentos,
            totalGanancia
        });
        setApartadosFiltrados(filtrados);
    }

    const handleCompletar = async (apartado) => {
        abrirModal({
            texto: "¿Quieres completar el apartado? (Se registrará como una venta)",
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
            texto: "¿Quieres borrar el producto apartado? (Se regresarán los productos al inventario)",
            onResult: async (res) => {
                if(res){
                    let producto = await obtenerProducto(apartado.id_producto);

                    if(producto){
                        await actualizarProducto({
                            ...producto,
                            cantidad: parseInt(producto.cantidad) + parseInt(apartado.cantidad)
                        });
                    }

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
            <h1 className="titulo contenedor">Apartados</h1>

            <div className="contenedor">
                <Link to="/apartar" className="boton__apartar boton">Apartar productos</Link>
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
                                            <th>Total sin descuento</th>
                                            <th>Descuento</th>
                                            <th>Total</th>
                                            <th>Ganancia</th>
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
                                                    <td>{apartado.nombre_persona}</td>
                                                    <td>{apartado.telefono_persona || "-"}</td>
                                                    <td>{apartado.cantidad}</td>
                                                    <td className="tabla__precio">${apartado.cantidad * apartado.precio_venta}</td>
                                                    <td className="tabla__precio">${apartado.descuento}</td>
                                                    <td className="tabla__precio">${apartado.cantidad * apartado.precio_venta - apartado.descuento}</td>
                                                    <td className="tabla__precio">${(apartado.precio_venta - apartado.precio_compra) * apartado.cantidad - apartado.descuento}</td>
                                                    
                                                    {
                                                        <>
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
                                            <td className="tabla__precio">${totales.totalSinDescuento - totales.totalDescuentos}</td>
                                            <td className="tabla__precio">${totales.totalGanancia}</td>
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

export default PaginaApartados;