// ==========================================
// ІНІЦІАЛІЗАЦІЯ ДАНИХ (LocalStorage) - З реальними фотографіями
// ==========================================
const defaultCars = [
    { id: 1, ownerId: 'demo@mail.com', brand: 'BMW', model: 'X5 M-Sport', price: 45000, year: 2020, body: 'Позашляховик', img: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=800&auto=format&fit=crop', mileage: 45, desc: 'Ідеальний стан, перший власник.' },
    { id: 2, ownerId: 'demo@mail.com', brand: 'Audi', model: 'A6 Quattro', price: 38000, year: 2019, body: 'Седан', img: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?q=80&w=800&auto=format&fit=crop', mileage: 60, desc: 'Офіціал, сервісна історія.' },
    { id: 3, ownerId: 'other@mail.com', brand: 'Toyota', model: 'Camry Hybrid', price: 25000, year: 2021, body: 'Седан', img: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fd?q=80&w=800&auto=format&fit=crop', mileage: 30, desc: 'Економний та надійний.' },
    { id: 4, ownerId: 'other@mail.com', brand: 'Mercedes', model: 'GLE 450', price: 58000, year: 2022, body: 'Позашляховик', img: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=800&auto=format&fit=crop', mileage: 15, desc: 'Нова гума, пройдено ТО.' }
];

const initStorage = (key, defaultData) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(defaultData));
};

initStorage('carsData', defaultCars);
initStorage('usersData', []);
initStorage('favoritesData', {});

let carsData = JSON.parse(localStorage.getItem('carsData'));
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let favoritesData = JSON.parse(localStorage.getItem('favoritesData'));
let currentViewMode = 'all';

// ==========================================
// АНІМАЦІЯ ЛІЧИЛЬНИКІВ СТАТИСТИКИ
// ==========================================
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 4); 
        obj.innerHTML = Math.floor(easeProgress * (end - start) + start).toLocaleString('en-US');
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.querySelectorAll('.stat-number').forEach(counter => {
                animateValue(counter, 0, parseInt(counter.getAttribute('data-target')), 2500);
            });
            observer.unobserve(entry.target); 
        }
    });
}, { threshold: 0.5 });

// ==========================================
// МОБІЛЬНЕ МЕНЮ ТА ФІЛЬТРИ
// ==========================================
let isMobileMenuOpen = false;
function toggleMobileMenu() {
    const nav = document.getElementById('mobileNav');
    const icon = document.querySelector('#mobileMenuBtn i');
    isMobileMenuOpen = !isMobileMenuOpen;
    
    if (isMobileMenuOpen) {
        nav.classList.remove('hidden');
        nav.classList.add('flex');
        icon.classList.replace('fa-bars', 'fa-xmark');
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => nav.classList.remove('opacity-0'));
    } else {
        nav.classList.add('opacity-0');
        icon.classList.replace('fa-xmark', 'fa-bars');
        document.body.style.overflow = '';
        setTimeout(() => { nav.classList.add('hidden'); nav.classList.remove('flex'); }, 300);
    }
}

function toggleFilters() {
    const panel = document.getElementById('filterPanel');
    if (panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => panel.classList.remove('opacity-0'));
    } else {
        panel.classList.add('opacity-0');
        document.body.style.overflow = '';
        setTimeout(() => panel.classList.add('hidden'), 300);
    }
}

