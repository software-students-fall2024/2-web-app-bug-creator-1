document.addEventListener('DOMContentLoaded', function() {
    const categoriesContainer = document.querySelector('.categories');
    const dishesContainer = document.querySelector('.dishes');
    const searchInput = document.getElementById('search');
    const addDishButton = document.getElementById('add-dish');
    const addCategoryButton = document.getElementById('add-category');
    const addDishModal = document.getElementById('add-dish-modal');
    const addDishForm = document.getElementById('add-dish-form');
    const cancelAddDish = document.getElementById('cancel-add-dish');

    let currentCategory = null;

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
                currentCategory = this.dataset.category;
                loadDishes(currentCategory);
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
        if (currentCategory) {
            addDishModal.style.display = 'block';
        } else {
            alert('Please select a category first');
        }
    });

    const closeButton = document.getElementsByClassName('close')[0];

    closeButton.addEventListener('click', function() {
        addDishModal.style.display = 'none';
    });

    window.addEventListener('click', function(event) {
        if (event.target == addDishModal) {
            addDishModal.style.display = 'none';
        }
    });

    addDishForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const dishName = document.getElementById('new-dish-name').value;
        const dishPrice = parseFloat(document.getElementById('new-dish-price').value);

        if (!currentCategory) {
            alert('Please select a category first');
            return;
        }

        fetch('/add_dish', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                category: currentCategory,
                dish_name: dishName,
                price: dishPrice
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Close the modal
                addDishModal.style.display = 'none';
                
                // Add the new dish to the dishes container
                const dishElement = document.createElement('div');
                dishElement.className = 'dish-item';
                dishElement.innerHTML = `
                    <span class="dish-name">${data.dish.dish_name}</span>
                    <span class="dish-price">$${data.dish.price.toFixed(2)}</span>
                    <button class="edit-dish" data-id="${data.dish._id}">Edit</button>
                    <button class="delete-dish" data-id="${data.dish._id}">Delete</button>
                `;
                dishesContainer.appendChild(dishElement);
                
                // Reset the form
                addDishForm.reset();
            } else {
                alert('Failed to add dish: ' + data.message);
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('An error occurred while adding the dish');
        });
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
