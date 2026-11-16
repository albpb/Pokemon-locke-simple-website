// ---------- pokeball svg ----------
function pokeballSVG() {
    return `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle class="ball-top" cx="50" cy="50" r="47"/>
        <path class="ball-bottom" d="M3 50a47 47 0 0 0 94 0z"/>
        <rect class="ball-ring" x="3" y="46" width="94" height="8"/>
        <circle class="ball-ring" cx="50" cy="50" r="17"/>
        <circle class="ball-center" cx="50" cy="50" r="12"/>
        <circle class="ball-center-dot" cx="50" cy="50" r="5"/>
      </svg>`;
}

// ---------- persistencia en localStorage ----------
const STORAGE_KEY = 'hardlocke-helper-save';
let persistEnabled = false; // evita que el render inicial pise la partida guardada

function saveToLocalStorage() {
    if (!persistEnabled) return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            currentGen,
            TOTAL_LIVES,
            current_lives,
            pokemonTeam,
            badges,
            godHistory,
            savedAt: new Date().toISOString()
        }));
    } catch (error) {
        console.error('No se pudo guardar en localStorage:', error);
    }
}

function applyGameState(datos) {
    TOTAL_LIVES = datos.TOTAL_LIVES;
    current_lives = datos.current_lives;
    currentGen = datos.currentGen;
    pokemonTeam = datos.pokemonTeam;
    badges = datos.badges;
    godHistory = Array.isArray(datos.godHistory) ? datos.godHistory : [];

    const genText = document.getElementById('input-gen').options[currentGen - 1].textContent;
    document.getElementById('badges-gen-label').textContent = genText;
    const brandGen = document.getElementById('brand-gen');
    if (brandGen) brandGen.textContent = genText;
    totalLabel.textContent = TOTAL_LIVES;

    renderGrid();

    for (let index = 0; index < 6; index++) {
        clearTeamSlot(index);
        loadTeamSlot(index);
    }

    renderBadgeGrid();

    // partidas anteriores a esta función: si ya había un dios en el equipo, lo registra
    const currentGod = pokemonTeam.find(p => p && p.isGod);
    if (currentGod) registerGod(currentGod);
    renderRegistry();
}

const grid = document.getElementById('ball-grid');
const currentEl = document.getElementById('lives-current');
const totalLabel = document.getElementById('lives-total-label');
const ofEl = document.querySelector('.lives-of');

// VARIABLES DE CONTROL:

let TOTAL_LIVES = 10;
let current_lives = 10;
let currentGen = 3;

let POKEMON_LIST = [
];
let FIRST_EVO_LIST = [
];
let pokemonTeam = [
    { id: 0, nickname: "" },
    { id: 0, nickname: "" },
    { id: 0, nickname: "" },
    { id: 0, nickname: "" },
    { id: 0, nickname: "" },
    { id: 0, nickname: "" }
];
let godHistory = []; // [{ id, nickname, species, image, ascendedAt }]

const TOTAL_BADGES = 8;
var badges = 0;

// ---------- tabla de tipos ----------
const TYPE_ICON_PATH = 'types/';

const POKEMON_TYPES = [
    { key: 'normal', label: 'Normal', color: '#A8A77A' },
    { key: 'fire', label: 'Fuego', color: '#EE8130' },
    { key: 'water', label: 'Agua', color: '#6390F0' },
    { key: 'electric', label: 'Eléctrico', color: '#F7D02C' },
    { key: 'grass', label: 'Planta', color: '#7AC74C' },
    { key: 'ice', label: 'Hielo', color: '#96D9D6' },
    { key: 'fighting', label: 'Lucha', color: '#C22E28' },
    { key: 'poison', label: 'Veneno', color: '#A33EA1' },
    { key: 'ground', label: 'Tierra', color: '#E2BF65' },
    { key: 'flying', label: 'Volador', color: '#A98FF3' },
    { key: 'psychic', label: 'Psíquico', color: '#F95587' },
    { key: 'bug', label: 'Bicho', color: '#A6B91A' },
    { key: 'rock', label: 'Roca', color: '#B6A136' },
    { key: 'ghost', label: 'Fantasma', color: '#735797' },
    { key: 'dragon', label: 'Dragón', color: '#6F35FC' },
    { key: 'dark', label: 'Siniestro', color: '#705746' },
    { key: 'steel', label: 'Acero', color: '#B7B7CE' },
    { key: 'fairy', label: 'Hada', color: '#D685AD' }
];