function applyMobileFilters() {
    filterCars();
    if(window.innerWidth < 768) toggleFilters();
    document.getElementById('carsGrid').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ==========================================
// АВТОРИЗАЦІЯ ТА UI
// ==========================================
const authModal = document.getElementById('authModal');
let currentAuthMode = 'login';

function updateAuthUIState() {
    const desktopNav = document.getElementById('authNavContainer');
    const mobileNav = document.getElementById('mobileAuthNavContainer');
    const userTabs = document.getElementById('userTabs');
    
    const loggedInHTML = `
        <span class="text-gray-400 block pb-2 md:pb-0">Вітаємо, <span class="text-white">${currentUser?.name || currentUser?.email.split('@')[0]}</span></span>
        <button onclick="logout(); if(window.innerWidth<768)toggleMobileMenu();" class="text-left md:text-center text-gray-500 hover:text-white transition py-2 md:py-0">Вийти</button>
    `;
    
    const loggedOutHTML = `
        <button onclick="openAuthModal('login'); if(window.innerWidth<768)toggleMobileMenu();" class="text-left md:text-center text-gray-300 hover:text-white transition py-2 md:py-0">Увійти</button>
        <button onclick="openAuthModal('register'); if(window.innerWidth<768)toggleMobileMenu();" class="text-center bg-[#ef4444] px-6 py-3 md:py-2.5 rounded-lg text-white hover:bg-red-600 transition mt-2 md:mt-0 font-medium shadow-lg">Зареєструватися</button>
    `;

    if (currentUser) {
        desktopNav.innerHTML = loggedInHTML;
        mobileNav.innerHTML = loggedInHTML;
        userTabs.classList.remove('hidden');
        userTabs.classList.add('flex');
    } else {
        desktopNav.innerHTML = loggedOutHTML;
        mobileNav.innerHTML = loggedOutHTML;
        userTabs.classList.add('hidden');
        userTabs.classList.remove('flex');
        currentViewMode = 'all';
    }
    updateTabsUI();
    renderCars(getCarsForCurrentMode());
}

function openAuthModal(mode) {
    currentAuthMode = mode;
    const title = document.getElementById('authTitle');
    const nameField = document.getElementById('nameField');
    const submitBtn = document.getElementById('authSubmitBtn');
    const switchText = document.getElementById('authSwitchText');
    const switchBtn = document.getElementById('authSwitchBtn');
    
    if (mode === 'login') {
        title.innerText = 'Увійти';
        nameField.classList.add('hidden');
        nameField.querySelector('input').removeAttribute('required');
        submitBtn.innerText = 'Увійти';
        switchText.innerText = 'Немає акаунта?';
        switchBtn.innerText = 'Зареєструватися';
    } else {
        title.innerText = 'Реєстрація';
        nameField.classList.remove('hidden');
        nameField.querySelector('input').setAttribute('required', 'true');
        submitBtn.innerText = 'Створити акаунт';
        switchText.innerText = 'Вже є акаунт?';
        switchBtn.innerText = 'Увійти';
    }
    
    authModal.classList.remove('hidden');
    authModal.classList.add('flex');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => authModal.classList.remove('opacity-0'));
}

function closeAuthModal() {
    authModal.classList.add('opacity-0');
    setTimeout(() => { 
        authModal.classList.add('hidden'); 
        authModal.classList.remove('flex'); 
        if(!document.querySelector('#mobileNav.flex')) document.body.style.overflow = '';
    }, 300);
}

function toggleAuthMode() { openAuthModal(currentAuthMode === 'login' ? 'register' : 'login'); }

function submitAuth(e) {
    e.preventDefault();
    const email = document.querySelector('#authForm input[type="email"]').value;
    const pass = document.querySelector('#authForm input[type="password"]').value;
    const name = document.querySelector('#nameField input').value;
    let users = JSON.parse(localStorage.getItem('usersData'));

    if (currentAuthMode === 'register') {
        if (users.find(u => u.email === email)) return alert('Цей email вже зареєстровано.');
        currentUser = { email, pass, name };
        users.push(currentUser);
        localStorage.setItem('usersData', JSON.stringify(users));
    } else {
        currentUser = users.find(u => u.email === email && u.pass === pass);
        if (!currentUser) return alert('Невірний email або пароль.');
    }

    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    closeAuthModal();
    updateAuthUIState();
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateAuthUIState();
}

// ==========================================
// ВІДОБРАЖЕННЯ ТА ФІЛЬТРАЦІЯ
// ==========================================
function updateTabsUI() {
    if(!currentUser) return;
    const buttons = document.querySelectorAll('#userTabs button');
    buttons.forEach(btn => {
        btn.classList.replace('bg-[#111111]', 'bg-[#111111]/50');
        btn.classList.replace('border-[#ef4444]', 'border-white/5');
        btn.classList.replace('text-white', 'text-gray-400');
    });

    let activeIndex = currentViewMode === 'all' ? 0 : currentViewMode === 'favorites' ? 1 : 2;
    buttons[activeIndex].classList.replace('bg-[#111111]/50', 'bg-[#111111]');
    buttons[activeIndex].classList.replace('border-white/5', 'border-[#ef4444]');
    buttons[activeIndex].classList.replace('text-gray-400', 'text-white');
}

function showAllCars() { currentViewMode = 'all'; updateTabsUI(); filterCars(); }
function showFavorites() { currentViewMode = 'favorites'; updateTabsUI(); filterCars(); }
function showMyAds() { currentViewMode = 'myAds'; updateTabsUI(); filterCars(); }

function getCarsForCurrentMode() {
    if (currentViewMode === 'myAds') return carsData.filter(c => c.ownerId === currentUser.email);
    if (currentViewMode === 'favorites') {
        const favs = favoritesData[currentUser?.email] || [];
        return carsData.filter(c => favs.includes(c.id));
    }
    return carsData;
}

function filterCars() {
    const brand = document.getElementById('brandFilter').value.toLowerCase();
    const body = document.getElementById('bodyFilter').value.toLowerCase();
    const priceMin = document.getElementById('priceMin').value;
    const priceMax = document.getElementById('priceMax').value;

    const baseCars = getCarsForCurrentMode();
    const filtered = baseCars.filter(car => {
        return (!brand || car.brand.toLowerCase() === brand) &&
               (!body || car.body.toLowerCase() === body) &&
               (!priceMin || car.price >= parseInt(priceMin)) &&
               (!priceMax || car.price <= parseInt(priceMax));
    });
    renderCars(filtered);
}

