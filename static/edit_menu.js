document.addEventListener('DOMContentLoaded', function() {
    const categoriesContainer = document.querySelector('.categories');
    const dishesContainer = document.querySelector('.dishes');
    const searchInput = document.getElementById('search');
    const addDishButton = document.getElementById('add-dish');
    const addCategoryButton = document.getElementById('add-category');
    const addDishModal = document.getElementById('add-dish-modal');
    const addCategoryModal = document.getElementById('add-category-modal');
    const addDishForm = document.getElementById('add-dish-form');
    const addCategoryForm = document.getElementById('add-category-form');
    const deleteModal = document.getElementById('delete-dish-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    let currentCategory = null;
    let currentDishToDelete = null;
    const editDishModal = document.getElementById('edit-dish-modal');
    const editDishForm = document.getElementById('edit-dish-form');

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
                        <button class="edit-dish" data-id="${dish._id}" data-category="${category}">Edit</button>
                        <button class="delete-dish" data-id="${dish._id}" data-category="${category}">Delete</button>
                    `;
                    dishesContainer.appendChild(dishElement);
                });
                setupDeleteButtons();
                setupEditButtons();
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

    function setupDeleteButtons() {
        const deleteButtons = document.querySelectorAll('.delete-dish');
        deleteButtons.forEach(button => {
            button.addEventListener('click', function() {
                const dishId = this.dataset.id;
                const category = this.dataset.category;
                currentDishToDelete = { dishId, category };
                deleteModal.style.display = 'block';
            });
        });
    }

    function setupEditButtons() {
        const editButtons = document.querySelectorAll('.edit-dish');
        editButtons.forEach(button => {
            button.addEventListener('click', function() {
                const dishId = this.dataset.id;
                const category = this.dataset.category;
                fetch(`/get_dish/${category}/${dishId}`)
                    .then(response => response.json())
                    .then(dish => {
                        document.getElementById('edit-dish-name').value = dish.dish_name;
                        document.getElementById('edit-dish-price').value = dish.price;
                        document.getElementById('edit-dish-id').value = dish._id;
                        document.getElementById('edit-dish-category').value = category;
                        editDishModal.style.display = 'block';
                    });
            });
        });
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
                            <button class="delete-dish" data-id="${dish._id}" data-category="${dish.category}">Delete</button>
                        `;
                        dishesContainer.appendChild(dishElement);
                    });
                    setupDeleteButtons();
                });
        } else if (currentCategory) {
            loadDishes(currentCategory);
        }
    });

    addDishButton.addEventListener('click', function() {
        if (currentCategory) {
            addDishModal.style.display = 'block';
        } else {
            alert('Please select a category first');
        }
    });

    const closeButtons = document.getElementsByClassName('close');
    Array.from(closeButtons).forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
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
                addDishModal.style.display = 'none';
                loadDishes(currentCategory);
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
        addCategoryModal.style.display = 'block';
    });

    addCategoryForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const categoryName = document.getElementById('new-category-name').value;

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
                const newButton = document.createElement('button');
                newButton.className = 'category-btn';
                newButton.textContent = categoryName;
                newButton.dataset.category = categoryName.toLowerCase().replace(' ', '_');
                categoriesContainer.insertBefore(newButton, addCategoryButton);
                setupCategoryButtons();
                addCategoryModal.style.display = 'none';
                addCategoryForm.reset();
            } else {
                alert('Failed to add category: ' + data.message);
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        });
    });

    confirmDeleteBtn.addEventListener('click', () => {
        if (currentDishToDelete) {
            deleteDish(currentDishToDelete.dishId, currentDishToDelete.category);
            deleteModal.style.display = 'none';
        }
    });

    cancelDeleteBtn.addEventListener('click', () => {
        deleteModal.style.display = 'none';
    });

    function deleteDish(dishId, category) {
        fetch('/delete_dish', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ dish_id: dishId, category: category }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadDishes(category);
            } else {
                alert('Failed to delete dish: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while deleting the dish');
        });
    }

    editDishForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const dishId = document.getElementById('edit-dish-id').value;
        const category = document.getElementById('edit-dish-category').value;
        const dishName = document.getElementById('edit-dish-name').value;
        const dishPrice = parseFloat(document.getElementById('edit-dish-price').value);

        fetch('/edit_dish', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                dish_id: dishId,
                category: category,
                dish_name: dishName,
                price: dishPrice
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                editDishModal.style.display = 'none';
                loadDishes(category);
                editDishForm.reset();
            } else {
                alert('Failed to edit dish: ' + data.message);
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('An error occurred while editing the dish');
        });
    });
});