// Tabla ofensiva: qué tipos recibe ×2 (double), ×½ (half) o ×0 (zero) cada tipo atacante.
const TYPE_CHART = {
    normal: { double: [], half: ['rock', 'steel'], zero: ['ghost'] },
    fire: { double: ['grass', 'ice', 'bug', 'steel'], half: ['fire', 'water', 'rock', 'dragon'], zero: [] },
    water: { double: ['fire', 'ground', 'rock'], half: ['water', 'grass', 'dragon'], zero: [] },
    electric: { double: ['water', 'flying'], half: ['electric', 'grass', 'dragon'], zero: ['ground'] },
    grass: { double: ['water', 'ground', 'rock'], half: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'], zero: [] },
    ice: { double: ['grass', 'ground', 'flying', 'dragon'], half: ['fire', 'water', 'ice', 'steel'], zero: [] },
    fighting: { double: ['normal', 'ice', 'rock', 'dark', 'steel'], half: ['poison', 'flying', 'psychic', 'bug', 'fairy'], zero: ['ghost'] },
    poison: { double: ['grass', 'fairy'], half: ['poison', 'ground', 'rock', 'ghost'], zero: ['steel'] },
    ground: { double: ['fire', 'electric', 'poison', 'rock', 'steel'], half: ['grass', 'bug'], zero: ['flying'] },
    flying: { double: ['grass', 'fighting', 'bug'], half: ['electric', 'rock', 'steel'], zero: [] },
    psychic: { double: ['fighting', 'poison'], half: ['psychic', 'steel'], zero: ['dark'] },
    bug: { double: ['grass', 'psychic', 'dark'], half: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'], zero: [] },
    rock: { double: ['fire', 'ice', 'flying', 'bug'], half: ['fighting', 'ground', 'steel'], zero: [] },
    ghost: { double: ['psychic', 'ghost'], half: ['dark'], zero: ['normal'] },
    dragon: { double: ['dragon'], half: ['steel'], zero: ['fairy'] },
    dark: { double: ['psychic', 'ghost'], half: ['fighting', 'dark', 'fairy'], zero: [] },
    steel: { double: ['ice', 'rock', 'fairy'], half: ['fire', 'water', 'electric', 'steel'], zero: [] },
    fairy: { double: ['fighting', 'dragon', 'dark'], half: ['fire', 'poison', 'steel'], zero: [] }
};

// multiplicador de daño que recibe un Pokémon (de 1 o 2 tipos) al ser atacado por "attackType"
function getEffectiveness(attackType, defenderTypes) {
    const chart = TYPE_CHART[attackType];
    return defenderTypes.reduce((mult, def) => {
        if (chart.zero.includes(def)) return mult * 0;
        if (chart.double.includes(def)) return mult * 2;
        if (chart.half.includes(def)) return mult * 0.5;
        return mult;
    }, 1);
}

// vector de cobertura: [{ tipo: 'water', fuertes: 2, debiles: 3 }, ...]
let typeCoverage = POKEMON_TYPES.map(t => ({ tipo: t.key, fuertes: 0, debiles: 0 }));

function computeTypeCoverage() {
    const matrix = {}; // matrix[tipo][hueco] = multiplicador (o null si el hueco está vacío)

    const vector = POKEMON_TYPES.map(t => {
        const row = { tipo: t.key, fuertes: 0, debiles: 0 };
        matrix[t.key] = pokemonTeam.map(p => {
            if (!p || !p.id || !Array.isArray(p.types) || p.types.length === 0) return null;
            const m = getEffectiveness(t.key, p.types);
            if (m > 1) row.debiles++;
            else if (m < 1) row.fuertes++;
            return m;
        });
        return row;
    });

    return { vector, matrix };
}

// ---------- tipos desde la PokeAPI ----------
const typesCache = new Map(); // id -> ['fire', 'flying']

async function getPokemonTypes(id) {
    if (typesCache.has(id)) return typesCache.get(id);

    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if (!res.ok) throw new Error(`PokeAPI HTTP ${res.status}`);

    const data = await res.json();
    const types = data.types
        .sort((a, b) => a.slot - b.slot)
        .map(t => t.type.name);

    typesCache.set(id, types);
    return types;
}

// ---------- panel de cobertura ----------
function pokemonLabel(entry) {
    if (!entry || !entry.id) return '';
    const species = POKEMON_LIST[entry.id - 1];
    const base = species ? species.name[0].toUpperCase() + species.name.slice(1) : `#${entry.id}`;
    return entry.nickname ? `${entry.nickname} (${base})` : base;
}

function fmtMult(m) {
    if (m === 0) return 'Inmune (×0)';
    if (m === 0.25) return '×¼';
    if (m === 0.5) return '×½';
    return `×${m}`;
}

function segClass(m) {
    if (m === null) return '';
    if (m === 0) return ' strong immune';
    if (m < 1) return ' strong';
    if (m === 1) return ' neutral';
    if (m >= 4) return ' weak x4';
    return ' weak';
}

function buildTypeGrid(grid) {
    console.log("hola")
    grid.innerHTML = POKEMON_TYPES.map(t => `
        <div class="type-row" data-type="${t.key}" style="--type-color:${t.color}">
            <span class="type-badge" title="${t.label}">
                <img class="type-icon" src="${TYPE_ICON_PATH}${t.key}.svg" alt="" onerror="this.remove()">
                <span class="type-abbr">${t.label.slice(0, 3)}</span>
            </span>
            <span class="type-name">${t.label}</span>
            <span class="type-bar">${'<i class="seg"></i>'.repeat(6)}</span>
            <span class="type-count">
                <b class="c-strong" title="Pokémon que lo resisten">0</b>
                <b class="c-weak" title="Pokémon débiles a este tipo">0</b>
            </span>
        </div>`).join('');
}

function renderTypeSummary(vector) {
    const el = document.getElementById('type-summary');
    if (!el) return;

    const hasTeam = pokemonTeam.some(p => p && Array.isArray(p.types) && p.types.length);
    if (!hasTeam) {
        el.innerHTML = '<span class="sum-empty">Añade Pokémon al equipo para ver su cobertura defensiva</span>';
        return;
    }

    const net = r => r.fuertes - r.debiles;
    const label = key => POKEMON_TYPES.find(t => t.key === key).label;
    const worst = vector.filter(r => net(r) < 0).sort((a, b) => net(a) - net(b)).slice(0, 3);
    const best = vector.filter(r => net(r) > 0).sort((a, b) => net(b) - net(a)).slice(0, 3);

    const chips = (list, cls) => list.length
        ? list.map(r => `<span class="sum-chip ${cls}">${label(r.tipo)} <b>${cls === 'weak' ? r.debiles : r.fuertes}</b></span>`).join('')
        : '<span class="sum-none">—</span>';

    el.innerHTML = `
        <div class="sum-group"><span class="sum-title">Puntos débiles</span>${chips(worst, 'weak')}</div>
        <div class="sum-group"><span class="sum-title">Mejor cubierto</span>${chips(best, 'strong')}</div>`;
}

function updateTypePanel() {
    const grid = document.getElementById('type-grid');
    if (!grid) return;
    if (!grid.children.length) buildTypeGrid(grid);

    const { vector, matrix } = computeTypeCoverage();
    typeCoverage = vector;

    vector.forEach(r => {
        const row = grid.querySelector(`.type-row[data-type="${r.tipo}"]`);
        if (!row) return;

        const segs = row.querySelectorAll('.seg');
        matrix[r.tipo].forEach((m, i) => {
            segs[i].className = 'seg' + segClass(m);
            segs[i].title = m === null ? '' : `${pokemonLabel(pokemonTeam[i])}: ${fmtMult(m)}`;
        });

        const strongEl = row.querySelector('.c-strong');
        const weakEl = row.querySelector('.c-weak');
        strongEl.textContent = r.fuertes;
        weakEl.textContent = r.debiles;
        strongEl.classList.toggle('is-zero', r.fuertes === 0);
        weakEl.classList.toggle('is-zero', r.debiles === 0);

        row.classList.toggle('risk', r.debiles > r.fuertes);
        row.classList.toggle('good', r.fuertes > r.debiles);
    });

    renderTypeSummary(vector);
}

function renderGrid() {
    grid.innerHTML = '';

    for (let i = 0; i < current_lives; i++) {
        const btn = document.createElement('button');
        btn.className = 'ball-btn';
        btn.type = 'button';
        btn.setAttribute('aria-pressed', 'false');
        btn.setAttribute('aria-label', 'Vida ' + (i + 1));
        btn.innerHTML = pokeballSVG();
        btn.addEventListener('click', () => toggleBall(btn));
        grid.appendChild(btn);
    }

    for (let i = current_lives; i < TOTAL_LIVES; i++) {
        console.log("holi")
        const btn = document.createElement('button');
        btn.className = 'ball-btn';
        btn.type = 'button';
        btn.setAttribute('aria-pressed', 'true');
        btn.setAttribute('aria-label', 'Vida ' + (i + 1));
        btn.classList.toggle('lost');
        btn.innerHTML = pokeballSVG();

        btn.addEventListener('click', () => toggleBall(btn));
        grid.appendChild(btn);
    }
    updateCounter();

}

function toggleBall(btn) {
    btn.classList.toggle('lost');
    btn.classList.remove('flip');
    requestAnimationFrame(() => btn.classList.add('flip'));
    btn.setAttribute('aria-pressed', btn.classList.contains('lost') ? 'true' : 'false');

    if (!btn.classList.contains('lost'))
        current_lives++;
    else {
        playSkullAnimation(btn);
        current_lives--;
    }

    updateCounter();
}

function updateCounter() {
    currentEl.textContent = current_lives;
    ofEl.textContent = `/ ${TOTAL_LIVES} restantes`;
    currentEl.classList.remove('pulse');
    requestAnimationFrame(() => currentEl.classList.add('pulse'));
    saveToLocalStorage();
}

renderGrid(TOTAL_LIVES);

// ---------- modal ----------
const overlay = document.getElementById('modal-overlay');
const openModal = () => overlay.classList.add('open');
const closeModal = () => overlay.classList.remove('open');

document.getElementById('btn-new').addEventListener('click', openModal);
document.getElementById('btn-cancel').addEventListener('click', closeModal);
overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeNicknameModal();
    }
});

