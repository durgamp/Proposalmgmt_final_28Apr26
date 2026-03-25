-- MySQL dump 10.13  Distrib 9.6.0, for Linux (x86_64)
--
-- Host: localhost    Database: biopropose
-- ------------------------------------------------------
-- Server version	9.6.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ 'caff13f2-215b-11f1-b931-4a7447b4b1dc:1-163';

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `proposal_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `details` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `changes_json` text COLLATE utf8mb4_unicode_ci,
  `snapshot_json` text COLLATE utf8mb4_unicode_ci,
  `timestamp` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_88dcc148d532384790ab874c3d` (`timestamp`),
  KEY `IDX_cee5459245f652b75eb2759b4c` (`action`),
  KEY `IDX_8b3c79f62e99a8290c955182f2` (`user_email`),
  KEY `IDX_8f332a8f309edfe58032d76d44` (`proposal_id`),
  CONSTRAINT `FK_8f332a8f309edfe58032d76d44b` FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES ('03feb29e-4cb0-4869-a2d4-dd607fc3e330','4545e3b9-0a0f-46b3-b5ab-23a0bf24f379','durga@gmail.com','durga@gmail.com','updated','Section \"CEO Letter\": Section reopened; completedBy updated; completedAt updated','{\"sectionKey\":\"ceo-letter\",\"changes\":[\"Section reopened\",\"completedBy updated\",\"completedAt updated\"]}',NULL,'2026-03-23 18:06:42.481048'),('0487ea7e-cdbe-4697-aac9-84d92d9bb691','4545e3b9-0a0f-46b3-b5ab-23a0bf24f379','durga@gmail.com','durga@gmail.com','created','Proposal \"Novartis \" created via template method',NULL,'{\"id\":\"4545e3b9-0a0f-46b3-b5ab-23a0bf24f379\",\"name\":\"Novartis \",\"client\":\"Novartis\"}','2026-03-17 07:23:43.853727'),('0b53d00c-45b6-4067-948a-31d9e9b50922','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','updated','Section \"Project Details\": contentJson updated','{\"sectionKey\":\"project-details\",\"changes\":[\"contentJson updated\"]}',NULL,'2026-03-24 13:08:49.974357'),('0cf7e4b6-24b2-4943-a531-ea6728c2fc0f','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','section_completed','Section \"Scope of Work\": Section completed; completedBy updated; completedAt updated','{\"sectionKey\":\"scope-of-work\",\"changes\":[\"Section completed\",\"completedBy updated\",\"completedAt updated\"]}',NULL,'2026-03-17 18:14:50.093473'),('176237b1-1bce-487d-b3c8-93c239680d69','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','updated','Section \"Scope of Work\": Section reopened; completedBy updated; completedAt updated','{\"sectionKey\":\"scope-of-work\",\"changes\":[\"Section reopened\",\"completedBy updated\",\"completedAt updated\"]}',NULL,'2026-03-17 18:15:06.269343'),('1d02667c-8d05-4865-9859-257e4eceb77b','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','updated','Section \"Executive Summary\": contentJson updated','{\"sectionKey\":\"executive-summary\",\"changes\":[\"contentJson updated\"]}',NULL,'2026-03-17 10:15:16.951470'),('1d1189d8-37ed-40ef-8737-709abce03cbd','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','updated','Section \"Project Details\": contentJson updated','{\"sectionKey\":\"project-details\",\"changes\":[\"contentJson updated\"]}',NULL,'2026-03-17 10:18:59.847642'),('1e3de5cf-b8ba-436a-8e20-709da6f79eda','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','section_unlocked','Section \"Scope of Work\": Section unlocked; lockedBy updated','{\"sectionKey\":\"scope-of-work\",\"changes\":[\"Section unlocked\",\"lockedBy updated\"]}',NULL,'2026-03-17 18:15:00.817779'),('26695478-a12c-4c39-910b-1e93e111d7dc','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','updated','Section \"Scope of Work\": contentJson updated','{\"sectionKey\":\"scope-of-work\",\"changes\":[\"contentJson updated\"]}',NULL,'2026-03-17 10:39:15.211657'),('27e76ed9-08f0-4da3-b79b-fcba2c3351b4','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','updated','Section \"Project Details\": contentJson updated','{\"sectionKey\":\"project-details\",\"changes\":[\"contentJson updated\"]}',NULL,'2026-03-24 13:08:41.337363'),('2c5d033b-1a97-40a2-b526-d7e1b96bc9d0','4545e3b9-0a0f-46b3-b5ab-23a0bf24f379','durga@gmail.com','durga@gmail.com','section_completed','Section \"CEO Letter\": Section completed; completedBy updated; completedAt updated','{\"sectionKey\":\"ceo-letter\",\"changes\":[\"Section completed\",\"completedBy updated\",\"completedAt updated\"]}',NULL,'2026-03-23 18:06:41.647258'),('322ea06e-e34b-4f7f-8808-a3386a5686c3','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','updated','Section \"Project Details\": contentJson updated','{\"sectionKey\":\"project-details\",\"changes\":[\"contentJson updated\"]}',NULL,'2026-03-17 10:17:16.823364'),('36b382d7-4fdc-4a06-ad2a-cd2369534117','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','updated','Section \"Scope of Work\": contentJson updated','{\"sectionKey\":\"scope-of-work\",\"changes\":[\"contentJson updated\"]}',NULL,'2026-03-18 06:04:25.773570'),('39568d20-2bbc-4f66-b839-fb297d919571','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','updated','Section \"Scope of Work\": contentJson updated','{\"sectionKey\":\"scope-of-work\",\"changes\":[\"contentJson updated\"]}',NULL,'2026-03-17 09:59:18.414298'),('40662d6b-17d7-4c32-8196-75e9d211731d','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','updated','Section \"CEO Letter\": contentJson updated','{\"sectionKey\":\"ceo-letter\",\"changes\":[\"contentJson updated\"]}',NULL,'2026-03-24 12:08:10.230980'),('47266fe1-d3c4-4d38-972f-bba06db80712','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','updated','Section \"Scope of Work\": contentJson updated','{\"sectionKey\":\"scope-of-work\",\"changes\":[\"contentJson updated\"]}',NULL,'2026-03-17 10:01:14.827805'),('4f1ce2e0-7fb8-4cc5-9921-e654b7f9826c','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','updated','Section \"Project Details\": contentJson updated','{\"sectionKey\":\"project-details\",\"changes\":[\"contentJson updated\"]}',NULL,'2026-03-24 13:08:34.148629'),('544336bc-51fc-4021-9142-8c7c8e44e32c','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','updated','Section \"Scope of Work\": contentJson updated','{\"sectionKey\":\"scope-of-work\",\"changes\":[\"contentJson updated\"]}',NULL,'2026-03-17 18:11:15.121006'),('56a71883-ccb1-41df-bd02-be32042cb2a4','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','updated','Section \"CEO Letter\": contentJson updated','{\"sectionKey\":\"ceo-letter\",\"changes\":[\"contentJson updated\"]}',NULL,'2026-03-18 06:05:04.755482'),('58071487-c439-4192-9b00-b77e326b0cd5','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','updated','Section \"Project Details\": contentJson updated','{\"sectionKey\":\"project-details\",\"changes\":[\"contentJson updated\"]}',NULL,'2026-03-17 10:41:19.168498'),('5a380478-d0b7-4ce9-bd50-2dde20856b0e','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','cost_updated','Cost breakdown updated — 2 items, total: $11,90,000',NULL,NULL,'2026-03-24 11:53:12.847771'),('65b661d9-6d44-4feb-9223-3f8a08b6e725','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','section_completed','Section \"CEO Letter\": Section completed; completedBy updated; completedAt updated','{\"sectionKey\":\"ceo-letter\",\"changes\":[\"Section completed\",\"completedBy updated\",\"completedAt updated\"]}',NULL,'2026-03-18 07:10:35.927615'),('663322c6-ed66-4a23-b844-f5c75daa0b70','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','section_locked','Section \"Scope of Work\": Section locked','{\"sectionKey\":\"scope-of-work\",\"changes\":[\"Section locked\"]}',NULL,'2026-03-17 18:14:58.563536'),('66765ee8-7663-49aa-a757-d35644e4e7b1','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','updated','Section \"CEO Letter\": Section reopened; completedBy updated; completedAt updated','{\"sectionKey\":\"ceo-letter\",\"changes\":[\"Section reopened\",\"completedBy updated\",\"completedAt updated\"]}',NULL,'2026-03-18 07:10:34.549095'),('66e68594-3334-4ab9-8586-110757cb031b','8c98cc6a-f884-4ce9-90ee-49f96086a760','durgapx2020@email.iimcal.ac.in','durgapx2020@email.iimcal.ac.in','section_completed','Section \"Executive Summary\": Section completed; completedBy updated; completedAt updated','{\"sectionKey\":\"executive-summary\",\"changes\":[\"Section completed\",\"completedBy updated\",\"completedAt updated\"]}',NULL,'2026-03-16 19:27:36.507388'),('69d08c6d-cc4b-475f-8706-23092608a57f','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','updated','Section \"Scope of Work\": contentJson updated','{\"sectionKey\":\"scope-of-work\",\"changes\":[\"contentJson updated\"]}',NULL,'2026-03-17 18:25:04.753901'),('6c0319dd-2ed1-426d-ae86-baf510c13216','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','updated','Section \"Scope of Work\": contentJson updated','{\"sectionKey\":\"scope-of-work\",\"changes\":[\"contentJson updated\"]}',NULL,'2026-03-17 18:15:17.450323'),('6c10d2c8-8ac6-4b21-ba0e-6e0d55525965','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','updated','Section \"CEO Letter\": contentJson updated','{\"sectionKey\":\"ceo-letter\",\"changes\":[\"contentJson updated\"]}',NULL,'2026-03-18 07:18:44.050282'),('6f0511d1-db4c-46c7-a752-732559a57197','4545e3b9-0a0f-46b3-b5ab-23a0bf24f379','durga@gmail.com','durga@gmail.com','updated','Section \"Project Details\": contentJson updated','{\"sectionKey\":\"project-details\",\"changes\":[\"contentJson updated\"]}',NULL,'2026-03-23 18:04:55.893596'),('6fd35f30-b73d-4674-90b9-62275b159c26','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','updated','Section \"Scope of Work\": Section reopened; completedBy updated; completedAt updated','{\"sectionKey\":\"scope-of-work\",\"changes\":[\"Section reopened\",\"completedBy updated\",\"completedAt updated\"]}',NULL,'2026-03-17 18:14:54.615606'),('6fd64bf5-0a73-49ba-9f92-0863e73a72f6','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','cost_updated','Cost breakdown updated — 1 items, total: $11,70,000',NULL,NULL,'2026-03-24 11:46:57.715129'),('7094eb4c-174b-44b3-8266-5b5dde3292c6','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','updated','Section \"Scope of Work\": contentJson updated','{\"sectionKey\":\"scope-of-work\",\"changes\":[\"contentJson updated\"]}',NULL,'2026-03-17 18:13:55.747157'),('70ace8f1-f86c-42ae-9f3a-2dd6cafa1475','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','updated','Section \"Project Details\": contentJson updated','{\"sectionKey\":\"project-details\",\"changes\":[\"contentJson updated\"]}',NULL,'2026-03-24 13:09:19.442323'),('78b83ebe-c3c3-4ee7-a5c5-9bb9c84c6dfc','8c98cc6a-f884-4ce9-90ee-49f96086a760','durgapx2020@email.iimcal.ac.in','durgapx2020@email.iimcal.ac.in','section_completed','Section \"Terms & Conditions\": Section completed; completedBy updated; completedAt updated','{\"sectionKey\":\"terms-conditions\",\"changes\":[\"Section completed\",\"completedBy updated\",\"completedAt updated\"]}',NULL,'2026-03-16 19:27:42.985088'),('7fe8a167-2263-4534-a295-9214e30f8307','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','updated','Section \"Scope of Work\": contentJson updated','{\"sectionKey\":\"scope-of-work\",\"changes\":[\"contentJson updated\"]}',NULL,'2026-03-18 06:04:21.352006'),('81d2bffa-37d9-4fc1-b64a-2eca1a68e756','8c98cc6a-f884-4ce9-90ee-49f96086a760','durgapx2020@email.iimcal.ac.in','durgapx2020@email.iimcal.ac.in','section_completed','Section \"CEO Letter\": Section completed; completedBy updated; completedAt updated','{\"sectionKey\":\"ceo-letter\",\"changes\":[\"Section completed\",\"completedBy updated\",\"completedAt updated\"]}',NULL,'2026-03-16 19:27:34.245632'),('82a12313-6760-4902-a98a-523cfa76554d','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','cost_updated','Cost breakdown updated — 1 items, total: $11,70,000',NULL,NULL,'2026-03-17 18:12:18.145351'),('8a107269-6058-4199-abac-eede561c0272','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','cost_updated','Cost breakdown updated — 2 items, total: $11,90,000',NULL,NULL,'2026-03-24 12:07:44.530524'),('97ae4c64-c20c-421d-8db0-254bf7740ef6','4545e3b9-0a0f-46b3-b5ab-23a0bf24f379','durga@gmail.com','durga@gmail.com','updated','Section \"CEO Letter\": contentJson updated','{\"sectionKey\":\"ceo-letter\",\"changes\":[\"contentJson updated\"]}',NULL,'2026-03-23 18:03:21.962495'),('9c8a5396-f1e1-442f-8a87-62db06d06161','4545e3b9-0a0f-46b3-b5ab-23a0bf24f379','durga@gmail.com','durga@gmail.com','updated','Section \"Scope of Work\": contentJson updated','{\"sectionKey\":\"scope-of-work\",\"changes\":[\"contentJson updated\"]}',NULL,'2026-03-23 18:03:50.810259'),('9e2d1973-5c0e-44e3-b7f2-e24988cfe7b0','8c98cc6a-f884-4ce9-90ee-49f96086a760','durgapx2020@email.iimcal.ac.in','durgapx2020@email.iimcal.ac.in','section_completed','Section \"Scope of Work\": Section completed; completedBy updated; completedAt updated','{\"sectionKey\":\"scope-of-work\",\"changes\":[\"Section completed\",\"completedBy updated\",\"completedAt updated\"]}',NULL,'2026-03-16 19:27:38.309438'),('a112992b-c5b1-406c-8de7-422087af662e','8c98cc6a-f884-4ce9-90ee-49f96086a760','durgapx2020@email.iimcal.ac.in','durgapx2020@email.iimcal.ac.in','stage_advanced','Stage advanced: Draft Creation → Technical Review',NULL,NULL,'2026-03-16 19:27:50.836790'),('a3ba0a4b-f183-4f72-861d-1b00b495c5e6','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','updated','Section \"Scope of Work\": contentJson updated','{\"sectionKey\":\"scope-of-work\",\"changes\":[\"contentJson updated\"]}',NULL,'2026-03-17 18:25:28.023956'),('aa3cdbfe-77f9-4979-a197-2991c453557c','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','updated','Section \"Scope of Work\": contentJson updated','{\"sectionKey\":\"scope-of-work\",\"changes\":[\"contentJson updated\"]}',NULL,'2026-03-17 18:14:30.611382'),('ab18a0e7-b01a-448a-8bd7-152987a2f2b5','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','updated','Section \"Project Details\": contentJson updated','{\"sectionKey\":\"project-details\",\"changes\":[\"contentJson updated\"]}',NULL,'2026-03-24 13:09:09.037664'),('ad443497-eced-463a-a1ce-229ae9ecff8f','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','updated','Section \"Project Details\": contentJson updated','{\"sectionKey\":\"project-details\",\"changes\":[\"contentJson updated\"]}',NULL,'2026-03-17 10:16:48.725765'),('afd7995e-8738-49ab-b1a8-bf4d86dd5999','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','section_unlocked','Section \"Scope of Work\": Section unlocked; lockedBy updated','{\"sectionKey\":\"scope-of-work\",\"changes\":[\"Section unlocked\",\"lockedBy updated\"]}',NULL,'2026-03-17 10:01:34.519450'),('b56ff8a8-b6a4-4ef9-b5e9-bae538671976','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','updated','Section \"Scope of Work\": contentJson updated','{\"sectionKey\":\"scope-of-work\",\"changes\":[\"contentJson updated\"]}',NULL,'2026-03-18 06:04:09.656650'),('ba86bd6d-27df-42d8-910b-bc6d5a6cfd2c','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','section_locked','Section \"Scope of Work\": Section locked; lockedBy updated','{\"sectionKey\":\"scope-of-work\",\"changes\":[\"Section locked\",\"lockedBy updated\"]}',NULL,'2026-03-17 10:01:32.087283'),('bbf364bb-3268-4720-a941-52e141e71f02','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','section_completed','Section \"Scope of Work\": Section completed; completedAt updated','{\"sectionKey\":\"scope-of-work\",\"changes\":[\"Section completed\",\"completedAt updated\"]}',NULL,'2026-03-17 18:15:02.073064'),('bcbf7b49-1154-413c-ae7b-a05beb517cd4','8c98cc6a-f884-4ce9-90ee-49f96086a760','durgapx2020@email.iimcal.ac.in','durgapx2020@email.iimcal.ac.in','section_completed','Section \"Project Details\": Section completed; completedBy updated; completedAt updated','{\"sectionKey\":\"project-details\",\"changes\":[\"Section completed\",\"completedBy updated\",\"completedAt updated\"]}',NULL,'2026-03-16 19:27:40.504678'),('c194d63c-05ef-4c2a-9530-bdbb2f236b0c','4545e3b9-0a0f-46b3-b5ab-23a0bf24f379','durga@gmail.com','durga@gmail.com','updated','Section \"Scope of Work\": contentJson updated','{\"sectionKey\":\"scope-of-work\",\"changes\":[\"contentJson updated\"]}',NULL,'2026-03-23 18:04:30.717086'),('cbf11536-b981-48ef-92ba-be69c6a819af','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','updated','Section \"Scope of Work\": contentJson updated','{\"sectionKey\":\"scope-of-work\",\"changes\":[\"contentJson updated\"]}',NULL,'2026-03-17 10:14:00.481811'),('d9549484-e3c2-447b-8be7-e6d79d756c76','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','updated','Section \"Scope of Work\": contentJson updated','{\"sectionKey\":\"scope-of-work\",\"changes\":[\"contentJson updated\"]}',NULL,'2026-03-17 10:13:47.875935'),('d9dc1369-a8fc-40c0-aeaf-1139bfb9a6f3','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','section_completed','Section \"Scope of Work\": Section completed; completedAt updated','{\"sectionKey\":\"scope-of-work\",\"changes\":[\"Section completed\",\"completedAt updated\"]}',NULL,'2026-03-18 07:08:38.810578'),('dd759f25-0616-4755-9564-7f5e84585dd7','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','updated','Section \"Project Details\": contentJson updated','{\"sectionKey\":\"project-details\",\"changes\":[\"contentJson updated\"]}',NULL,'2026-03-24 13:09:12.869930'),('ddfcd993-0f34-402c-b649-b5c5d31a296b','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','updated','Section \"CEO Letter\": contentJson updated','{\"sectionKey\":\"ceo-letter\",\"changes\":[\"contentJson updated\"]}',NULL,'2026-03-17 18:09:44.657147'),('e0b71796-a322-487d-b7aa-c64e51783f64','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','timeline_updated','Timeline updated — 5 stages, 0 activities',NULL,NULL,'2026-03-24 11:53:18.078166'),('ec520182-aaf5-4516-bdfa-755dcf55d9ca','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','updated','Section \"Scope of Work\": Minor update','{\"sectionKey\":\"scope-of-work\",\"changes\":[\"Minor update\"]}',NULL,'2026-03-18 06:04:35.652544'),('f768fba9-748a-4f80-a48c-022cdda133de','8c98cc6a-f884-4ce9-90ee-49f96086a760','durgapx2020@email.iimcal.ac.in','durgapx2020@email.iimcal.ac.in','timeline_updated','Timeline updated — 5 stages, 0 activities',NULL,NULL,'2026-03-16 19:26:38.963105'),('fdcdbba5-2739-4065-8775-4242494429b2','8c98cc6a-f884-4ce9-90ee-49f96086a760','dmp@gmail.com','dmp@gmail.com','created','Proposal \"AAAwqdwqdwq\" created via scratch method',NULL,'{\"id\":\"8c98cc6a-f884-4ce9-90ee-49f96086a760\",\"name\":\"AAAwqdwqdwq\",\"client\":\"AAAA\"}','2026-03-16 18:31:42.191502'),('ff48146c-2bdb-467f-b415-95c30d31019a','8c98cc6a-f884-4ce9-90ee-49f96086a760','durga@gmail.com','durga@gmail.com','updated','Section \"Scope of Work\": Section reopened; completedBy updated; completedAt updated','{\"sectionKey\":\"scope-of-work\",\"changes\":[\"Section reopened\",\"completedBy updated\",\"completedAt updated\"]}',NULL,'2026-03-17 18:14:47.322134');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comments`
--

DROP TABLE IF EXISTS `comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comments` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `proposal_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `section_key` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_role` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_ab5aa7f1b50c3d087574a67bb1` (`section_key`),
  KEY `IDX_5fdbb8267cecb08f138f2530ce` (`proposal_id`),
  CONSTRAINT `FK_5fdbb8267cecb08f138f2530ce2` FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comments`
--

LOCK TABLES `comments` WRITE;
/*!40000 ALTER TABLE `comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cost_items`
--

DROP TABLE IF EXISTS `cost_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cost_items` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `proposal_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` float NOT NULL DEFAULT '1',
  `service_rate` float NOT NULL DEFAULT '0',
  `material_rate` float NOT NULL DEFAULT '0',
  `outsourcing_rate` float NOT NULL DEFAULT '0',
  `total_cost` float NOT NULL DEFAULT '0',
  `stage` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_binding` tinyint NOT NULL DEFAULT '1',
  `is_fixed_rate` tinyint NOT NULL DEFAULT '0',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_00cc55c23a99819d698b07c2e1` (`stage`),
  KEY `IDX_212a7cbcc03589854f12da4829` (`proposal_id`),
  CONSTRAINT `FK_212a7cbcc03589854f12da4829e` FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cost_items`
