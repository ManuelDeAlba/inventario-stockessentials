import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { obtenerProducto, actualizarProducto, guardarVenta, guardarMovimiento, guardarTransaccion } from "../firebase";

import TablaProductos from "../components/TablaProductos";
import { obtenerFecha } from "../utils";
import { useAuth } from "../context/AuthContext";

function FormularioVenta(){
    let { id } = useParams();
    let navigate = useNavigate();

    const { usuario } = useAuth();

    const [producto, setProducto] = useState(null);
    const [nuevoProducto, setNuevoProducto] = useState(null);
    const [cantidad, setCantidad] = useState(0);
    const [descuento, setDescuento] = useState(0);

    useEffect(() => {
        const obtenerProductoDB = async () => {
            let doc = await obtenerProducto(id);

            setProducto(doc);
            setNuevoProducto(doc);
        }

        obtenerProductoDB();
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault();

        e.target.reset();

        e.target.querySelector(".form__input").focus();

        // Se actualiza la cantidad del producto
        await actualizarProducto(nuevoProducto);

        // Se guarda la venta en la db para mostrar la tabla
        let venta = {
            id_producto: nuevoProducto.id,
            fecha: obtenerFecha(new Date()),
            cantidad,
            descuento,
            precio_compra: nuevoProducto.precio_compra,
            precio_venta: nuevoProducto.precio_venta,

            //? Solo lo puede ver el admin
            creador: usuario.nombre
        }
        
        let docVenta = await guardarVenta(venta);

        await guardarTransaccion({
            descripcion: `Venta de ${nuevoProducto.nombre} (${cantidad})`,
            dinero: (nuevoProducto.precio_venta * cantidad) - descuento,
            id_venta: docVenta.id
        });

        await guardarMovimiento(`${usuario.nombre} registró una venta de ${venta.cantidad} productos (${venta.nombre}) con descuento de $${venta.descuento}`);

        navigate("/ventas");
    }

    const handleCantidad = (e) => {
        // Se limita la cantidad a los productos existentes, no puede sobrepasar
        // Tampoco puede ser < 0
        const cant = Math.min(producto.cantidad, Math.max(e.target.value, 0));

        // Se actualiza el estado de la cantidad para mostrar el total
        setCantidad(cant);

        // Se actualiza el nuevo producto para mostrar la tabla y para actualizar en la db
        setNuevoProducto({
            ...producto,
            cantidad: (parseInt(producto.cantidad) - parseInt(cant))
        });
    }

    const handleDescuento = e => {
        /* Se guarda el estado del descuento, aquí no se agrega al producto como la cantidad que se tiene que restar
        En este caso al crear la venta sí se agrega el descuento */
        setDescuento(Math.max(0, e.target.value));
    }

    if(producto === null) return <h2 className="titulo contenedor">Cargando...</h2>
    
    if(producto === undefined) return <h2 className="titulo contenedor">No existe el producto</h2>
    
    return(
        <>
            <h1 className="titulo contenedor">Vender {producto.nombre}</h1>
            
            <div className="contenedor">
                <form action="" className="form" onSubmit={handleSubmit}>
                    <TablaProductos productos={[producto]} />

                    <div style={{margin: "20px 0"}}>
                        <div className="form__apartado">
                            <label htmlFor="cantidad">Cantidad</label>
                            <input
                                type="number"
                                className="form__input"
                                name="cantidad"
                                id="cantidad"
                                min={0}
                                max={producto.cantidad}
                                inputMode="numeric"
                                onInput={handleCantidad}
                                value={cantidad}
                                required
                            />
                        </div>

                        <div className="form__apartado">
                            <label htmlFor="descuento">Descuento</label>
                            <input
                                type="number"
                                className="form__input"
                                name="descuento"
                                id="descuento"
                                min={0}
                                inputMode="numeric"
                                onInput={handleDescuento}
                                value={descuento}
                                required
                            />
                        </div>

                        <h2 style={{marginTop: "10px"}}>Total venta: ${(cantidad * nuevoProducto.precio_venta) - descuento}</h2>
                        <h2>Ganancia: ${cantidad * (nuevoProducto.precio_venta - nuevoProducto.precio_compra) - descuento}</h2>
                    </div>

                    <TablaProductos productos={[nuevoProducto]} />

                    <input type="submit" value="Vender" className="boton form__boton" />
                </form>
            </div>
        </>
    )
}

export default FormularioVenta;