document.getElementById('btn-confirm').addEventListener('click', () => {
    const lives = parseInt(document.getElementById('input-lives').value, 10) || 1;
    const gen = parseInt(document.getElementById('input-gen').value, 10);

    TOTAL_LIVES = lives;
    current_lives = lives;
    totalLabel.textContent = lives;
    currentGen = gen;
    document.getElementById('badges-gen-label').textContent = document.getElementById('input-gen').selectedOptions[0].textContent;

    pokemonTeam = [
        { id: 0, nickname: "" },
        { id: 0, nickname: "" },
        { id: 0, nickname: "" },
        { id: 0, nickname: "" },
        { id: 0, nickname: "" },
        { id: 0, nickname: "" }
    ];
    for (let index = 0; index < 6; index++) {
        clearTeamSlot(index);

    }

    badges = 0;

    godHistory = [];
    renderRegistry();

    renderGrid(lives);

    renderBadgeGrid();

    closeModal();
    showToast('Nueva partida creada');
});

// ---------- toast helper (visual only) ----------
let toastTimer;
function showToast(text) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-text').textContent = text;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

document.getElementById('btn-save').addEventListener('click', () => {
    const jsonToMake = {
        currentGen,
        TOTAL_LIVES,
        current_lives,
        pokemonTeam,
        badges,
        godHistory,
        fechaCreacion: new Date().toISOString()
    };

    const json = JSON.stringify(jsonToMake, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');

    enlace.href = url;
    enlace.download = 'datos.json';

    document.body.appendChild(enlace);
    enlace.click();

    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);

    showToast('Partida guardada');
});