--

LOCK TABLES `cost_items` WRITE;
/*!40000 ALTER TABLE `cost_items` DISABLE KEYS */;
INSERT INTO `cost_items` VALUES ('0068c299-ab5a-42f6-8d07-33e2751eec30','8c98cc6a-f884-4ce9-90ee-49f96086a760','Material','cell culture material',117,0,10000,0,1170000,'stage 1',1,0,0,'durga@gmail.com','durga@gmail.com','2026-03-24 12:07:44.521256','2026-03-24 12:07:44.521256'),('29dc9158-b723-47a7-83ae-f13d182c611c','8c98cc6a-f884-4ce9-90ee-49f96086a760','Service','sieve',20,1000,0,0,20000,'stage',1,0,1,'durga@gmail.com','durga@gmail.com','2026-03-24 12:07:44.522919','2026-03-24 12:07:44.522919');
/*!40000 ALTER TABLE `cost_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exported_files`
--

DROP TABLE IF EXISTS `exported_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exported_files` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `proposal_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `filename` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `format` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_url` text COLLATE utf8mb4_unicode_ci,
  `file_size` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `exported_by` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `exported_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_aa92a3206ebd6d3f702a40794f` (`proposal_id`),
  CONSTRAINT `FK_aa92a3206ebd6d3f702a40794f2` FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exported_files`
--

LOCK TABLES `exported_files` WRITE;
/*!40000 ALTER TABLE `exported_files` DISABLE KEYS */;
INSERT INTO `exported_files` VALUES ('1fd21b05-d530-4bb1-adbe-2f0102808e8a','8c98cc6a-f884-4ce9-90ee-49f96086a760','PROP-2025-001-1774354991600.docx','docx','exports\\PROP-2025-001-1774354991600.docx',NULL,'dmp@gmail.com','2026-03-24 12:23:11.638099');
/*!40000 ALTER TABLE `exported_files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_activities`
--

DROP TABLE IF EXISTS `project_activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_activities` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `proposal_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stage_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `end_date` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration_days` int NOT NULL DEFAULT '0',
  `progress` int NOT NULL DEFAULT '0',
  `assignee` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phase` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'bg-blue-500',
  `sort_order` int NOT NULL DEFAULT '0',
  `dependencies_json` text COLLATE utf8mb4_unicode_ci,
  `created_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_1bfed9f5efb2fe4050bee64bea` (`stage_id`),
  KEY `IDX_75bc5da5c4c80401e48667b40f` (`proposal_id`),
  CONSTRAINT `FK_1bfed9f5efb2fe4050bee64bea0` FOREIGN KEY (`stage_id`) REFERENCES `project_stages` (`id`) ON DELETE SET NULL,
  CONSTRAINT `FK_75bc5da5c4c80401e48667b40f1` FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_activities`
--

LOCK TABLES `project_activities` WRITE;
/*!40000 ALTER TABLE `project_activities` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_activities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_stages`
--

DROP TABLE IF EXISTS `project_stages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_stages` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `proposal_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `end_date` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration_days` int NOT NULL DEFAULT '0',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_c8ea3637e10ee653aec8967899` (`proposal_id`),
  CONSTRAINT `FK_c8ea3637e10ee653aec8967899a` FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_stages`
--

LOCK TABLES `project_stages` WRITE;
/*!40000 ALTER TABLE `project_stages` DISABLE KEYS */;
INSERT INTO `project_stages` VALUES ('165fd0f1-9ed2-4242-afd6-5abc9067e206','8c98cc6a-f884-4ce9-90ee-49f96086a760','New Stage','2026-03-17','2026-03-17',0,4,'durga@gmail.com','durga@gmail.com','2026-03-24 11:53:18.071212','2026-03-24 11:53:18.071212'),('6b77fd42-ed3a-4da5-a8a8-e3a67a3985e8','8c98cc6a-f884-4ce9-90ee-49f96086a760','New Stage','2026-03-17','2026-03-17',0,0,'durga@gmail.com','durga@gmail.com','2026-03-24 11:53:18.063506','2026-03-24 11:53:18.063506'),('ced25456-be26-4c96-8a01-1074d7f4c99a','8c98cc6a-f884-4ce9-90ee-49f96086a760','New Stage','2026-03-17','2026-03-17',0,3,'durga@gmail.com','durga@gmail.com','2026-03-24 11:53:18.069634','2026-03-24 11:53:18.069634'),('dde58124-7140-455d-b38b-9994aa755d42','8c98cc6a-f884-4ce9-90ee-49f96086a760','New Stage','2026-03-17','2026-03-17',0,2,'durga@gmail.com','durga@gmail.com','2026-03-24 11:53:18.067767','2026-03-24 11:53:18.067767'),('eb06865d-d9bd-4bcd-b20e-e964ee920017','8c98cc6a-f884-4ce9-90ee-49f96086a760','New Stage','2026-03-17','2026-03-17',0,1,'durga@gmail.com','durga@gmail.com','2026-03-24 11:53:18.066116','2026-03-24 11:53:18.066116');
/*!40000 ALTER TABLE `project_stages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `proposal_sections`
--

DROP TABLE IF EXISTS `proposal_sections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `proposal_sections` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `proposal_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `section_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contentJson` text COLLATE utf8mb4_unicode_ci,
  `is_complete` tinyint NOT NULL DEFAULT '0',
  `is_locked` tinyint NOT NULL DEFAULT '0',
  `completed_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `completed_at` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `locked_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `created_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_c2cac3c6804bc2b639f9d51ba3` (`proposal_id`,`section_key`),
  CONSTRAINT `FK_42e6670e1997138fc85c4630c85` FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proposal_sections`
--

LOCK TABLES `proposal_sections` WRITE;
/*!40000 ALTER TABLE `proposal_sections` DISABLE KEYS */;
INSERT INTO `proposal_sections` VALUES ('01200ff6-9876-443c-a5ee-da2c2e3fb197','4545e3b9-0a0f-46b3-b5ab-23a0bf24f379','executive-summary','Executive Summary','{}',0,0,NULL,NULL,NULL,1,'durga@gmail.com','durga@gmail.com','2026-03-17 07:23:43.815458','2026-03-17 07:23:43.815458'),('03d8e7dc-5b69-4293-9e9f-8542ba49e0f3','8c98cc6a-f884-4ce9-90ee-49f96086a760','ceo-letter','CEO Letter','{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"Dear Members of the AAwqdwqdwq Team,,\"},{\"type\":\"hardBreak\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"It is with great enthusiasm and a deep sense of responsibility that I write to you regarding the development of your monoclonal antibody candidate. At AAwqdwqdwq, we recognize that the transition from early-stage discovery to a robust, scalable manufacturing platform is the defining challenge of modern biologics development. Our primary focus for this project is to deliver a solution that seamlessly integrates transient expression strategies with strict Good Manufacturing Practice (GMP) compliance, ensuring that your product meets the highest global standards from day one.\"},{\"type\":\"hardBreak\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"Our organization possesses specialized expertise in the process scaleup of monoclonal antibodies, a critical skill set that allows us to navigate the complex biological and engineering variables inherent to these therapeutics. We understand that successful scaleup is not merely about increasing volume; it is about maintaining product quality, consistency, and purity while adhering to rigorous regulatory expectations. Our team brings a proven track record of optimizing transient expression systems to maximize yield and titer without compromising the integrity of the final product, a capability that is essential for your specific therapeutic profile.\"},{\"type\":\"hardBreak\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"We are fully committed to executing this project with unwavering precision and scientific rigor. Our approach combines advanced process analytics with a culture of continuous improvement, ensuring that every step of your scaleup journey is data-driven and compliant. We are confident in our ability to partner closely with AAwqdwqdwq to deliver a manufacturing process that is not only technically sound but also economically viable and ready for commercialization.\"},{\"type\":\"hardBreak\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"Thank you for the opportunity to discuss this pivotal phase of your program. We look forward to collaborating with you to bring your monoclonal antibody to market safely and effectively.\"},{\"type\":\"hardBreak\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"Sincerely,\"},{\"type\":\"hardBreak\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"CEO\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"AAwqdwqdwq\"}]}]}',1,0,'durga@gmail.com','2026-03-18T07:10:35.873Z',NULL,0,'dmp@gmail.com','durga@gmail.com','2026-03-16 18:31:42.125038','2026-03-24 12:08:10.000000'),('0748bce5-8d75-4f80-9ae4-5102230fe368','8c98cc6a-f884-4ce9-90ee-49f96086a760','executive-summary','Executive Summary','{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"This proposal outlines the end-to-end development, GMP qualification, and process validation of a monoclonal antibody synthesis process, integrating upstream cell culture with downstream purification and analytical characterization. Our approach delivers a fully qualified, validated, and scale-ready manufacturing process, supported by a comprehensive batch record set and a validated analytical method suite compliant with ICH Q6B guidelines. The project is executed across four distinct phases: Phase I focuses on cell culture system design and qualification, including equipment DQ/IQ/OQ, medium characterization, and cell line profiling; Phase II develops and qualifies the downstream purification train to ensure the removal of host cell proteins, DNA, and endotoxins; Phase III executes the critical Three-Batch (IQ/OQ/PQ) process validation campaign under GMP conditions with real-time data capture; and Phase IV consolidates all data to generate the final Validation Master Plan, Risk Assessment (FMEA), and Validation Summary Report.\\n\\nKey deliverables include finalized upstream and downstream protocols, cell bank qualification reports demonstrating >10^7 viable cells/mL, and a complete analytical characterization report covering identity, purity, potency, and Critical Quality Attributes (CQAs). We will also provide a full validation master plan, execution of the three-batch PQ sequence, and a risk assessment report identifying potential failure modes and mitigation strategies, alongside comprehensive training and qualification records for personnel. Success is defined by the timely delivery of three consecutive GMP batches meeting strict acceptance criteria: >80% theoretical yield, host cell protein <50 ppm, DNA <10 pg/mL, and endotoxin <5 EU/mL. The project is considered complete upon formal sign-off of the Validation Summary Report by the client\'s Quality Assurance representative.\\n\\nThe engagement assumes the client will provide a defined cell line with known characteristics, including preliminary growth curves and isotype information. We operate on the premise that the client\'s GMP-compliant facility possesses a validated stainless steel bioreactor (500L–2000L) and chromatography platform, which will be qualified to our standards prior to commencement. The client is responsible for supplying all raw materials, media, buffers, and resins, ensuring compliance with relevant pharmacopoeia standards, while all data will be managed within a compliant Electronic Data Capture (EDC) system. Explicitly excluded from this scope are primary cell line generation, hybridoma synthesis, regulatory filing submissions, clinical supply manufacturing, hardware installation beyond existing capabilities, troubleshooting of failures caused by non-compliant client inputs, and optimization for non-macroscale volumes.\"}]}]}',1,0,'durgapx2020@email.iimcal.ac.in','2026-03-16T19:27:36.495Z',NULL,1,'dmp@gmail.com','durga@gmail.com','2026-03-16 18:31:42.140193','2026-03-17 10:15:16.000000'),('6ae888b8-50e0-433a-bcc7-c10f9831fb47','8c98cc6a-f884-4ce9-90ee-49f96086a760','project-details','Project Details','{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"**Project Scope and Technical Approach: End-to-End Monoclonal Antibody Process Development and GMP Qualification**\"},{\"type\":\"hardBreak\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"The proposed project for monoclonal antibody (mAb) expression and scale-up to a 1,500-liter (KL) bioreactor will be executed in strict adherence to ICH Q7, Q9, Q10, Q11, and Q12 guidelines, alongside USP <1079> and <1241> standards for biological products. The core methodology integrates a risk-based approach to scale-up, utilizing a cell line characterization phase followed by a multi-stage scale-up strategy that transitions from bench-scale (5–20 L) to pilot-scale (100–500 L) before finalizing the 1,500 KL production run. This phased progression ensures that critical process parameters (CPPs) and critical quality attributes (CQAs) are defined and optimized early, minimizing variability and regulatory risk during the transition to commercial scale.\"},{\"type\":\"hardBreak\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"Key activities will encompass comprehensive cell line characterization, including GMP-grade cryopreservation, viability assessment, and growth kinetics analysis across varying oxygen transfer rates (OTR) and pH profiles. Subsequent phases involve the execution of pilot-scale campaigns to model scale-up factors such as shear stress, oxygen availability, and nutrient depletion, utilizing computational modeling to predict performance at the 1,500 KL scale. These activities include media optimization for maximal specific growth rate and product titer, process control strategy definition, and the implementation of a robust sampling and data integrity framework compliant with ALCOA+ principles.\"},{\"type\":\"hardBreak\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"The project timeline is structured into distinct milestones to ensure timely delivery and regulatory readiness. Milestone 1 involves the completion of cell line characterization and the establishment of GMP master and working cell banks, expected within six weeks of initiation. Milestone 2 covers the successful execution of three consecutive pilot-scale runs demonstrating consistent yield and robustness, to be achieved by week 14. Milestone 3 marks the design and commissioning of the 1,500 KL production facility, including utility validation and computerized system qualification (CSVQ), scheduled for week 20. The final milestone, Week 26, entails the execution of the first commercial GMP batch at 1,500 KL, followed by the completion of in-process controls (IPC) and release testing to verify product identity, purity, and potency.\"},{\"type\":\"hardBreak\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"Our technical approach leverages advanced bioprocess engineering techniques, including real-time monitoring via near-infrared (NIR) spectroscopy and advanced process control (APC) systems to maintain product quality during fermentation. We will employ a top-down approach to define the process model, integrating upstream and downstream parameters to ensure optimal protein folding and glycosylation patterns, which are critical for the immunogenicity and efficacy of the monoclonal antibody. Quality control is embedded throughout the lifecycle, utilizing a risk-based quality management system (RBQMS) to proactively identify and mitigate potential deviations. This includes rigorous validation of analytical methods per ICH Q2(R1) guidelines and adherence to GMP documentation requirements for batch records, equipment qualification (DQ/IQ/OQ/PQ), and change control management.\"},{\"type\":\"hardBreak\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"The project team structure is organized around a cross-functional Biologics Development Unit, comprising a Principal Scientist leading the project, supported by a Process Development Engineer, a Quality Assurance Manager, and specialized technical staff in cell biology and analytical chemistry. The Principal Scientist will oversee the overall strategy and regulatory interactions, while the Process Development Engineer will manage the scale-up modeling and execution. The QA Manager ensures continuous compliance with GMP standards and manages the quality management system, and the analytical specialists will handle the characterization and release testing. This collaborative structure facilitates seamless communication between R&D, manufacturing, and quality functions, ensuring that the final 1,500 KL production campaign meets all specified quality and performance criteria.\"}]}]}',1,0,'durgapx2020@email.iimcal.ac.in','2026-03-16T19:27:40.493Z',NULL,3,'dmp@gmail.com','durga@gmail.com','2026-03-16 18:31:42.168606','2026-03-24 13:09:19.000000'),('71629192-cd91-4389-984b-08f9d20de137','4545e3b9-0a0f-46b3-b5ab-23a0bf24f379','scope-of-work','Scope of Work','{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"The Scope of Work encompasses the end-to-end technical execution, regulatory compliance, and documentation delivery for the GMP-scale production of the monoclonal antibody candidate at a volume of 1,500 KL. The engagement will transition the process from pilot-scale optimization to commercial batch manufacturing, ensuring full adherence to ICH Q7, WHO TRS 974, and FDA 21 CFR Part 210 and 211 regulations. The scope includes the detailed design and validation of the bioreactor system, cell culture process development, harvest and purification operations, virus clearance validation, and the preparation of the complete Master Manufacturing Record (MMR) and Batch Production Record (BPR) sets. All activities will be executed in accordance with the agreed-upon Standard Operating Procedures (SOPs) and will strictly follow the defined Critical Quality Attributes (CQAs) and Critical Process Parameters (CPPs) established during the pre-engagement phase. The deliverables include the final validated manufacturing data, Certificate of Analysis (CoA) templates, Stability Study protocols, and the FDA Form 483 response package, culminating in the submission of the Certificate of Completion (CoC) confirming the successful execution of three consecutive successful commercial batches. Exclusions from this scope explicitly cover clinical trial supply chain logistics, post-market surveillance activities, regulatory filing submissions to the FDA or EMA (which are the Client\'s responsibility), and the development of non-GMP exploratory research studies. The Client assumes full responsibility for providing the validated master cell bank (MCB), raw materials, and necessary regulatory correspondence. Success in this engagement is measured by the on-time delivery of three consecutive validated commercial batches meeting all pre-defined CQAs, the zero occurrence of FDA 483 observations during the audit phase, and the full sign-off of the final MMR and BPR sets by the Client\'s Quality Assurance and Regulatory teams within the defined project timeline.The Scope of Work encompasses the end-to-end scale-up of a novel monoclonal antibody from the final development process to commercial manufacturing capacity of 1,500 kg per year, executed in strict adherence to FDA regulations and current Good Manufacturing Practice (cGMP) standards. This engagement includes the transfer of critical process parameters from the pilot scale facility to the commercial site, ensuring process robustness, product quality, and regulatory compliance. The scope specifically covers the design and validation of the manufacturing process, including the selection and qualification of Critical Process Parameters (CPPs) and Critical Quality Attributes (CQAs) for the monoclonal antibody, the optimization of the upstream cell culture process to achieve target productivity and titer, and the validation of the downstream purification train (chromatography, filtration, and viral clearance steps). Deliverables will include the complete Master Batch Record, standard operating procedures (SOPs), risk assessment reports based on FMEA and Ishikawa diagrams, and a comprehensive validation master plan executed in compliance with 21 CFR Part 211 and 211.10. The team is responsible for generating all necessary regulatory documentation, including the Clinical Trial Application (CTA) or CMC summary for the FDA, stability protocols, and the final Validation Report. Work exclusions strictly limit the engagement to the defined monoclonal antibody process; activities related to the synthesis of the antibody, formulation development prior to the defined pilot data, or non-GMP scale-up activities are excluded. The project assumes that the client provides all necessary pilot-scale process data, cell line bank certificates, and validated analytical methods, and that the commercial site is pre-qualified and ready for process execution. Success will be measured by the timely delivery of the validated commercial process and documentation package, achieving a manufacturing yield consistent with pilot data, passing all regulatory inspections without observations, and maintaining product potency and purity within specified limits over the stability study period.\"}]}]}',0,0,NULL,NULL,NULL,2,'durga@gmail.com','durga@gmail.com','2026-03-17 07:23:43.827190','2026-03-23 18:04:30.000000'),('88bcb767-f7fb-43bd-819b-d35c6da07a19','8c98cc6a-f884-4ce9-90ee-49f96086a760','scope-of-work','Scope of Work','{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"--**Scope of Work: Monoclonal Antibody Expression, Cell Culture, Scale-Up, and GMP Compliance**--\"},{\"type\":\"hardBreak\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"The service provider shall execute a comprehensive analytical and manufacturing support program focused on the development, characterization, and GMP-compliant production of monoclonal antibodies (mAbs). The scope encompasses the end-to-end lifecycle of the mAb candidate, from expression system optimization through large-scale GMP cell culture and purification, with a specific emphasis on analytical validation of critical quality attributes (CQAs).\"},{\"type\":\"hardBreak\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"**Specific Deliverables**\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"The Service Provider shall deliver the following tangible outputs:\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"1.  **Process Development Report:** A detailed technical document outlining the optimization of the expression system (e.g., CHO, HEK293), including cell line characterization, media formulation, and fed-batch parameters derived from pilot-scale data.\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"2.  **Analytical Characterization Package:** A validated suite of assays and methods for protein expression analysis, including SDS-PAGE/Western blotting, SEC-HPLC for aggregation assessment, and Capillary Electrophoresis (CE-SDS) for charge variants. The provider must demonstrate method validation (specificity, accuracy, precision, linearity, and range) per ICH Q2(R1) guidelines.\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"3.  **GMP Batch Manufacturing Record:** A fully executed GMP batch record for at least one pilot scale (e.g., 200L or 500L bioreactor), including raw material certificates of analysis (CoA), process control charts, and in-process testing results.\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"4.  **Release Specification:** A finalized, validated release specification document for the mAb product, including impurity limits for host cell proteins (HCP), DNA, endotoxins, and product-related aggregates, aligned with ICH Q6B.\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"5.  **Regulatory Documentation:** A draft Common Technical Document (CTD) Module 3 (Summary of Characteristics) and Module 5 (Quality) summary, tailored for submission to relevant regulatory authorities.\"},{\"type\":\"hardBreak\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"**Work Breakdown**\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"The work shall be executed across four distinct phases:\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"*   **Phase I: Expression System Optimization and Analytical Method Development:** This phase involves screening and selecting the optimal expression host, performing high-throughput screening for titer and glycosylation profiles, and developing robust analytical methods for early-stage process monitoring. The provider shall integrate real-time monitoring tools (e.g., off-line UV, refractometry) to correlate process parameters with product quality.\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"*   **Phase II: Pilot-Scale Cell Culture and Scale-Up:** The provider shall execute scale-up studies from shake flask to pilot bioreactors (up to 500L), optimizing oxygen transfer rates (OTR), mixing, and feeding strategies to maintain consistent product quality across scales. This includes establishing cell banking protocols (master and working seed) and performing full process validation runs under GMP conditions.\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"*   **Phase III: Downstream Processing and Purification:** The scope includes the design and execution of a chromatographic purification train (e.g., Protein A, ion exchange, polishing steps) optimized for yield and recovery. The provider shall perform analytical monitoring of the eluate and pool fractions to ensure the removal of viral vectors, HCPs, and host DNA while maintaining product integrity.\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"*   **Phase IV: GMP Manufacturing and Analytical Validation:** This final phase involves the execution of a GMP-compliant manufacturing run with full process validation. Concurrently, the provider shall perform comprehensive release testing in a validated analytical laboratory, ensuring all CQAs meet pre-defined acceptance criteria.\"},{\"type\":\"hardBreak\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"**Exclusions**\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"The following items are explicitly excluded from this Scope of Work and shall be sourced by the Client (AAAA) or handled by other third parties:\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"*   Synthesis of novel monoclonal antibody sequences (cloning) or the provision of proprietary cell lines not provided by AAAA.\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"*   Upstream cell line development, including primary cell isolation and initial cell line development, unless explicitly requested as a separate addendum.\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"*   Clinical trial execution, patient recruitment, or clinical site management.\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"*   Final product filling, labeling, and final packaging (unless specified as a separate contract line item).\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"*   Regulatory filing submissions (e.g., IND/BLA) beyond the drafting of technical quality modules; regulatory strategy and interaction management are excluded.\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"*   Third-party vendor management for critical raw materials (e.g., media, buffers, chromatography media) unless AAAA has pre-approved a specific vendor list.\"},{\"type\":\"hardBreak\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"**Assumptions**\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"The Service Provider operates under the following assumptions:\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"*   AAAA shall provide all necessary regulatory approvals, including any required Investigational New Drug (IND) or Biologics License Application (BLA) authorizations prior to the initiation of GMP manufacturing.\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"*   All raw materials, reagents, and consumables required for the process shall be supplied by AAAA or approved vendors, with the Service Provider responsible for verifying compliance with GMP standards.\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"*   The expression system and cell line are characterized and qualified to the Service Provider\'s satisfaction prior to the commencement of Phase II.\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"*   Site-specific utilities (water, gases, power) at the manufacturing facility shall meet the utility requirements specified in the facility design qualification documents.\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"*   Any deviations from the approved process parameters or release specifications shall be reported by AAAA in writing within 24 hours of detection, triggering a deviation management workflow.\"},{\"type\":\"hardBreak\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"**Success Criteria**\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"The project shall be considered successful upon the achievement of the following milestones:\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"1.  **Method Validation:** All analytical methods developed in Phase I achieve full validation status with a validation score of 100%, demonstrating zero critical failures in accuracy, precision, or robustness testing.\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"2.  **Process Consistency:** The pilot-scale culture runs (Phase II) demonstrate a coefficient of variation (CV) for titer and yield of no greater than 10% compared to the reference run, with no unexplained anomalies in product glycosylation profiles.\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"3.  **Quality Attributes:** The GMP manufactured product meets or exceeds all pre-defined Critical Quality Attributes (CQAs), specifically achieving HCP < 10 ppm, DNA < 1 pg/reaction, and endotoxin < 1.0 EU/mL, with no out-of-specification (OOS) results in the release testing.\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"4.  **Documentation:** All batch records, validation protocols, and analytical reports are completed, signed off, and archived in compliance with GMP and GLP regulations within 15 working days post-batch completion.\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"5.  **Timelines:** All deliverables specified in the project plan are submitted by their respective due dates, with no critical path delays attributable to the Service Provider.\"}]}]}',1,0,'durga@gmail.com','2026-03-18T07:08:38.790Z','durga@gmail.com',2,'dmp@gmail.com','durga@gmail.com','2026-03-16 18:31:42.156120','2026-03-18 07:08:38.000000'),('95c5061c-8c6c-4451-8879-c2ae9f1b3e77','8c98cc6a-f884-4ce9-90ee-49f96086a760','terms-conditions','Terms & Conditions','{}',1,0,'durgapx2020@email.iimcal.ac.in','2026-03-16T19:27:42.974Z',NULL,4,'dmp@gmail.com','durgapx2020@email.iimcal.ac.in','2026-03-16 18:31:42.180431','2026-03-16 19:27:42.000000'),('cc87ce9a-e2ab-4160-adc6-b98c64e69523','4545e3b9-0a0f-46b3-b5ab-23a0bf24f379','project-details','Project Details','{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"The project execution for the Novartis monoclonal antibody scale-up to 1,500 KL will adhere to a rigorous, risk-based methodology grounded in ICH Q5E, Q8, Q9, and Q10 guidelines, ensuring full compliance with FDA regulations and cGMP standards. The technical approach centers on a validated cell line expansion strategy utilizing a high-yield CHO-K1 or CHO-S1001 host cell line, selected based on the specific antibody\'s glycosylation profile and growth kinetics. The manufacturing process will be executed in a tiered scale-up sequence, transitioning from pilot-scale bioreactors (50–100 L) to the final 1,500 KL production capacity, with critical process parameters (CPPs) such as dissolved oxygen, pH, temperature, and feed rates optimized to maintain product quality attributes (CQAs) including aggregation levels, charge variants, and glycosylation patterns. To ensure GMP compliance, all operations will occur within designated Aseptic Manufacturing Areas (Class A zones) connected to cleanroom environments (Class B and C), utilizing continuous monitoring systems integrated with a Computerized Manufacturing Execution System (MES) to enforce real-time data integrity and automated deviation management.\\n\\nKey activities will encompass the comprehensive development of the Process Validation Master Plan (PVMP), the execution of three consecutive batches at pilot scale to establish robust process parameters, and the finalization of the Master Cell Bank (MCB) and Working Cell Bank (WCB) with full characterization data. Concurrently, the Quality Unit will oversee the development of the Control Strategy, defining acceptance criteria for impurities, host cell proteins (HCP), DNA, and endotoxins in alignment with USP <1215> and <1216> standards. The team structure will be organized into three specialized functional groups: a Manufacturing Operations Lead responsible for reactor engineering and process control, a Quality Assurance and Control Lead managing compliance and analytical validation, and a Regulatory Affairs Specialist dedicated to FDA submission coordination and documentation generation. This cross-functional collaboration ensures that all critical quality attributes are monitored and controlled throughout the lifecycle of the scale-up.\\n\\nMilestones for the project are structured to deliver a ready-for-production state within the defined timeline. The initial phase focuses on site readiness and regulatory filing, culminating in the receipt of FDA Form 483 or similar correspondence if applicable, followed by the initiation of pilot-scale campaigns. The mid-phase involves the successful completion of three consecutive pilot-scale runs with zero deviations and the generation of comparative data against the reference product. The final phase includes the full-scale validation runs, the submission of the Complete Biologics License Application (CBLA) components for the 1,500 KL capacity, and the issuance of the FDA Inspection Report (Form 1500) confirming cGMP compliance. Throughout these phases, strict adherence to data integrity principles (ALCOA+) and the use of validated analytical methods will ensure that the final product meets all specifications required for commercial release.\"}]}]}',0,0,NULL,NULL,NULL,3,'durga@gmail.com','durga@gmail.com','2026-03-17 07:23:43.836327','2026-03-23 18:04:55.000000'),('ee7bc655-3da6-4728-98d6-b34c42bbe6c9','4545e3b9-0a0f-46b3-b5ab-23a0bf24f379','ceo-letter','CEO Letter','{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":null},\"content\":[{\"type\":\"text\",\"text\":\"Dear Novartis Leadership Team,\\n\\nIt is with great enthusiasm and a deep sense of partnership that we submit this proposal to support your Biologics business unit in advancing your monoclonal antibody program. At our organization, we understand that a successful biologics campaign hinges not only on scientific excellence but on the seamless integration of robust manufacturing capabilities and unwavering regulatory compliance. Our commitment to Novartis stems from our shared vision of translating innovative therapies into tangible patient outcomes, a mission we are uniquely positioned to fulfill through our dedicated expertise in complex biologic development.\\n\\nWe recognize the critical nature of scaling your monoclonal antibody production to 1500 KL, a milestone that requires a level of precision and control rarely matched in the industry. Our facility is specifically engineered to handle this volume without compromising the integrity of your product. We have developed a tailored scale-up strategy that addresses your specific process parameters, ensuring a smooth transition from pilot to commercial manufacturing while maintaining strict GMP compliance throughout every stage. Our integrated quality management system is designed to proactively mitigate risks, ensuring that your supply chain remains resilient and reliable.\\n\\nFurthermore, we understand the immense importance of aligning your manufacturing outputs with FDA documentation standards. Our team of experienced regulatory specialists is fully prepared to generate comprehensive, audit-ready documentation that reflects the highest standards of Good Manufacturing Practice. From batch record generation and stability protocols to full-scale regulatory filings, we ensure that every document serves as a testament to your product\'s quality and safety, facilitating a streamlined regulatory pathway for your monoclonal antibody.\\n\\nWe are confident that our collaborative approach, backed by our technical prowess and regulatory rigor, will enable Novartis to accelerate its pipeline with speed and certainty. We look forward to partnering with you to bring this transformative therapy to market.\\n\\nSincerely,\\n\\nThe CEO\\n[Your Organization Name]\"}]}]}',0,0,'durga@gmail.com','2026-03-23T18:06:41.629Z',NULL,0,'durga@gmail.com','durga@gmail.com','2026-03-17 07:23:43.803147','2026-03-23 18:06:42.000000'),('f6cea9d3-96c8-4184-a3e7-360f9b40519e','4545e3b9-0a0f-46b3-b5ab-23a0bf24f379','terms-conditions','Terms & Conditions','{}',0,0,NULL,NULL,NULL,4,'durga@gmail.com','durga@gmail.com','2026-03-17 07:23:43.846081','2026-03-17 07:23:43.846081');
/*!40000 ALTER TABLE `proposal_sections` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `proposals`
--

DROP TABLE IF EXISTS `proposals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `proposals` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bd_manager` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `proposal_manager` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `proposal_code` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Draft',
  `method` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `business_unit` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `template_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `current_stage` int NOT NULL DEFAULT '1',
  `completion_percentage` int NOT NULL DEFAULT '0',
  `sfdc_opportunity_code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pm_review_complete` tinyint NOT NULL DEFAULT '0',
  `management_review_complete` tinyint NOT NULL DEFAULT '0',
  `is_amendment` tinyint NOT NULL DEFAULT '0',
  `parent_proposal_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parent_proposal_code` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `revision_number` int DEFAULT NULL,
  `amendment_date` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assigned_stakeholders` text COLLATE utf8mb4_unicode_ci,
  `created_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_5cae6a43be3cd69c354b438bcb` (`proposal_code`),
  KEY `IDX_e3a6c800f9a01f3c5c71f624a0` (`created_at`),
  KEY `IDX_6c3597cd3093a2e6e30db17814` (`current_stage`),
  KEY `IDX_09d2319018bf917d600ba742c5` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proposals`
--

LOCK TABLES `proposals` WRITE;
/*!40000 ALTER TABLE `proposals` DISABLE KEYS */;
INSERT INTO `proposals` VALUES ('4545e3b9-0a0f-46b3-b5ab-23a0bf24f379','Novartis ','Novartis','hari@gmail.com','durga@gmail.com','NOV-2026-001','Draft','template','Biologics','Biologics DS','monoclonal antibody',1,0,'NPV-2025-721',0,0,0,NULL,NULL,NULL,NULL,'[\"hari@gmail.com\",\"akshaya@gmail.com\",\"sandhya@gmail.com\"]','durga@gmail.com','durga@gmail.com','2026-03-17 07:23:43.766922','2026-03-17 07:23:43.766922'),('8c98cc6a-f884-4ce9-90ee-49f96086a760','AAAwqdwqdwq','AAAA','hari@gmail.com','dmp@gmail.com','PROP-2025-001','Review','scratch','Analytical','Biologics DS','sadadwe',2,75,'AAAA-007',0,0,0,NULL,NULL,NULL,NULL,'[\"sandhya@gmail.com\",\"harish@gmail.com\"]','dmp@gmail.com','durgapx2020@email.iimcal.ac.in','2026-03-16 18:31:42.090281','2026-03-16 19:27:50.000000');
/*!40000 ALTER TABLE `proposals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `templates`
--

DROP TABLE IF EXISTS `templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `templates` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `business_unit` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `sections_json` text COLLATE utf8mb4_unicode_ci,
  `is_system` tinyint NOT NULL DEFAULT '0',
  `created_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `templates`
--

LOCK TABLES `templates` WRITE;
/*!40000 ALTER TABLE `templates` DISABLE KEYS */;
INSERT INTO `templates` VALUES ('2b173f26-152b-4ecc-b0e8-b30899ee275d','Biologics Drug Product (DP)','Biologics','Biologics DP','Template for fill-finish and drug product manufacturing proposals','[{\"sectionKey\":\"ceo_letter\",\"title\":\"CEO Letter\",\"sortOrder\":0,\"defaultContent\":{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"\"}]}]}},{\"sectionKey\":\"executive_summary\",\"title\":\"Executive Summary\",\"sortOrder\":1,\"defaultContent\":{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"\"}]}]}},{\"sectionKey\":\"scope_of_work\",\"title\":\"Scope of Work\",\"sortOrder\":2,\"defaultContent\":{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"\"}]}]}},{\"sectionKey\":\"project_details\",\"title\":\"Project Details\",\"sortOrder\":3,\"defaultContent\":{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"\"}]}]}},{\"sectionKey\":\"terms_conditions\",\"title\":\"Terms & Conditions\",\"sortOrder\":4,\"defaultContent\":{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"\"}]}]}}]',1,'system','2026-03-16 18:20:59.763832','2026-03-16 18:20:59.763832'),('70750db2-671b-4e5c-b2ad-2d253e4620b1','Analytical Services','Analytical','Analytical Only','Template for analytical testing and characterization proposals','[{\"sectionKey\":\"ceo_letter\",\"title\":\"CEO Letter\",\"sortOrder\":0,\"defaultContent\":{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"\"}]}]}},{\"sectionKey\":\"executive_summary\",\"title\":\"Executive Summary\",\"sortOrder\":1,\"defaultContent\":{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"\"}]}]}},{\"sectionKey\":\"scope_of_work\",\"title\":\"Scope of Work\",\"sortOrder\":2,\"defaultContent\":{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"\"}]}]}},{\"sectionKey\":\"terms_conditions\",\"title\":\"Terms & Conditions\",\"sortOrder\":4,\"defaultContent\":{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"\"}]}]}}]',1,'system','2026-03-16 18:20:59.774260','2026-03-16 18:20:59.774260'),('aa361723-17ca-499d-a5fb-81dee29b37db','Biologics Drug Substance (DS)','Biologics','Biologics DS','Standard proposal template for mAb/recombinant protein drug substance manufacturing','[{\"sectionKey\":\"ceo_letter\",\"title\":\"CEO Letter\",\"sortOrder\":0,\"defaultContent\":{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"Dear [Client Name],\"}]},{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"We are pleased to present this proposal for [Project Name]...\"}]}]}},{\"sectionKey\":\"executive_summary\",\"title\":\"Executive Summary\",\"sortOrder\":1,\"defaultContent\":{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"This proposal outlines our approach to [Project Name]...\"}]}]}},{\"sectionKey\":\"scope_of_work\",\"title\":\"Scope of Work\",\"sortOrder\":2,\"defaultContent\":{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"\"}]}]}},{\"sectionKey\":\"project_details\",\"title\":\"Project Details\",\"sortOrder\":3,\"defaultContent\":{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"\"}]}]}},{\"sectionKey\":\"terms_conditions\",\"title\":\"Terms & Conditions\",\"sortOrder\":4,\"defaultContent\":{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"\"}]}]}}]',1,'system','2026-03-16 18:20:59.742107','2026-03-16 18:20:59.742107');
/*!40000 ALTER TABLE `templates` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-25  4:16:01
