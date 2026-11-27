
const API_URL = "http://127.0.0.1:8000";

// ==========================================
// 1. REFERENCIAS A LOS ELEMENTOS DEL HTML
// ==========================================

// Formulario
const form = document.getElementById("form-plato");
const inputNombre = document.getElementById("nombre_plato");
const inputCategoria = document.getElementById("categoria");
const inputPrecio = document.getElementById("precio");
const inputDisponible = document.getElementById("disponible_hoy");
const inputImagen = document.getElementById("imagen_url");

const btnGuardar = document.getElementById("btn-guardar");
const btnCancelar = document.getElementById("btn-cancelar");
const tituloForm = document.getElementById("titulo-form");
const mensaje = document.getElementById("mensaje");

// Vista previa
const vistaPrevia = document.getElementById("vista-previa");
const vistaPreviaContenedor = document.getElementById(
    "vista-previa-contenedor"
);

// Elementos de la página del menú
const lista = document.getElementById("lista-platos");
const estadoLista = document.getElementById("estado-lista");
const filtro = document.getElementById("filtro-categoria");

// ==========================================
// 2. VARIABLES
// ==========================================

let platos = [];
let idEnEdicion = null;

// ==========================================
// 3. FUNCIONES GENERALES
// ==========================================

// Mostrar mensajes
function mostrarMensaje(texto, tipo = "error") {
    if (!mensaje) return;

    mensaje.textContent = texto;
    mensaje.className = `mensaje ${tipo}`;
    mensaje.hidden = false;
}

// Formatear precios en pesos colombianos
function formatoCOP(valor) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0
    }).format(valor);
}

// Obtener mensajes de error de la API
async function leerError(response) {
    try {
        const error = await response.json();
        return error.detail || "Ocurrió un error en la solicitud.";
    } catch {
        return "No fue posible procesar la solicitud.";
    }
}

// Obtener el identificador del plato
function obtenerId(plato) {
    return plato.id || plato._id;
}

// ==========================================
// 4. VISTA PREVIA DE LA IMAGEN
// ==========================================

if (inputImagen && vistaPrevia && vistaPreviaContenedor) {

    inputImagen.addEventListener("input", () => {
        const url = inputImagen.value.trim();

        if (url) {
            vistaPrevia.src = url;
            vistaPreviaContenedor.hidden = false;
        } else {
            vistaPrevia.removeAttribute("src");
            vistaPreviaContenedor.hidden = true;
        }
    });

    // Si la imagen no carga, ocultar la vista previa
    vistaPrevia.addEventListener("error", () => {
        vistaPreviaContenedor.hidden = true;
    });

    vistaPrevia.addEventListener("load", () => {
        vistaPreviaContenedor.hidden = false;
    });
}

// ==========================================
// 5. CARGAR PLATOS DESDE LA API
// ==========================================

async function cargarPlatos() {

    // Solo cargar el listado si estamos en una página
    // que contiene los elementos necesarios.
    if (!lista) return;

    if (estadoLista) {
        estadoLista.textContent = "Cargando menú...";
        estadoLista.hidden = false;
    }

    try {
        const response = await fetch(`${API_URL}/Menu_completo`);

        if (!response.ok) {
            throw new Error(await leerError(response));
        }

        platos = await response.json();

        renderizar();

    } catch (error) {
        console.error("Error al cargar los platos:", error);

        if (estadoLista) {
            estadoLista.textContent =
                "No fue posible cargar el menú. Verifica la conexión con el servidor.";
            estadoLista.hidden = false;
        }
    }
}

// ==========================================
// 6. MOSTRAR LOS PLATOS EN EL MENÚ
// ==========================================


