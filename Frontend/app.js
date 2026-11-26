const API_URL = "http://127.0.0.1:8000";

const form = document.getElementById("form-plato");
const inputNombre = document.getElementById("nombre_plato");
const inputCategoria = document.getElementById("categoria");
const inputPrecio = document.getElementById("precio");
const inputDisponible = document.getElementById("disponible_hoy");
const btnGuardar = document.getElementById("btn-guardar");
const btnCancelar = document.getElementById("btn-cancelar");
const tituloForm = document.getElementById("titulo-form");
const mensaje = document.getElementById("mensaje");
const lista = document.getElementById("lista-platos");
const estadoLista = document.getElementById("estado-lista");
const filtro = document.getElementById("filtro-categoria");

let platos = [];
let idEnEdicion = null;

// Utilidades 
function mostrarMensaje(texto, tipo = "ok") {
    mensaje.textContent = texto;
    mensaje.className = `mensaje ${tipo}`;
    mensaje.hidden = false;
    setTimeout(() => (mensaje.hidden = true), 4000);
}

function formatoCOP(valor) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency", currency: "COP", maximumFractionDigits: 0
    }).format(valor);
}

// Extrae el mensaje de error que devuelve FastAPI (400, 404, 422)
async function leerError(respuesta) {
    try {
        const data = await respuesta.json();
        if (typeof data.detail === "string") return data.detail;
        if (Array.isArray(data.detail)) {
            return data.detail.map(e => `${e.loc.slice(1).join(".")}: ${e.msg}`).join(" | ");
        }
    } catch (_) {}
    return `Error ${respuesta.status}`;
}

// READ 
async function cargarPlatos() {
    estadoLista.textContent = "Cargando menú...";
    estadoLista.hidden = false;
    try {
        const respuesta = await fetch(`${API_URL}/Menu_completo`);
        if (!respuesta.ok) throw new Error(await leerError(respuesta));
        platos = await respuesta.json();
        renderizar();
    } catch (error) {
        estadoLista.textContent = "No se pudo conectar con la API. ¿Está corriendo uvicorn?";
        console.error(error);
    }
}

function renderizar() {
    const categoria = filtro.value;
    const visibles = categoria
        ? platos.filter(p => p.categoria.includes(categoria))
        : platos;

    lista.innerHTML = "";

    if (visibles.length === 0) {
        estadoLista.textContent = "No hay platos para mostrar.";
        estadoLista.hidden = false;
        return;
    }
    estadoLista.hidden = true;

    visibles.forEach(plato => {
        const li = document.createElement("li");
        li.className = "plato-item" + (plato.disponible_hoy ? "" : " agotado");

        const info = document.createElement("div");
        info.className = "plato-info";

        const nombre = document.createElement("h3");
        nombre.textContent = plato.nombre_plato;

        const detalle = document.createElement("p");
        detalle.textContent = `${plato.categoria.join(", ")} · ${formatoCOP(plato.precio)}`;

        const estado = document.createElement("span");
        estado.className = "badge " + (plato.disponible_hoy ? "badge-ok" : "badge-no");
        estado.textContent = plato.disponible_hoy ? "Disponible" : "Agotado";

        info.append(nombre, detalle, estado);

        const acciones = document.createElement("div");
        acciones.className = "plato-acciones";

        const btnToggle = document.createElement("button");
        btnToggle.className = "btn btn-small";
        btnToggle.innerHTML = '<i class="fa-solid fa-toggle-on"></i>';
        btnToggle.title = "Cambiar disponibilidad";
        btnToggle.addEventListener("click", () => cambiarDisponibilidad(plato));

        const btnEditar = document.createElement("button");
        btnEditar.className = "btn btn-small";
        btnEditar.innerHTML = '<i class="fa-solid fa-pen"></i>';
        btnEditar.title = "Editar";
        btnEditar.addEventListener("click", () => iniciarEdicion(plato));

        const btnEliminar = document.createElement("button");
        btnEliminar.className = "btn btn-small btn-danger";
        btnEliminar.innerHTML = '<i class="fa-solid fa-trash"></i>';
        btnEliminar.title = "Eliminar";
        btnEliminar.addEventListener("click", () => eliminarPlato(plato));

        acciones.append(btnToggle, btnEditar, btnEliminar);
        li.append(info, acciones);
        lista.appendChild(li);
    });
}

// CREATE / UPDATE 
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const datos = {
        nombre_plato: inputNombre.value.trim(),
        categoria: [inputCategoria.value],   // la API espera una lista
        precio: parseInt(inputPrecio.value, 10),
        disponible_hoy: inputDisponible.checked
    };

    const editando = idEnEdicion !== null;
    const url = editando
        ? `${API_URL}/Menu_completo/${idEnEdicion}`
        : `${API_URL}/Nuevo_plato`;

    try {
        const respuesta = await fetch(url, {
            method: editando ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });
        if (!respuesta.ok) throw new Error(await leerError(respuesta));

        mostrarMensaje(editando ? "Plato actualizado correctamente" : "Plato creado correctamente");
        resetearFormulario();
        await cargarPlatos();
    } catch (error) {
        mostrarMensaje(error.message, "error");
    }
});

function iniciarEdicion(plato) {
    idEnEdicion = plato._id;
    inputNombre.value = plato.nombre_plato;
    inputCategoria.value = plato.categoria[0] ?? "";
    inputPrecio.value = plato.precio;
    inputDisponible.checked = plato.disponible_hoy;

    tituloForm.innerHTML = '<i class="fa-solid fa-pen"></i> Editar plato';
    btnGuardar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Actualizar plato';
    btnCancelar.hidden = false;
    form.scrollIntoView({ behavior: "smooth" });
}

function resetearFormulario() {
    idEnEdicion = null;
    form.reset();
    inputCategoria.value = "";
    tituloForm.innerHTML = '<i class="fa-solid fa-plus-circle"></i> Nuevo plato';
    btnGuardar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar plato';
    btnCancelar.hidden = true;
}

btnCancelar.addEventListener("click", resetearFormulario);

// UPDATE parcial (solo disponibilidad)
async function cambiarDisponibilidad(plato) {
    try {
        const respuesta = await fetch(`${API_URL}/Menu_completo/${plato._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ disponible_hoy: !plato.disponible_hoy })
        });
        if (!respuesta.ok) throw new Error(await leerError(respuesta));
        await cargarPlatos();
    } catch (error) {
        mostrarMensaje(error.message, "error");
    }
}

//DELETE 
async function eliminarPlato(plato) {
    if (!confirm(`¿Eliminar "${plato.nombre_plato}" del menú?`)) return;

    try {
        const respuesta = await fetch(`${API_URL}/Menu_completo/${plato._id}`, {
            method: "DELETE"
        });
        if (!respuesta.ok) throw new Error(await leerError(respuesta));

        mostrarMensaje("Plato eliminado correctamente");
        if (idEnEdicion === plato._id) resetearFormulario();
        await cargarPlatos();
    } catch (error) {
        mostrarMensaje(error.message, "error");
    }
}

filtro.addEventListener("change", renderizar);

// Carga inicial
cargarPlatos();