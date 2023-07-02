import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { filtrarProductos } from "../utils";
import { borrarProducto, guardarMovimiento } from "../firebase";
import { useModal } from "../context/ModalConfirmProvider";
import { ROLES } from "../constantes";
import { useAuth } from "../context/AuthContext";

function TablaProductos({ productos, handleEditar, conAcciones, conResultados, conFiltro }){
    const [totales, setTotales] = useState({
        totalCompra: 0,
        totalVenta: 0,
        totalGanancia: 0
    });
    const [filtro, setFiltro] = useState(undefined);
    // Productos filtrados para mostrar en la tabla
    const [productosFiltrados, setProductosFiltrados] = useState(productos);

    const { abrirModal, cerrarModal } = useModal();
    const { usuario } = useAuth();

    // Calcula los totales y aplica el filtro a los productos
    const actualizarProductos = () => {
        let totalCompra = 0;
        let totalVenta = 0;
        let totalGanancia = 0;

        // Se aplica el filtro si existe en el input, si no, se ponen los productos completos
        let prodsFiltrados = filtro ? productos.filter(producto => filtrarProductos(filtro, producto)) : productos;

        // Se calculan los totales con todos los productos filtrados
        prodsFiltrados.forEach(producto => {
            totalCompra += producto.cantidad * producto.precio_compra,
            totalVenta += producto.cantidad * producto.precio_venta,
            totalGanancia += producto.cantidad * (producto.precio_venta - producto.precio_compra)
        })

        // Se actualiza el estado
        setTotales({
            totalCompra,
            totalVenta,
            totalGanancia
        });
        setProductosFiltrados(prodsFiltrados);
    }

    // Cada que cambien los productos de las props, se actualiza
    useEffect(() => {
        setProductosFiltrados(productos);

        // Se aplica el filtro por si los productos cambiaron y ya hay un filtro
        // Esto no debería pasar normalmente pero es para asegurar
        actualizarProductos();
    }, [productos])
    
    // Cada que cambie el texto del filtro, se actualizan los productos
    useEffect(() => {
        actualizarProductos();
    }, [filtro])

    const handleFiltro = (e) => {
        setFiltro(e.target.value.toLowerCase());
    }

    const handleBorrar = ({ id, nombre, cantidad, precio_compra, precio_venta }) => {
        abrirModal({
            texto: "¿Quieres borrar el producto?",
            onResult: async (res) => {
                if(res){
                    await borrarProducto(id);

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
                    <input type="text" className="form__input" placeholder="Buscar" onInput={handleFiltro} />
                )
            }
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
        </>
    )
}

export default TablaProductos;