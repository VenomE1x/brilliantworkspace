const supabaseUrl = 'https://hepryxeadtuqxkkqubsl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcHJ5eGVhZHR1cXhra3F1YnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5Nzc3ODAsImV4cCI6MjA5NTU1Mzc4MH0.SUwKIMhXJ6_mnfPjAjoNSX6rUtsBBHYet6D4MfEaJws';
const db = window.supabase.createClient(supabaseUrl, supabaseKey);

const STORAGE_KEY = 'desksData';
const CAFETERIA_KEY = 'cafeteriaMenu';
const CLIENTS_DB_KEY = 'clientsDB';
const SHIFT_REVENUE_KEY = 'shiftRevenue';
const TRANSACTIONS_KEY = 'transactionsLog';

const ADMIN_PASSWORD = 'vortex6541';

const JOB_TYPES = {
    student: 'طالب',
    freelancer: 'فريلانسر',
    other: 'أخرى',
};

const PACKAGES = [
    { id: '1hour', name: '1 Hour', nameAr: 'ساعة واحدة', price: 10, durationMs: 60 * 60 * 1000 },
    { id: '1day', name: '1 Day', nameAr: 'يوم واحد', price: 50, durationMs: 24 * 60 * 60 * 1000 },
    { id: '1week', name: '1 Week', nameAr: 'أسبوع واحد', price: 300, durationMs: 7 * 24 * 60 * 60 * 1000 },
    { id: '2weeks', name: '2 Weeks', nameAr: 'أسبوعين', price: 550, durationMs: 14 * 24 * 60 * 60 * 1000 },
    { id: '1month', name: '1 Month', nameAr: 'شهر واحد', price: 1000, durationMs: 30 * 24 * 60 * 60 * 1000 },
];

const totalDesks = 37;
const desks = [];
let cafeteriaMenu = [];
let clientsDB = [];
let modalSelectedClient = null;
let activeDeskId = null;
let selectedPackageId = null;
let countdownInterval = null;
let shiftRevenue = { desks: 0, drinks: 0 };
let transactionsLog = [];

const desksGrid = document.getElementById('desksGrid');
const availableCountEl = document.getElementById('availableCount');
const occupiedCountEl = document.getElementById('occupiedCount');
const regClientSourceInput = document.getElementById('regClientSource');
const regClientStatusInput = document.getElementById('regClientStatus'); // إضافة المتغير الجديد
const tabsNav = document.getElementById('tabsNav');
const modalOverlay = document.getElementById('modalOverlay');
const modalBox = document.getElementById('modalBox');
const modalTitle = document.getElementById('modalTitle');
const modalClose = document.getElementById('modalClose');
const bookingForm = document.getElementById('bookingForm');
const checkoutView = document.getElementById('checkoutView');
const clientsTableBody = document.getElementById('clientsTableBody');
const clientListFilter = document.getElementById('clientListFilter');
const clientDetailOverlay = document.getElementById('clientDetailOverlay');
const clientDetailBody = document.getElementById('clientDetailBody');
const closeClientDetailBtn = document.getElementById('closeClientDetail');
const registerClientForm = document.getElementById('registerClientForm');
const regClientNameInput = document.getElementById('regClientName');
const regClientPhoneInput = document.getElementById('regClientPhone');
const regClientJobTypeInput = document.getElementById('regClientJobType');
const regReferralCodeInput = document.getElementById('regReferralCode');
const regPromoCodeInput = document.getElementById('promoCode');
const modalClientSearchInput = document.getElementById('modalClientSearch');
const modalClientDropdown = document.getElementById('modalClientDropdown');
const modalSelectedClientEl = document.getElementById('modalSelectedClient');
const modalSelectedClientText = document.getElementById('modalSelectedClientText');
const clearModalClientBtn = document.getElementById('clearModalClient');
const packageOptions = document.getElementById('packageOptions');
const confirmBooking = document.getElementById('confirmBooking');
const checkoutDetails = document.getElementById('checkoutDetails');
const drinksList = document.getElementById('drinksList');
const deskOrderSummary = document.getElementById('deskOrderSummary');
const billingSummary = document.getElementById('billingSummary');
const confirmCheckout = document.getElementById('confirmCheckout');
const payDrinksNowBtn = document.getElementById('payDrinksNow');
const cafeteriaForm = document.getElementById('cafeteriaForm');
const itemNameInput = document.getElementById('itemName');
const itemPriceInput = document.getElementById('itemPrice');
const itemStockInput = document.getElementById('itemStock');
const menuTableBody = document.getElementById('menuTableBody');
const revDesksEl = document.getElementById('revDesks');
const revDrinksEl = document.getElementById('revDrinks');
const revGrandEl = document.getElementById('revGrand');
const marketingCountEl = document.getElementById('marketingCount');
const marketingRevenueEl = document.getElementById('marketingRevenue');
const closeShiftBtn = document.getElementById('closeShiftBtn');
const transactionsTableBody = document.getElementById('transactionsTableBody');

function getPackageById(id) {
    return PACKAGES.find((p) => p.id === id);
}

function getMenuItemById(id) {
    return cafeteriaMenu.find((item) => item.id === id);
}

function saveClientsDB() {
    localStorage.setItem(CLIENTS_DB_KEY, JSON.stringify(clientsDB));
    const mappedClients = clientsDB.map(c => ({
        id: Number(c.uniqueCode),
        name: c.name,
        phone: c.phone,
        job_type: c.jobType,
        source: c.source || 'أخرى',
        client_status: c.clientStatus || 'عميل جديد', // إضافة الرفع للسحابة
        promo_code: c.promoCode || '',
        total_hours: c.totalHoursBooked || 0,
        total_money: c.totalMoneyPaid || 0,
        history: c.history || []
    }));
    db.from('clients').upsert(mappedClients).then(({ data, error }) => {
        if (error) {
            console.error('Supabase Error:', error.message, error.details);
            alert('فشل الرفع لسوبابيز: ' + error.message);
        } else {
            console.log('Clients Synced Perfectly!');
        }
    });
}

