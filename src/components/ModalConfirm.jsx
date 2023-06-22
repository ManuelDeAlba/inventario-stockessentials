function ModalConfirm({ handleResult, texto, visible }){
    return(
        visible && (
            <div className="modal">
                <div className="modal__contenedor">
                    <p className="modal__texto">{texto}</p>
                    <div className="modal__botones">
                        <button className="boton boton--verde" onClick={() => handleResult(true)}>Aceptar</button>
                        <button className="boton boton--rojo" onClick={() => handleResult(false)}>Cancelar</button>
                    </div>
                </div>
            </div>
        )
    )
}

export default ModalConfirm;