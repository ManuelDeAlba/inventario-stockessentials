import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { ROLES } from "../constantes";
import { useModal } from "../context/ModalConfirmProvider";

import { borrarImagen, borrarProducto, guardarMovimiento } from "../firebase";
import { filtrarElementos } from "../utils";

import Filtro from "./Filtro";

function TablaProductos({ productos, handleEditar, conAcciones, conResultados, conFiltro }){
    const [totales, setTotales] = useState({
        totalCompra: 0,
        totalVenta: 0,
        totalGanancia: 0
    });
    // Productos filtrados para mostrar en la tabla
    const [productosFiltrados, setProductosFiltrados] = useState(productos);

    const { abrirModal, cerrarModal } = useModal();
    const { usuario } = useAuth();

    // Cuando no se usa el filtro, los productos filtrados
    // también se actualizan al cambiar las props pero con los elementos completos
    // y se calculan los totales por si se usa conResultados
    useEffect(() => {
        if(!conFiltro) handleProductosFiltrados(productos);
    }, [productos])

    // Cuando hay filtro
    // Calcula los totales con los productos ya filtrados
    const handleProductosFiltrados = (filtrados) => {
        let totalCompra = 0;
        let totalVenta = 0;
        let totalGanancia = 0;

        // Se calculan los totales con todos los productos filtrados
        filtrados.forEach(producto => {
            totalCompra += producto.cantidad * producto.precio_compra,
            totalVenta += producto.cantidad * producto.precio_venta,
            totalGanancia += producto.cantidad * (producto.precio_venta - producto.precio_compra)
        })

        setTotales({
            totalCompra,
            totalVenta,
            totalGanancia
        });
        setProductosFiltrados(filtrados);
    }

    const handleBorrar = ({ id, nombre, cantidad, precio_compra, precio_venta, img }) => {
        abrirModal({
            texto: "¿Quieres borrar el producto?",
            onResult: async (res) => {
                if(res){
                    await borrarProducto(id);

                    // Si existe la imagen, la borra
                    if(img) await borrarImagen(id);

                    await guardarMovimiento(`${usuario.nombre} borró el producto "${nombre}" - cantidad: ${cantidad} - precio_compra: $${precio_compra} - precio_venta: $${precio_venta}`);
                }

                cerrarModal();
            }
        });
    }

    return(
        <>
            {
                conFiltro && (
                    <Filtro
                        elementos={productos}
                        handleElementosFiltrados={handleProductosFiltrados}
                        funcionFiltro={filtrarElementos}
                    />
                )
            }

            {
                productosFiltrados?.length > 0 ? (
                    <table className="tabla">
                        <thead className="tabla__titulos">
                            <tr>
                                <th>Nombre</th>
                                <th>Cantidad</th>
                                <th>Precio compra</th>
                                <th>Precio venta</th>
                                <th>Precio compra total</th>
                                <th>Precio venta total</th>
                                <th>Ganancia por unidad</th>
                                <th>Ganancia total</th>
                                {
                                    conAcciones && (
                                        <>
                                            <th></th>
                                            <th></th>
                                            <th></th>
                                            <th></th>
                                        </>
                                    )
                                }

                                {/* CATÁLOGO */}
                                <th>Categoría</th>
                                <th>Imagen</th>

                                {
                                    usuario.rol == ROLES.ADMIN && (
                                        <>
                                            <th>Creador</th>
                                            <th>Última modificación</th>
                                            <th>Último precio compra</th>
                                            <th>Último precio venta</th>
                                            <th>ID</th>
                                        </>
                                    )
                                }
                            </tr>
                        </thead>
                    
                        <tbody>
                            {
                                productosFiltrados.map(producto => (
                                    <tr className="tabla__fila" key={producto.id}>
                                        <td>{producto.nombre}</td>
                                        <td>{producto.cantidad}</td>
                                        <td className="tabla__precio">${producto.precio_compra}</td>
                                        <td className="tabla__precio">${producto.precio_venta}</td>
                                        <td className="tabla__precio">${producto.cantidad * producto.precio_compra}</td>
                                        <td className="tabla__precio">${producto.cantidad * producto.precio_venta}</td>
                                        <td className="tabla__precio">${producto.precio_venta - producto.precio_compra}</td>
                                        <td className="tabla__precio">${producto.cantidad * (producto.precio_venta - producto.precio_compra)}</td>
                                        {
                                            conAcciones && (
                                                <>
                                                    <td><Link to={`/comprar/${producto.id}`} className="tabla__boton boton">Comprar</Link></td>
                                                    <td><Link to={`/vender/${producto.id}`} className="tabla__boton boton">Vender</Link></td>
                                                    <td><button className="tabla__boton boton" onClick={() => handleEditar(producto.id)}>Editar</button></td>
                                                    <td><button className="tabla__boton boton" onClick={() => handleBorrar(producto)}>Borrar</button></td>
                                                </>
                                            )
                                        }

                                        {/* CATÁLOGO */}
                                        <td>{producto.categoria || "-"}</td>
                                        <td>
                                            {
                                                producto.img ? (
                                                    <img className="tabla__img" src={producto.img} alt={`Imagen de ${producto.nombre}`} />
                                                ) : (
                                                    "-"
                                                )
                                            }
                                        </td>

                                        {
                                            usuario.rol == ROLES.ADMIN && (
                                                <>
                                                    <td>{producto.creador || "-"}</td>
                                                    <td>{producto.ultima_modificacion || "-"}</td>
                                                    <td className="tabla__precio">${producto.ultimo_precio_compra || "-"}</td>
                                                    <td className="tabla__precio">${producto.ultimo_precio_venta || "-"}</td>
                                                    <td>{producto.id}</td>
                                                </>
                                            )
                                        }
                                    </tr>
                                ))
                            }
                        </tbody>
                    
                        {
                            conResultados && (
                                <tfoot className="tabla__footer">
                                    <tr>
                                        <td>Total</td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td className="tabla__precio">${totales.totalCompra}</td>
                                        <td className="tabla__precio">${totales.totalVenta}</td>
                                        <td></td>
                                        <td className="tabla__precio">${totales.totalGanancia}</td>
                                        {
                                            conAcciones && (
                                                <>
                                                    <td></td>
                                                    <td></td>
                                                    <td></td>
                                                    <td></td>
                                                </>
                                            )
                                        }
                                        
                                        {/* CATÁLOGO */}
                                        <td></td>
                                        <td></td>
                                        
                                        {
                                            usuario.rol == ROLES.ADMIN && (
                                                <>
                                                    <td></td>
                                                    <td></td>
                                                    <td></td>
                                                    <td></td>
                                                    <td></td>
                                                </>
                                            )
                                        }
                                    </tr>
                                </tfoot>
                            )
                        }
                    </table>
                ) : (
                    <h3 className="titulo" style={{marginTop: "20px"}}>Ningún elemento coincide con el filtro</h3>
                )
            }
        </>
    )
}

export default TablaProductos;