import { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { ROLES } from "../constantes";
import { useModal } from "../context/ModalConfirmProvider";

import { actualizarProducto, borrarCompra, borrarTransaccionesConCondicion, guardarMovimiento, obtenerCompras, obtenerProducto } from "../firebase";
import { filtrarProductos, timestampAFecha } from "../utils";

import Filtro from "../components/Filtro";

function PaginaCompras(){
    const [total, setTotal] = useState(0);
    const [compras, setCompras] = useState(null);
    const [comprasFiltradas, setComprasFiltradas] = useState(compras);

    const { abrirModal, cerrarModal } = useModal();
    const { usuario } = useAuth();

    useEffect(() => {
        // Se suscribe al evento "obtenerCompras" y con el callback guardamos los datos
        // Nos devuelve una función para desuscribirnos
        let unsubscribe;
        const obtenerComprasDB = async () => {
            unsubscribe = await obtenerCompras(async (docs) => {
                let precioCompraTotal = 0;

                // Por cada compra, calculamos los totales para la tabla
                let documentos = docs.map(async doc => {
                    let precioCompra = doc.cantidad * doc.precio_compra;
                    // Este total es para mostrar el total de todas las compras en la tabla
                    precioCompraTotal += precioCompra;

                    // El nombre sí lo obtenemos desde el producto porque puede que haya cambiado de nombre
                    let { nombre } = await obtenerProducto(doc.id_producto);

                    return {
                        ...doc,
                        nombre,
                        total: precioCompra
                    }
                })

                documentos = await Promise.all(documentos);
    
                setTotal(precioCompraTotal);
                setCompras(documentos);
            });
        }
        obtenerComprasDB();

        // Se desuscribe del evento al desmontar el componente
        return () => {
            if(unsubscribe) unsubscribe();
        }
    }, [])

    const handleComprasFiltradas = filtradas => {
        let precioCompraTotal = 0;

        filtradas.forEach(filtrada => {
            precioCompraTotal += filtrada.cantidad * filtrada.precio_compra;
        })

        setTotal(precioCompraTotal);
        setComprasFiltradas(filtradas);
    }

    const handleBorrar = ({ id, id_producto, nombre, cantidad, precio_compra }) => {
        abrirModal({
            texto: "¿Quieres borrar la compra? (Se descontará del inventario)",
            onResult: async (res) => {
                if(res){
                    await borrarCompra(id);

                    await guardarMovimiento(`${usuario.nombre} borró la compra de "${nombre} - cantidad: ${cantidad} - precio: $${precio_compra * cantidad}"`);

                    // Actualizar el producto para que se reste la cantidad si ya no existe esa compra
                    let producto = await obtenerProducto(id_producto);

                    if(producto){
                        await actualizarProducto({
                            ...producto,
                            cantidad: parseInt(producto.cantidad) - parseInt(cantidad)
                        });
                    }

                    // Borrar transacciones relacionadas a la compra
                    await borrarTransaccionesConCondicion(["id_compra", "==", id]);
                }

                cerrarModal();
            }
        });
    }

    if(compras === null) return <h2 className="titulo contenedor">Cargando...</h2>

    if(compras.length <= 0) return <h2 className="titulo contenedor">No hay compras</h2>

    return(
        <>
            <h1 className="titulo contenedor">Compras</h1>

            <div className="contenedor">
                <Filtro
                    elementos={compras}
                    handleElementosFiltrados={handleComprasFiltradas}
                    funcionFiltro={filtrarProductos}
                />

                {
                    comprasFiltradas?.length > 0 ? (
                        <table className="tabla">
                            <thead className="tabla__titulos">
                                <tr>
                                    <th>Nombre</th>
                                    <th>Fecha</th>
                                    <th>Cantidad</th>
                                    <th>Precio compra total</th>
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
                                    comprasFiltradas.map(compra => (
                                        <tr className="tabla__fila" key={compra.id}>
                                            <td>{compra.nombre}</td>
                                            <td>{timestampAFecha(compra.fecha)}</td>
                                            <td>{compra.cantidad}</td>
                                            <td className="tabla__precio">${compra.total}</td>
                                            
                                            {
                                                <td><button className="tabla__boton boton" onClick={() => handleBorrar(compra)}>Borrar</button></td>
                                            }
                                            
                                            {
                                                usuario.rol == ROLES.ADMIN && (
                                                    <>
                                                        <td>{compra.creador || "-"}</td>
                                                        <td>{compra.id}</td>
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
                                    <td className="tabla__precio">${total}</td>
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
        </>
    )
}

export default PaginaCompras;