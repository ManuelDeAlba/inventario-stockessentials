import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../constantes";
import { useNavigate } from "react-router-dom";

function AuthProtectedRoute({ children, admin }){
    const navigate = useNavigate();

    const [contrasena, setContrasena] = useState(null);

    const { permitido, error, iniciarSesion, usuario } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Se intenta iniciar sesión, si se permite o si hay un error, se actualiza el contexto
        await iniciarSesion(contrasena);
    }

    useEffect(() => {
        // Si ya existe el usuario y se pide que sea admin y no lo es, llevar a inicio
        if(usuario && admin && usuario.rol != ROLES.ADMIN){
            navigate("/");
        }
    }, [usuario])


    if(!permitido) {
        return (
            //? Se le quitan los 40 pixeles porque el body por defecto tiene un margen de 60 por el navbar
            <form action="" className="form contenedor" style={{marginTop: "-40px"}} onSubmit={handleSubmit}>
                <h1 className="titulo">Inicia sesión</h1>

                <div className="form__apartado">
                    <label htmlFor="contrasena">Contraseña</label>
                    <input type="password" className="form__input" name="contrasena" id="contrasena" onInput={(e) => setContrasena(e.target.value)} />
                </div>

                <p style={{ color: "#f00" }}>{error}</p>

                <input type="submit" className="boton form__boton" value="Iniciar" />
            </form>
        )
    }

    return(
        <>
            { children }
        </>
    )
}

export default AuthProtectedRoute;