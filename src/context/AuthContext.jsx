import { createContext, useContext, useEffect, useState } from "react";

import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

import md5 from "md5"; //? Cifra la contraseña a comprobar en la base de datos
import { ROLES } from "../constantes";

const authContext = createContext();

// Hook personalizado para facilitar el uso del contexto
export const useAuth = () => {
    let context = useContext(authContext);

    return context;
}

// Componente para envolver la app y proveer el contexto
function AuthProvider({ children }){
    const [permitido, setPermitido] = useState(false);
    const [error, setError] = useState(null);

    const [usuario, setUsuario] = useState({
        nombre: "",
        rol: ""
    });

    const iniciarSesion = async (contrasena) => {
        // La contraseña está hasheada en la db para proteger la información
        // Aquí se pasa por la función para comprobar
        let cifrada = md5(contrasena);
        
        // Se busca la contraseña en la db
        let q = query(collection(db, "contrasenas"), where("contrasena", "==", cifrada));

        let querySnapshot = await getDocs(q);
        let valida = !querySnapshot.empty;

        if(!valida){
            setError("La contraseña es incorrecta");
            // Permitido se queda en falso
            return;
        }

        setUsuario({
            nombre: querySnapshot.docs[0].data().nombre,
            rol: querySnapshot.docs[0].data().rol
        });
        setPermitido(valida);
        setError(null);
    }

    const cerrarSesion = () => {
        setPermitido(false);
        setError(null);
    }

    // Si al iniciar sesión, el usuario es administrador, se pone el color azul
    useEffect(() => {
        if(usuario.rol == ROLES.ADMIN) document.body.classList.add("azul");
    }, [usuario])

    return (
        <authContext.Provider value={{usuario, permitido, error, iniciarSesion, cerrarSesion}}>
            { children }
        </authContext.Provider>
    )
}

export default AuthProvider;