document.getElementById('btn-load').addEventListener('click', () => document.getElementById('file-input').click());
document.getElementById('file-input').addEventListener('change', () => showToast('Fichero cargado'));

document.getElementById('file-input').addEventListener('change', loadJSON);

async function loadTeamSlot(index) {
    const entry = pokemonTeam[index];
    if (!entry || entry.id === 0) return;

    const needsImage = !entry.image;
    const needsTypes = !Array.isArray(entry.types) || entry.types.length === 0;
    if (needsImage || needsTypes) setTeamSlotLoading(index);

    const pokemon = POKEMON_LIST[entry.id - 1] || { id: entry.id };
    const [image, types] = await Promise.all([
        needsImage ? getRandomCardImage(pokemon, entry.nickname) : entry.image,
        needsTypes ? getPokemonTypes(entry.id).catch(() => []) : entry.types
    ]);

    if (pokemonTeam[index] !== entry) return;

    entry.image = image;
    entry.types = types;
    setTeamSlot(index, image, entry.nickname);
    saveToLocalStorage();
}

function loadJSON(event) {
    const archivo = event.target.files[0];
    if (!archivo) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const datos = JSON.parse(e.target.result);

            if (!validFormat(datos)) {
                showToast('Formato de JSON no valido');
                return;
            }

            applyGameState(datos);
            saveToLocalStorage();
        } catch (error) {
            showToast('Formato de archivo incorrecto');
        }
    };
    reader.readAsText(archivo);
    event.target.value = ''; // permite volver a cargar el mismo fichero
}

// FUTURO: control de archivo JSON
function validFormat(d) {
    return (
        typeof d === 'object' && d !== null &&
        Number.isInteger(d.TOTAL_LIVES) && d.TOTAL_LIVES > 0 &&
        Number.isInteger(d.current_lives) && d.current_lives >= 0 && d.current_lives <= d.TOTAL_LIVES &&
        Number.isInteger(d.currentGen) && d.currentGen >= 1 && d.currentGen <= 9 &&
        Number.isInteger(d.badges) && d.badges >= 0 && d.badges <= TOTAL_BADGES &&
        Array.isArray(d.pokemonTeam) && d.pokemonTeam.length === 6 &&

        (d.godHistory === undefined || (Array.isArray(d.godHistory) && d.godHistory.every(g =>
            g && Number.isInteger(g.id) && typeof g.nickname === 'string'
        ))) &&
        d.pokemonTeam.every(p =>
            p && Number.isInteger(p.id) && typeof p.nickname === 'string' &&
            (p.image === undefined || typeof p.image === 'string') &&
            (p.types === undefined || Array.isArray(p.types)) &&
            (p.isGod === undefined || typeof p.isGod === 'boolean')
        )

    );
}


// ---------- modal de mote ----------
const nicknameOverlay = document.getElementById('nickname-overlay');
const nicknamePreviewImg = document.getElementById('nickname-preview-img');
const nicknamePreviewName = document.getElementById('nickname-preview-name');
const inputNickname = document.getElementById('input-nickname');

let pendingPokemon = null; // { name, image }

function openNicknameModal(item) {

    let pokemon = POKEMON_LIST.at(item.id - 1);
    pendingPokemon = pokemon.id;
    nicknamePreviewImg.src = `home/${pokemon.id}.png`;
    nicknamePreviewImg.alt = pokemon.id;
    nicknamePreviewName.textContent = pokemon.name;
    inputNickname.value = '';
    nicknameOverlay.classList.add('open');
    setTimeout(() => inputNickname.focus(), 200);
}

function closeNicknameModal() {
    nicknameOverlay.classList.remove('open');
    pendingPokemon = null;
}

async function confirmNickname() {
    if (!pendingPokemon) return;

    const pokemon = POKEMON_LIST[pendingPokemon - 1];
    const nickname = inputNickname.value.trim();

    const freeIndex = Array.from(teamSlots).findIndex(
        slot => !slot.classList.contains('filled') && !slot.classList.contains('loading')
    );

    closeNicknameModal();
    if (freeIndex === -1) return;

    const entry = { id: pokemon.id, nickname: nickname, image: '', types: [] };
    pokemonTeam[freeIndex] = entry;
    saveToLocalStorage();

    setTeamSlotLoading(freeIndex);

    const [image, types] = await Promise.all([
        getRandomCardImage(pokemon, nickname),
        getPokemonTypes(pokemon.id).catch(() => [])
    ]);

    if (pokemonTeam[freeIndex] !== entry) return; // se reinició la partida mientras cargaba

    entry.image = image;
    entry.types = types;
    setTeamSlot(freeIndex, image, nickname); // también actualiza el panel de tipos
    saveToLocalStorage();
}

