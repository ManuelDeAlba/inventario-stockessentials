import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import { actualizarProducto, guardarApartado, guardarMovimiento, obtenerProductos } from "../firebase";
import Filtro from "../components/Filtro";
import { filtrarElementos } from "../utils";

const CLAVES_NO_ITERABLES = ["nombre", "telefono", "descuento"];

function FormularioApartar(){
    const navigate = useNavigate();

    const [productos, setProductos] = useState(null);
    const [productosFiltrados, setProductosFiltrados] = useState([]);
    const [cantidades, setCantidades] = useState({});

    const { usuario } = useAuth();

    useEffect(() => {
        let unsubscribe;
        const obtenerProductosDB = async () => {
            unsubscribe = await obtenerProductos((docs) => {
                setProductos(docs);
            });
        }
        obtenerProductosDB();

        return () => {
            if(unsubscribe) unsubscribe();
        }
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault();

        let formData = new FormData(e.target);

        /*
            Se obtiene la información del formulario
            Nombre persona
            Telefono
            Por cada producto [id, cantidad_apartada]
        */
        let data = {}

        data.nombre = formData.get("nombre");
        data.telefono = formData.get("telefono");
        data.descuento = formData.get("descuento");

        Object.entries(cantidades).forEach(([id, cantidad]) => {
            data[id] = cantidad;
        })

        // Por cada producto, guardar el registro de apartado
        for(let [clave, valor] of Object.entries(data)){
            if(CLAVES_NO_ITERABLES.includes(clave)) continue;

            let prod = productos.filter(producto => producto.id == clave)[0];

            // Documento de apartado
            let doc = {
                id_producto: prod.id, // Se guarda el id del producto para poder borrarlo
                nombre_persona: data.nombre,
                telefono_persona: data.telefono,
                cantidad: valor.toString(),
                descuento: Number(data.descuento),
                precio_compra: prod.precio_compra, // Se guarda para después pasarlo a venta si se completa
                precio_venta: prod.precio_venta,

                //? Solo lo puede ver el admin
                creador: usuario.nombre
            }

            // Quitar cantidad del inventario
            await actualizarProducto({
                ...prod,
                cantidad: prod.cantidad - valor
            });

            await guardarApartado(doc);

            await guardarMovimiento(`${usuario.nombre} registró un apartado de ${doc.cantidad} productos (${prod.nombre}) para ${doc.nombre_persona} con un total de $${doc.precio_venta * doc.cantidad} con descuento de $${doc.descuento}`);

            e.target.reset();

            navigate("/apartados");
        }
    }

    const handleProductosFiltrados = productos => {
        setProductosFiltrados(productos);
    }

    const handleCantidad = e => {
        const id = e.target.name;
        const value = e.target.value;

        setCantidades(prev => {
            let prevClone = structuredClone(prev);

            if(value && value != "0") prevClone[id] = Number(value);
            else delete prevClone[id];

            return prevClone;
        })
    }

    const handleCancelar = id => {
        setCantidades(prev => {
            let prevClone = structuredClone(prev);

            delete prevClone[id];

            return prevClone;
        })
    }

    if(!productos) return <h2 className="titulo contenedor">Cargando...</h2>

    if(productos.length <= 0) return <h2 className="titulo contenedor">No hay productos</h2>

    return(
        <>
            <h1 className="titulo contenedor">Apartar productos</h1>

            <div className="contenedor">
                <form className="form" onSubmit={handleSubmit}>
                    <Filtro
                        elementos={productos}
                        handleElementosFiltrados={handleProductosFiltrados}
                        funcionFiltro={filtrarElementos}
                    />

                    <table className="tabla">
                        <thead className="tabla__titulos">
                            <tr>
                                <th>Nombre</th>
                                <th>Cantidad</th>
                                <th>Precio venta</th>
                                <th></th>
                            </tr>
                        </thead>

                        <tbody>
                            {
                                productosFiltrados?.length > 0 && productosFiltrados.map(producto => (
                                    <tr className="tabla__fila" key={producto.id}>
                                        <td>{producto.nombre}</td>
                                        <td>{producto.cantidad}</td>
                                        <td className="tabla__precio">${producto.precio_venta}</td>
                                        {
                                            <td>
                                                <input
                                                    type="number"
                                                    name={producto.id}
                                                    className="form__input form__input--number"
                                                    min={0}
                                                    max={producto.cantidad}
                                                    onInput={handleCantidad}
                                                    value={cantidades?.[producto.id] || ""}
                                                />
                                            </td>
                                        }
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
            
                    <div className="form__apartado">
                        <label htmlFor="nombre">Nombre</label>
                        <input
                            type="text"
                            name="nombre"
                            id="nombre"
                            className="form__input"
                            required
                        />
                    </div>

                    <div className="form__apartado">
                        <label htmlFor="telefono">Telefono</label>
                        <input
                            type="tel"
                            className="form__input"
                            name="telefono"
                            id="telefono"
                            pattern="[0-9]{10}"
                            inputMode="tel"
                            maxLength={10}
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
                            defaultValue={0}
                            inputMode="numeric"
                            required
                        />
                    </div>

                    {/* Tabla con los productos elegidos */}
                    {
                        Object.entries(cantidades).length > 0 && (
                            <>
                                <h2 className="titulo">Productos apartados</h2>
                                <table className="tabla">
                                    <thead className="tabla__titulos">
                                        <tr>
                                            <th>Nombre</th>
                                            <th>Cantidad</th>
                                            <th>Total</th>
                                            <th>Cancelar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            Object.entries(cantidades).map(([id, cantidad]) => {
                                                let prod = productos.filter(producto => producto.id == id)[0];

                                                return(
                                                    <tr key={id} className="tabla__fila">
                                                        <td>{prod.nombre}</td>
                                                        <td>{cantidad}</td>
                                                        <td className="tabla__precio">${cantidad * prod.precio_venta}</td>
                                                        <td><button className="boton boton--rojo" style={{display: "block", marginInline: "auto"}} type="button" onClick={() => handleCancelar(prod.id)}>X</button></td>
                                                    </tr>
                                                )
                                            })
                                        }
                                    </tbody>
                                </table>
                            </>
                        )
                    }

                    <input type="submit" value="Apartar" className="boton form__boton" />
                </form>
            </div>
        </>
    )
}

export default FormularioApartar;