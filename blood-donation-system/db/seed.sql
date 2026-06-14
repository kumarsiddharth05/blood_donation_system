-- Blood Donation Management System - Seed Data
-- Run this file after schema.sql

USE blood_donation_db;

-- ----------------------------------------------------------------
-- Blood Banks
-- ----------------------------------------------------------------
INSERT INTO blood_banks (name, location, phone) VALUES
('City Blood Bank', 'Davanagere, Karnataka', '9876500001');

-- ----------------------------------------------------------------
-- Blood Inventory (10 units for each blood group at bank_id=1)
-- ----------------------------------------------------------------
INSERT INTO blood_inventory (bank_id, blood_group, units_available) VALUES
(1, 'A+',  10),
(1, 'A-',  10),
(1, 'B+',  10),
(1, 'B-',  10),
(1, 'AB+', 10),
(1, 'AB-', 10),
(1, 'O+',  10),
(1, 'O-',  10);

-- ----------------------------------------------------------------
-- Blood Compatibility Matrix (full ABO + Rh compatibility)
-- ----------------------------------------------------------------
-- O- can donate to everyone
INSERT INTO blood_compatibility (donor_group, recipient_group) VALUES
('O-', 'O-'),
('O-', 'O+'),
('O-', 'A-'),
('O-', 'A+'),
('O-', 'B-'),
('O-', 'B+'),
('O-', 'AB-'),
('O-', 'AB+');

-- O+ can donate to O+, A+, B+, AB+
INSERT INTO blood_compatibility (donor_group, recipient_group) VALUES
('O+', 'O+'),
('O+', 'A+'),
('O+', 'B+'),
('O+', 'AB+');

-- A- can donate to A-, A+, AB-, AB+
INSERT INTO blood_compatibility (donor_group, recipient_group) VALUES
('A-', 'A-'),
('A-', 'A+'),
('A-', 'AB-'),
('A-', 'AB+');

-- A+ can donate to A+, AB+
INSERT INTO blood_compatibility (donor_group, recipient_group) VALUES
('A+', 'A+'),
('A+', 'AB+');

-- B- can donate to B-, B+, AB-, AB+
INSERT INTO blood_compatibility (donor_group, recipient_group) VALUES
('B-', 'B-'),
('B-', 'B+'),
('B-', 'AB-'),
('B-', 'AB+');

-- B+ can donate to B+, AB+
INSERT INTO blood_compatibility (donor_group, recipient_group) VALUES
('B+', 'B+'),
('B+', 'AB+');

-- AB- can donate to AB-, AB+
INSERT INTO blood_compatibility (donor_group, recipient_group) VALUES
('AB-', 'AB-'),
('AB-', 'AB+');

-- AB+ can donate to AB+ only
INSERT INTO blood_compatibility (donor_group, recipient_group) VALUES
('AB+', 'AB+');

-- ----------------------------------------------------------------
-- Admin User (password: admin123)
-- bcrypt hash for "admin123" with saltRounds=10
-- ----------------------------------------------------------------
INSERT INTO users (name, email, password_hash, role) VALUES
('Admin', 'admin@biet.ac.in', '$2a$10$HJdP8aWUq/IIbPOz/0.aKOVJZfxdxaPYtdSh.QpRjZfOiAe31XaSm', 'admin');

-- ----------------------------------------------------------------
-- Donor Users (password for both: donor123)
-- bcrypt hash for "donor123" with saltRounds=10
-- ----------------------------------------------------------------
INSERT INTO users (name, email, password_hash, role) VALUES
('Rajesh Kumar', 'rajesh@example.com', '$2a$10$jvTXGH86yKYvQhsBz0z5T.Y9HwafZ1RNOoDZ9x9NhtL90GpGRFfJy', 'donor'),
('Priya Sharma', 'priya@example.com',  '$2a$10$jvTXGH86yKYvQhsBz0z5T.Y9HwafZ1RNOoDZ9x9NhtL90GpGRFfJy', 'donor');

-- Donor profiles
INSERT INTO donors (user_id, blood_group, dob, phone, address, last_donation_date, is_eligible) VALUES
(2, 'O+',  '1990-06-15', '9876500002', '12, MG Road, Davanagere', NULL,         TRUE),
(3, 'A+',  '1995-03-22', '9876500003', '45, Station Road, Davanagere', '2024-11-10', TRUE);

-- ----------------------------------------------------------------
-- Recipient Users (password for both: recipient123)
-- bcrypt hash for "recipient123" with saltRounds=10
-- ----------------------------------------------------------------
INSERT INTO users (name, email, password_hash, role) VALUES
('Suresh Patel',  'suresh@example.com', '$2a$10$FwJ4ASkVGrcSxIZCqlsS7e97O62wAevpTJGZfG.a5TRWj3vsKXL6e', 'recipient'),
('Anita Reddy',   'anita@example.com',  '$2a$10$FwJ4ASkVGrcSxIZCqlsS7e97O62wAevpTJGZfG.a5TRWj3vsKXL6e', 'recipient');

-- Recipient profiles
INSERT INTO recipients (user_id, blood_group_needed, phone, address, medical_condition) VALUES
(4, 'O+',  '9876500004', '78, 4th Cross, Davanagere', 'Anemia'),
(5, 'A+',  '9876500005', '23, Park Avenue, Davanagere', 'Thalassemia');

-- ----------------------------------------------------------------
-- Sample Donations
-- ----------------------------------------------------------------
-- Donation 1: pending (donor_id=1 i.e. Rajesh Kumar)
INSERT INTO donations (donor_id, bank_id, donation_date, units_donated, status) VALUES
(1, 1, '2025-05-01', 1, 'pending');

-- Donation 2: completed (donor_id=2 i.e. Priya Sharma)
-- Note: the trigger after_donation_completed will fire if status is changed via UPDATE
-- For seed we insert directly in completed state for demo purposes
INSERT INTO donations (donor_id, bank_id, donation_date, units_donated, status) VALUES
(2, 1, '2025-04-15', 1, 'completed');

-- ----------------------------------------------------------------
-- Sample Blood Requests
-- ----------------------------------------------------------------
-- Request 1: pending (recipient_id=1 i.e. Suresh Patel)
INSERT INTO blood_requests (recipient_id, bank_id, blood_group, units_needed, urgency, status) VALUES
(1, 1, 'O+', 2, 'high', 'pending');

-- Request 2: approved (recipient_id=2 i.e. Anita Reddy)
INSERT INTO blood_requests (recipient_id, bank_id, blood_group, units_needed, urgency, status) VALUES
(2, 1, 'A+', 1, 'medium', 'approved');