document.getElementById('btn-nickname-confirm').addEventListener('click', () => confirmNickname());
inputNickname.addEventListener('keydown', (e) => { if (e.key === 'Enter') confirmNickname(true); });
nicknameOverlay.addEventListener('click', (e) => { if (e.target === nicknameOverlay) closeNicknameModal(); });



const searchInput = document.getElementById('pokemon-search');
const searchDropdown = document.getElementById('search-dropdown');
const teamCompleteChip = document.getElementById('team-complete-chip');
const teamCountEl = document.getElementById('team-count');
const teamSlots = document.querySelectorAll('.team-slot');


// abre/cierra el desplegable
searchInput.addEventListener('focus', () => searchDropdown.classList.add('open'));
searchInput.addEventListener('input', () => {
    searchDropdown.classList.toggle('open', searchInput.value.trim().length > 0);
});
document.addEventListener('click', (e) => {
    if (!e.target.closest('.team-search-wrap')) searchDropdown.classList.remove('open');
});

function setTeamSlotLoading(index) {
    const slot = teamSlots[index];
    if (slot) slot.classList.add('loading');
}

function setTeamSlot(index, imgSrc, name) {
    const slot = teamSlots[index];
    if (!slot) return;
    const empty = slot.querySelector('.slot-empty');
    const filledContent = slot.querySelector('.slot-filled-content');
    const img = slot.querySelector('.slot-img');
    const nameEl = slot.querySelector('.slot-name');

    const isCard = imgSrc.includes('assets.tcgdex.net');
    filledContent.classList.toggle('is-sprite', !isCard);

    img.src = imgSrc;
    img.alt = name || '';
    nameEl.textContent = name || '';

    empty.classList.add('is-hidden');
    filledContent.classList.remove('is-hidden');
    slot.classList.remove('loading');
    slot.classList.add('filled');
    updateTeamCount();
}

function clearTeamSlot(index) {
    const slot = teamSlots[index];
    if (!slot) return;
    const empty = slot.querySelector('.slot-empty');
    const filledContent = slot.querySelector('.slot-filled-content');
    const img = slot.querySelector('.slot-img');
    const nameEl = slot.querySelector('.slot-name');

    filledContent.classList.add('is-hidden');
    img.src = '';
    nameEl.textContent = '';
    empty.classList.remove('is-hidden');
    slot.classList.remove('filled', 'loading');
    updateTeamCount();
}

function updateTeamCount() {
    const filled = document.querySelectorAll('.team-slot.filled').length;
    const total = teamSlots.length;
    teamCountEl.textContent = `${filled} / ${total}`;
    teamCompleteChip.classList.toggle('show', filled === total);
    applyGodState();
    updateTypePanel();
}

function renderPokemonDropdown(list) {
    if (!list || list.length === 0) {
        searchDropdown.innerHTML = `<div class="dropdown-empty">Sin resultados</div>`;
        searchDropdown.classList.add('open');
        return;
    }

    searchDropdown.innerHTML = list.map(p => {
        let realname = p.name[0].toUpperCase() + p.name.slice(1);
        return `
    <div class="dropdown-item" id=${p.id}>
      <span>${realname}</span>
    </div>
  `;
    }).join('');

    searchDropdown.classList.add('open');
}

// cierre del dropdown al hacer click fuera
document.addEventListener('click', (e) => {
    if (!e.target.closest('.team-search-wrap')) searchDropdown.classList.remove('open');
});

searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    const filtrados = POKEMON_LIST.filter(p => p.name.toLowerCase().includes(q)).splice(0, 5);
    renderPokemonDropdown(filtrados);
});

searchDropdown.addEventListener('click', (e) => {
    const item = e.target.closest('.dropdown-item');
    if (!item) return; // click fue en el dropdown pero no en un item válido

    openNicknameModal(item);

    // cerrar dropdown
    searchInput.value = '';
    searchDropdown.classList.remove('open');
});

// ---------- Dios de Locke ----------
const CROWN_SVG = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 7l4.5 4L12 4l4.5 7L21 7l-2 11H5L3 7Zm2 13h14v2H5v-2Z"/></svg>`;

const godOverlay = document.getElementById('god-overlay');
const godCardImg = document.getElementById('god-card-img');
const godNameEl = document.getElementById('god-name');
let pendingGodIndex = null;

// crea el botón, el título y el aura dentro de cada hueco (no hace falta tocar el HTML)
function injectGodUI() {
    teamSlots.forEach((slot, index) => {
        slot.insertAdjacentHTML('beforeend', `
            <div class="slot-god-glow"></div>
            <div class="slot-god-title">${CROWN_SVG}<span>Dios de Locke</span></div>
            <button type="button" class="slot-ascend" aria-label="Ascender a Dios de Locke">${CROWN_SVG}<span>Ascender</span></button>
        `);

        slot.querySelector('.slot-ascend').addEventListener('click', (e) => {
            e.stopPropagation(); // si no, el click llegaría al hueco y quitaría el Pokémon
            openGodModal(index);
        });
    });
}
injectGodUI();

function pokemonDisplayName(entry) {
    if (entry.nickname) return entry.nickname;
    const species = POKEMON_LIST[entry.id - 1];
    return species ? species.name[0].toUpperCase() + species.name.slice(1) : `#${entry.id}`;
}

