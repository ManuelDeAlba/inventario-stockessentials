import { useState, useEffect } from "react";
import { actualizarProducto, crearProducto, guardarMovimiento, obtenerProducto, obtenerProductos } from "../firebase";
import { useAuth } from "../context/AuthContext";

import TablaProductos from "../components/TablaProductos";

function PaginaInicio(){
    const [producto, setProducto] = useState({
        id: "",
        nombre: "",
        cantidad: 0,
        precio_compra: 0,
        precio_venta: 0
    });
    const [productos, setProductos] = useState([]);
    const [editando, setEditando] = useState(false);

    const { usuario } = useAuth();

    useEffect(() => {
        // Se suscribe al evento "obtenerProductos" y con el callback guardamos los datos
        // Nos devuelve una función para desuscribirnos
        let unsubscribe;
        const obtenerProductosDB = async () => {
            let unsub = await obtenerProductos((docs) => {
                setProductos(docs);
            });

            unsubscribe = unsub;
        }

        obtenerProductosDB();

        // Se desuscribe del evento al desmontar el componente
        return () => {
            if(unsubscribe) unsubscribe();
        }
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Datos mínimos compartidos
        let prod = {
            nombre: producto.nombre,
            precio_compra: Number(producto.precio_compra),
            precio_venta: Number(producto.precio_venta)
        }

        if(!editando){
            e.target.reset();

            // Se le agregan los atributos que solo puede ver el administrador
            prod.creador = usuario.nombre

            // Se crea el producto con los datos mínimos
            await crearProducto(prod);

            // Se guarda el movimiento en la base de datos
            await guardarMovimiento(`${usuario.nombre} creó el producto "${prod.nombre}"`);
        } else {
            setEditando(false);

            // Solo si se está editando, se manda el id y la cantidad para actualizar el producto completo
            // Si solo se está creando, no existe su id ni una cantidad definida
            prod.id = producto.id;
            prod.cantidad = producto.cantidad;

            // Se le agregan o actualizan los atributos que solo puede ver el administrador
            prod.creador = producto.creador || "-",
            prod.ultima_modificacion = usuario.nombre,
            prod.ultimo_precio_compra = producto.ultimo_precio_compra,
            prod.ultimo_precio_venta = producto.ultimo_precio_venta

            // Se actualiza el producto con los datos nuevos
            await actualizarProducto(prod);

            // Se guarda el movimiento en la base de datos
            await guardarMovimiento(`${usuario.nombre} editó el producto "${prod.nombre}" - ultimo_precio_compra: $${producto.ultimo_precio_compra} - ultimo_precio_venta: $${producto.ultimo_precio_venta}`);
        }

        e.target.querySelector(".form__input").focus();
        setProducto({
            id: "",
            nombre: "",
            cantidad: 0,
            precio_compra: 0,
            precio_venta: 0
        });
    }

    const handleInput = (e) => {
        setProducto({
            ...producto,
            [e.target.name]: e.target.value
        });
    }

    const handleEditar = async id_producto => {
        // Poner modo editar
        setEditando(true);
        
        // Cargar datos
        let prod = await obtenerProducto(id_producto);

        setProducto({
            id: id_producto,
            cantidad: prod.cantidad,
            nombre: prod.nombre,
            precio_compra: Number(prod.precio_compra),
            precio_venta: Number(prod.precio_venta),

            //? Se pasan los atributos actuales que se van a usar para el administrador
            //? Se tienen que poner en el estado para usarlos en el handleSubmit (después se van a borrar del estado)
            creador: prod.creador,
            ultimo_precio_compra: Number(prod.precio_compra),
            ultimo_precio_venta: Number(prod.precio_venta)
        })
    }

    return(
        <>
            <h1 className="titulo titulo--principal contenedor">StockEssentials</h1>

            <div className="contenedor">
                {/* Formulario agregar producto */}
                <form action="" className="form" onSubmit={handleSubmit}>
                    <div className="form__apartado">
                        <label htmlFor="nombre">Nombre</label>
                        <input
                            type="text"
                            className="form__input"
                            name="nombre"
                            id="nombre"
                            onInput={handleInput}
                            value={producto.nombre}
                            required
                        />
                    </div>

                    <div className="form__apartado">
                        <label htmlFor="precio_compra">Precio compra</label>
                        <input
                            type="number"
                            className="form__input"
                            name="precio_compra"
                            id="precio_compra"
                            min={0}
                            step={.01}
                            inputMode="numeric"
                            onInput={handleInput}
                            value={producto.precio_compra}
                            required
                        />
                    </div>

                    <div className="form__apartado">
                        <label htmlFor="precio_venta">Precio venta</label>
                        <input
                            type="number"
                            className="form__input"
                            name="precio_venta"
                            id="precio_venta"
                            min={0}
                            inputMode="numeric"
                            onInput={handleInput}
                            value={producto.precio_venta}
                            required
                        />
                    </div>

                    {
                        !editando ? (
                            <input type="submit" value="Agregar producto" className="boton form__boton" />
                        ) : (
                            <input type="submit" value="Editar" className="boton form__boton" />
                        )
                    }
                </form>

                {
                    productos.length > 0 ? (
                        <>
                            <h2 className="titulo contenedor">Inventario</h2>
                            <TablaProductos
                                productos={productos}
                                handleEditar={handleEditar}
                                conAcciones
                                conResultados
                                conFiltro
                            />
                        </>
                    ) : (
                        <h2 className="titulo contenedor">Sin productos</h2>
                    )
                }
            </div>
        </>
    )
}

export default PaginaInicio;