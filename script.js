let products = [];
let orders = [];
let receiptHistory = [];
let moneyPool = 0;
const adminPassword = "101605funNNNNN";

// --- PERSISTENCE ---
function saveData() {
    localStorage.setItem('pos_products', JSON.stringify(products));
    localStorage.setItem('pos_history', JSON.stringify(receiptHistory));
    localStorage.setItem('pos_moneyPool', JSON.stringify(moneyPool));
}

function loadData() {
    products = JSON.parse(localStorage.getItem('pos_products')) || [];
    receiptHistory = JSON.parse(localStorage.getItem('pos_history')) || [];
    moneyPool = JSON.parse(localStorage.getItem('pos_moneyPool')) || 0;
    renderProducts();
    updatePoolDisplay();
}

function updatePoolDisplay() {
    document.getElementById('moneyPool').innerText = `Pool: P${moneyPool.toFixed(2)}`;
}

// --- UI CONTROLS ---
function toggleModal() {
    const modal = document.getElementById('setupModal');
    modal.style.display = (modal.style.display === 'flex') ? 'none' : 'flex';
    renderModalProducts();
}

function toggleHistory() {
    const hist = document.getElementById('historyPage');
    hist.style.display = (hist.style.display === 'none') ? 'block' : 'none';
    if (hist.style.display === 'block') renderHistory();
}

// --- PRODUCT ENGINE ---
function addProduct() {
    const name = document.getElementById('productName').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    if (name && !isNaN(price)) {
        products.push({ name, price });
        document.getElementById('productName').value = '';
        document.getElementById('productPrice').value = '';
        saveData();
        renderProducts();
        renderModalProducts();
    }
}

function deleteProduct(index) {
    if(confirm("Delete this item?")) {
        products.splice(index, 1);
        saveData();
        renderProducts();
        renderModalProducts();
    }
}

function renderProducts() {
    const list = document.getElementById('productList');
    list.innerHTML = products.length ? '' : '<p style="color:gray;">Add items in Settings.</p>';
    products.forEach((p, index) => {
        const div = document.createElement('div');
        div.className = 'product-card';
        div.innerHTML = `<strong>${p.name}</strong><br>P${p.price.toFixed(2)}
            <button class="btn-add" onclick="addToOrder(${index})">Add</button>`;
        list.appendChild(div);
    });
}

function renderModalProducts() {
    const list = document.getElementById('modalProductList');
    list.innerHTML = '';
    products.forEach((p, index) => {
        list.innerHTML += `<div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #eee;">
            <span>${p.name} (P${p.price.toFixed(2)})</span>
            <button style="background:var(--danger); color:white; min-height:30px; padding:0 10px;" onclick="deleteProduct(${index})">Del</button>
        </div>`;
    });
}

// --- ORDER ENGINE ---
function newOrder() {
    orders.push({ items: [], time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), bill: null, change: null });
    renderOrders();
}

function addToOrder(idx) {
    if (orders.length === 0) newOrder();
    orders[orders.length - 1].items.push(products[idx]);
    renderOrders();
}

function renderOrders() {
    const container = document.getElementById('orders');
    container.innerHTML = '';
    orders.forEach((order, oIdx) => {
        const total = order.items.reduce((sum, item) => sum + item.price, 0);
        const div = document.createElement('div');
        div.className = 'order-box';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between;">
                <strong>Order ${order.time}</strong>
                <button onclick="cancelOrder(${oIdx})" style="color:var(--danger); background:none; min-height:auto;">Void</button>
            </div>
            <div id="items-${oIdx}" style="margin: 15px 0; font-size:0.95rem;"></div>
            <div style="font-size:1.2rem; font-weight:bold; margin-bottom:15px;">Total: P${total.toFixed(2)}</div>
            <input type="number" inputmode="decimal" placeholder="Cash Received" oninput="calcChange(${oIdx}, this.value, ${total})">
            <div id="changeText-${oIdx}" style="margin: 10px 0; font-weight:bold;"></div>
            <button onclick="finishOrder(${oIdx}, ${total})" class="btn-primary" style="background:var(--secondary);">Finish Transaction</button>
        `;
        container.appendChild(div);
        const itemBox = document.getElementById(`items-${oIdx}`);
        order.items.forEach(item => {
            itemBox.innerHTML += `<div class="receipt-item"><span>${item.name}</span><span>P${item.price.toFixed(2)}</span></div>`;
        });
    });
}

function calcChange(oIdx, val, total) {
    const bill = parseFloat(val);
    if(!isNaN(bill)) {
        orders[oIdx].bill = bill;
        orders[oIdx].change = bill - total;
        const txt = document.getElementById(`changeText-${oIdx}`);
        txt.innerHTML = orders[oIdx].change >= 0 ? `Change: P${orders[oIdx].change.toFixed(2)}` : `Short: P${Math.abs(orders[oIdx].change).toFixed(2)}`;
        txt.style.color = orders[oIdx].change >= 0 ? "green" : "red";
    }
}

function finishOrder(oIdx, total) {
    const order = orders[oIdx];
    if (!order.bill || (order.bill - total) < 0) return alert("Insufficient cash!");

    receiptHistory.push({ ...order, items: [...order.items], total, date: new Date().toLocaleString() });
    moneyPool += total;
    saveData();
    updatePoolDisplay();
    orders.splice(oIdx, 1);
    renderOrders();
}

function cancelOrder(idx) { if(confirm("Void this order?")) { orders.splice(idx, 1); renderOrders(); } }

function renderHistory() {
    const list = document.getElementById('historyList');
    list.innerHTML = receiptHistory.length ? '' : '<p>No history.</p>';
    receiptHistory.forEach((r, i) => {
        const div = document.createElement('div');
        div.className = 'receipt-log';
        let items = r.items.map(it => `<div class="receipt-item"><span>${it.name}</span><span>P${it.price.toFixed(2)}</span></div>`).join('');
        div.innerHTML = `<strong>RECEIPT #${i+1}</strong><br><small>${r.date}</small><hr>${items}<hr>
            <div class="receipt-item"><strong>Total</strong><strong>P${r.total.toFixed(2)}</strong></div>`;
        list.appendChild(div);
    });
}

function unlockHistory() {
    if(prompt("Admin Password:") === adminPassword) document.getElementById('clearBtn').style.display = 'block';
}

function clearHistory() {
    if(confirm("Erase all sales?")) { receiptHistory = []; moneyPool = 0; saveData(); updatePoolDisplay(); renderHistory(); }
}