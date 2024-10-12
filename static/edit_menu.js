document.addEventListener('DOMContentLoaded', function() {
    const categoriesContainer = document.querySelector('.categories');
    const dishesContainer = document.querySelector('.dishes');
    const searchInput = document.getElementById('search');
    const addDishButton = document.getElementById('add-dish');
    const addCategoryButton = document.getElementById('add-category');

    function loadDishes(category) {
        fetch(`/get_dishes/${category}`)
            .then(response => response.json())
            .then(dishes => {
                dishesContainer.innerHTML = '';
                dishes.forEach(dish => {
                    const dishElement = document.createElement('div');
                    dishElement.className = 'dish-item';
                    dishElement.innerHTML = `
                        <span class="dish-name">${dish.dish_name}</span>
                        <span class="dish-price">$${dish.price.toFixed(2)}</span>
                        <button class="edit-dish" data-id="${dish._id}">Edit</button>
                        <button class="delete-dish" data-id="${dish._id}">Delete</button>
                    `;
                    dishesContainer.appendChild(dishElement);
                });
            });
    }

    function setupCategoryButtons() {
        const categoryButtons = document.querySelectorAll('.category-btn');
        categoryButtons.forEach(button => {
            button.addEventListener('click', function() {
                categoryButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                loadDishes(this.dataset.category);
            });
        });

        // Load the first category by default
        if (categoryButtons.length > 0) {
            categoryButtons[0].click();
        }
    }

    setupCategoryButtons();

    searchInput.addEventListener('input', function() {
        if (this.value.length > 2) {
            fetch(`/search_dishes?query=${this.value}`)
                .then(response => response.json())
                .then(dishes => {
                    dishesContainer.innerHTML = '';
                    dishes.forEach(dish => {
                        const dishElement = document.createElement('div');
                        dishElement.className = 'dish-item';
                        dishElement.innerHTML = `
                            <span class="dish-name">${dish.dish_name}</span>
                            <span class="dish-price">$${dish.price.toFixed(2)}</span>
                            <span class="dish-category">${dish.category}</span>
                            <button class="edit-dish" data-id="${dish._id}">Edit</button>
                            <button class="delete-dish" data-id="${dish._id}">Delete</button>
                        `;
                        dishesContainer.appendChild(dishElement);
                    });
                });
        }
    });

    addDishButton.addEventListener('click', function() {
        // This is a placeholder for the add dish functionality
        // You would typically open a modal or navigate to a new page here
        alert('Add new dish functionality to be implemented');
    });

    addCategoryButton.addEventListener('click', function() {
        const categoryName = prompt("Enter the name of the new category:");
        if (categoryName) {
            fetch('/add_category', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ category_name: categoryName }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Create and add the new category button
                    const newButton = document.createElement('button');
                    newButton.className = 'category-btn';
                    newButton.textContent = categoryName;
                    newButton.dataset.category = categoryName.toLowerCase().replace(' ', '_');
                    categoriesContainer.insertBefore(newButton, addCategoryButton);
                    
                    // Setup the new button
                    setupCategoryButtons();
                    
                    alert('Category added successfully!');
                } else {
                    alert('Failed to add category. Please try again.');
                }
            })
            .catch((error) => {
                console.error('Error:', error);
                alert('An error occurred. Please try again.');
            });
        }
    });
});
