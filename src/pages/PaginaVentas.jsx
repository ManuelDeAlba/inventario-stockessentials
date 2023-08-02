import { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { ROLES } from "../constantes";
import { useModal } from "../context/ModalConfirmProvider";

import { obtenerVentas, borrarVenta, guardarMovimiento, borrarTransaccionesConCondicion, obtenerProducto, actualizarProducto } from "../firebase";
import { filtrarElementos, timestampAFecha } from "../utils";

import Filtro from "../components/Filtro";

function PaginaVentas(){
    const [totales, setTotales] = useState({
        descuentos: 0,
        total: 0,
        ganancia: 0
    });
    const [ventas, setVentas] = useState(null);
    const [ventasFiltradas, setVentasFiltradas] = useState(ventas);

    const { abrirModal, cerrarModal } = useModal();
    const { usuario } = useAuth();

    useEffect(() => {
        // Se suscribe al evento "obtenerVentas" y con el callback guardamos los datos
        // Nos devuelve una función para desuscribirnos
        let unsubscribe;
        const obtenerVentasDB = async () => {
            unsubscribe = await obtenerVentas(async (docs) => {
                let descuentosTotales = 0;
                let precioVentaTotal = 0;
                let gananciaTotal = 0;

                // Por cada venta, calculamos los totales para la tabla
                let documentos = docs.map(async doc => {
                    let precioVenta = (doc.cantidad * doc.precio_venta) - doc.descuento;
                    let ganancia = ((doc.precio_venta - doc.precio_compra) * doc.cantidad) - doc.descuento;

                    // Estos totales son para mostrar en la tabla de ventas
                    // Se quita el descuento de el total de las ventas y de las ganancias
                    descuentosTotales += Number(doc.descuento);
                    precioVentaTotal += precioVenta;
                    gananciaTotal += ganancia;

                    // El nombre sí lo obtenemos desde el producto porque puede que haya cambiado de nombre
                    let { nombre } = await obtenerProducto(doc.id_producto);

                    // Se quita el descuento de el total y la ganancia de esa venta individual
                    return {
                        ...doc,
                        total: precioVenta,
                        nombre,
                        ganancia: ganancia
                    }
                })

                documentos = await Promise.all(documentos);
    
                setTotales({
                    descuentos: descuentosTotales,
                    total: precioVentaTotal,
                    ganancia: gananciaTotal
                });
                setVentas(documentos);
            });
        }
        obtenerVentasDB();

        // Se desuscribe del evento al desmontar el componente
        return () => {
            if(unsubscribe) unsubscribe();
        }
    }, [])

    const handleVendasFiltradas = filtradas => {
        let descuentosTotales = 0;
        let precioVentaTotal = 0;
        let gananciaTotal = 0;

        filtradas.forEach(filtrada => {
            let precioVenta = (filtrada.cantidad * filtrada.precio_venta) - filtrada.descuento;
            let ganancia = ((filtrada.precio_venta - filtrada.precio_compra) * filtrada.cantidad) - filtrada.descuento;

            descuentosTotales += Number(filtrada.descuento);
            precioVentaTotal += precioVenta;
            gananciaTotal += ganancia;
        })

        setTotales({
            descuentos: descuentosTotales,
            total: precioVentaTotal,
            ganancia: gananciaTotal
        });
        setVentasFiltradas(filtradas);
    }

    const handleBorrar = ({ id, id_producto, nombre, cantidad, precio_compra, precio_venta, descuento }) => {
        abrirModal({
            texto: "¿Quieres borrar la venta? (Se regresarán los productos al inventario)",
            onResult: async (res) => {
                if(res){
                    await borrarVenta(id);

                    await guardarMovimiento(`${usuario.nombre} borró la venta de "${nombre} - cantidad: ${cantidad} - descuento: $${descuento} - total: $${precio_venta * cantidad - descuento} - ganancia: $${(precio_venta - precio_compra) * cantidad - descuento}"`);

                    // Actualizar el producto para que se regrese la cantidad al inventario
                    let producto = await obtenerProducto(id_producto);

                    if(producto){
                        await actualizarProducto({
                            ...producto,
                            cantidad: parseInt(producto.cantidad) + parseInt(cantidad)
                        });
                    }

                    // Borrar transacciones relacionadas a la venta
                    await borrarTransaccionesConCondicion(["id_venta", "==", id]);
                }

                cerrarModal();
            }
        });
    }

    if(ventas === null) return <h2 className="titulo contenedor">Cargando...</h2>

    if(ventas.length <= 0) return <h2 className="titulo contenedor">No hay ventas</h2>

    return(
        <>
            <h1 className="titulo contenedor">Ventas</h1>

            <div className="contenedor">
                <Filtro
                    elementos={ventas}
                    handleElementosFiltrados={handleVendasFiltradas}
                    funcionFiltro={filtrarElementos}
                />

                {
                    ventasFiltradas?.length > 0 ? (
                        <table className="tabla">
                            <thead className="tabla__titulos">
                                <tr>
                                    <th>Nombre</th>
                                    <th>Fecha</th>
                                    <th>Cantidad</th>
                                    <th>Total sin descuento</th>
                                    <th>Descuento</th>
                                    <th>Total venta</th>
                                    <th>Ganancia</th>
                                    <th></th>
                                    {
                                        usuario.rol == ROLES.ADMIN && (
                                            <>
                                                <th>Creador</th>
                                                <th>ID</th>
                                                <th>Nombre persona</th>
                                            </>
                                        )
                                    }
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    ventasFiltradas.map(venta => (
                                        <tr className="tabla__fila" key={venta.id}>
                                            <td>{venta.nombre}</td>
                                            <td>{timestampAFecha(venta.fecha)}</td>
                                            <td>{venta.cantidad}</td>
                                            <td className="tabla__precio">${venta.total + venta.descuento}</td>
                                            <td className="tabla__precio">${venta.descuento}</td>
                                            <td className="tabla__precio">${venta.total}</td>
                                            <td className="tabla__precio">${venta.ganancia}</td>
                                            
                                            {
                                                <td><button className="tabla__boton boton" onClick={() => handleBorrar(venta)}>Borrar</button></td>
                                            }

                                            {
                                                usuario.rol == ROLES.ADMIN && (
                                                    <>
                                                        <td>{venta.creador || "-"}</td>
                                                        <td>{venta.id}</td>
                                                        <td>{venta.nombre_persona || "-"}</td>
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
                                    <td className="tabla__precio">${totales.total + totales.descuentos}</td>
                                    <td className="tabla__precio">${totales.descuentos}</td>
                                    <td className="tabla__precio">${totales.total}</td>
                                    <td className="tabla__precio">${totales.ganancia}</td>
                                    <td></td>
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
            </div>
        </>
    )
}

export default PaginaVentas;