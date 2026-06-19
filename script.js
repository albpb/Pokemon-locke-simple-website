 // ---------- pokeball svg ----------
  function pokeballSVG(){
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

  const grid = document.getElementById('ball-grid');
  const currentEl = document.getElementById('lives-current');
  const totalLabel = document.getElementById('lives-total-label');
  const ofEl = document.querySelector('.lives-of');

  // VARIABLES DE CONTROL:

  let TOTAL_LIVES = 10;
  let currentGen = 3;
  let POKEMON_LIST = [
    ];
    const TOTAL_BADGES = 8;
    var badges = 0;


  function renderGrid(total){
    grid.innerHTML = '';
    for(let i=0;i<total;i++){
      const btn = document.createElement('button');
      btn.className = 'ball-btn';
      btn.type = 'button';
      btn.setAttribute('aria-pressed','false');
      btn.setAttribute('aria-label', 'Vida ' + (i+1));
      btn.innerHTML = pokeballSVG();
      btn.addEventListener('click', () => toggleBall(btn));
      grid.appendChild(btn);
    }
    updateCounter();
  }

  function toggleBall(btn){
    btn.classList.toggle('lost');
    btn.classList.remove('flip');
    requestAnimationFrame(()=> btn.classList.add('flip'));
    btn.setAttribute('aria-pressed', btn.classList.contains('lost') ? 'true' : 'false');
    updateCounter();
  }

  function updateCounter(){
    const total = grid.children.length;
    const lost = grid.querySelectorAll('.ball-btn.lost').length;
    const remaining = total - lost;
    currentEl.textContent = remaining;
    ofEl.textContent = `/ ${total} restantes`;
    currentEl.classList.remove('pulse');
    requestAnimationFrame(()=> currentEl.classList.add('pulse'));
  }

  renderGrid(TOTAL_LIVES);

  // ---------- modal ----------
  const overlay = document.getElementById('modal-overlay');
  const openModal = () => overlay.classList.add('open');
  const closeModal = () => overlay.classList.remove('open');

  document.getElementById('btn-new').addEventListener('click', openModal);
  document.getElementById('btn-cancel').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e)=>{ if(e.target === overlay) closeModal(); });
  document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape'){
    closeModal();
    closeNicknameModal();
  }
});

  document.getElementById('btn-confirm').addEventListener('click', () => {
    const lives = parseInt(document.getElementById('input-lives').value, 10) || 1;
    const gen = parseInt(document.getElementById('input-gen').value, 10);

    TOTAL_LIVES = lives;
    totalLabel.textContent = lives;
    currentGen = gen;
  document.getElementById('badges-gen-label').textContent = document.getElementById('input-gen').selectedOptions[0].textContent;

    renderGrid(lives);
    renderBadgeGrid();
    
    closeModal();
    showToast('Nueva partida creada');
  });

  // ---------- toast helper (visual only) ----------
  let toastTimer;
  function showToast(text){
    const toast = document.getElementById('toast');
    document.getElementById('toast-text').textContent = text;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=> toast.classList.remove('show'), 2200);
  }

  document.getElementById('btn-save').addEventListener('click', () => showToast('Partida guardada'));
  document.getElementById('btn-load').addEventListener('click', () => document.getElementById('file-input').click());
  document.getElementById('file-input').addEventListener('change', () => showToast('Fichero cargado'));


// ---------- modal de mote ----------
const nicknameOverlay = document.getElementById('nickname-overlay');
const nicknamePreviewImg = document.getElementById('nickname-preview-img');
const nicknamePreviewName = document.getElementById('nickname-preview-name');
const inputNickname = document.getElementById('input-nickname');

let pendingPokemon = null; // { name, image }

function openNicknameModal(item){

  let pokemon = POKEMON_LIST.at(item.id -1);
  pendingPokemon = pokemon.id;
  nicknamePreviewImg.src = `home/${pokemon.id}.png`;
  nicknamePreviewImg.alt = pokemon.id;
  nicknamePreviewName.textContent = pokemon.name;
  inputNickname.value = '';
  nicknameOverlay.classList.add('open');
  setTimeout(() => inputNickname.focus(), 200);
}

function closeNicknameModal(){
  nicknameOverlay.classList.remove('open');
  pendingPokemon = null;
}

function confirmNickname(){
  if(!pendingPokemon) return;

  const nickname = inputNickname.value.trim();

  const freeIndex = Array.from(teamSlots).findIndex(slot => !slot.classList.contains('filled'));
  if(freeIndex !== -1){
    setTeamSlot(freeIndex, `home/${pendingPokemon}.png`, nickname);
  }

  closeNicknameModal();
}

