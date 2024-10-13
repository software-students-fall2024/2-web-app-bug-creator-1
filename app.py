from flask import Flask, jsonify, render_template, redirect, url_for, request, flash
from flask_pymongo import PyMongo
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from bson import ObjectId



load_dotenv()


app = Flask(__name__)



MONGO_URI=os.getenv('MONGO_URI')
MONGO_DBNAME = os.getenv('MONGO_DBNAME')


app.config['MONGO_URI'] = MONGO_URI
app.config['MONGO_DBNAME'] = MONGO_DBNAME
app.config['SECRET_KEY'] = 'thisisasecretkey'

try:
    client = MongoClient(MONGO_URI)
    db = client[MONGO_DBNAME]
    print("MongoDB connection successful")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

class User(UserMixin):
    def __init__(self, user_data):
        self.id = str(user_data['_id'])
        self.username = user_data['username']

@login_manager.user_loader
def load_user(user_id):
    user_data = db.users.find_one({'_id': ObjectId(user_id)})
    if user_data:
        return User(user_data)
    return None

@app.route('/', methods=['GET','POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main_page'))

    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        user = db.users.find_one({'username': username})

        if user and check_password_hash(user['password'], password):
            user_obj = User(user)
            login_user(user_obj)
            flash('Login successful', 'success')
            return redirect(url_for('main_page'))
        else:
            flash('Invalid username or password', 'error')
    
    return render_template('home.html')

@app.route('/main_page')
@login_required
def main_page():
    return render_template('main_page.html')

@app.route('/check_orders')
@login_required
def check_orders():
    # For now, this just renders a new template
    return render_template('check_orders.html')

@app.route('/edit_menu')
@login_required
def edit_menu():
    # Get all categories from the database
    categories = db.list_collection_names()
    # Exclude system collections and other non-category collections
    categories = [cat for cat in categories if not cat.startswith('system.') and cat != 'users' and cat != 'categories']
    
    # Convert underscores to spaces and capitalize for display
    categories = [cat.replace('_', ' ').title() for cat in categories]
    
    return render_template('edit_menu.html', categories=categories)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out', 'info')
    return redirect(url_for('login'))

@app.route('/get_dishes/<category>')
@login_required
def get_dishes(category):
    dishes = list(db[category].find({}, {'_id': 1, 'dish_name': 1, 'price': 1}))
    for dish in dishes:
        dish['_id'] = str(dish['_id'])
    return jsonify(dishes)

@app.route('/search_dishes')
@login_required
def search_dishes():
    query = request.args.get('query', '')
    
    # Get all categories from the database
    categories = db.list_collection_names()
    # Exclude system collections and other non-category collections
    categories = [cat for cat in categories if not cat.startswith('system.') and cat != 'users' and cat != 'categories']
    
    results = []
    for category in categories:
        dishes = list(db[category].find({'dish_name': {'$regex': query, '$options': 'i'}}, {'_id': 1, 'dish_name': 1, 'price': 1, 'category': 1}))
        for dish in dishes:
            dish['_id'] = str(dish['_id'])
            dish['category'] = category
            results.append(dish)
    return jsonify(results)

@app.route('/add_dish', methods=['POST'])
@login_required
def add_dish():
    dish_data = request.json
    
    # Validate required fields
    required_fields = ['category', 'dish_name', 'price']
    for field in required_fields:
        if field not in dish_data:
            return jsonify({'success': False, 'message': f'{field} is required'}), 400
    
    category = dish_data.pop('category')
    
    # Convert price to float
    try:
        dish_data['price'] = float(dish_data['price'])
    except ValueError:
        return jsonify({'success': False, 'message': 'Invalid price format'}), 400
    
    # Insert the new dish into the database
    result = db[category].insert_one(dish_data)
    
    # Return the new dish details
    new_dish = db[category].find_one({'_id': result.inserted_id})
    new_dish['_id'] = str(new_dish['_id'])
    new_dish['category'] = category
    
    return jsonify({'success': True, 'dish': new_dish})

@app.route('/add_category', methods=['POST'])
@login_required
def add_category():
    category_data = request.json
    category_name = category_data.get('category_name')
    
    if not category_name:
        return jsonify({'success': False, 'message': 'Category name is required'}), 400

    # Convert the category name to a valid collection name (lowercase, replace spaces with underscores)
    collection_name = category_name.lower().replace(' ', '_')

    # Check if the collection already exists
    if collection_name in db.list_collection_names():
        return jsonify({'success': False, 'message': 'Category already exists'}), 400

    # Create a new collection for the category
    db.create_collection(collection_name)

    # Add the new category to a categories list (if you want to maintain a list of all categories)
    db.categories.insert_one({'name': category_name, 'collection_name': collection_name})

    return jsonify({'success': True, 'message': 'Category added successfully'})

@app.route('/delete_dish', methods=['POST'])
@login_required
def delete_dish():
    dish_data = request.json
    dish_id = dish_data.get('dish_id')
    category = dish_data.get('category')
    
    if not dish_id or not category:
        return jsonify({'success': False, 'message': 'Dish ID and category are required'}), 400

    try:
        result = db[category].delete_one({'_id': ObjectId(dish_id)})
        if result.deleted_count == 1:
            return jsonify({'success': True, 'message': 'Dish deleted successfully'})
        else:
            return jsonify({'success': False, 'message': 'Dish not found'}), 404
    except Exception as e:
        print(f"Error deleting dish: {e}")
        return jsonify({'success': False, 'message': 'An error occurred while deleting the dish'}), 500

@app.route('/get_dish/<category>/<dish_id>')
@login_required
def get_dish(category, dish_id):
    dish = db[category].find_one({'_id': ObjectId(dish_id)})
    if dish:
        dish['_id'] = str(dish['_id'])
        return jsonify(dish)
    return jsonify({'success': False, 'message': 'Dish not found'}), 404

@app.route('/edit_dish', methods=['POST'])
@login_required
def edit_dish():
    dish_data = request.json
    dish_id = dish_data.get('dish_id')
    category = dish_data.get('category')
    dish_name = dish_data.get('dish_name')
    price = dish_data.get('price')
    
    if not all([dish_id, category, dish_name, price]):
        return jsonify({'success': False, 'message': 'All fields are required'}), 400

    try:
        result = db[category].update_one(
            {'_id': ObjectId(dish_id)},
            {'$set': {'dish_name': dish_name, 'price': price}}
        )
        if result.modified_count == 1:
            return jsonify({'success': True, 'message': 'Dish updated successfully'})
        else:
            return jsonify({'success': False, 'message': 'Dish not found or no changes made'}), 404
    except Exception as e:
        print(f"Error updating dish: {e}")
        return jsonify({'success': False, 'message': 'An error occurred while updating the dish'}), 500

if __name__=='__main__':
    app.run(debug=True)