// sincroniza la interfaz con pokemonTeam: aura, título y botones. Solo puede haber UN dios
function applyGodState() {
    const container = document.getElementById('team-slots');
    let hasGod = false;

    teamSlots.forEach((slot, i) => {
        const p = pokemonTeam[i];
        const occupied = slot.classList.contains('filled') || slot.classList.contains('loading');
        const isGod = !hasGod && !!(p && p.isGod) && occupied;
        if (isGod) hasGod = true;
        slot.classList.toggle('is-god', isGod);
    });

    container.classList.toggle('has-god', hasGod);
}

function openGodModal(index) {
    const entry = pokemonTeam[index];
    if (!entry || !entry.id) return;
    if (pokemonTeam.some(p => p && p.isGod)) return; // ya hay un dios

    pendingGodIndex = index;
    godCardImg.src = entry.image || `home/${entry.id}.png`;
    godCardImg.alt = pokemonDisplayName(entry);
    godNameEl.textContent = `“${pokemonDisplayName(entry)}”`;

    godOverlay.classList.add('open');
    setTimeout(() => document.getElementById('btn-god-accept').focus(), 350);
}

function closeGodModal() {
    godOverlay.classList.remove('open');
    pendingGodIndex = null;
}

function confirmGod() {
    if (pendingGodIndex === null) return;
    const index = pendingGodIndex;
    const entry = pokemonTeam[index];
    if (!entry || !entry.id) { closeGodModal(); return; }

    pokemonTeam.forEach(p => { if (p) delete p.isGod; }); // seguridad: solo uno
    entry.isGod = true;
    registerGod(entry);          // <- nuevo: queda en el registro para siempre
    saveToLocalStorage();
    updateTeamCount();

    const slot = teamSlots[index];
    slot.classList.add('god-flash');
    setTimeout(() => slot.classList.remove('god-flash'), 1100);

    closeGodModal();
    showToast(`${pokemonDisplayName(entry)} es ahora Dios de Locke`);
}
document.getElementById('btn-god-accept').addEventListener('click', confirmGod);
godOverlay.addEventListener('click', (e) => { if (e.target === godOverlay) closeGodModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeGodModal(); });

// ---------- registro de Dioses de Locke ----------
const registryOverlay = document.getElementById('registry-overlay');
const registryGrid = document.getElementById('registry-grid');
const registryCount = document.getElementById('registry-count');
const registrySub = document.getElementById('registry-sub');

function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
}

// guarda al Pokémon en el historial (si ya estaba con ese mote, no se duplica)
function registerGod(entry) {
    const already = godHistory.some(g => g.id === entry.id && g.nickname === entry.nickname);
    if (already) return;

    const species = POKEMON_LIST[entry.id - 1];
    godHistory.push({
        id: entry.id,
        nickname: entry.nickname || '',
        species: species ? species.name : '',
        image: entry.image || '',
        ascendedAt: new Date().toISOString()
    });
    renderRegistry();
}

function renderRegistry() {
    const n = godHistory.length;
    registryCount.textContent = n;
    registryCount.classList.toggle('is-zero', n === 0);
    registrySub.textContent = n === 0
        ? 'Ningún ascenso todavía'
        : `${n} ${n === 1 ? 'Pokémon ha ostentado' : 'Pokémon han ostentado'} el título`;

    if (n === 0) {
        registryGrid.innerHTML = `
            <div class="registry-empty">
                ${CROWN_SVG}
                <span>Aún no has ascendido a nadie.<br>Pasa el ratón sobre un Pokémon del equipo y pulsa «Ascender».</span>
            </div>`;
        return;
    }

    const currentGod = pokemonTeam.find(p => p && p.isGod);

    registryGrid.innerHTML = godHistory.map((g, i) => {
        const src = g.image || `home/${g.id}.png`;
        const isCard = src.includes('assets.tcgdex.net');
        const species = g.species ? g.species[0].toUpperCase() + g.species.slice(1) : `#${g.id}`;
        const title = g.nickname || species;
        const isCurrent = currentGod && currentGod.id === g.id && currentGod.nickname === g.nickname;
        const date = g.ascendedAt ? new Date(g.ascendedAt).toLocaleDateString('es-ES') : '';

        return `
            <article class="god-entry" style="--i:${i}">
                <div class="god-entry-art${isCard ? '' : ' is-sprite'}">
                    <img src="${escapeHTML(src)}" alt="${escapeHTML(title)}">
                    <span class="god-entry-rank">${CROWN_SVG}${i + 1}</span>
                    ${isCurrent ? '<span class="god-entry-current">Actual</span>' : ''}
                </div>
                <div class="god-entry-info">
                    <div class="god-entry-nick">${escapeHTML(title)}</div>
                    ${g.nickname ? `<div class="god-entry-species">${escapeHTML(species)}</div>` : ''}
                    ${date ? `<div class="god-entry-date">Ascendido el ${date}</div>` : ''}
                </div>
            </article>`;
    }).join('');
}

function openRegistry() {
    renderRegistry(); // refresca también la etiqueta "Actual"
    registryOverlay.classList.add('open');
}
function closeRegistry() {
    registryOverlay.classList.remove('open');
}

document.getElementById('btn-registry').addEventListener('click', openRegistry);
document.getElementById('registry-close').addEventListener('click', closeRegistry);
registryOverlay.addEventListener('click', (e) => { if (e.target === registryOverlay) closeRegistry(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeRegistry(); });

renderRegistry();

// Peticion api de pokemon
async function getPokemon() {
    try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon-species?limit=1025');

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        POKEMON_LIST = data.results.map((obj, index) => {
            return { name: obj.name, id: index + 1 }
        })
    } catch (error) {
        console.error('Error:', error);
    }
}

