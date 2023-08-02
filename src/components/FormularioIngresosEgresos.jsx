import { useState } from "react";
import { guardarTransaccion } from "../firebase";
import { useAuth } from "../context/AuthContext";

function FormularioIngresosEgresos(){
    const { usuario } = useAuth();
    const [datos, setDatos] = useState({
        descripcion: "",
        dinero: 0
    });

    const handleTransacciones = async (datos) => {
        if(datos.precio == 0) return;

        await guardarTransaccion({
            ...datos,
            
            //? Solo lo puede ver el admin
            creador: usuario.nombre
        });

        setDatos({
            descripcion: "",
            dinero: 0
        });
    }

    const handleIngreso = () => {
        handleTransacciones({
            ...datos,
            dinero: Math.abs(datos.dinero)
        });
    }
    
    const handleEgreso = () => {
        handleTransacciones({
            ...datos,
            dinero: -Math.abs(datos.dinero)
        });
    }

    const handleInput = e => {
        setDatos({
            ...datos,
            [e.target.name]: e.target.value
        });
    }
    
    return(
        <div className="form">
            <div className="form__apartado">
                <label htmlFor="descripcion">Descripción</label>
                <input
                    type="text"
                    className="form__input"
                    name="descripcion"
                    id="descripcion"
                    onInput={handleInput}
                    value={datos.descripcion}
                    required
                />
            </div>

            <div className="form__apartado">
                <label htmlFor="dinero">Dinero</label>
                <input
                    type="number"
                    className="form__input"
                    name="dinero"
                    id="dinero"
                    min={0}
                    step={.01}
                    inputMode="numeric"
                    onInput={handleInput}
                    value={datos.dinero}
                    required
                />
            </div>

            <button onClick={handleIngreso} className="boton boton--verde">Ingreso</button>
            <button onClick={handleEgreso} className="boton boton--rojo">Egreso</button>
        </div>
    )
}

export default FormularioIngresosEgresos;