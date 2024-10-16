# Web Application Exercise

A little exercise to build a web application following an agile development process. See the [instructions](instructions.md) for more detail.

## Product vision statement

We implement a mobile manager system for a restaurant manager to edit the menu, and see all the orders they made to calculate the total revenue.

## User stories

1. As a restaurant manager, I want to see all the orders I made, so I can calculate the total revenue.
2. As a restaurant manager, I want to add new dish to the menu so that I can attract more customers.
3. As a restaurant manager, I want to add new category to the menu so that I can organize the menu better.
4. As a restaurant manager, I want to change the price of the dish so that I can attract more customers.
5. As a restaurant manager, I want to delete some unpopular dishes from the menu so that I can focus on the most profitable ones.
6. As a restaurant manager, I want only myself are able to login so that no other people can change the menu.
7. As a restaurant manager, I want to delete category from the menu so that I can better organize the menu.
8. As a restaurant manager, I want to change the name of the current dish so that it might attract more customers to try it.

Link to the Issues page:

https://github.com/software-students-fall2024/2-web-app-bug-creator-1/issues

## Steps necessary to run the software

1. git clone the repository
2. cd into the repository
3. in the terminal, type in 'pipenv install' to install all the packages
4. create a .env file with the following:
```env
MONGO_DBNAME=restaurantDB
MONGO_URI=mongodb+srv://mbw3047256:12345@project2.vvcih.mongodb.net/
FLASK_APP=app.py
FLASK_ENV=development
FLASK_PORT=5000
```
5. in terminal, type in 'pipenv shell' to open the virtual environment
6. in terminal, type in 'pipenv run python app.py' to run the application
7. in the login page, the username is 'manager' and the password is '12345'

## Task boards

Link to the task board: 
https://github.com/orgs/software-students-fall2024/projects/31