// get first evo Pokemon
async function getPokemonFirstEvo() {
    try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon-species?limit=1025');

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();

        const results = data.results;
        console.log(results);
        for (let index = 0; index < results.length; index++) {
            const response2 = await fetch(results[index].url);

            const dataSpecie = await response2.json();

            if (dataSpecie.evolves_from_species == null) FIRST_EVO_LIST.push(
                { name: dataSpecie.name, id: dataSpecie.id }
            )

        }


    } catch (error) {
        console.error('Error:', error);
    }
}
getPokemon();
getPokemonFirstEvo();

// ---------- aleatorio con semilla ----------
function xmur3(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
    }
    return function () {
        h = Math.imul(h ^ (h >>> 16), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        return (h ^= h >>> 16) >>> 0;
    };
}

function mulberry32(a) {
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// mismo texto + misma longitud de lista = siempre el mismo índice
function seededIndex(seed, length) {
    const rng = mulberry32(xmur3(seed)());
    return Math.floor(rng() * length);
}
// ---------- TCGdex ----------
const TCGDEX_API = 'https://api.tcgdex.net/v2/en';
const tcgCache = new Map(); // id del pokémon -> cartas válidas (evita repetir peticiones)

// "Mr. Mime" y "mr-mime" -> "mr mime"; "Flabébé" -> "flabebe"
function normalizeName(str) {
    return str
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/-/g, ' ')
        .replace(/[^a-z0-9 ]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

async function getPokemonCards(pokemon) {
    if (tcgCache.has(pokemon.id)) return tcgCache.get(pokemon.id);

    const overrides = { 'nidoran-f': 'nidoran', 'nidoran-m': 'nidoran' };
    const slug = normalizeName(overrides[pokemon.name] || pokemon.name);

    // la API busca por "contiene": pedimos con la palabra más larga y filtramos después
    const term = slug.split(' ').sort((a, b) => b.length - a.length)[0];
    const res = await fetch(`${TCGDEX_API}/cards?name=${encodeURIComponent(term)}`);
    if (!res.ok) throw new Error(`TCGdex HTTP ${res.status}`);

    const cards = await res.json();
    const matcher = new RegExp(`(^| )${slug}( |$)`); // palabra completa: "mew" no coge "mewtwo"
    const valid = cards
        .filter(c => c.image && matcher.test(normalizeName(c.name)))
        .sort((a, b) => a.id.localeCompare(b.id));

    tcgCache.set(pokemon.id, valid);
    return valid;
}

function preloadImage(src) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = src;
    });
}

// devuelve la URL de una carta aleatoria; si algo falla, usa el sprite de siempre
async function getRandomCardImage(pokemon, nickname = '') {
    try {
        if (pokemon && pokemon.name) {
            const cards = await getPokemonCards(pokemon);
            if (cards.length > 0) {
                const seed = nickname
                    ? `${pokemon.name}|${nickname.trim().toLowerCase()}`
                    : pokemon.name;
                const card = cards[seededIndex(seed, cards.length)];
                const url = `${card.image}/high.webp`;
                if (await preloadImage(url)) return url;
            }
        }
    } catch (error) {
        console.error('TCGdex:', error);
    }
    return `home/${pokemon.id}.png`;
}
updateTeamCount();


// ---------- badges panel ----------
function badgeSVG() {
    return `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path class="badge-shield-edge badge-shield" d="M50 4 92 26v32c0 24-19 36-42 38C27 94 8 82 8 58V26z"/>
      <circle class="badge-core" cx="50" cy="50" r="22"/>
      <path class="badge-spark" d="M50 34l7 14 15 2-11 11 3 16-14-8-14 8 3-16-11-11 15-2z"/>
    </svg>`;
}
function badgeImg(index) {
    var numMedalla = 1 + index + (currentGen - 1) * 8;
    if (currentGen == 6) {
        numMedalla = 43 + index;
    }
    else if (currentGen > 6) return badgeSVG();
    console.log(numMedalla);
    console.log(currentGen);
    return `<img class="badge-img" src="badges/${numMedalla}.png" alt="Medalla ${index + 1}">`;
}
const badgeGrid = document.getElementById('badge-grid');
const percentEl = document.getElementById('badges-percent');
const percentTextEl = document.getElementById('badges-percent-text');
const badgesCountText = document.getElementById('badges-count-text');

function renderBadgeGrid() {
    badgeGrid.innerHTML = '';

    for (let i = 0; i < badges; i++) {
        const btn = document.createElement('button');
        btn.className = 'badge-btn';
        btn.type = 'button';
        btn.setAttribute('aria-pressed', 'false');
        btn.setAttribute('aria-label', 'Medalla ' + (i + 1));
        btn.innerHTML = badgeImg(i);

        btn.addEventListener('click', () => toggleBadge(btn));
        badgeGrid.appendChild(btn);
    }

    for (let i = badges; i < TOTAL_BADGES; i++) {
        const btn = document.createElement('button');
        btn.className = 'badge-btn';
        btn.type = 'button';
        btn.setAttribute('aria-pressed', 'false');
        btn.setAttribute('aria-label', 'Medalla ' + (i + 1));
        btn.innerHTML = badgeImg(i);

        btn.classList.add('lost');
        btn.addEventListener('click', () => toggleBadge(btn));
        badgeGrid.appendChild(btn);
    }
    updateBadgePercent();
}