function clearFilters() {
    document.getElementById('brandFilter').value = '';
    document.getElementById('bodyFilter').value = '';
    document.getElementById('priceMin').value = '';
    document.getElementById('priceMax').value = '';
    filterCars();
}

// ==========================================
// РЕНДЕР КАРТОК
// ==========================================
function renderCars(cars) {
    const grid = document.getElementById('carsGrid');
    if(cars.length === 0) {
        grid.innerHTML = `<div class="col-span-full flex flex-col items-center justify-center py-20 px-4 text-center">
            <div class="w-16 h-16 bg-[#111111] rounded-full flex items-center justify-center mb-4"><i class="fa-solid fa-car-side text-gray-500 text-2xl"></i></div>
            <p class="text-gray-400 text-lg">За вашим запитом нічого не знайдено.</p>
        </div>`;
        return;
    }

    const userFavs = currentUser && favoritesData[currentUser.email] ? favoritesData[currentUser.email] : [];
    const fragment = document.createDocumentFragment();

    cars.forEach(car => {
        const isFav = userFavs.includes(car.id);
        const favIconClass = isFav ? 'fa-solid text-[#ef4444]' : 'fa-regular text-white drop-shadow-md';
        let actionBtns = '';
        
        if (currentUser && car.ownerId === currentUser.email) {
            actionBtns = `
                <div class="absolute top-3 left-3 flex gap-2 z-10">
                    <button onclick="editCar(${car.id}); event.stopPropagation();" class="bg-black/60 backdrop-blur-md p-2 rounded-full text-blue-400 hover:text-blue-300 border border-white/10 min-w-[36px] min-h-[36px]"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="deleteCar(${car.id}); event.stopPropagation();" class="bg-black/60 backdrop-blur-md p-2 rounded-full text-[#ef4444] hover:text-red-400 border border-white/10 min-w-[36px] min-h-[36px]"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
        }

        const div = document.createElement('div');
        div.className = "bg-[#111111] rounded-2xl overflow-hidden border border-white/5 card-hover flex flex-col relative group cursor-pointer";
        div.onclick = () => showDetails(car.id);
        
        div.innerHTML = `
            ${actionBtns}
            <button onclick="toggleFavorite(${car.id}); event.stopPropagation();" class="absolute top-3 right-3 bg-black/40 backdrop-blur-md p-2 rounded-full border border-white/10 z-10 transition hover:bg-black/60 min-w-[40px] min-h-[40px] flex items-center justify-center">
                <i class="${favIconClass} fa-heart text-lg"></i>
            </button>
            <div class="relative w-full pt-[65%] sm:pt-[60%] bg-black">
                <img src="${car.img}" alt="${car.brand} ${car.model}" loading="lazy" class="absolute inset-0 w-full h-full object-cover">
            </div>
            <div class="p-4 md:p-5 flex flex-col flex-grow">
                <div class="flex justify-between items-start mb-1.5 gap-2">
                    <h3 class="text-base md:text-lg font-bold leading-tight line-clamp-2">${car.brand} ${car.model}</h3>
                    <span class="bg-black text-xs px-2 py-1 rounded text-gray-300 border border-white/5 flex-shrink-0">${car.year}</span>
                </div>
                <p class="text-xs md:text-sm text-gray-400 mb-4">${car.body} • ${car.mileage} тис. км</p>
                <div class="mt-auto flex items-center justify-between">
                    <p class="text-lg md:text-xl font-black text-white">$${car.price.toLocaleString()}</p>
                    <span class="text-[#ef4444] text-sm font-semibold group-hover:underline">Деталі <i class="fa-solid fa-arrow-right text-xs ml-1"></i></span>
                </div>
            </div>
        `;
        fragment.appendChild(div);
    });
    grid.innerHTML = '';
    grid.appendChild(fragment);
}

function toggleFavorite(carId) {
    if (!currentUser) return openAuthModal('login');
    if (!favoritesData[currentUser.email]) favoritesData[currentUser.email] = [];
    const favs = favoritesData[currentUser.email];
    const index = favs.indexOf(carId);
    if (index === -1) favs.push(carId); else favs.splice(index, 1);
    localStorage.setItem('favoritesData', JSON.stringify(favoritesData));
    filterCars();
}

// ==========================================
// ДЕТАЛІ ТА CRUD
// ==========================================
const detailsModal = document.getElementById('detailsModal');
function showDetails(id) {
    const car = carsData.find(c => c.id === id);
    if(!car) return;
    document.getElementById('detImg').src = car.img;
    document.getElementById('detTitle').innerText = `${car.brand} ${car.model}`;
    document.getElementById('detPrice').innerText = `$${car.price.toLocaleString()}`;
    document.getElementById('detYear').innerText = car.year;
    document.getElementById('detBody').innerText = car.body;
    document.getElementById('detMileage').innerText = car.mileage;
    document.getElementById('detOwner').innerText = car.ownerId;
    document.getElementById('detDesc').innerText = car.desc || 'Опис відсутній.';
    detailsModal.classList.remove('hidden');
    detailsModal.classList.add('flex');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => detailsModal.classList.remove('opacity-0'));
}

function closeDetails() {
    detailsModal.classList.add('opacity-0');
    setTimeout(() => { detailsModal.classList.add('hidden'); detailsModal.classList.remove('flex'); document.body.style.overflow = ''; }, 300);
}

const addCarModal = document.getElementById('addCarModal');
function openAddCarModal() {
    if (!currentUser) return openAuthModal('login');
    if(!document.getElementById('editCarId').value) {
        const draft = JSON.parse(localStorage.getItem('carDraft'));
        if(draft) {
            ['Brand', 'Model', 'Year', 'Price', 'Body', 'Mileage', 'Desc', 'Img'].forEach(field => {
                document.getElementById('car' + field).value = draft[field.toLowerCase()] || '';
            });
        }
        document.getElementById('addCarTitle').innerText = 'Нове оголошення';
        document.getElementById('submitCarBtn').innerText = 'Опублікувати';
    }
    addCarModal.classList.remove('hidden');
    addCarModal.classList.add('flex');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => addCarModal.classList.remove('opacity-0'));
}

function closeAddCarModal() {
    addCarModal.classList.add('opacity-0');
    setTimeout(() => { 
        addCarModal.classList.add('hidden'); addCarModal.classList.remove('flex'); 
        document.body.style.overflow = ''; document.getElementById('addCarForm').reset(); document.getElementById('editCarId').value = '';
    }, 300);
}

function saveDraft() {
    if(document.getElementById('editCarId').value) return;
    const draft = {};
    ['Brand', 'Model', 'Year', 'Price', 'Body', 'Mileage', 'Desc', 'Img'].forEach(field => {
        draft[field.toLowerCase()] = document.getElementById('car' + field).value;
    });
    localStorage.setItem('carDraft', JSON.stringify(draft));
}

function clearDraft() {
    localStorage.removeItem('carDraft');
    document.getElementById('addCarForm').reset();
    document.getElementById('editCarId').value = '';
}

function editCar(id) {
    const car = carsData.find(c => c.id === id);
    if(!car) return;
    document.getElementById('editCarId').value = car.id;
    ['Brand', 'Model', 'Year', 'Price', 'Body', 'Mileage', 'Desc', 'Img'].forEach(field => {
        document.getElementById('car' + field).value = car[field.toLowerCase()] || '';
    });
    document.getElementById('addCarTitle').innerText = 'Редагування';
    document.getElementById('submitCarBtn').innerText = 'Зберегти зміни';
    openAddCarModal();
}

function submitCar(e) {
    e.preventDefault();
    const editId = document.getElementById('editCarId').value;
    const carData = {
        brand: document.getElementById('carBrand').value, model: document.getElementById('carModel').value,
        price: parseInt(document.getElementById('carPrice').value), year: parseInt(document.getElementById('carYear').value),
        body: document.getElementById('carBody').value, mileage: parseInt(document.getElementById('carMileage').value),
        desc: document.getElementById('carDesc').value,
        img: document.getElementById('carImg').value || `https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=800&auto=format&fit=crop`
    };

    if (editId) {
        const index = carsData.findIndex(c => c.id == editId);
        carsData[index] = { ...carsData[index], ...carData };
    } else {
        carsData.unshift({ id: Date.now(), ownerId: currentUser.email, ...carData });
        clearDraft();
    }
    localStorage.setItem('carsData', JSON.stringify(carsData));
    closeAddCarModal();
    showMyAds();
}

function deleteCar(id) {
    if(confirm('Видалити оголошення?')) {
        carsData = carsData.filter(c => c.id !== id);
        localStorage.setItem('carsData', JSON.stringify(carsData));
        filterCars();
    }
}

// Загальні Event Listeners
document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape') {
        if(!authModal.classList.contains('hidden')) closeAuthModal();
        if(!addCarModal.classList.contains('hidden')) closeAddCarModal();
        if(!detailsModal.classList.contains('hidden')) closeDetails();
    }
});
[authModal, addCarModal, detailsModal].forEach(modal => {
    modal.addEventListener('mousedown', (e) => { if (e.target === modal) window['close' + modal.id.charAt(0).toUpperCase() + modal.id.slice(1)](); });
});

// Ініціалізація
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUIState();
    const statsSection = document.getElementById('statistics');
    if (statsSection) observer.observe(statsSection);
});