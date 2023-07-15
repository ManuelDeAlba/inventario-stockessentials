import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { actualizarProducto, guardarTransaccion, guardarCompra, guardarMovimiento, obtenerProducto } from "../firebase";

import { useAuth } from "../context/AuthContext";
import TablaProductos from "../components/TablaProductos";

function FormularioCompras(){
    let { id } = useParams();
    let navigate = useNavigate();

    const { usuario } = useAuth();

    const [producto, setProducto] = useState(null);
    const [nuevoProducto, setNuevoProducto] = useState(null);
    const [cantidad, setCantidad] = useState(0);

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

        // Se guarda la compra en la db para mostrar la tabla
        let compra = {
            id_producto: nuevoProducto.id,
            cantidad,
            precio_compra: nuevoProducto.precio_compra,

            //? Solo lo puede ver el admin
            creador: usuario.nombre
        }
        
        let docCompra = await guardarCompra(compra);

        await guardarTransaccion({
            descripcion: `Compra de ${nuevoProducto.nombre} (${cantidad})`,
            dinero: -(nuevoProducto.precio_compra * cantidad),
            id_compra: docCompra.id
        });

        await guardarMovimiento(`${usuario.nombre} registró una compra de ${compra.cantidad} productos (${nuevoProducto.nombre})`);

        navigate("/compras");
    }

    const handleInput = (e) => {
        const cantidad = Math.max(0, e.target.value);

        // Se actualiza el estado de la cantidad para mostrar el total
        setCantidad(cantidad);

        // Se actualiza el nuevo producto para mostrar la tabla y para actualizar en la db
        setNuevoProducto({
            ...producto,
            cantidad: (parseInt(producto.cantidad) + parseInt(cantidad)) || 0
        });
    }

    if(producto === null) return <h2 className="titulo contenedor">Cargando...</h2>
    
    if(producto === undefined) return <h2 className="titulo contenedor">No existe el producto</h2>
    
    return(
        <>
            <h1 className="titulo contenedor">Comprar {producto.nombre}</h1>
            
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
                                value={cantidad}
                                inputMode="numeric"
                                onInput={handleInput}
                                required
                            />
                        </div>

                        <h2 style={{marginTop: "10px"}}>Costo: ${cantidad * nuevoProducto.precio_compra}</h2>
                    </div>

                    <TablaProductos productos={[nuevoProducto]} />

                    <input type="submit" value="Comprar" className="boton form__boton" />
                </form>
            </div>
        </>
    )
}

export default FormularioCompras;