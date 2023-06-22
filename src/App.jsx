import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import PaginaInicio from "./pages/PaginaInicio";
import FormularioVenta from "./pages/FormularioVenta";
import FormularioCompra from "./pages/FormularioCompra";
import PaginaCompras from "./pages/PaginaCompras";
import PaginaVentas from "./pages/PaginaVentas";
import AuthProtectedRoute from "./components/AuthProtectedRoute";
import FormularioApartar from "./pages/FormularioApartar";
import PaginaApartados from "./pages/PaginaApartados";

import AuthProvider from "./context/AuthContext";
import ModalConfirmProvider from "./context/ModalConfirmProvider";

import Navbar from "./components/Navbar";
import PaginaMovimientos from "./pages/PaginaMovimientos";
import PaginaIngresosEgresos from "./pages/PaginaIngresosEgresos";

function App(){
    return(
        <Router>
            <AuthProvider>
                <ModalConfirmProvider>
                    <AuthProtectedRoute>
                        <Navbar />
                        <Routes>
                            <Route path="/" element={<PaginaInicio />} />
                            <Route path="/compras" element={<PaginaCompras />} />
                            <Route path="/comprar/:id" element={<FormularioCompra />} />
                            <Route path="/ventas" element={<PaginaVentas />} />
                            <Route path="/vender/:id" element={<FormularioVenta />} />
                            <Route path="/apartar" element={<FormularioApartar />} />
                            <Route path="/apartados" element={<PaginaApartados />} />
                            <Route path="/movimientos" element={
                                <AuthProtectedRoute admin>
                                    <PaginaMovimientos />
                                </AuthProtectedRoute>}
                            />
                            <Route path="/ingresos-egresos" element={<PaginaIngresosEgresos />} />
                        </Routes>
                    </AuthProtectedRoute>
                </ModalConfirmProvider>
            </AuthProvider>
        </Router>
    )
}

export default App;