function renderizar() {

    // Evitar errores si esta página no tiene el listado
    if (!lista) return;

    lista.innerHTML = "";

    const categoria = filtro ? filtro.value : "";

    const platosFiltrados = platos.filter(plato => {
        if (!categoria) return true;

        return Array.isArray(plato.categoria) &&
            plato.categoria.includes(categoria);
    });

    if (platosFiltrados.length === 0) {
        if (estadoLista) {
            estadoLista.textContent = "No hay platos para mostrar.";
            estadoLista.hidden = false;
        }
        return;
    }

    if (estadoLista) {
        estadoLista.hidden = true;
    }

    platosFiltrados.forEach(plato => {

        const li = document.createElement("li");
        li.className = "plato-item";

        // IMAGEN DEL PLATO
        const imagen = document.createElement("img");

        imagen.className = "plato-imagen";
        imagen.alt = plato.nombre_plato || "Imagen del plato";
        imagen.loading = "lazy";

        // INFORMACIÓN DEL PLATO
        const info = document.createElement("div");
        info.className = "plato-info";

        const nombre = document.createElement("h3");
        nombre.textContent = plato.nombre_plato;

        const categoriaTexto = document.createElement("p");
        categoriaTexto.textContent =
            `Categoría: ${(plato.categoria || []).join(", ")}`;

        const precio = document.createElement("p");
        precio.textContent = `Precio: ${formatoCOP(plato.precio)}`;

        const disponibilidad = document.createElement("span");

        disponibilidad.className = plato.disponible_hoy
            ? "badge disponible"
            : "badge no-disponible";

        disponibilidad.textContent = plato.disponible_hoy
            ? "Disponible hoy"
            : "No disponible";

        info.append(
            nombre,
            categoriaTexto,
            precio,
            disponibilidad
        );

        // ACCIONES
        const acciones = document.createElement("div");
        acciones.className = "plato-acciones";

        const btnDisponibilidad = document.createElement("button");
        btnDisponibilidad.type = "button";

        btnDisponibilidad.textContent = plato.disponible_hoy
            ? "Marcar no disponible"
            : "Marcar disponible";

        btnDisponibilidad.addEventListener("click", () => {
            cambiarDisponibilidad(plato);
        });

        const btnEditar = document.createElement("button");
        btnEditar.type = "button";
        btnEditar.textContent = "Editar";

        btnEditar.addEventListener("click", () => {
            const id = obtenerId(plato);

            if (id) {
                window.location.href =
                    `nuevo_plato.html?id=${encodeURIComponent(id)}`;
            }
        });

        const btnEliminar = document.createElement("button");
        btnEliminar.type = "button";
        btnEliminar.textContent = "Eliminar";

        btnEliminar.addEventListener("click", () => {
            eliminarPlato(plato);
        });

        acciones.append(
            btnDisponibilidad,
            btnEditar,
            btnEliminar
        );

        // AGREGAR ELEMENTOS A LA TARJETA
        li.append(imagen, info, acciones);

        lista.appendChild(li);

        // CARGAR LA IMAGEN DESPUÉS DE AGREGARLA AL DOM
        if (plato.imagen_url) {

            imagen.addEventListener("error", () => {

                const fallback = document.createElement("div");
                fallback.className = "plato-imagen-fallback";
                fallback.textContent = plato.nombre_plato;

                imagen.replaceWith(fallback);

            }, { once: true });

            imagen.src = plato.imagen_url;

        } else {

            const fallback = document.createElement("div");
            fallback.className = "plato-imagen-fallback";
            fallback.textContent = plato.nombre_plato;

            imagen.replaceWith(fallback);
        }
    });
}


// ==========================================
// 7. REGISTRAR O ACTUALIZAR UN PLATO
// ==========================================

if (form) {

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        const datos = {
            nombre_plato: inputNombre.value.trim(),
            categoria: [inputCategoria.value],
            precio: Number(inputPrecio.value),
            disponible_hoy: inputDisponible.checked,
            imagen_url: inputImagen ? inputImagen.value.trim() : null
        };

        const esEdicion = idEnEdicion !== null;

        const url = esEdicion
            ? `${API_URL}/Menu_completo/${idEnEdicion}`
            : `${API_URL}/Nuevo_plato`;

        const metodo = esEdicion ? "PUT" : "POST";

        try {

            btnGuardar.disabled = true;

            const response = await fetch(url, {
                method: metodo,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(datos)
            });

            if (!response.ok) {
                throw new Error(await leerError(response));
            }

            mostrarMensaje(
                esEdicion
                    ? "¡Plato actualizado correctamente!"
                    : "¡Plato registrado correctamente!",
                "ok"
            );

            resetearFormulario();

            // Actualizar listado si existe en esta página
            if (lista) {
                await cargarPlatos();
            }

        } catch (error) {

            console.error("Error al guardar el plato:", error);
            mostrarMensaje(error.message);

        } finally {
            btnGuardar.disabled = false;
        }
    });
}

// ==========================================
// 8. INICIAR EDICIÓN DE UN PLATO
// ==========================================

