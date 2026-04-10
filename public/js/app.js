document.addEventListener('DOMContentLoaded', () => {
    const loginLayer = document.getElementById("loginOverlay");
    const mainWrapper = document.getElementById("mainSite");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const loginBtn = document.getElementById("loginBtn");
    const registerBtn = document.getElementById("registerBtn");
    const errorBox = document.getElementById("loginError");
    const profileCircle = document.getElementById("profilePic");
    const welcomeText = document.getElementById("welcomeMsg");
    const cartList = document.getElementById("orderList");
    const cartCounter = document.getElementById("cartCount");
    const checkoutBtn = document.getElementById("checkoutBtn");
    const navItems = document.querySelectorAll(".nav-item");

    let bookingCart = [];

    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        location.reload();
    }

    profileCircle.addEventListener('click', logout);

    // Initial load check
    if (localStorage.getItem('token')) {
        loginLayer.style.display = 'none';
        mainWrapper.style.display = 'block';
        const un = localStorage.getItem('username');
        profileCircle.innerText = un.charAt(0).toUpperCase();
        welcomeText.innerText = `welcome, ${un}!`;
        setTimeout(loadProducts, 100);
        setTimeout(loadBookings, 200);
        setTimeout(loadReviews, 300);
    }

    // AUTH API
    async function handleAuth(isRegister) {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        
        if (!username || !password) {
            errorBox.innerText = "username & password required";
            return;
        }

        const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
        
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, role: username === 'srihari' ? 'admin' : 'customer' })
            });
            const data = await res.json();
            
            if (!res.ok) {
                errorBox.innerText = data.message;
                return;
            }

            if (isRegister) {
                errorBox.innerText = "Registered successfully. Logging in...";
                errorBox.style.color = 'green';
                handleAuth(false);
            } else {
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', data.user.username);
                localStorage.setItem('role', data.user.role);
                
                if (data.user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    location.reload();
                }
            }
        } catch (e) {
            errorBox.innerText = "Network Error";
        }
    }

    loginBtn.addEventListener("click", () => handleAuth(false));
    registerBtn.addEventListener("click", () => handleAuth(true));

    /* UI TABS */
        const sectionMap = {
            rides: document.getElementById("rides"),
            food: document.getElementById("food"),
            stays: document.getElementById("stays"),
            events: document.getElementById("events"),
            reviews: document.getElementById("reviews"),
            history: document.getElementById("history")
        };
    
        function switchSection(sectionKey) {
            Object.values(sectionMap).forEach(el => {
                if (el) el.classList.remove("active-section");
            });
            if (sectionMap[sectionKey]) sectionMap[sectionKey].classList.add("active-section");
    
            navItems.forEach(n => {
                n.classList.remove("active-tab");
                if (n.dataset.section === sectionKey) n.classList.add("active-tab");
            });
        }
    
        navItems.forEach(item => {
            item.addEventListener("click", function () {
                switchSection(this.dataset.section);
            });
        });
    
        /* PRODUCTS LOAD & STATS */
        async function loadProducts() {
            try {
                const res = await fetch('/api/social/product-stats');
                const stats = await res.json();
                
                // Inject stats into DOM elements
                stats.forEach(stat => {
                    const el = document.querySelector(`.avg-rating[data-product="${stat.product}"]`);
                    if (el) {
                        el.innerHTML = `<span style="color:#ffae42; cursor:pointer;" onclick="openProductReviews('${stat.product}')">⭐ ${stat.avgRating} (${stat.reviewCount} reviews)</span>`;
                    }
                });
                attachBookingEvents();
            } catch(e) {}
        }
    
        /* CART & BOOKING */
    function refreshCartUI() {
        if (bookingCart.length === 0) {
            cartList.innerHTML = '<li style="justify-content: center;">— no bookings yet —</li>';
            cartCounter.innerText = "0 items";
            checkoutBtn.style.display = 'none';
            return;
        }

        let html = "";
        let total = 0;
        bookingCart.forEach(item => {
            const qty = item.quantity || 1;
            const lineTotal = parseInt(item.price, 10) * qty;
            total += lineTotal;
            html += `<li><span style="display:flex; flex-direction:column;">
                <span><i class="fas fa-check-circle" style="color: #0ea1ab;"></i> ${item.name} <span style="color:#888;font-size:0.9em;">x${qty}</span></span>
                <span style="font-size: 0.8rem; color: #777; margin-left: 22px;"><i class="far fa-clock"></i> ${item.slot}</span>
            </span><span style="background: #def0f0; padding: 4px 16px; border-radius: 50px; height: 32px; display: flex; align-items: center;">₹${lineTotal}</span></li>`;
        });
        html += `<li style="background: #ffd966; border-left-color: #b6581c; font-weight: bold;"><span>total</span><span>₹${total}</span></li>`;
        
        cartList.innerHTML = html;
        const totalItems = bookingCart.reduce((sum, i) => sum + (i.quantity || 1), 0);
        cartCounter.innerText = `${totalItems} item${totalItems > 1 ? 's' : ''}`;
        checkoutBtn.style.display = 'block';
    }

    function handleBookingClick(event) {
        const btn = event.currentTarget;
        const name = btn.dataset.item;
        const price = btn.dataset.price;
        
        // Open Modal instead of pushing directly
        document.getElementById('configItemName').value = name;
        document.getElementById('configItemPrice').value = price;
        document.getElementById('configItemQuantity').value = 1;
        document.getElementById('configModalTitle').innerText = name;
        
        $('#addToCartConfigModal').modal('show');
    }

    document.getElementById('confirmAddToCartBtn').addEventListener('click', () => {
        const name = document.getElementById('configItemName').value;
        const price = document.getElementById('configItemPrice').value;
        const quantity = parseInt(document.getElementById('configItemQuantity').value, 10);
        const slot = document.getElementById('configItemSlot').value;
        
        if (!quantity || quantity < 1) return alert('Invalid quantity');
        
        const existing = bookingCart.find(i => i.name === name && i.slot === slot);
        if (existing) {
            existing.quantity = (existing.quantity || 1) + quantity;
        } else {
            bookingCart.push({ name, price, quantity, slot });
        }
        
        $('#addToCartConfigModal').modal('hide');
        refreshCartUI();
    });

    function attachBookingEvents() {
        document.querySelectorAll(".book-btn").forEach(btn => {
            btn.addEventListener("click", handleBookingClick);
        });
    }

    checkoutBtn.addEventListener('click', async () => {
        if (bookingCart.length === 0) return;
        
        const res = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ items: bookingCart })
        });
        
        if (res.ok) {
            alert('Booking successful!');
            bookingCart = [];
            refreshCartUI();
            loadBookings();
        } else {
            alert('Booking failed. Please try again.');
        }
    });

    async function loadBookings() {
        try {
            const res = await fetch('/api/bookings', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const bookings = await res.json();
            const container = document.getElementById('history-container');
            
            if (bookings.length === 0) {
                container.innerHTML = '<p>No bookings yet.</p>';
                return;
            }

            container.innerHTML = '';
            bookings.forEach(b => {
                const qtyStr = b.quantity > 1 ? `x${b.quantity} ` : '';
                container.innerHTML += `
                    <div class="review-card" style="margin-bottom: 10px;">
                        <div class="review-header">
                            <span><i class="fas fa-ticket-alt"></i> ${b.product} <span style="color:#888; font-size: 0.8em;">${qtyStr}</span></span>
                            <span style="color: green;">₹${b.price}</span>
                        </div>
                        <div style="font-size: 0.8rem; color: #666; margin-bottom: 10px;">
                            Booked on: ${new Date(b.date).toLocaleDateString()} | Slot: <strong>${b.slot || 'N/A'}</strong>
                        </div>
                        <div style="background: #f8f9fa; padding: 10px; border-radius: 8px;">
                            <strong>Leave a Review:</strong><br>
                            <input type="number" id="rating-${b.product}" min="1" max="5" placeholder="1-5" style="width: 60px; margin-right: 10px;">
                            <input type="text" id="text-${b.product}" placeholder="Your experience..." style="width: 200px; margin-right: 10px;">
                            <button class="react-btn" onclick="submitReview('${b.product}')">Submit</button>
                        </div>
                    </div>
                `;
            });
        } catch(e) {}
    }

    window.submitReview = async function(productName) {
        const rating = document.getElementById(`rating-${productName}`).value;
        const text = document.getElementById(`text-${productName}`).value;
        if (!rating || !text) return alert("Please provide rating and review text");

        const res = await fetch('/api/social/reviews', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ productName, text, rating })
        });
        if (res.ok) {
            alert('Review posted!');
            loadProducts(); // refresh stats
            loadReviews(); // refresh global
        }
    }

    /* REVIEWS AND SOCIAL */
    async function loadReviews() {
        try {
            const res = await fetch('/api/social/reviews');
            const reviews = await res.json();
            const container = document.getElementById("reviews-container");
            container.innerHTML = '';
            
            reviews.forEach(r => {
                let stars = '⭐'.repeat(r.rating);
                container.innerHTML += `
                    <div class="review-card">
                        <div class="review-header">
                            <span><i class="fas fa-user-circle"></i> ${r.author} (on ${r.product})</span>
                            <span class="review-ratings">${stars}</span>
                        </div>
                        <div class="review-text">"${r.text}"</div>
                        <div style="display:flex; gap: 10px;">
                            <button class="react-btn" onclick="reactToReview('${r.id}', 'like')"><i class="fas fa-thumbs-up"></i> (${r.reactions})</button>
                        </div>
                    </div>
                `;
            });
        } catch(e) {}
    }

    window.openProductReviews = async function(productName) {
        $('#productReviewsModal').modal('show');
        document.getElementById('modalProductTitle').innerText = `${productName} Reviews`;
        const container = document.getElementById('modalReviewsContainer');
        container.innerHTML = '<p>Loading...</p>';

        try {
            const res = await fetch(`/api/social/reviews/${encodeURIComponent(productName)}`);
            const reviews = await res.json();
            container.innerHTML = '';
            if (reviews.length === 0) return container.innerHTML = '<p>No reviews yet.</p>';

            reviews.forEach(r => {
                let stars = '⭐'.repeat(r.rating);
                container.innerHTML += `
                    <div class="review-card" style="margin-bottom: 15px;">
                        <div class="review-header">
                            <span><i class="fas fa-user-circle"></i> ${r.author}</span>
                            <span class="review-ratings">${stars}</span>
                        </div>
                        <div class="review-text">"${r.text}"</div>
                        <div style="display:flex; gap: 10px;">
                            <button class="react-btn" onclick="reactToReview('${r.id}', 'like'); openProductReviews('${productName}');"><i class="fas fa-thumbs-up"></i> (${r.likes})</button>
                            <button class="react-btn" style="background:#ffe5e5; color:#cc0000;" onclick="reactToReview('${r.id}', 'dislike'); openProductReviews('${productName}');"><i class="fas fa-thumbs-down"></i> (${r.dislikes})</button>
                        </div>
                    </div>
                `;
            });
        } catch(e) {
            container.innerHTML = '<p>Error loading reviews.</p>';
        }
    };

    window.reactToReview = async function(reviewId, type) {
        await fetch('/api/social/react', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ reviewId, type })
        });
        loadReviews();
    }
});