function toggleBadge(btn) {
    btn.classList.toggle('lost');
    btn.classList.remove('flip');
    requestAnimationFrame(() => btn.classList.add('flip'));
    if (!btn.classList.contains('lost')) {
        btn.setAttribute('aria-pressed', 'true');
        badges++;
        console.log(badges)
    } else {
        btn.setAttribute('aria-pressed', 'false');
        badges--;
    }

    updateBadgePercent();
}

function updateBadgePercent() {

    const pct = Math.round((badges / TOTAL_BADGES) * 100);
    percentEl.textContent = pct;
    percentTextEl.textContent = pct;
    badgesCountText.textContent = `${badges} / ${TOTAL_BADGES} medallas`;
    percentEl.classList.remove('pulse');
    requestAnimationFrame(() => percentEl.classList.add('pulse'));
    saveToLocalStorage();

}

renderBadgeGrid();
// ---------- restaurar partida al abrir la web ----------
function loadFromLocalStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return false;

        const datos = JSON.parse(raw);
        if (!validFormat(datos)) return false;

        applyGameState(datos);
        return true;
    } catch (error) {
        console.error('No se pudo leer localStorage:', error);
        return false;
    }
}

const restored = loadFromLocalStorage();
persistEnabled = true; // a partir de aquí, cada cambio se guarda
if (restored) showToast('Partida recuperada');


teamSlots.forEach(ts => {
    ts.addEventListener('click', () => {
        if (ts.classList.contains('loading')) return;
        const slot = parseInt(ts.dataset.slot, 10);
        pokemonTeam[slot] = { id: 0, nickname: "", image: "", types: [] };
        clearTeamSlot(slot);
        saveToLocalStorage();
    });
});

// ---------- animación de calavera al perder una vida ----------
function skullSVG() {
    return `
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <path fill="#eef0fb" d="M32 4C18 4 8 14 8 27c0 8 4 13 8 17v8a4 4 0 0 0 4 4h4v-6h4v6h8v-6h4v6h4a4 4 0 0 0 4-4v-8c4-4 8-9 8-17C56 14 46 4 32 4Z"/>
      <circle cx="22" cy="27" r="6" fill="#ff5d73"/>
      <circle cx="42" cy="27" r="6" fill="#ff5d73"/>
      <circle cx="22" cy="27" r="2.6" fill="#14162a"/>
      <circle cx="42" cy="27" r="2.6" fill="#14162a"/>
      <path d="M28 38h8l-2 6h-4l-2-6Z" fill="#34386a"/>
    </svg>`;
}

function playSkullAnimation(originEl) {
    const rect = originEl.getBoundingClientRect();
    const fx = document.createElement('div');
    fx.className = 'skull-fx';
    fx.style.left = (rect.left + rect.width / 2) + 'px';
    fx.style.top = (rect.top + rect.height / 2) + 'px';
    fx.innerHTML = skullSVG();
    document.body.appendChild(fx);
    fx.addEventListener('animationend', () => fx.remove());
}

// ---------- panel de huevo (solo animación visual) ----------
const eggBtn = document.getElementById('egg-btn');
const eggImgIdle = document.getElementById('egg-img-idle');
const eggImgResult = document.getElementById('egg-img-result');
const eggHint = document.getElementById('egg-hint');
const eggResultEmpty = document.getElementById('egg-result-empty');
const eggResultFilled = document.getElementById('egg-result-filled');
const eggResultName = document.getElementById('egg-result-name');

eggBtn.classList.add('idle');
let eggBusy = false;

eggBtn.addEventListener('click', () => {
    if (eggBusy) return;
    eggBusy = true;

    eggBtn.classList.remove('idle');
    eggBtn.classList.add('shaking');
    eggHint.style.opacity = '0';

    setTimeout(() => {
        eggBtn.classList.remove('shaking');
        eggBtn.classList.add('hatching');

        const burst = document.createElement('div');
        burst.className = 'egg-burst';
        document.body.appendChild(burst);
        burst.addEventListener('animationend', () => burst.remove());

        const random = FIRST_EVO_LIST[Math.floor(Math.random() * FIRST_EVO_LIST.length)];

        showEggResult(random.name, `home/${random.id}.png`);

    }, 1500);
});

function showEggResult(name, imageSrc) {
    eggImgResult.src = imageSrc;
    eggImgResult.alt = name;
    eggImgResult.hidden = false;
    eggBtn.classList.add('revealed');

    eggResultName.textContent = name;
    eggResultEmpty.classList.add('is-hidden');
    eggResultFilled.classList.remove('is-hidden');

    eggBusy = false; // ya no se puede volver a clicar el huevo hasta reiniciar
}

document.getElementById('btn-egg-restart').addEventListener('click', () => {
    eggBtn.classList.remove('hatching', 'revealed');
    eggBtn.classList.add('idle');
    eggImgResult.hidden = true;
    eggImgResult.src = '';
    eggHint.style.opacity = '1';

    eggResultFilled.classList.add('is-hidden');
    eggResultEmpty.classList.remove('is-hidden');

    eggBusy = false;
});

