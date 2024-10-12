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

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out', 'info')
    return redirect(url_for('login'))

if __name__=='__main__':
    app.run()
