import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import { actualizarProducto, guardarApartado, guardarMovimiento, obtenerProductos } from "../firebase";

const CLAVES_NO_ITERABLES = ["nombre", "telefono", "descuento"];

function FormularioApartar(){
    const navigate = useNavigate();

    const [productos, setProductos] = useState(null);

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
        for(let [clave, valor] of formData.entries()){
            // Si son claves no iterables lo agrega a data sin importar nada
            // Si son iterables excluimos campos vacios o con 0
            if(!CLAVES_NO_ITERABLES.includes(clave) && (!valor || valor == "0")) continue;

            data[clave] = valor;
        }

        // Por cada producto, guardar el registro de apartado
        for(let [clave, valor] of Object.entries(data)){
            if(CLAVES_NO_ITERABLES.includes(clave)) continue;

            let prod = productos.filter(producto => producto.id == clave)[0];

            // Documento de apartado
            let doc = {
                id_producto: prod.id, // Se guarda el id del producto para poder borrarlo
                nombre_persona: data.nombre,
                telefono_persona: data.telefono,
                cantidad: valor,
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

    if(!productos) return <h2 className="titulo contenedor">Cargando...</h2>

    if(productos.length <= 0) return <h2 className="titulo contenedor">No hay productos</h2>

    return(
        <>
            <h1 className="titulo contenedor">Apartar productos</h1>

            <div className="contenedor">
                <form className="form" onSubmit={handleSubmit}>
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
                                productos.map(producto => (
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

                    <input type="submit" value="Apartar" className="boton form__boton" />
                </form>
            </div>
        </>
    )
}

export default FormularioApartar;