import { createContext, useContext, useState } from 'react';
import ModalConfirm from '../components/ModalConfirm';

const modalContext = createContext();

export const useModal = () => {
    return useContext(modalContext);
}

function ModalConfirmProvider({children}){
    const [modalVisible, setModalVisible] = useState(false);
    const [texto, setTexto] = useState(undefined);
    const [onResult, setOnResult] = useState(undefined);

    const abrirModal = ({
        texto="¿Realmente quieres realizar la acción?",
        onResult
    }) => {
        setTexto(texto);
        setOnResult(() => onResult); // Se guarda como una función para que no se ejecute inmediatamente
        setModalVisible(true);
    }

    const cerrarModal = () => setModalVisible(false);

    return(
        <modalContext.Provider value={{ abrirModal, cerrarModal }}>
            <ModalConfirm
                visible={modalVisible}
                texto={texto}
                handleResult={onResult}
            />
            {children}
        </modalContext.Provider>
    )
}

export default ModalConfirmProvider;