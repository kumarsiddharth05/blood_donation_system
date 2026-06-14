-- Blood Donation Management System - Schema
-- Run this file first before seed.sql and procedures.sql

CREATE DATABASE IF NOT EXISTS blood_donation_db;
USE blood_donation_db;

-- Users table (base for all roles)
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('donor', 'recipient', 'admin') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Donors table
CREATE TABLE IF NOT EXISTS donors (
  donor_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  blood_group ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
  dob DATE NOT NULL,
  phone VARCHAR(15) NOT NULL,
  address TEXT NOT NULL,
  last_donation_date DATE DEFAULT NULL,
  is_eligible BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Recipients table
CREATE TABLE IF NOT EXISTS recipients (
  recipient_id       INT AUTO_INCREMENT PRIMARY KEY,
  user_id            INT NOT NULL,
  blood_group_needed ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') DEFAULT NULL,
  phone              VARCHAR(15) DEFAULT NULL,
  address            TEXT DEFAULT NULL,
  medical_condition  VARCHAR(255) DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Blood banks table
CREATE TABLE IF NOT EXISTS blood_banks (
  bank_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  location VARCHAR(255) NOT NULL,
  phone VARCHAR(15) NOT NULL
);

-- Blood inventory table
CREATE TABLE IF NOT EXISTS blood_inventory (
  inventory_id INT AUTO_INCREMENT PRIMARY KEY,
  bank_id INT NOT NULL,
  blood_group ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
  units_available INT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (bank_id) REFERENCES blood_banks(bank_id) ON DELETE CASCADE
);

-- Donations table
CREATE TABLE IF NOT EXISTS donations (
  donation_id INT AUTO_INCREMENT PRIMARY KEY,
  donor_id INT NOT NULL,
  bank_id INT NOT NULL,
  donation_date DATE NOT NULL,
  units_donated INT NOT NULL DEFAULT 1,
  status ENUM('pending','completed','rejected') DEFAULT 'pending',
  FOREIGN KEY (donor_id) REFERENCES donors(donor_id) ON DELETE CASCADE,
  FOREIGN KEY (bank_id) REFERENCES blood_banks(bank_id) ON DELETE CASCADE
);

-- Blood requests table
CREATE TABLE IF NOT EXISTS blood_requests (
  request_id INT AUTO_INCREMENT PRIMARY KEY,
  recipient_id INT NOT NULL,
  bank_id INT NOT NULL,
  blood_group ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
  units_needed INT NOT NULL,
  urgency ENUM('low','medium','high') DEFAULT 'medium',
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipient_id) REFERENCES recipients(recipient_id) ON DELETE CASCADE,
  FOREIGN KEY (bank_id) REFERENCES blood_banks(bank_id) ON DELETE CASCADE
);

-- Blood compatibility table
CREATE TABLE IF NOT EXISTS blood_compatibility (
  donor_group ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
  recipient_group ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
  PRIMARY KEY (donor_group, recipient_group)
);
