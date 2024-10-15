document.addEventListener('DOMContentLoaded', function() {
    fetchAllDishes();
});

function fetchAllDishes() {
    fetch('/get_all_dishes')
        .then(response => response.json())
        .then(data => {
            const dishList = document.getElementById('dishList');
            dishList.innerHTML = '';
            data.forEach(dish => {
                const dishElement = document.createElement('div');
                dishElement.className = 'dish-item';
                dishElement.innerHTML = `
                    <h3>${dish.dish_name}</h3>
                    <p>Price: $${dish.price.toFixed(2)}</p>
                    <p>Category: ${dish.category.replace('_', ' ').charAt(0).toUpperCase() + dish.category.slice(1)}</p>
                `;
                dishList.appendChild(dishElement);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            const dishList = document.getElementById('dishList');
            dishList.innerHTML = '<p>Error loading dishes. Please try again later.</p>';
        });
}