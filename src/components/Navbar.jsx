import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useModal } from "../context/ModalConfirmProvider";
import { ROLES } from "../constantes";
import { useAuth } from "../context/AuthContext";

function Navbar(){
    const { cerrarModal} = useModal();
    const { usuario } = useAuth();

    useEffect(() => {
        document.querySelectorAll(".nav__link").forEach(link => {
            link.addEventListener("click", () => {
                document.getElementById("hamburguesa").checked = false;
                cerrarModal();
            })
        })
    }, [])

    return(
        <div className="nav">

            <label htmlFor="hamburguesa" className="nav__hamburguesa">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-menu-2" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                    <path d="M4 6l16 0"></path>
                    <path d="M4 12l16 0"></path>
                    <path d="M4 18l16 0"></path>
                </svg>
            </label>

            <input type="checkbox" name="hamburguesa" id="hamburguesa" className="nav__checkbox" style={{display: "none"}} />

            <div className="nav__links contenedor">
                <Link to="/" className="nav__link">Inicio</Link>
                <Link to="/apartar" className="nav__link">Apartar productos</Link>
                <Link to="/compras" className="nav__link">Compras</Link>
                <Link to="/ventas" className="nav__link">Ventas</Link>
                <Link to="/apartados" className="nav__link">Apartados</Link>
                <Link to="/ingresos-egresos" className="nav__link">Ingresos y Egresos</Link>
                {
                    usuario && usuario.rol == ROLES.ADMIN && (
                        <Link to="/movimientos" className="nav__link">Movimientos</Link>
                    )
                }
            </div>
        </div>
    )
}

export default Navbar;