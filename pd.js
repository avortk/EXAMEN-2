/* NIKOL STEFANIA QUENTA ESCOBAR */
const API_KEY = '7a795bd90e1e0f649489bfea039be2dc'; 
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

const seriesGrid    = document.getElementById('series-grid');
const loadingDiv    = document.getElementById('loading');
const errorDiv      = document.getElementById('error');
const errorMessage  = document.getElementById('error-message');
const resultsTitle  = document.getElementById('results-title');
const resultsCount  = document.getElementById('results-count');
const searchInput   = document.getElementById('search');
const clearBtn      = document.getElementById('clear-search');
const retryBtn      = document.getElementById('retry-btn');
const themeToggle   = document.getElementById('theme-toggle');
const modal         = document.getElementById('serie-modal');
const modalBody     = document.getElementById('modal-body');
const modalClose    = document.getElementById('modal-close');
const modalOverlay  = document.getElementById('modal-overlay');


// ============================================================================
// UTILIDADES DE UI (DADO - no modificar)
// ============================================================================
const mostrarLoading = () => {
    loadingDiv.style.display = 'flex';
    errorDiv.style.display = 'none';
    seriesGrid.innerHTML = '';
};

const ocultarLoading = () => {
    loadingDiv.style.display = 'none';
};

const mostrarError = (mensaje) => {
    ocultarLoading();
    errorMessage.textContent = mensaje;
    errorDiv.style.display = 'flex';
    seriesGrid.innerHTML = '';
};


// ============================================================================
// DARK MODE (DADO - no modificar)
// ============================================================================
const aplicarTema = (tema) => {
    document.documentElement.setAttribute('data-theme', tema);
    themeToggle.textContent = tema === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', tema);
};

const cargarTema = () => {
    const guardado = localStorage.getItem('theme');
    const preferido = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    aplicarTema(guardado || preferido);
};

themeToggle.addEventListener('click', () => {
    const actual = document.documentElement.getAttribute('data-theme');
    aplicarTema(actual === 'dark' ? 'light' : 'dark');
});

cargarTema();






/*CODIGO  */



const obtenerSeries = async () => {
    const url = `${BASE_URL}/tv/popular?api_key=${API_KEY}&language=es-ES`;

    const respuesta = await fetch(url);
    const datos = await respuesta.json();

    if (datos.status_code === 7) {
        mostrarError('API Key inválida');
        return null;
    }

    if (!datos.results) {
        mostrarError('No se pudo cargar las series');
        return null;
    }

    return datos.results;
};


const crearTarjeta = (serie) => {
    const nom = serie.name;
    const fecha = serie.first_air_date;
    const nota = serie.vote_average;
    const foto = serie.poster_path;

    const anio = fecha ? fecha.split('-')[0] : 'N/A';
    const img = foto ? `${IMAGE_URL}${foto}` : '';
    const cal = nota ? nota.toFixed(1) : 'N/A';

    const tarjeta = document.createElement('article');
    tarjeta.className = 'serie-card';

    tarjeta.innerHTML = `
        <div class="serie-card__poster">
            <img class="serie-card__image" src="${img}" alt="${nom}">
            <span class="serie-card__rating">${cal}</span>
        </div>

        <div class="serie-card__content">
            <h3 class="serie-card__title">${nom}</h3>
            <span class="serie-card__year">${anio}</span>
        </div>
    `;

    tarjeta.addEventListener('click', () => {
        verDetalle(serie.id);
    });

    return tarjeta;
};




const verDetalle = async (id) => {
    modal.classList.add('modal--show');
    modalBody.innerHTML = '<p>Cargando detalles...</p>';

    try {
        
        const url = `${BASE_URL}/tv/${id}?api_key=${API_KEY}&language=es-ES`;
        const respuesta = await fetch(url);
        const datos = await respuesta.json();

        if (datos.status_code === 7) {
            modalBody.textContent = 'API Key inválida';
            return;
        }

        if (!datos.genres) {
            modalBody.textContent = 'No se pudo cargar el detalle';
            return;
        }


        const nom = datos.name;
        const sinopsis = datos.overview || 'Sin sinopsis';
        const temp = datos.number_of_seasons;
        const epis = datos.number_of_episodes;
        const estado = datos.status;
        const generos = datos.genres.map(g => g.name).join(', ');

        modalBody.innerHTML = `
            <h2 class="modal__title">${nom}</h2>
            <p class="modal__overview">${sinopsis}</p>

            <div class="modal__info">
                <p>Temporadas: ${temp}</p>
                <p>Episodios: ${epis}</p>
                <p>Generos: ${generos}</p>
                <p>Estado: ${estado}</p>
            </div>
        `;

        } catch (error) {
            console.log('Error', error);
            modalBody.textContent = 'Error de conexion';
        }
};

modalClose.addEventListener('click', () => {
    modal.classList.remove('modal--show');
});

modalOverlay.addEventListener('click', () => {
    modal.classList.remove('modal--show');
});




const iniciar = async () => {
    mostrarLoading();

    try {
        const lista = await obtenerSeries();

        if (!lista) return;
        ocultarLoading();

        lista.forEach(serie => {
            seriesGrid.appendChild(crearTarjeta(serie));
        });

        resultsCount.textContent = `${lista.length} series encontradas`;


        } catch (error) {
            console.log('Error', error);

            let mensaje = 'Error de conexión';

            if (error.message && error.message.includes('401')) {
                mensaje = 'API Key inválida';
            }

            mostrarError(mensaje);
        }

};


iniciar();












const buscarSeries = async (texto) => {
    if (!texto || texto.trim() === '') {
        return obtenerSeries();
    }

    const dato = encodeURIComponent(texto.trim());
    const url = `${BASE_URL}/search/tv?api_key=${API_KEY}&language=es-ES&query=${dato}`;

    const respuesta = await fetch(url);
    const datos = await respuesta.json();

    if (datos.status_code === 7) {
        mostrarError('API Key inválida');
        return null;
    }

    if (!datos.results) {
        mostrarError('Error al buscar series');
        return null;
    }

    return datos.results;
};


let tiempo = null;

searchInput.addEventListener('input', (e) => {
    const texto = e.target.value;

    clearTimeout(tiempo);

    tiempo = setTimeout(async () => {
        mostrarLoading();

        try {
            const lista = await buscarSeries(texto);
            if (!lista) return;
            ocultarLoading();

            resultsTitle.textContent = texto.trim() === '' ? 'Series Populares' : 'Resultados de busqueda';
            resultsCount.textContent = `${lista.length} series encontradas`;

            if (lista.length === 0) {
                seriesGrid.innerHTML = '<p>No se encontraron series</p>';
                return;
            }

            lista.forEach(serie => {
                seriesGrid.appendChild(crearTarjeta(serie));
            });
        } catch (error) {
            console.log('Error', error);
            mostrarError('Error de conexion');
        }
    }, 500);
});

clearBtn.addEventListener('click', () => {
    clearTimeout(tiempo);
    searchInput.value = '';
    resultsTitle.textContent = 'Series Populares';
    iniciar();
});


retryBtn.addEventListener('click', iniciar);