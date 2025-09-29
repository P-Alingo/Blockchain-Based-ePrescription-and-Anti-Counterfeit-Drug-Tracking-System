-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "wallet" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100),
    "passwordhash" VARCHAR(255),
    "roleid" INTEGER,
    "createdat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor" (
    "id" SERIAL NOT NULL,
    "userid" INTEGER,
    "licenseno" VARCHAR(100) NOT NULL,
    "hospital" VARCHAR(100) NOT NULL,

    CONSTRAINT "doctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient" (
    "id" SERIAL NOT NULL,
    "userid" INTEGER,
    "dateofbirth" DATE NOT NULL,

    CONSTRAINT "patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacist" (
    "id" SERIAL NOT NULL,
    "userid" INTEGER,
    "licenseno" VARCHAR(100) NOT NULL,
    "pharmacy" VARCHAR(100) NOT NULL,

    CONSTRAINT "pharmacist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manufacturer" (
    "id" SERIAL NOT NULL,
    "userid" INTEGER,
    "companyname" VARCHAR(100) NOT NULL,

    CONSTRAINT "manufacturer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distributor" (
    "id" SERIAL NOT NULL,
    "userid" INTEGER,
    "companyname" VARCHAR(100) NOT NULL,

    CONSTRAINT "distributor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulator" (
    "id" SERIAL NOT NULL,
    "userid" INTEGER,
    "agencyname" VARCHAR(100) NOT NULL,

    CONSTRAINT "regulator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin" (
    "id" SERIAL NOT NULL,
    "userid" INTEGER,

    CONSTRAINT "admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drug" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "formulation" VARCHAR(50) NOT NULL,
    "dosageunit" VARCHAR(20) NOT NULL,

    CONSTRAINT "drug_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescription" (
    "id" SERIAL NOT NULL,
    "patientid" INTEGER,
    "doctorid" INTEGER,
    "drugid" INTEGER,
    "dosage" VARCHAR(50) NOT NULL,
    "issuedat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "expiresat" TIMESTAMP(6) NOT NULL,
    "blockchaintx" VARCHAR(255),
    "qrcode" TEXT NOT NULL,
    "ipfshash" VARCHAR(255),
    "status" VARCHAR(50) NOT NULL,

    CONSTRAINT "prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drugbatch" (
    "id" SERIAL NOT NULL,
    "manufacturerid" INTEGER,
    "drugid" INTEGER,
    "batchnumber" VARCHAR(50) NOT NULL,
    "manufacturedate" DATE NOT NULL,
    "expirydate" DATE NOT NULL,
    "blockchaintx" VARCHAR(255),
    "qrcode" TEXT NOT NULL,
    "ipfshash" VARCHAR(255),

    CONSTRAINT "drugbatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplychainrecord" (
    "id" SERIAL NOT NULL,
    "drugbatchid" INTEGER,
    "fromentityid" INTEGER,
    "toentityid" INTEGER,
    "action" VARCHAR(50) NOT NULL,
    "timestamp" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "blockchaintx" VARCHAR(255),

    CONSTRAINT "supplychainrecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revocationrecord" (
    "id" SERIAL NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "refid" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "revokedbyid" INTEGER,
    "timestamp" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "blockchaintx" VARCHAR(255),

    CONSTRAINT "revocationrecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp" (
    "id" SERIAL NOT NULL,
    "userid" INTEGER,
    "code" VARCHAR(10) NOT NULL,
    "expiresat" TIMESTAMP(6) NOT NULL,
    "createdat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert" (
    "id" SERIAL NOT NULL,
    "userid" INTEGER,
    "title" VARCHAR(100) NOT NULL,
    "message" TEXT NOT NULL,
    "isread" BOOLEAN DEFAULT false,
    "priority" VARCHAR(20) NOT NULL,
    "createdat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activitylog" (
    "id" SERIAL NOT NULL,
    "userid" INTEGER,
    "action" VARCHAR(100) NOT NULL,
    "details" TEXT,
    "timestamp" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activitylog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" SERIAL NOT NULL,
    "userid" INTEGER,
    "reporttype" VARCHAR(50) NOT NULL,
    "filters" JSONB,
    "generatedat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "ipfshash" VARCHAR(255),

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispenserecord" (
    "id" SERIAL NOT NULL,
    "prescriptionid" INTEGER,
    "pharmacistid" INTEGER,
    "drugbatchid" INTEGER,
    "quantity" INTEGER NOT NULL,
    "dispensedat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "blockchaintx" VARCHAR(255),

    CONSTRAINT "dispenserecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blockchaineventlog" (
    "id" SERIAL NOT NULL,
    "eventname" VARCHAR(100) NOT NULL,
    "contractname" VARCHAR(100) NOT NULL,
    "entityid" INTEGER,
    "entitytype" VARCHAR(50),
    "transactionhash" VARCHAR(255) NOT NULL,
    "timestamp" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "processed" BOOLEAN DEFAULT false,

    CONSTRAINT "blockchaineventlog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_wallet_key" ON "users"("wallet");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_user_wallet" ON "users"("wallet");

-- CreateIndex
CREATE INDEX "idx_user_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_user_role" ON "users"("roleid");

-- CreateIndex
CREATE INDEX "idx_user_createdat" ON "users"("createdat");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_userid_key" ON "doctor"("userid");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_licenseno_key" ON "doctor"("licenseno");

-- CreateIndex
CREATE INDEX "idx_doctor_user" ON "doctor"("userid");

-- CreateIndex
CREATE INDEX "idx_doctor_license" ON "doctor"("licenseno");

-- CreateIndex
CREATE UNIQUE INDEX "patient_userid_key" ON "patient"("userid");

-- CreateIndex
CREATE INDEX "idx_patient_user" ON "patient"("userid");

-- CreateIndex
CREATE INDEX "idx_patient_dob" ON "patient"("dateofbirth");

-- CreateIndex
CREATE UNIQUE INDEX "pharmacist_userid_key" ON "pharmacist"("userid");

-- CreateIndex
CREATE UNIQUE INDEX "pharmacist_licenseno_key" ON "pharmacist"("licenseno");

-- CreateIndex
CREATE INDEX "idx_pharmacist_user" ON "pharmacist"("userid");

-- CreateIndex
CREATE INDEX "idx_pharmacist_license" ON "pharmacist"("licenseno");

-- CreateIndex
CREATE UNIQUE INDEX "manufacturer_userid_key" ON "manufacturer"("userid");

-- CreateIndex
CREATE INDEX "idx_manufacturer_user" ON "manufacturer"("userid");

-- CreateIndex
CREATE INDEX "idx_manufacturer_company" ON "manufacturer"("companyname");

-- CreateIndex
CREATE UNIQUE INDEX "distributor_userid_key" ON "distributor"("userid");

-- CreateIndex
CREATE INDEX "idx_distributor_user" ON "distributor"("userid");

-- CreateIndex
CREATE INDEX "idx_distributor_company" ON "distributor"("companyname");

-- CreateIndex
CREATE UNIQUE INDEX "regulator_userid_key" ON "regulator"("userid");

-- CreateIndex
CREATE INDEX "idx_regulator_user" ON "regulator"("userid");

-- CreateIndex
CREATE INDEX "idx_regulator_agency" ON "regulator"("agencyname");

-- CreateIndex
CREATE UNIQUE INDEX "admin_userid_key" ON "admin"("userid");

-- CreateIndex
CREATE INDEX "idx_admin_user" ON "admin"("userid");

-- CreateIndex
CREATE UNIQUE INDEX "drug_code_key" ON "drug"("code");

-- CreateIndex
CREATE INDEX "idx_drug_name" ON "drug"("name");

-- CreateIndex
CREATE INDEX "idx_drug_code" ON "drug"("code");

-- CreateIndex
CREATE INDEX "idx_prescription_patient" ON "prescription"("patientid");

-- CreateIndex
CREATE INDEX "idx_prescription_doctor" ON "prescription"("doctorid");

-- CreateIndex
CREATE INDEX "idx_prescription_drug" ON "prescription"("drugid");

-- CreateIndex
CREATE INDEX "idx_prescription_issued" ON "prescription"("issuedat");

-- CreateIndex
CREATE INDEX "idx_prescription_expires" ON "prescription"("expiresat");

-- CreateIndex
CREATE INDEX "idx_prescription_status" ON "prescription"("status");

-- CreateIndex
CREATE INDEX "idx_prescription_tx" ON "prescription"("blockchaintx");

-- CreateIndex
CREATE UNIQUE INDEX "drugbatch_batchnumber_key" ON "drugbatch"("batchnumber");

-- CreateIndex
CREATE INDEX "idx_drugbatch_manufacturer" ON "drugbatch"("manufacturerid");

-- CreateIndex
CREATE INDEX "idx_drugbatch_drug" ON "drugbatch"("drugid");

-- CreateIndex
CREATE INDEX "idx_drugbatch_batchnumber" ON "drugbatch"("batchnumber");

-- CreateIndex
CREATE INDEX "idx_drugbatch_manufactured" ON "drugbatch"("manufacturedate");

-- CreateIndex
CREATE INDEX "idx_drugbatch_expiry" ON "drugbatch"("expirydate");

-- CreateIndex
CREATE INDEX "idx_drugbatch_tx" ON "drugbatch"("blockchaintx");

-- CreateIndex
CREATE INDEX "idx_supplychain_batch" ON "supplychainrecord"("drugbatchid");

-- CreateIndex
CREATE INDEX "idx_supplychain_from" ON "supplychainrecord"("fromentityid");

-- CreateIndex
CREATE INDEX "idx_supplychain_to" ON "supplychainrecord"("toentityid");

-- CreateIndex
CREATE INDEX "idx_supplychain_action" ON "supplychainrecord"("action");

-- CreateIndex
CREATE INDEX "idx_supplychain_timestamp" ON "supplychainrecord"("timestamp");

-- CreateIndex
CREATE INDEX "idx_supplychain_tx" ON "supplychainrecord"("blockchaintx");

-- CreateIndex
CREATE INDEX "idx_revocation_type" ON "revocationrecord"("type");

-- CreateIndex
CREATE INDEX "idx_revocation_ref" ON "revocationrecord"("refid");

-- CreateIndex
CREATE INDEX "idx_revocation_by" ON "revocationrecord"("revokedbyid");

-- CreateIndex
CREATE INDEX "idx_revocation_timestamp" ON "revocationrecord"("timestamp");

-- CreateIndex
CREATE INDEX "idx_revocation_tx" ON "revocationrecord"("blockchaintx");

-- CreateIndex
CREATE INDEX "idx_otp_user" ON "otp"("userid");

-- CreateIndex
CREATE INDEX "idx_otp_code" ON "otp"("code");

-- CreateIndex
CREATE INDEX "idx_otp_expires" ON "otp"("expiresat");

-- CreateIndex
CREATE INDEX "idx_alert_user" ON "alert"("userid");

-- CreateIndex
CREATE INDEX "idx_alert_read" ON "alert"("isread");

-- CreateIndex
CREATE INDEX "idx_alert_priority" ON "alert"("priority");

-- CreateIndex
CREATE INDEX "idx_alert_created" ON "alert"("createdat");

-- CreateIndex
CREATE INDEX "idx_activity_user" ON "activitylog"("userid");

-- CreateIndex
CREATE INDEX "idx_activity_action" ON "activitylog"("action");

-- CreateIndex
CREATE INDEX "idx_activity_timestamp" ON "activitylog"("timestamp");

-- CreateIndex
CREATE INDEX "idx_report_user" ON "reports"("userid");

-- CreateIndex
CREATE INDEX "idx_report_type" ON "reports"("reporttype");

-- CreateIndex
CREATE INDEX "idx_report_generated" ON "reports"("generatedat");

-- CreateIndex
CREATE INDEX "idx_dispense_prescription" ON "dispenserecord"("prescriptionid");

-- CreateIndex
CREATE INDEX "idx_dispense_pharmacist" ON "dispenserecord"("pharmacistid");

-- CreateIndex
CREATE INDEX "idx_dispense_batch" ON "dispenserecord"("drugbatchid");

-- CreateIndex
CREATE INDEX "idx_dispense_dispensed" ON "dispenserecord"("dispensedat");

-- CreateIndex
CREATE INDEX "idx_dispense_tx" ON "dispenserecord"("blockchaintx");

-- CreateIndex
CREATE UNIQUE INDEX "blockchaineventlog_transactionhash_key" ON "blockchaineventlog"("transactionhash");

-- CreateIndex
CREATE INDEX "idx_blockchain_event" ON "blockchaineventlog"("eventname");

-- CreateIndex
CREATE INDEX "idx_blockchain_contract" ON "blockchaineventlog"("contractname");

-- CreateIndex
CREATE INDEX "idx_blockchain_entity" ON "blockchaineventlog"("entityid");

-- CreateIndex
CREATE INDEX "idx_blockchain_entitytype" ON "blockchaineventlog"("entitytype");

-- CreateIndex
CREATE INDEX "idx_blockchain_txhash" ON "blockchaineventlog"("transactionhash");

-- CreateIndex
CREATE INDEX "idx_blockchain_timestamp" ON "blockchaineventlog"("timestamp");

-- CreateIndex
CREATE INDEX "idx_blockchain_processed" ON "blockchaineventlog"("processed");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleid_fkey" FOREIGN KEY ("roleid") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "doctor" ADD CONSTRAINT "doctor_userid_fkey" FOREIGN KEY ("userid") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patient" ADD CONSTRAINT "patient_userid_fkey" FOREIGN KEY ("userid") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pharmacist" ADD CONSTRAINT "pharmacist_userid_fkey" FOREIGN KEY ("userid") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "manufacturer" ADD CONSTRAINT "manufacturer_userid_fkey" FOREIGN KEY ("userid") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "distributor" ADD CONSTRAINT "distributor_userid_fkey" FOREIGN KEY ("userid") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "regulator" ADD CONSTRAINT "regulator_userid_fkey" FOREIGN KEY ("userid") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "admin" ADD CONSTRAINT "admin_userid_fkey" FOREIGN KEY ("userid") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "prescription" ADD CONSTRAINT "prescription_doctorid_fkey" FOREIGN KEY ("doctorid") REFERENCES "doctor"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "prescription" ADD CONSTRAINT "prescription_drugid_fkey" FOREIGN KEY ("drugid") REFERENCES "drug"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "prescription" ADD CONSTRAINT "prescription_patientid_fkey" FOREIGN KEY ("patientid") REFERENCES "patient"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "drugbatch" ADD CONSTRAINT "drugbatch_drugid_fkey" FOREIGN KEY ("drugid") REFERENCES "drug"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "drugbatch" ADD CONSTRAINT "drugbatch_manufacturerid_fkey" FOREIGN KEY ("manufacturerid") REFERENCES "manufacturer"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "supplychainrecord" ADD CONSTRAINT "supplychainrecord_drugbatchid_fkey" FOREIGN KEY ("drugbatchid") REFERENCES "drugbatch"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "supplychainrecord" ADD CONSTRAINT "supplychainrecord_fromentityid_fkey" FOREIGN KEY ("fromentityid") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "supplychainrecord" ADD CONSTRAINT "supplychainrecord_toentityid_fkey" FOREIGN KEY ("toentityid") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "revocationrecord" ADD CONSTRAINT "revocationrecord_revokedbyid_fkey" FOREIGN KEY ("revokedbyid") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "otp" ADD CONSTRAINT "otp_userid_fkey" FOREIGN KEY ("userid") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alert" ADD CONSTRAINT "alert_userid_fkey" FOREIGN KEY ("userid") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "activitylog" ADD CONSTRAINT "activitylog_userid_fkey" FOREIGN KEY ("userid") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_userid_fkey" FOREIGN KEY ("userid") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dispenserecord" ADD CONSTRAINT "dispenserecord_drugbatchid_fkey" FOREIGN KEY ("drugbatchid") REFERENCES "drugbatch"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dispenserecord" ADD CONSTRAINT "dispenserecord_pharmacistid_fkey" FOREIGN KEY ("pharmacistid") REFERENCES "pharmacist"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dispenserecord" ADD CONSTRAINT "dispenserecord_prescriptionid_fkey" FOREIGN KEY ("prescriptionid") REFERENCES "prescription"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "blockchaineventlog" ADD CONSTRAINT "fk_drugbatch" FOREIGN KEY ("entityid") REFERENCES "drugbatch"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "blockchaineventlog" ADD CONSTRAINT "fk_prescription" FOREIGN KEY ("entityid") REFERENCES "prescription"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "blockchaineventlog" ADD CONSTRAINT "fk_supplychain" FOREIGN KEY ("entityid") REFERENCES "supplychainrecord"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
