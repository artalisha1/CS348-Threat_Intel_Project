CREATE DATABASE IF NOT EXISTS threat_intel;

USE threat_intel;

CREATE TABLE IF NOT EXISTS ThreatActors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  org_type VARCHAR(255),
  origin_country VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS IndicatorsOfCompromise (
  id INT AUTO_INCREMENT PRIMARY KEY,
  actor_id INT,
  ioc_value VARCHAR(255),
  ioc_type VARCHAR(255),
  severity VARCHAR(255),
  description TEXT,
  status VARCHAR(50) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_id) REFERENCES ThreatActors(id) ON DELETE CASCADE
);

-- Index 1: Index on actor_id in the IndicatorsOfCompromise table
-- actor_id is a foreign key used in JOIN operations with the ThreatActors table 
-- in server.js, GET /api/iocs query joins the two tables using actor_id
-- so with this index, it can quickly match records between the two table
-- otherwise, it would require a full table scan on both tables to find matching records
-- also used for `/api/iocs?actor_id=X` filter query
CREATE INDEX idx_ioc_actor ON IndicatorsOfCompromise(actor_id);

-- Index 2: Index on severity in the IndicatorsOfCompromise table
-- severity of the IOC is used as a filter in the frontend, so with this index,
-- it can quickly find matching rows for the `/api/iocs?severity=X` query
CREATE INDEX idx_ioc_severity ON IndicatorsOfCompromise(severity);

-- Index 3: Index on ioc_type in the IndicatorsOfCompromise table
-- ioc_type is used as a filter in the frontend, so with this index,
-- it can quickly find matching rows for the `/api/iocs?ioc_type=X` query
-- even with many different IOCs added over time 
CREATE INDEX idx_ioc_type ON IndicatorsOfCompromise(ioc_type);

-- Seed Initial Data
INSERT INTO ThreatActors (name, org_type, origin_country) VALUES
  ('APT28 (Fancy Bear)', 'State-Sponsored', 'Russia'),
  ('Lazarus Group', 'State-Sponsored', 'North Korea'),
  ('FIN7', 'Financially Motivated', 'Russia'),
  ('Anonymous', 'Hacktivist', 'Global');

INSERT INTO IndicatorsOfCompromise (actor_id, ioc_value, ioc_type, severity, description, status) VALUES
  (1, 'powershell.exe -enc ...', 'Command', 'Critical', 'Malicious execution of base64 encoded payload', 'Active'),
  (2, '185.22.148.102', 'IPv4', 'High', 'Known C2 communication endpoint', 'Resolved'),
  (3, 'invoice_urgent.docm', 'File Name', 'Medium', 'Malicious macro document spreading via email spoofing', 'Active'),
  (1, '098f6bcd4621d373cade4e832627b4f6', 'MD5 Hash', 'High', 'Dropper binary payload', 'Active'),
  (2, 'fake-crypto-exchange.io', 'Domain', 'High', 'Phishing domain used to steal wallet credentials', 'Active');


-- Insert new historical threat actors
INSERT IGNORE INTO ThreatActors (id, name, org_type, origin_country) VALUES
  (5, 'Equation Group', 'State-Sponsored', 'United States'),
  (6, 'Sandworm Team', 'State-Sponsored', 'Russia'),
  (7, 'DarkSide', 'Cybercriminal', 'Eastern Europe'),
  (8, 'WannaCry Actors', 'Various', 'North Korea');

-- Insert historical famous IOCs
INSERT INTO IndicatorsOfCompromise (actor_id, ioc_value, ioc_type, severity, description) VALUES
  (8, 'ed01ebfbc9eb5bbea545af4d01bf5f1071661840480439c6e5babe8e080e41aa', 'SHA256 Hash', 'Critical', 'WannaCry Ransomware primary executable hash'),
  (8, 'www.iuqerfsodp9ifjaposdfjhgosurijfaewrwergwea.com', 'Domain', 'High', 'WannaCry Killswitch Domain'),
  (7, 'darkside.onion', 'Domain', 'Critical', 'DarkSide Ransomware leak site on Tor network (Colonial Pipeline attack)'),
  (6, '185.22.148.102', 'IPv4', 'High', 'NotPetya C2 Server associated with Sandworm'),
  (6, 'C:\\Windows\\dispci.exe', 'File Name', 'Critical', 'NotPetya wiper component payload'),
  (5, 'stuxnet.sys', 'File Name', 'Critical', 'Stuxnet worm driver file targeting SCADA systems'),
  (3, 'carbanak.exe', 'File Name', 'High', 'Carbanak malware used by FIN7 for bank heists');