function loadClientsDB() {
    try {
        const raw = localStorage.getItem(CLIENTS_DB_KEY);
        clientsDB = raw ? JSON.parse(raw) : [];
        // Migrate old clients: add missing tracking fields
        clientsDB.forEach((c) => {
            if (c.totalHoursBooked === undefined) c.totalHoursBooked = 0;
            if (c.totalMoneyPaid === undefined) c.totalMoneyPaid = 0;
            // ensure history array exists for each client
            if (!Array.isArray(c.history)) c.history = [];
        });
    } catch (err) {
        console.error('Failed to load clients DB:', err);
        clientsDB = [];
    }
}

function generateNextId() {
    let maxId = 0;
    clientsDB.forEach((client) => {
        const id = parseInt(client.uniqueCode, 10);
        if (!isNaN(id) && id > maxId) maxId = id;
    });
    return maxId + 1;
}

function normalizePhone(phone) {
    return phone.replace(/\s+/g, '').trim();
}

function getClientById(id) {
    const num = String(id).trim();
    return clientsDB.find((c) => String(c.uniqueCode) === num);
}

function getClientByPhone(phone) {
    const normalized = normalizePhone(phone);
    return clientsDB.find((c) => normalizePhone(c.phone) === normalized);
}

function searchClient(query) {
    const q = query.trim();
    if (!q) return null;
    if (/^\d+$/.test(q)) {
        return getClientById(q);
    }
    return getClientByPhone(q);
}

function getJobTypeLabel(jobType) {
    return JOB_TYPES[jobType] || jobType;
}