document.getElementById('btn-nickname-confirm').addEventListener('click', () => confirmNickname());
inputNickname.addEventListener('keydown', (e) => { if(e.key === 'Enter') confirmNickname(true); });
nicknameOverlay.addEventListener('click', (e) => { if(e.target === nicknameOverlay) closeNicknameModal(); });

// ---------- team panel (solo visual) ----------

// POKEMON_LIST[0] = {id: id, name: name}


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

function setTeamSlot(index, imgSrc, name){
  const slot = teamSlots[index];
  if(!slot) return;
  const empty = slot.querySelector('.slot-empty');
  const filledContent = slot.querySelector('.slot-filled-content');
  const img = slot.querySelector('.slot-img');
  const nameEl = slot.querySelector('.slot-name');

  img.src = imgSrc;
  img.alt = name || '';
  nameEl.textContent = name || '';

  empty.classList.add('is-hidden');
  filledContent.classList.remove('is-hidden');
  slot.classList.add('filled');
  updateTeamCount();
}

function clearTeamSlot(index){
  const slot = teamSlots[index];
  if(!slot) return;
  const empty = slot.querySelector('.slot-empty');
  const filledContent = slot.querySelector('.slot-filled-content');
  const img = slot.querySelector('.slot-img');
  const nameEl = slot.querySelector('.slot-name');

  filledContent.classList.add('is-hidden');
  img.src = '';
  nameEl.textContent = '';
  empty.classList.remove('is-hidden');
  slot.classList.remove('filled');
  updateTeamCount();
}

function updateTeamCount(){
  const filled = document.querySelectorAll('.team-slot.filled').length;
  const total = teamSlots.length;
  teamCountEl.textContent = `${filled} / ${total}`;
  teamCompleteChip.classList.toggle('show', filled === total);
}


function renderPokemonDropdown(list){
  if(!list || list.length === 0){
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
  const filtrados = POKEMON_LIST.filter(p => p.name.toLowerCase().includes(q)).splice(0,5);
  renderPokemonDropdown(filtrados);
});

searchDropdown.addEventListener('click', (e) => {
  const item = e.target.closest('.dropdown-item');
  if(!item) return; // click fue en el dropdown pero no en un item válido

  openNicknameModal(item);

  // cerrar dropdown
  searchInput.value = '';
  searchDropdown.classList.remove('open');
});

teamSlots.forEach(ts => {
    ts.addEventListener('click', (e) => {
        const slot = ts.dataset.slot;
        clearTeamSlot(slot);
    })
});

// Peticion api de pokemon
async function getPokemon() {
  try {
    const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025');

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    POKEMON_LIST = data.results.map((obj, index) => {
        return {name: obj.name, id: index + 1}
    })
    console.log(POKEMON_LIST);
  } catch (error) {
    console.error('Error:', error);
  }
}

getPokemon();


updateTeamCount();


// ---------- badges panel ----------
function badgeSVG(){
  return `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path class="badge-shield-edge badge-shield" d="M50 4 92 26v32c0 24-19 36-42 38C27 94 8 82 8 58V26z"/>
      <circle class="badge-core" cx="50" cy="50" r="22"/>
      <path class="badge-spark" d="M50 34l7 14 15 2-11 11 3 16-14-8-14 8 3-16-11-11 15-2z"/>
    </svg>`;
}
function badgeImg(index){
    var numMedalla = 1+ index + (currentGen-1)*8;
    if (currentGen == 6)
    {
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

function renderBadgeGrid(){
  badgeGrid.innerHTML = '';
  for(let i=0;i<TOTAL_BADGES;i++){
    const btn = document.createElement('button');
    btn.className = 'badge-btn';
    btn.type = 'button';
    btn.setAttribute('aria-pressed','false');
    btn.setAttribute('aria-label', 'Medalla ' + (i+1));
    btn.innerHTML = badgeImg(i);
    
    btn.classList.add('lost');
    btn.addEventListener('click', () => toggleBadge(btn));
    badgeGrid.appendChild(btn);
  }
  updateBadgePercent();
}

function toggleBadge(btn){
  btn.classList.toggle('lost');
  btn.classList.remove('flip');
  requestAnimationFrame(()=> btn.classList.add('flip'));
  btn.setAttribute('aria-pressed', !btn.classList.contains('lost') ? 'true' : 'false');
  updateBadgePercent();
}

function updateBadgePercent(){
    
  const pct = Math.round((badges / TOTAL_BADGES) * 100);
  percentEl.textContent = pct;
  percentTextEl.textContent = pct;
  badgesCountText.textContent = `${badges} / ${TOTAL_BADGES} medallas`;
  percentEl.classList.remove('pulse');
  requestAnimationFrame(()=> percentEl.classList.add('pulse'));
}

renderBadgeGrid();

