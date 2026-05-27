-- Creating a database named expense_tracker.

CREATE DATABASE expense_tracker; 

-- Using Database expense_tracker

USE expense_tracker; 

-- Creating table named users 

CREATE TABLE users(
id INT AUTO_INCREMENT PRIMARY KEY,
username VARCHAR(50) NOT NULL UNIQUE,
email VARCHAR(50) NOT NULL UNIQUE,
password VARCHAR(255) NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Creating another table named expenses

CREATE TABLE expenses(
id INT AUTO_INCREMENT PRIMARY KEY,
user_id INT NOT NULL,
title VARCHAR(100) NOT NULL,
amount DECIMAL(10,2) NOT NULL,
category VARCHAR(50) NOT NULL,
date DATE NOT NULL,
note VARCHAR(255),
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);


select * from users;

select * from expenses;
 