function iniciarEdicion(plato) {

    if (!form) return;

    idEnEdicion = obtenerId(plato);

    if (!idEnEdicion) {
        mostrarMensaje("No se encontró el identificador del plato.");
        return;
    }

    inputNombre.value = plato.nombre_plato;
    inputCategoria.value = plato.categoria?.[0] || "";
    inputPrecio.value = plato.precio;
    inputDisponible.checked = plato.disponible_hoy;

    if (inputImagen) {
        inputImagen.value = plato.imagen_url || "";
        inputImagen.dispatchEvent(new Event("input"));
    }

    if (tituloForm) {
        tituloForm.textContent = "Editar plato";
    }

    if (btnGuardar) {
        btnGuardar.innerHTML = "Actualizar plato";
    }

    if (btnCancelar) {
        btnCancelar.hidden = false;
    }
}

// ==========================================
// 9. CARGAR PLATO PARA EDICIÓN DESDE LA URL
// ==========================================

async function cargarPlatoParaEditar() {

    if (!form) return;

    const parametros = new URLSearchParams(window.location.search);
    const id = parametros.get("id");

    if (!id) return;

    try {

        const response = await fetch(
            `${API_URL}/Menu_completo/${encodeURIComponent(id)}`
        );

        if (!response.ok) {
            throw new Error(await leerError(response));
        }

        const plato = await response.json();

        iniciarEdicion(plato);

    } catch (error) {

        console.error("Error al cargar el plato:", error);
        mostrarMensaje(error.message);
    }
}

// ==========================================
// 10. REINICIAR FORMULARIO
// ==========================================

function resetearFormulario() {

    if (!form) return;

    form.reset();

    idEnEdicion = null;

    if (inputImagen) {
        inputImagen.value = "";
    }

    if (vistaPrevia) {
        vistaPrevia.removeAttribute("src");
    }

    if (vistaPreviaContenedor) {
        vistaPreviaContenedor.hidden = true;
    }

    if (tituloForm) {
        tituloForm.textContent = "Nuevo plato";
    }

    if (btnGuardar) {
        btnGuardar.innerHTML = "Guardar plato";
    }

    if (btnCancelar) {
        btnCancelar.hidden = true;
    }
}

// ==========================================
// 11. BOTÓN CANCELAR EDICIÓN
// ==========================================

if (btnCancelar) {

    btnCancelar.addEventListener("click", () => {

        resetearFormulario();

        if (mensaje) {
            mensaje.hidden = true;
        }

        // Quitar el parámetro de edición de la dirección
        window.history.replaceState(
            {},
            document.title,
            window.location.pathname
        );
    });
}

// ==========================================
// 12. CAMBIAR DISPONIBILIDAD
// ==========================================

async function cambiarDisponibilidad(plato) {

    const id = obtenerId(plato);

    if (!id) return;

    try {

        const response = await fetch(
            `${API_URL}/Menu_completo/${id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    disponible_hoy: !plato.disponible_hoy
                })
            }
        );

        if (!response.ok) {
            throw new Error(await leerError(response));
        }

        await cargarPlatos();

    } catch (error) {

        console.error("Error al cambiar disponibilidad:", error);
        alert(error.message);
    }
}

// ==========================================
// 13. ELIMINAR PLATO
// ==========================================

async function eliminarPlato(plato) {

    const id = obtenerId(plato);

    if (!id) return;

    const confirmar = confirm(
        `¿Estás seguro de eliminar ${plato.nombre_plato}?`
    );

    if (!confirmar) return;

    try {

        const response = await fetch(
            `${API_URL}/Menu_completo/${id}`,
            {
                method: "DELETE"
            }
        );

        if (!response.ok) {
            throw new Error(await leerError(response));
        }

        await cargarPlatos();

    } catch (error) {

        console.error("Error al eliminar el plato:", error);
        alert(error.message);
    }
}

// ==========================================
// 14. EVENTO DEL FILTRO
// ==========================================

if (filtro) {
    filtro.addEventListener("change", renderizar);
}

// ==========================================
// 15. INICIALIZACIÓN
// ==========================================

// Si estamos en menu.html, cargar los platos.
if (lista) {
    cargarPlatos();
}

// Si estamos en nuevo_plato.html, comprobar si
// se está editando un plato existente.
if (form) {
    cargarPlatoParaEditar();
}
