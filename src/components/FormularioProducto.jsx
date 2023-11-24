import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { actualizarProducto, borrarImagen, crearProducto, guardarMovimiento, obtenerProducto, subirImagen } from "../firebase";

function FormularioProducto(){
    const { id_producto } = useParams(); // Para saber si se está editando
    const navigate = useNavigate();
    
    const [imagen, setImagen] = useState(null); // Archivo de imagen para enviar a firebase
    const [errorImagen, setErrorImagen] = useState(null); // Error al subir un tipo de archivo que no es imagen
    const [eliminarImagen, setEliminarImagen] = useState(false);
    const [url, setUrl] = useState(null); // Url de la imagen

    const [producto, setProducto] = useState({
        id: "",
        nombre: "",
        cantidad: 0,
        precio_compra: 0,
        precio_venta: 0,
        categoria: "",
    });
    const { usuario } = useAuth();

    // Si se está editando, se obtiene el producto para rellenar los inputs
    useEffect(() => {
        if(!id_producto) return;

        obtenerProducto(id_producto)
        .then(prod => {
            setProducto({
                id: id_producto,
                cantidad: prod.cantidad,
                nombre: prod.nombre,
                precio_compra: Number(prod.precio_compra),
                precio_venta: Number(prod.precio_venta),
                categoria: prod.categoria || "",
                img: prod.img,
    
                //? Se pasan los atributos actuales que se van a usar para el administrador
                //? Se tienen que poner en el estado para usarlos en el handleSubmit (después se van a borrar del estado)
                creador: prod.creador,
                ultimo_precio_compra: Number(prod.precio_compra),
                ultimo_precio_venta: Number(prod.precio_venta)
            })
            setUrl(prod.img || "");
        })
    }, [])

    // Cuando se renderiza el mismo componente pero en lugar de editar ahora es agregar, se limpian los campos
    useEffect(() => {
        if(!id_producto){
            setProducto({
                id: "",
                nombre: "",
                cantidad: 0,
                precio_compra: 0,
                precio_venta: 0,
                categoria: ""
            });
            setImagen(null);
            setErrorImagen(null);
            setEliminarImagen(false);
            setUrl(null);
        }
    }, [id_producto])

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Datos mínimos compartidos
        let prod = {
            nombre: producto.nombre,
            precio_compra: Number(producto.precio_compra),
            precio_venta: Number(producto.precio_venta),
            categoria: producto.categoria
        }

        // Si se está creando
        if(!id_producto){
            e.target.reset();

            // Se le agregan los atributos que solo puede ver el administrador
            prod.creador = usuario.nombre;

            // Se crea el producto con los datos mínimos
            let productoCreado = await crearProducto(prod);

            // Si se seleccionó una imagen, se sube a storage
            if(imagen){
                let url = await subirImagen(imagen, productoCreado.id);
    
                // Se actualiza el producto y se le pone la imagen
                await actualizarProducto({
                    ...productoCreado,
                    img: url
                });
            }

            // Se guarda el movimiento en la base de datos
            await guardarMovimiento(`${usuario.nombre} creó el producto "${prod.nombre}" (${prod.categoria}) - precio_compra: ${prod.precio_compra} - precio_venta: ${prod.precio_venta}`);
        } else {
            // Solo si se está editando, se manda el id y la cantidad para actualizar el producto completo
            // Si solo se está creando, no existe su id ni una cantidad definida
            prod.id = producto.id;
            prod.cantidad = producto.cantidad;

            // Se le agregan o actualizan los atributos que solo puede ver el administrador
            prod.creador = producto.creador || "-",
            prod.ultima_modificacion = usuario.nombre,
            prod.ultimo_precio_compra = producto.ultimo_precio_compra,
            prod.ultimo_precio_venta = producto.ultimo_precio_venta

            // Si se seleccionó una imagen, se sube a storage
            if(imagen){
                let url = await subirImagen(imagen, prod.id);
    
                // Se actualiza el producto con los datos nuevos
                await actualizarProducto({
                    ...prod,
                    img: url
                });
            } else {
                if(!eliminarImagen && producto.img){
                    // Si no se va a borrar y existe la imagen, la agrega en la actualización
                    prod.img = producto.img;
                } else if(eliminarImagen && producto.img) {
                    // Si sí se borró la imagen y sí existía, también se borra de storage
                    await borrarImagen(prod.id);
                }

                await actualizarProducto(prod);

            }

            // Se guarda el movimiento en la base de datos
            await guardarMovimiento(`${usuario.nombre} editó el producto "${prod.nombre}" - ultimo_precio_compra: $${producto.ultimo_precio_compra} - ultimo_precio_venta: $${producto.ultimo_precio_venta} - categoria: ${producto.categoria}`);
        }

        // Se regresa a inicio
        navigate("/");
    }

    const handleImagen = async (e) => {
        setErrorImagen(null);

        let file = e.target.files[0];

        if(!file) return;

        if(!file.type.startsWith("image/")){
            setErrorImagen("El archivo tiene que ser una imagen");
            return;
        }

        // Archivo para subir a la base de datos
        setImagen(file);

        let reader = new FileReader();

        reader.onload = (e) => {
            // Url base64 para mostrar previsualizacion
            setUrl(e.target.result);
        }

        reader.readAsDataURL(file);

        e.target.value = null; // Para poder seleccionar la misma foto anterior
    }

    const handleBorrarImagen = (e) => {
        setUrl(null);
        setImagen(null);
        setEliminarImagen(true);
    }

    const handleInput = (e) => {
        setProducto({
            ...producto,
            [e.target.name]: e.target.value
        });
    }
    
    const cancelarEdicion = e => {
        navigate("/");
    }

    return(
        <form action="" className="form contenedor" onSubmit={handleSubmit}>
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

            <div className="form__apartado">
                <label htmlFor="imagen">Imagen del producto</label>
                <label tabIndex={0} className="boton" htmlFor="imagen" onKeyDown={(e) => {
                    if(e.code == "Enter") document.activeElement.click();
                }}>
                    {
                        !url ? "Subir imagen" : "Cambiar imagen"
                    }
                </label>
                {
                    errorImagen && (
                        <p style={{color: "#f00"}}>{errorImagen}</p>
                    )
                }
                <input
                    type="file"
                    className="form__input"
                    name="imagen"
                    id="imagen"
                    hidden
                    onInput={handleImagen}
                    accept="image/*"
                    // required
                />
                {
                    url && (
                        <>
                            <button type="button" className="boton" onClick={handleBorrarImagen}>Borrar imagen</button>
                            <img className="form__img" src={url} alt={`Imagen de ${producto.nombre || "producto"}`} />
                        </>
                    )
                }
            </div>

            <div className="form__apartado">
                <label htmlFor="categoria">Categoría</label>
                <select
                    type="file"
                    className="form__input"
                    name="categoria"
                    id="categoria"
                    onInput={handleInput}
                    value={producto.categoria}
                    required
                >
                    <option value="">Elige una categoría</option>
                    <option value="cobija">Cobija</option>
                    <option value="colcha">Colcha</option>
                    <option value="cortina">Cortina</option>
                    <option value="edredon">Edredón</option>
                    <option value="frazada">Frazada</option>
                    <option value="sabana">Sábana</option>
                    <option value="almohada">Almohada</option>
                    <option value="cojin">Cojín</option>
                    <option value="cobertor">Cobertor</option>
                    <option value="otros">Otros</option>
                </select>
            </div>

            <div className="form__controles">
                <p><b>Ganancia:</b> ${producto.precio_venta - producto.precio_compra}</p>

                <div className="form__botones">
                    {
                        !id_producto ? (
                            <input type="submit" value="Agregar producto" className="boton form__boton" />
                        ) : (
                            <>
                                <button type="button" className="boton form__boton" onClick={cancelarEdicion}>Cancelar</button>
                                <input type="submit" value="Editar" className="boton form__boton" />
                            </>
                        )
                    }
                </div>
            </div>
        </form>
    )
}

export default FormularioProducto;