-- Blood Donation Management System - Stored Procedures, Triggers, and Views
-- Run this file after schema.sql and seed.sql

USE blood_donation_db;

-- ================================================================
-- TRIGGERS
-- ================================================================

-- Drop triggers if they exist (for re-runability)
DROP TRIGGER IF EXISTS after_donation_completed;
DROP TRIGGER IF EXISTS after_donation_mark_ineligible;
DROP TRIGGER IF EXISTS after_request_approved;

DELIMITER $$

-- ----------------------------------------------------------------
-- Trigger 1: Auto-update blood_inventory when donation is completed
-- ----------------------------------------------------------------
CREATE TRIGGER after_donation_completed
AFTER UPDATE ON donations
FOR EACH ROW
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE blood_inventory
    SET units_available = units_available + NEW.units_donated
    WHERE bank_id = NEW.bank_id
      AND blood_group = (
        SELECT blood_group FROM donors WHERE donor_id = NEW.donor_id
      );
  END IF;
END$$

-- ----------------------------------------------------------------
-- Trigger 2: Mark donor ineligible after a completed donation
-- ----------------------------------------------------------------
CREATE TRIGGER after_donation_mark_ineligible
AFTER UPDATE ON donations
FOR EACH ROW
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE donors
    SET is_eligible = FALSE,
        last_donation_date = NEW.donation_date
    WHERE donor_id = NEW.donor_id;
  END IF;
END$$

-- ----------------------------------------------------------------
-- Trigger 3: Deduct inventory when a blood request is approved
-- ----------------------------------------------------------------
CREATE TRIGGER after_request_approved
AFTER UPDATE ON blood_requests
FOR EACH ROW
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE blood_inventory
    SET units_available = units_available - NEW.units_needed
    WHERE bank_id = NEW.bank_id
      AND blood_group = NEW.blood_group;
  END IF;
END$$

DELIMITER ;

-- ================================================================
-- VIEWS
-- ================================================================

-- Drop views if they exist (for re-runability)
DROP VIEW IF EXISTS available_donors;
DROP VIEW IF EXISTS low_inventory_alert;

-- ----------------------------------------------------------------
-- View 1: All currently eligible donors
-- ----------------------------------------------------------------
CREATE VIEW available_donors AS
SELECT
  d.donor_id,
  u.name,
  u.email,
  d.blood_group,
  d.phone,
  d.last_donation_date,
  d.is_eligible
FROM donors d
JOIN users u ON d.user_id = u.user_id
WHERE d.is_eligible = TRUE;

-- ----------------------------------------------------------------
-- View 2: Blood groups with low inventory (< 5 units)
-- ----------------------------------------------------------------
CREATE VIEW low_inventory_alert AS
SELECT
  b.name        AS bank_name,
  b.location,
  i.blood_group,
  i.units_available
FROM blood_inventory i
JOIN blood_banks b ON i.bank_id = b.bank_id
WHERE i.units_available < 5;

-- ================================================================
-- STORED PROCEDURES
-- ================================================================

DROP PROCEDURE IF EXISTS match_blood;

DELIMITER $$

-- ----------------------------------------------------------------
-- Procedure: Match recipient to compatible blood inventory
-- ----------------------------------------------------------------
CREATE PROCEDURE match_blood(IN p_recipient_id INT)
BEGIN
  DECLARE v_blood_group VARCHAR(5);

  -- Fetch the blood group needed by this recipient
  SELECT blood_group_needed INTO v_blood_group
  FROM recipients
  WHERE recipient_id = p_recipient_id;

  -- Return all banks that have compatible blood in stock
  SELECT
    b.name           AS bank_name,
    b.location,
    b.phone          AS bank_phone,
    i.blood_group    AS available_blood_group,
    i.units_available
  FROM blood_inventory i
  JOIN blood_banks b ON i.bank_id = b.bank_id
  WHERE i.blood_group IN (
    SELECT donor_group
    FROM blood_compatibility
    WHERE recipient_group = v_blood_group
  )
  AND i.units_available > 0
  ORDER BY i.units_available DESC;
END$$

DELIMITER ;