function renderClientCardHTML(client) {
    return `
        <p><strong>الرقم:</strong> ${client.uniqueCode}</p>
        <p><strong>الاسم:</strong> ${client.name}</p>
        <p><strong>الهاتف:</strong> ${client.phone}</p>
        <p><strong>نوع العمل:</strong> ${getJobTypeLabel(client.jobType)}</p>
        <p><strong>مصدر العميل:</strong> ${client.source || 'أخرى'}</p>
        <p><strong>حالة العميل:</strong> ${client.clientStatus || 'عميل جديد'}</p>
        <p><strong>إجمالي الساعات:</strong> ${(client.totalHoursBooked || 0).toFixed(1)} ساعة</p>
        <p><strong>إجمالي المبالغ المدفوعة:</strong> ${(client.totalMoneyPaid || 0)} EG</p>
    `;
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach((view) => view.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach((btn) => btn.classList.remove('active'));
    const targetView = document.getElementById(tabId);
    const targetBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
    if (targetView) targetView.classList.add('active');
    if (targetBtn) targetBtn.classList.add('active');
}

// ===== Modal embedded client search =====
function filterClients(query) {
    const q = query.trim().toLowerCase();
    if (!q) return clientsDB;
    return clientsDB.filter((c) => {
        return String(c.uniqueCode).includes(q) || c.name.toLowerCase().includes(q);
    });
}

function renderModalClientDropdown(query) {
    const results = filterClients(query);
    if (results.length === 0) {
        modalClientDropdown.innerHTML = '<div class="client-option-empty">لا يوجد عملاء مطابقين</div>';
    } else {
        modalClientDropdown.innerHTML = results.map((c) =>
            `<button type="button" class="client-option" data-client-id="${c.uniqueCode}">الرقم: ${c.uniqueCode} - ${c.name}</button>`
        ).join('');
    }
    modalClientDropdown.classList.add('open');
}

function selectModalClient(client) {
    modalSelectedClient = client;
    modalSelectedClientText.textContent = `الرقم: ${client.uniqueCode} - ${client.name}`;
    modalSelectedClientEl.hidden = false;
    modalClientSearchInput.value = '';
    modalClientDropdown.classList.remove('open');
    updateConfirmButton();
}

function clearModalClient() {
    modalSelectedClient = null;
    modalSelectedClientEl.hidden = true;
    modalSelectedClientText.textContent = '';
    modalClientSearchInput.value = '';
    modalClientDropdown.classList.remove('open');
    updateConfirmButton();
}

// ===== CRM Tab Register =====
function handleRegisterClient(e) {
    e.preventDefault();
    const name = regClientNameInput.value.trim();
    const phone = normalizePhone(regClientPhoneInput.value);
    const jobType = regClientJobTypeInput.value;
    const source = regClientSourceInput ? regClientSourceInput.value : 'أخرى';
    const clientStatus = regClientStatusInput ? regClientStatusInput.value : 'عميل جديد'; // استقبال حالة العميل
    const referralCode = regReferralCodeInput ? regReferralCodeInput.value.trim() : '';

    if (!name) {
        alert('يرجى إدخال اسم العميل');
        regClientNameInput.focus();
        return;
    }
    if (!phone) {
        alert('يرجى إدخال رقم الهاتف');
        regClientPhoneInput.focus();
        return;
    }

    loadClientsDB();

    if (getClientByPhone(phone)) {
        alert('رقم الهاتف مسجل مسبقاً لعميل آخر');
        regClientPhoneInput.focus();
        return;
    }

    // prepare new client object
    const newClient = {
        uniqueCode: generateNextId(),
        name,
        phone,
        jobType,
        source: source,
        clientStatus: clientStatus, // إضافة حالة العميل للأوبجكت
        freeHoursBalance: 0,
        totalHoursBooked: 0,
        totalMoneyPaid: 0,
        history: [],
        promoCode: regPromoCodeInput ? (regPromoCodeInput.value.trim().toUpperCase() || '') : '',
    };

    // If referral code provided, validate it exists and record history for both parties
    if (referralCode) {
        const referrer = getClientById(referralCode);
        if (!referrer) {
            alert('كود الدعوة غير صحيح!');
            regReferralCodeInput.focus();
            return;
        }

        // link referral on the new client
        newClient.referredBy = String(referrer.uniqueCode);

        // add history entry to new client
        try {
            const ts = new Date().toLocaleString('ar-EG');
            newClient.history.push({
                timestamp: ts,
                action: 'تسجيل جديد',
                details: `تم التسجيل عن طريق كود دعوة من العميل رقم ${referrer.uniqueCode}`,
            });
        } catch (err) {
            console.error('Failed to add referral history to new client:', err);
        }

        // add history entry to referrer (no rewards given)
        try {
            referrer.history = referrer.history || [];
            const ts2 = new Date().toLocaleString('ar-EG');
            referrer.history.push({
                timestamp: ts2,
                action: 'دعوة صديق',
                details: `قام بدعوة العميل الجديد: ${name}`,
            });
        } catch (err) {
            console.error('Failed to add referral history to referrer:', err);
        }
    }

    // finalize registration
    clientsDB.push(newClient);
    saveClientsDB();
    // update marketing stats in case this registration used a promo code
    updateMarketingStats();
    registerClientForm.reset();
    renderClientsList();

    alert(`تم تسجيل العميل بنجاح!\nرقم العميل: ${newClient.uniqueCode}`);
}

// ===== Client List & Detail =====
function renderClientsList(filterQuery) {
    const q = (filterQuery || '').trim().toLowerCase();
    let list = clientsDB;
    if (q) {
        list = clientsDB.filter((c) => String(c.uniqueCode).includes(q) || c.name.toLowerCase().includes(q));
    }

    if (list.length === 0) {
        // تحديث الـ colspan لـ 6 عشان يغطي الجدول بالكامل
        clientsTableBody.innerHTML = `<tr class="empty-row"><td colspan="6">${q ? 'لا يوجد عملاء مطابقين' : 'لا يوجد عملاء مسجلين بعد'}</td></tr>`;
        return;
    }

    // إضافة خانة المصدر وحالة العميل لرسمة الجدول
    clientsTableBody.innerHTML = list.map((c) => `
        <tr data-client-id="${c.uniqueCode}">
            <td>${c.uniqueCode}</td>
            <td>${c.name}</td>
            <td>${c.phone}</td>
            <td>${getJobTypeLabel(c.jobType)}</td>
            <td>${c.source || 'أخرى'}</td>
            <td>${c.clientStatus || 'عميل جديد'}</td>
        </tr>
    `).join('');
}

function openClientDetail(clientId) {
    loadClientsDB();
    const client = getClientById(clientId);
    if (!client) return;

    clientDetailBody.innerHTML = `
        <p><strong>الرقم:</strong> ${client.uniqueCode}</p>
        <p><strong>الاسم:</strong> ${client.name}</p>
        <p><strong>الهاتف:</strong> ${client.phone}</p>
        <p><strong>نوع العمل:</strong> ${getJobTypeLabel(client.jobType)}</p>
        <p><strong>مصدر العميل:</strong> ${client.source || 'أخرى'}</p>
        <p><strong>حالة العميل:</strong> ${client.clientStatus || 'عميل جديد'}</p>
        <div class="client-detail-stats">
            <div class="client-stat-card stat-hours">
                <span class="client-stat-label">إجمالي الساعات</span>
                <span class="client-stat-value">${(client.totalHoursBooked || 0).toFixed(1)}</span>
            </div>
            <div class="client-stat-card stat-money">
                <span class="client-stat-label">إجمالي المبالغ المدفوعة</span>
                <span class="client-stat-value">${(client.totalMoneyPaid || 0)} EG</span>
            </div>
        </div>
    `;
    // render client history table (newest first)
    renderClientHistory(client);
    clientDetailOverlay.hidden = false;
}

// Render client's history into the client detail modal
function renderClientHistory(client) {
    const tbody = document.getElementById('clientHistoryBody');
    if (!tbody) return;

    const history = Array.isArray(client.history) ? client.history : [];
    if (history.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="3">لا توجد حركات للعميل بعد</td></tr>`;
        return;
    }

    // newest first
    const rows = [...history].reverse().map((h) => `
        <tr>
            <td>${h.timestamp}</td>
            <td>${h.action}</td>
            <td>${h.details}</td>
        </tr>
    `).join('');

    tbody.innerHTML = rows;
}

function closeClientDetail() {
    clientDetailOverlay.hidden = true;
}

// ===== Finance & Revenue Tracking =====
function getTodayString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function loadShiftRevenue() {
    try {
        const raw = localStorage.getItem(SHIFT_REVENUE_KEY);
        shiftRevenue = raw ? JSON.parse(raw) : { desks: 0, drinks: 0, currentShiftDate: getTodayString() };
        if (!shiftRevenue.currentShiftDate) {
            shiftRevenue.currentShiftDate = getTodayString();
        }
    } catch (err) {
        shiftRevenue = { desks: 0, drinks: 0, currentShiftDate: getTodayString() };
    }
}

function saveShiftRevenue() {
    localStorage.setItem(SHIFT_REVENUE_KEY, JSON.stringify(shiftRevenue));
    let mRev = 0;
    if(clientsDB && clientsDB.length > 0) {
        const matched = clientsDB.filter((c) => (String(c.promoCode || '').toUpperCase()) === 'VORTEX');
        mRev = matched.reduce((sum, c) => sum + (Number(c.totalMoneyPaid) || 0), 0);
    }
    db.from('shift_revenue').upsert([{
        shift_date: shiftRevenue.currentShiftDate,
        desks_revenue: shiftRevenue.desks,
        drinks_revenue: shiftRevenue.drinks,
        marketer_revenue: mRev
    }]).then(() => console.log('Shift Synced'));
}

function loadTransactionsLog() {
    try {
        const raw = localStorage.getItem(TRANSACTIONS_KEY);
        transactionsLog = raw ? JSON.parse(raw) : [];
    } catch (err) {
        transactionsLog = [];
    }
}

function saveTransactionsLog() {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactionsLog));
}

function renderFinanceView() {
    revDesksEl.textContent = shiftRevenue.desks;
    revDrinksEl.textContent = shiftRevenue.drinks;
    revGrandEl.textContent = shiftRevenue.desks + shiftRevenue.drinks;

    if (transactionsLog.length === 0) {
        transactionsTableBody.innerHTML = `<tr class="empty-row"><td colspan="4">لا توجد حركات مالية بعد</td></tr>`;
        return;
    }

    // Show newest first
    const reversed = [...transactionsLog].reverse();
    transactionsTableBody.innerHTML = reversed.map((t) => {
        const rowClass = t.type === 'تقفيل يومية' ? ' class="tr-shift-closed"' : '';
        return `<tr${rowClass}>
            <td>${t.time}</td>
            <td>${t.type}</td>
            <td>${t.client}</td>
            <td>${t.amount} EG</td>
        </tr>`;
    }).join('');

    // update marketing stats whenever finance view renders
    updateMarketingStats();
}

// Marketing stats: count and revenue for promo code 'VORTEX'
function updateMarketingStats() {
    try {
        loadClientsDB();
        const code = 'VORTEX';
        const matched = clientsDB.filter((c) => (String(c.promoCode || '').toUpperCase()) === code);
        const count = matched.length;
        const revenue = matched.reduce((sum, c) => sum + (Number(c.totalMoneyPaid) || 0), 0);
        if (marketingCountEl) marketingCountEl.textContent = count;
        if (marketingRevenueEl) marketingRevenueEl.textContent = revenue;
    } catch (err) {
        console.error('Failed to update marketing stats:', err);
    }
}

function addTransaction(type, client, amount) {
    const now = new Date();
    const time = now.toLocaleString('ar-EG', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
    });
    transactionsLog.push({ time, type, client, amount });
    saveTransactionsLog();
    db.from('transactions').insert([{
        type: type,
        client_name: client,
        amount: amount,
        details: time
    }]).then(() => console.log('Transaction Synced'));
}

function checkAndAutoCloseShift() {
    loadShiftRevenue();
    const todayStr = getTodayString();

    if (shiftRevenue.currentShiftDate && shiftRevenue.currentShiftDate !== todayStr) {
        if (shiftRevenue.desks > 0 || shiftRevenue.drinks > 0) {
            const grandTotal = shiftRevenue.desks + shiftRevenue.drinks;
            const oldDate = shiftRevenue.currentShiftDate;
            
            // Log automatic close for the old day
            addTransaction('تقفيل تلقائي - نظام الأمان (تغيير اليوم)', `يوم ${oldDate}`, grandTotal);
        }

        shiftRevenue.desks = 0;
        shiftRevenue.drinks = 0;
        shiftRevenue.currentShiftDate = todayStr;
        saveShiftRevenue();
        renderFinanceView();
    } else if (!shiftRevenue.currentShiftDate) {
        shiftRevenue.currentShiftDate = todayStr;
        saveShiftRevenue();
    }
}

function handleCloseShift() {
    const grandTotal = shiftRevenue.desks + shiftRevenue.drinks;
    if (!confirm('هل أنت متأكد من تقفيل اليومية وتصفير العدادات الحالية؟')) return;

    addTransaction('تقفيل يومية', '—', grandTotal);

    shiftRevenue.desks = 0;
    shiftRevenue.drinks = 0;
    saveShiftRevenue();
    renderFinanceView();

    alert(`تم تقفيل اليومية بنجاح ✅\nإجمالي اليوم: ${grandTotal} EG`);
}

function formatRemainingTime(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n) => String(n).padStart(2, '0');

    if (days > 0) {
        return `${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function getRemainingMs(desk) {
    return desk.endTime - Date.now();
}

function getDrinksTotal(desk) {
    if (!desk.orders?.length) return 0;
    return desk.orders.reduce((sum, order) => sum + order.price * order.qty, 0);
}

function getGrandTotal(desk) {
    return (desk.price || 0) + getDrinksTotal(desk);
}

function saveDesksData() {
    const data = desks.map(({ id, status, clientName, clientCode, packageId, price, endTime, orders }) => ({
        id,
        status,
        clientName,
        clientCode,
        packageId,
        price,
        endTime,
        orders: orders || [],
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadDesksData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;

        const saved = JSON.parse(raw);
        saved.forEach((savedDesk) => {
            const desk = desks.find((d) => d.id === savedDesk.id);
            if (!desk || savedDesk.status !== 'occupied' || !savedDesk.endTime) return;

            if (Date.now() >= savedDesk.endTime) return;

            desk.status = 'occupied';
            desk.clientName = savedDesk.clientName;
            desk.clientCode = savedDesk.clientCode || null;
            desk.packageId = savedDesk.packageId;
            desk.price = savedDesk.price;
            desk.endTime = savedDesk.endTime;
            desk.orders = savedDesk.orders || [];
        });

        saveDesksData();
    } catch (err) {
        console.error('Failed to load desks data:', err);
    }
}

function saveCafeteriaMenu() {
    localStorage.setItem(CAFETERIA_KEY, JSON.stringify(cafeteriaMenu));
}

function loadCafeteriaMenu() {
    try {
        const raw = localStorage.getItem(CAFETERIA_KEY);
        if (!raw) {
            cafeteriaMenu = [];
            return;
        }
        cafeteriaMenu = JSON.parse(raw);
    } catch (err) {
        console.error('Failed to load cafeteria menu:', err);
        cafeteriaMenu = [];
    }
}

function renderMenuTable() {
    if (cafeteriaMenu.length === 0) {
        menuTableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="4">لا توجد منتجات في المنيو بعد</td>
            </tr>
        `;
        return;
    }

    menuTableBody.innerHTML = cafeteriaMenu
        .map(
            (item) => `
        <tr>
            <td>${item.name}</td>
            <td>${item.price} EG</td>
            <td>
                <span class="stock-badge ${item.stock === 0 ? 'stock-out' : item.stock <= 5 ? 'stock-low' : ''}">
                    ${item.stock}
                </span>
            </td>
            <td>
                <button type="button" class="btn-delete-item" data-item-id="${item.id}">حذف</button>
            </td>
        </tr>
    `
        )
        .join('');
}

function handleAddMenuItem(e) {
    e.preventDefault();

    const name = itemNameInput.value.trim();
    const price = parseFloat(itemPriceInput.value);
    const stock = parseInt(itemStockInput.value, 10);

    if (!name) {
        alert('يرجى إدخال اسم المنتج');
        itemNameInput.focus();
        return;
    }

    if (isNaN(price) || price < 0) {
        alert('يرجى إدخال سعر صحيح');
        itemPriceInput.focus();
        return;
    }

    if (isNaN(stock) || stock < 0) {
        alert('يرجى إدخال كمية مخزون صحيحة');
        itemStockInput.focus();
        return;
    }

    cafeteriaMenu.push({
        id: `item_${Date.now()}`,
        name,
        price,
        stock,
    });

    saveCafeteriaMenu();
    renderMenuTable();

    itemNameInput.value = '';
    itemPriceInput.value = '';
    itemStockInput.value = '';
    itemNameInput.focus();
}

function deleteMenuItem(itemId) {
    const item = getMenuItemById(itemId);
    if (!item) return;

    if (!confirm(`هل تريد حذف "${item.name}" من المنيو؟`)) return;

    cafeteriaMenu = cafeteriaMenu.filter((i) => i.id !== itemId);
    saveCafeteriaMenu();
    renderMenuTable();

    if (activeDeskId !== null) {
        renderDrinksList(activeDeskId);
    }
}

function renderDrinksList(deskId) {
    if (cafeteriaMenu.length === 0) {
        drinksList.innerHTML = '<p class="empty-drinks">لا توجد منتجات في المنيو. أضف منتجات من لوحة الكافيتريا.</p>';
        return;
    }

    drinksList.innerHTML = cafeteriaMenu
        .map((item) => {
            const outOfStock = item.stock <= 0;
            return `
            <div class="drink-row ${outOfStock ? 'out-of-stock' : ''}">
                <div class="drink-info">
                    <span class="drink-name">${item.name}</span>
                    <span class="drink-meta">${item.price} EG · مخزون: ${item.stock}</span>
                </div>
                <button
                    type="button"
                    class="btn-add-drink"
                    data-item-id="${item.id}"
                    data-desk-id="${deskId}"
                    ${outOfStock ? 'disabled' : ''}
                >إضافة للكرسي</button>
            </div>
        `;
        })
        .join('');
}

function renderDeskOrderSummary(desk) {
    if (!desk.orders?.length) {
        deskOrderSummary.innerHTML = '<p class="empty-orders">لا توجد مشروبات مضافة بعد</p>';
        return;
    }

    deskOrderSummary.innerHTML = desk.orders
        .map(
            (order) => `
        <div class="order-line">
            <span>${order.name} × ${order.qty}</span>
            <span>${order.price * order.qty} EG</span>
        </div>
    `
        )
        .join('');
}

function updatePayDrinksButton(desk) {
    const drinksCost = getDrinksTotal(desk);
    payDrinksNowBtn.disabled = drinksCost <= 0;
}

function renderBillingSummary(desk) {
    const packageCost = desk.price || 0;
    const drinksCost = getDrinksTotal(desk);
    const grandTotal = getGrandTotal(desk);

    billingSummary.innerHTML = `
        <div class="billing-line"><span>الباقة:</span><span>${packageCost} EG</span></div>
        <div class="billing-line billing-drinks-unpaid"><span>المشروبات (غير مدفوعة):</span><span>${drinksCost} EG</span></div>
        <div class="billing-line billing-grand"><span>الإجمالي الحالي:</span><span>${grandTotal} EG</span></div>
    `;

    updatePayDrinksButton(desk);
}

function payDrinksNow(deskId) {
    checkAndAutoCloseShift();

    const desk = desks[deskId - 1];
    if (!desk || desk.status !== 'occupied') return;

    const drinksCost = getDrinksTotal(desk);
    if (drinksCost <= 0) {
        alert('لا توجد مشروبات غير مدفوعة على هذا الكرسي');
        return;
    }

    // Track drinks cost to client stats immediately
    if (desk.clientCode) {
        loadClientsDB();
        const client = getClientById(desk.clientCode);
        if (client) {
                client.totalMoneyPaid = (client.totalMoneyPaid || 0) + drinksCost;
                // push drinks purchase history
                try {
                    const ts = new Date().toLocaleString('ar-EG');
                    client.history = client.history || [];
                    client.history.push({
                        timestamp: ts,
                        action: 'طلب كافيتريا',
                        details: `شراء مشروبات بقيمة ${drinksCost} ج.م`,
                    });
                } catch (err) {
                    console.error('Failed to append client history:', err);
                }
                saveClientsDB();
                renderClientsList(clientListFilter.value);
        }
    }

    // Record drinks transaction
    const clientLabel = `${desk.clientCode || '—'} - ${desk.clientName || '—'}`;
    addTransaction('كافيتريا', clientLabel, drinksCost);
    shiftRevenue.drinks += drinksCost;
    saveShiftRevenue();
    renderFinanceView();

    desk.orders = [];
    saveDesksData();

    alert(`تم تحصيل ${drinksCost} جنيه مقابل المشاريب بنجاح!`);

    renderDeskCard(desk);
    renderDeskOrderSummary(desk);
    renderBillingSummary(desk);
}

function addDrinkToDesk(deskId, itemId) {
    const item = getMenuItemById(itemId);
    const desk = desks[deskId - 1];

    if (!item || desk.status !== 'occupied') return;

    if (item.stock <= 0) {
        alert('عذراً، الكمية نفدت من المخزن!');
        return;
    }

    item.stock -= 1;
    saveCafeteriaMenu();
    renderMenuTable();

    if (!desk.orders) desk.orders = [];

    const existing = desk.orders.find((o) => o.itemId === itemId);
    if (existing) {
        existing.qty += 1;
    } else {
        desk.orders.push({
            itemId: item.id,
            name: item.name,
            price: item.price,
            qty: 1,
        });
    }

    saveDesksData();
    renderDeskCard(desk);
    renderDrinksList(deskId);
    renderDeskOrderSummary(desk);
    renderBillingSummary(desk);
}

function renderPackageButtons() {
    packageOptions.innerHTML = PACKAGES.map(
        (pkg) => `
        <button type="button" class="package-btn" data-package-id="${pkg.id}">
            <span>${pkg.nameAr}</span>
            <span class="package-price">${pkg.price} EG</span>
        </button>
    `
    ).join('');

    packageOptions.querySelectorAll('.package-btn').forEach((btn) => {
        btn.addEventListener('click', () => selectPackage(btn.dataset.packageId));
    });
}

function selectPackage(packageId) {
    selectedPackageId = packageId;
    packageOptions.querySelectorAll('.package-btn').forEach((btn) => {
        btn.classList.toggle('selected', btn.dataset.packageId === packageId);
    });
    updateConfirmButton();
}

function updateConfirmButton() {
    confirmBooking.disabled = !selectedPackageId || !modalSelectedClient;
}

function updateStats() {
    const occupied = desks.filter((d) => d.status === 'occupied').length;
    const available = desks.filter((d) => d.status === 'available').length;

    availableCountEl.textContent = available;
    occupiedCountEl.textContent = occupied;
}

function renderDeskCard(desk) {
    const card = desk.element;
    card.classList.toggle('available', desk.status === 'available');
    card.classList.toggle('occupied', desk.status === 'occupied');

    if (desk.status === 'available') {
        card.innerHTML = `
            <h3>كرسي ${desk.id}</h3>
            <p class="status-text">متاح</p>
        `;
        return;
    }

    const pkg = getPackageById(desk.packageId);
    const remaining = getRemainingMs(desk);
    const grandTotal = getGrandTotal(desk);

    card.innerHTML = `
        <h3>كرسي ${desk.id}</h3>
        <p class="status-text">محجوز</p>
        <div class="desk-info">
            <p class="desk-client-code">العميل: ${desk.clientCode || '—'} - ${desk.clientName}</p>
            <p>${pkg ? pkg.nameAr : '—'}</p>
            <p class="countdown-timer">${formatRemainingTime(remaining)}</p>
            <p class="desk-total">الإجمالي: ${grandTotal} EG</p>
        </div>
    `;
}

function updateDeskTimerDisplay(desk) {
    const timerEl = desk.element.querySelector('.countdown-timer');
    if (timerEl) {
        timerEl.textContent = formatRemainingTime(getRemainingMs(desk));
    }
}

function updateCheckoutModalTimer(desk) {
    if (activeDeskId !== desk.id || checkoutView.hidden) return;

    const timerEl = document.getElementById('checkoutTimer');
    if (!timerEl) return;

    const remaining = getRemainingMs(desk);
    timerEl.textContent = remaining > 0 ? formatRemainingTime(remaining) : '00:00:00';
}

function startCountdownLoop() {
    if (countdownInterval) return;
    countdownInterval = setInterval(tickAllCountdowns, 1000);
}

function stopCountdownLoopIfIdle() {
    if (desks.some((d) => d.status === 'occupied')) return;
    clearInterval(countdownInterval);
    countdownInterval = null;
}

function tickAllCountdowns() {
    desks.forEach((desk) => {
        if (desk.status !== 'occupied') return;

        const remaining = getRemainingMs(desk);

        if (remaining <= 0) {
            checkoutDesk(desk.id, { auto: true });
            return;
        }

        updateDeskTimerDisplay(desk);
        updateCheckoutModalTimer(desk);
    });

    stopCountdownLoopIfIdle();
}

function openBookingModal(deskId) {
    activeDeskId = deskId;
    modalBox.classList.remove('modal-checkout');
    modalTitle.textContent = `حجز كرسي ${deskId}`;
    bookingForm.hidden = false;
    checkoutView.hidden = true;
    selectedPackageId = null;
    clearModalClient();
    loadClientsDB();
    packageOptions.querySelectorAll('.package-btn').forEach((btn) => btn.classList.remove('selected'));
    renderModalClientDropdown('');
    modalClientDropdown.classList.remove('open');
    updateConfirmButton();
    modalOverlay.hidden = false;
}

function renderCheckoutModal(deskId) {
    const desk = desks[deskId - 1];
    const pkg = getPackageById(desk.packageId);
    const remaining = getRemainingMs(desk);

    checkoutDetails.innerHTML = `
        <p><strong>رقم العميل:</strong> ${desk.clientCode || '—'}</p>
        <p><strong>اسم العميل:</strong> ${desk.clientName}</p>
        <p><strong>الباقة:</strong> ${pkg ? pkg.nameAr : '—'}</p>
        <p><strong>سعر الباقة:</strong> ${desk.price} EG</p>
        <p><strong>الوقت المتبقي:</strong> <span id="checkoutTimer" class="checkout-timer">${formatRemainingTime(remaining)}</span></p>
    `;

    renderDrinksList(deskId);
    renderDeskOrderSummary(desk);
    renderBillingSummary(desk);
}

function openCheckoutModal(deskId) {
    activeDeskId = deskId;
    modalBox.classList.add('modal-checkout');
    modalTitle.textContent = `تفاصيل كرسي ${deskId}`;
    bookingForm.hidden = true;
    checkoutView.hidden = false;
    renderCheckoutModal(deskId);
    modalOverlay.hidden = false;
}

function closeModal() {
    modalOverlay.hidden = true;
    modalBox.classList.remove('modal-checkout');
    activeDeskId = null;
    selectedPackageId = null;
    modalSelectedClient = null;
    modalSelectedClientEl.hidden = true;
    modalClientDropdown.classList.remove('open');
}

function showCheckoutBillAlert(desk) {
    const packageCost = desk.price || 0;
    const drinksCost = getDrinksTotal(desk);
    const grandTotal = getGrandTotal(desk);

    let drinksBreakdown = '';
    if (desk.orders?.length) {
        drinksBreakdown =
            '\n\nتفاصيل المشروبات:\n' +
            desk.orders.map((o) => `• ${o.name} × ${o.qty} = ${o.price * o.qty} EG`).join('\n');
    }

    alert(
        `تم إنهاء الجلسة بنجاح ✅\n\n` +
            `الباقة: ${packageCost} EG\n` +
            `المشروبات: ${drinksCost} EG` +
            drinksBreakdown +
            `\n────────────────\n` +
            `الإجمالي الكلي: ${grandTotal} EG`
    );
}

function checkoutDesk(deskId, options = {}) {
    const desk = desks[deskId - 1];
    if (desk.status !== 'occupied') return;

    if (!options.auto) {
        showCheckoutBillAlert(desk);
    }

    desk.status = 'available';
    desk.clientName = null;
    desk.clientCode = null;
    desk.packageId = null;
    desk.price = null;
    desk.endTime = null;
    desk.orders = [];

    renderDeskCard(desk);
    saveDesksData();
    updateStats();

    if (activeDeskId === deskId) {
        closeModal();
    }

    stopCountdownLoopIfIdle();
}

function bookDesk() {
    checkAndAutoCloseShift();

    if (!modalSelectedClient) {
        alert('يرجى اختيار عميل من القائمة أولاً');
        modalClientSearchInput.focus();
        return;
    }

    if (!selectedPackageId || activeDeskId === null) {
        alert('يرجى اختيار باقة');
        return;
    }

    const pkg = getPackageById(selectedPackageId);
    const desk = desks[activeDeskId - 1];

    desk.status = 'occupied';
    desk.clientName = modalSelectedClient.name;
    desk.clientCode = modalSelectedClient.uniqueCode;
    desk.packageId = selectedPackageId;
    desk.price = pkg.price;
    desk.endTime = Date.now() + pkg.durationMs;
    desk.orders = [];

    // Track package stats to client immediately at booking time
    loadClientsDB();
    const bookedClient = getClientById(modalSelectedClient.uniqueCode);
    if (bookedClient) {
        const sessionHours = pkg.durationMs / (60 * 60 * 1000);
        bookedClient.totalHoursBooked = (bookedClient.totalHoursBooked || 0) + sessionHours;
        bookedClient.totalMoneyPaid = (bookedClient.totalMoneyPaid || 0) + pkg.price;
        // push client activity history
        try {
            const ts = new Date().toLocaleString('ar-EG');
            bookedClient.history = bookedClient.history || [];
            bookedClient.history.push({
                timestamp: ts,
                action: 'حجز مكتب',
                details: `حجز كرسي رقم ${desk.id} - باقة ${pkg.nameAr} بقيمة ${pkg.price} ج.م`,
            });
        } catch (err) {
            console.error('Failed to append client history:', err);
        }

        saveClientsDB();
        renderClientsList(clientListFilter.value);
    }

    // Record desk booking transaction
    const clientLabel = `${modalSelectedClient.uniqueCode} - ${modalSelectedClient.name}`;
    addTransaction('حجز مكتب', clientLabel, pkg.price);
    shiftRevenue.desks += pkg.price;
    saveShiftRevenue();
    renderFinanceView();

    renderDeskCard(desk);
    saveDesksData();
    updateStats();
    startCountdownLoop();
    closeModal();
}

function handleDeskClick(deskId) {
    const desk = desks[deskId - 1];
    if (desk.status === 'available') {
        openBookingModal(deskId);
    } else {
        openCheckoutModal(deskId);
    }
}

function initDesks() {
    for (let i = 1; i <= totalDesks; i++) {
        const deskCard = document.createElement('div');
        deskCard.classList.add('desk-card', 'available');

        const desk = {
            id: i,
            status: 'available',
            clientName: null,
            clientCode: null,
            packageId: null,
            price: null,
            endTime: null,
            orders: [],
            element: deskCard,
        };
        desks.push(desk);

        deskCard.innerHTML = `
            <h3>كرسي ${i}</h3>
            <p class="status-text">متاح</p>
        `;

        deskCard.addEventListener('click', () => handleDeskClick(i));
        desksGrid.appendChild(deskCard);
    }
}

async function syncFromCloud() {
    try {
        const { data: clients } = await db.from('clients').select('*');
        if (clients && clients.length > 0) {
            clientsDB = clients.map(c => ({
                uniqueCode: String(c.id),
                name: c.name,
                phone: c.phone,
                jobType: c.job_type,
                source: c.source || 'أخرى',
                clientStatus: c.client_status || 'عميل جديد', // إضافة السحب من السحابة
                promoCode: c.promo_code || '',
                totalHoursBooked: c.total_hours || 0,
                totalMoneyPaid: c.total_money || 0,
                history: c.history || [],
                freeHoursBalance: 0
            }));
            localStorage.setItem(CLIENTS_DB_KEY, JSON.stringify(clientsDB));
            renderClientsList();
            updateMarketingStats();
        }

        const { data: shift } = await db.from('shift_revenue').select('*').eq('shift_date', getTodayString()).single();
        if (shift) {
            shiftRevenue.desks = shift.desks_revenue;
            shiftRevenue.drinks = shift.drinks_revenue;
            localStorage.setItem(SHIFT_REVENUE_KEY, JSON.stringify(shiftRevenue));
            renderFinanceView();
        }
    } catch (error) {
        console.log("Cloud sync ready");
    }
}

function initApp() {
    initDesks();
    loadClientsDB();
    loadCafeteriaMenu();
    loadDesksData();
    loadShiftRevenue();
    loadTransactionsLog();
    checkAndAutoCloseShift();

    desks.forEach((desk) => {
        if (desk.status === 'occupied') {
            renderDeskCard(desk);
        }
    });

    if (desks.some((d) => d.status === 'occupied')) {
        startCountdownLoop();
        tickAllCountdowns();
    }

    updateStats();
    renderMenuTable();
    renderPackageButtons();
    renderClientsList();
    renderFinanceView();

    // Tab navigation with admin-protected tabs (Inventory & Financials)
    tabsNav.addEventListener('click', (e) => {
        const btn = e.target.closest('.tab-btn');
        if (!btn) return;

        const targetTab = btn.dataset.tab;
        const protectedTabs = ['inventoryView', 'financeView'];

        // If tab is protected, require session unlock
        if (protectedTabs.includes(targetTab)) {
            const unlocked = sessionStorage.getItem('isAdminUnlocked') === 'true';
            if (!unlocked) {
                const entered = prompt('برجاء إدخال كلمة مرور المسؤول:');
                if (entered === null || entered !== ADMIN_PASSWORD) {
                    alert('كلمة المرور غير صحيحة!');
                    return; // abort tab switch
                }
                // correct password: mark session unlocked
                sessionStorage.setItem('isAdminUnlocked', 'true');
            }
        }

        // Open the requested tab
        switchTab(targetTab);
        if (targetTab === 'financeView') {
            updateMarketingStats();
        }
    });

    cafeteriaForm.addEventListener('submit', handleAddMenuItem);

    menuTableBody.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-delete-item');
        if (btn) deleteMenuItem(btn.dataset.itemId);
    });

    drinksList.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-add-drink');
        if (btn) addDrinkToDesk(parseInt(btn.dataset.deskId, 10), btn.dataset.itemId);
    });

    // CRM tab register
    registerClientForm.addEventListener('submit', handleRegisterClient);

    // Finance tab
    closeShiftBtn.addEventListener('click', handleCloseShift);

    // Client list filter
    clientListFilter.addEventListener('input', () => {
        renderClientsList(clientListFilter.value);
    });

    // Client list row click → open detail
    clientsTableBody.addEventListener('click', (e) => {
        const row = e.target.closest('tr[data-client-id]');
        if (row) openClientDetail(row.dataset.clientId);
    });

    // Close client detail modal
    closeClientDetailBtn.addEventListener('click', closeClientDetail);
    clientDetailOverlay.addEventListener('click', (e) => {
        if (e.target === clientDetailOverlay) closeClientDetail();
    });

    // Modal embedded client search
    modalClientSearchInput.addEventListener('input', () => {
        renderModalClientDropdown(modalClientSearchInput.value);
    });
    modalClientSearchInput.addEventListener('focus', () => {
        renderModalClientDropdown(modalClientSearchInput.value);
    });
    modalClientDropdown.addEventListener('click', (e) => {
        const btn = e.target.closest('.client-option');
        if (!btn) return;
        const client = getClientById(btn.dataset.clientId);
        if (client) selectModalClient(client);
    });
    clearModalClientBtn.addEventListener('click', clearModalClient);

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.modal-client-search-wrap')) {
            modalClientDropdown.classList.remove('open');
        }
    });

    confirmBooking.addEventListener('click', bookDesk);
    payDrinksNowBtn.addEventListener('click', () => {
        if (activeDeskId !== null) payDrinksNow(activeDeskId);
    });
    confirmCheckout.addEventListener('click', () => {
        if (activeDeskId !== null) checkoutDesk(activeDeskId);
    });
    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    syncFromCloud();
}

initApp();