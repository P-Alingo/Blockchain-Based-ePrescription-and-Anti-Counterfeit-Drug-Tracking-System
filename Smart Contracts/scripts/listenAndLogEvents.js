const hre = require("hardhat");
const { ethers } = hre;
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

// Global db reference (will be initialized in main)
let db;

// Helper: log blockchain event to DB
async function logEvent(eventName, contractName, entityType, txHash) {
  if (!txHash || txHash === "0x" || txHash.length < 10) {
    console.warn(`⚠️ Skipping event log for ${eventName} - missing or invalid transactionHash`);
    return;
  }
  try {
    // Lookup user by wallet address to get entityId
    let entityId = null;
    let wallet = null;
    if (typeof arguments[4] === 'string' && arguments[4].startsWith('0x')) {
      wallet = arguments[4];
      const { rows: userRows } = await db.query(
        'SELECT id FROM users WHERE LOWER(wallet_address) = LOWER($1)',
        [wallet]
      );
      if (userRows.length > 0) {
        entityId = userRows[0].id;
      }
    }
    // Prevent duplicate transaction hash insert
    const { rows: existing } = await db.query(
      'SELECT id FROM blockchaineventlog WHERE transactionhash = $1',
      [txHash]
    );
    if (existing.length === 0) {
      await db.query(
        `INSERT INTO blockchaineventlog (eventname, contractname, entityid, entitytype, transactionhash, processed, wallet_address)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [eventName, contractName, entityId, entityType, txHash, true, wallet]
      );
      console.log(`🧾 Logged: ${eventName} from ${contractName}`);
    } else {
      console.log(`⏩ Skipped duplicate event log for txHash: ${txHash}`);
    }
  } catch (err) {
    console.error("❌ Error logging event:", err.message);
  }
}

// Bootstrap user roles and registration after node restart
async function bootstrapUsers(signer, userManagement) {
  const roles = [
    { name: "doctor", wallets: [/* Add doctor wallet addresses here */] },
    { name: "pharmacist", wallets: [/* Add pharmacist wallet addresses here */] },
    { name: "patient", wallets: [/* Add patient wallet addresses here */] },
    { name: "regulator", wallets: [/* Add regulator wallet addresses here */] },
    { name: "manufacturer", wallets: [/* Add manufacturer wallet addresses here */] },
    { name: "distributor", wallets: [/* Add distributor wallet addresses here */] },
    { name: "admin", wallets: [signer.address] },
  ];

  for (const role of roles) {
    let roleId;
    try {
      roleId = await userManagement.getRoleIdByName(role.name);
      console.log(`✅ Role ${role.name} exists with ID: ${roleId}`);
    } catch (err) {
      console.log(`⏳ Creating role: ${role.name}`);
      const tx = await userManagement.connect(signer).createRole(role.name);
      const receipt = await tx.wait();
      roleId = await userManagement.getRoleIdByName(role.name);
      try {
        await db.query(
          `INSERT INTO roles (id, name, createdat, updatedat, transaction_hash, block_number)
           VALUES ($1, $2, NOW(), NOW(), $3, $4)
           ON CONFLICT (id) DO UPDATE SET name = $2, updatedat = NOW(), transaction_hash = $3, block_number = $4`,
          [roleId, role.name, receipt.transactionHash, receipt.blockNumber]
        );
        console.log(`📝 Created role ${role.name} with ID ${roleId}, tx ${receipt.transactionHash}`);
      } catch (dbErr) {
        console.warn(`No roles table or failed to update role ${role.name}:`, dbErr.message);
      }
    }
    
    for (const wallet of role.wallets) {
      if (!wallet || wallet === "0x0000000000000000000000000000000000000000") continue;
      
      try {
        const user = await userManagement.users(wallet);
        if (!user.exists) {
          console.log(`⏳ Registering user: ${wallet} as ${role.name}`);
          const tx = await userManagement.connect(signer).registerUser(wallet, roleId);
          const receipt = await tx.wait();
          
          // Get role name for display
          let roleName = role.name;
          try {
            roleName = await userManagement.getRoleName(roleId);
          } catch (err) {
            console.warn(`Could not fetch role name for roleId ${roleId}:`, err.message);
          }
          
          console.log(`✅ Registered ${roleName}: ${wallet}`);
          
          // Update database
          try {
            await db.query(
              `INSERT INTO users (wallet_address, role, status, createdat, updatedat, transaction_hash, block_number)
               VALUES ($1, $2, $3, NOW(), NOW(), $4, $5)
               ON CONFLICT (LOWER(wallet_address)) 
               DO UPDATE SET role = $2, updatedat = NOW(), transaction_hash = $4, block_number = $5`,
              [wallet, roleName, 'pending', receipt.transactionHash, receipt.blockNumber]
            );
          } catch (dbErr) {
            console.error(`❌ Failed to update user ${wallet} in DB:`, dbErr.message);
          }
        } else {
          // User exists, check if role needs update
          const currentRoleName = await userManagement.getUserRole(wallet);
          if (currentRoleName.toLowerCase() !== role.name.toLowerCase()) {
            console.log(`⏳ Updating user role: ${wallet} from ${currentRoleName} to ${role.name}`);
            const tx = await userManagement.connect(signer).updateUserRole(wallet, roleId);
            const receipt = await tx.wait();
            
            try {
              await db.query(
                `UPDATE users SET role = $1, updatedat = NOW(), transaction_hash = $2, block_number = $3 
                 WHERE LOWER(wallet_address) = LOWER($4)`,
                [role.name, receipt.transactionHash, receipt.blockNumber, wallet]
              );
              console.log(`📝 Updated user role for ${wallet} to ${role.name}`);
            } catch (dbErr) {
              console.error(`❌ Failed to update user role for ${wallet}:`, dbErr.message);
            }
          }
          
          // Auto-approve pending users
          const userStatus = await userManagement.getUserStatusString(wallet);
          if (userStatus === 'pending') {
            console.log(`⏳ Approving pending user: ${wallet}`);
            const tx = await userManagement.connect(signer).approveUser(wallet);
            const receipt = await tx.wait();
            
            try {
              await db.query(
                `UPDATE users SET status = 'active', updatedat = NOW(), transaction_hash = $1, block_number = $2 
                 WHERE LOWER(wallet_address) = LOWER($3)`,
                [receipt.transactionHash, receipt.blockNumber, wallet]
              );
              console.log(`✅ Approved user ${wallet}`);
            } catch (dbErr) {
              console.error(`❌ Failed to update user status for ${wallet}:`, dbErr.message);
            }
          } else {
            console.log(`⏩ Skipping approveUser for ${wallet} (status: ${userStatus})`);
          }
        }
      } catch (err) {
        console.error(`❌ Error processing ${role.name} (${wallet}):`, err.message);
      }
    }
  }
}

async function main() {
  // ✅ Connect to PostgreSQL
  db = new Client({
    user: "postgres",
    host: "localhost",
    database: "eprescribe_kenya",
    password: "Mkenya04!",
    port: 5432,
  });
  await db.connect();
  console.log("✅ Connected to PostgreSQL");

  // ✅ Load deployed contract addresses
  const deploymentJsonPath = path.join(__dirname, "../../Backend/src/contracts.json");
  if (!fs.existsSync(deploymentJsonPath))
    throw new Error("Deployment JSON not found at " + deploymentJsonPath);
  const deployedContracts = JSON.parse(fs.readFileSync(deploymentJsonPath, "utf8"));

  // ✅ Get signer
  const [signer] = await ethers.getSigners();
  console.log(`👤 Using signer: ${signer.address}`);

  // ✅ Connect to deployed contracts
  const userManagement = await ethers.getContractAt(
    "UserManagement",
    deployedContracts.USER_MANAGEMENT_ADDRESS
  );

  console.log("✅ Connected to contracts:");
  console.log(`   - UserManagement: ${deployedContracts.USER_MANAGEMENT_ADDRESS}`);

  // Bootstrap user roles and registration after node restart
  console.log("🚀 Bootstrapping users and roles...");
  await bootstrapUsers(signer, userManagement);

  // =====================
  // EVENT LISTENERS - CORRECTED FOR YOUR CONTRACT
  // =====================

  // UserRegistered event - matches your contract
  userManagement.on("UserRegistered", async (wallet, roleId, status, metadata, event) => {
    let txHash = event?.log?.transactionHash || event?.transactionHash;
    let blockNumber = event?.log?.blockNumber || event?.blockNumber;
    
    await logEvent("UserRegistered", "UserManagement", "user", txHash, wallet);
    
    let roleName = "unknown";
    try {
      roleName = await userManagement.getRoleName(roleId);
    } catch (err) {
      console.warn(`Could not fetch role name for roleId ${roleId}:`, err.message);
    }
    
    const statusMap = { 0: 'pending', 1: 'active', 2: 'suspended', 3: 'inactive' };
    const statusString = statusMap[status] || 'unknown';
    
    console.log(`👤 UserRegistered | Wallet: ${wallet} | Role: ${roleName} | Status: ${statusString}`);
    
    try {
        await db.query(
          `INSERT INTO users (wallet_address, role, status, createdat, updatedat)
           VALUES ($1, $2, $3, NOW(), NOW())
           ON CONFLICT (LOWER(wallet_address)) 
           DO UPDATE SET role = $2, status = $3, updatedat = NOW()`,
          [wallet, roleName, statusString]
        );
        console.log(`🗂️ Synced user ${wallet} with role ${roleName}`);
    } catch (err) {
      console.error("❌ Failed to sync UserRegistered:", err.message);
    }
  });

  // UserRoleUpdated event
  userManagement.on("UserRoleUpdated", async (wallet, newRoleId, event) => {
    let txHash = event?.log?.transactionHash || event?.transactionHash;
    let blockNumber = event?.log?.blockNumber || event?.blockNumber;
    
    await logEvent("UserRoleUpdated", "UserManagement", "user", txHash, wallet);
    
    let roleName = "unknown";
    try {
      roleName = await userManagement.getRoleName(newRoleId);
    } catch (err) {
      console.warn(`Could not fetch role name for roleId ${newRoleId}:`, err.message);
    }
    
    console.log(`🔁 UserRoleUpdated | Wallet: ${wallet} | New Role: ${roleName}`);
    
    try {
        await db.query(
          `UPDATE users SET role = $1, updatedat = NOW() 
           WHERE LOWER(wallet_address) = LOWER($2)`,
          [roleName, wallet]
        );
        console.log(`🗂️ Updated user role for ${wallet} to ${roleName}`);
    } catch (err) {
      console.error("❌ Failed to sync UserRoleUpdated:", err.message);
    }
  });

  // UserStatusUpdated event
  userManagement.on("UserStatusUpdated", async (wallet, newStatus, event) => {
    let txHash = event?.log?.transactionHash || event?.transactionHash;
    let blockNumber = event?.log?.blockNumber || event?.blockNumber;
    
    await logEvent("UserStatusUpdated", "UserManagement", "user", txHash, wallet);
    
    const statusMap = { 
      0: 'pending', 
      1: 'active', 
      2: 'suspended', 
      3: 'inactive' 
    };
    
    const statusString = statusMap[newStatus] || 'unknown';
    console.log(`🔄 UserStatusUpdated | Wallet: ${wallet} | New Status: ${statusString}`);
    
    try {
        await db.query(
          `UPDATE users SET status = $1, updatedat = NOW() 
           WHERE LOWER(wallet_address) = LOWER($2)`,
          [statusString, wallet]
        );
        console.log(`🗂️ Updated user status for ${wallet} to ${statusString}`);
    } catch (err) {
      console.error("❌ Failed to sync UserStatusUpdated:", err.message);
    }
  });

  // RoleCreated event
  userManagement.on("RoleCreated", async (roleId, name, event) => {
    let txHash = event?.log?.transactionHash || event?.transactionHash;
    let blockNumber = event?.log?.blockNumber || event?.blockNumber;
    
    await logEvent("RoleCreated", "UserManagement", "role", txHash);
    
    console.log(`🏷️ RoleCreated | ID: ${roleId} | Name: ${name}`);
    
    try {
      await db.query(
        `INSERT INTO roles (id, name, createdat, updatedat, transaction_hash, block_number)
         VALUES ($1, $2, NOW(), NOW(), $3, $4)
         ON CONFLICT (id) 
         DO UPDATE SET name = $2, updatedat = NOW(), transaction_hash = $3, block_number = $4`,
        [roleId, name, txHash, blockNumber]
      );
      console.log(`🗂️ Upserted role ${roleId} with name ${name}`);
    } catch (err) {
      console.error("❌ Failed to sync RoleCreated:", err.message);
    }
  });

  // UserDeleted event
  userManagement.on("UserDeleted", async (wallet, event) => {
    let txHash = event?.log?.transactionHash || event?.transactionHash;
    let blockNumber = event?.log?.blockNumber || event?.blockNumber;
    
    await logEvent("UserDeleted", "UserManagement", "user", txHash, wallet);
    
    console.log(`🗑️ UserDeleted | Wallet: ${wallet}`);
    
    try {
        await db.query(
          `UPDATE users SET is_deleted = TRUE, updatedat = NOW() 
           WHERE LOWER(wallet_address) = LOWER($1)`,
          [wallet]
        );
        console.log(`🗂️ Marked user ${wallet} as deleted`);
    } catch (err) {
      console.error("❌ Failed to sync UserDeleted:", err.message);
    }
  });

  // UserEdited event
  userManagement.on("UserEdited", async (wallet, metadata, event) => {
    let txHash = event?.log?.transactionHash || event?.transactionHash;
    let blockNumber = event?.log?.blockNumber || event?.blockNumber;
    
    await logEvent("UserEdited", "UserManagement", "user", txHash, wallet);
    
    console.log(`✏️ UserEdited | Wallet: ${wallet} | Metadata: ${metadata}`);
    
    // No metadata column in users table, so skip DB update for metadata
  });

  // AdminAdded event
  userManagement.on("AdminAdded", async (newAdmin, event) => {
    let txHash = event?.log?.transactionHash || event?.transactionHash;
    let blockNumber = event?.log?.blockNumber || event?.blockNumber;
    
    await logEvent("AdminAdded", "UserManagement", "admin", txHash);
    console.log(`👑 AdminAdded | Address: ${newAdmin}`);
  });

  // AdminRemoved event
  userManagement.on("AdminRemoved", async (removedAdmin, event) => {
    let txHash = event?.log?.transactionHash || event?.transactionHash;
    let blockNumber = event?.log?.blockNumber || event?.blockNumber;
    
    await logEvent("AdminRemoved", "UserManagement", "admin", txHash);
    console.log(`⚠️ AdminRemoved | Address: ${removedAdmin}`);
  });

  // UserSynced event (custom event from your contract)
  userManagement.on("UserSynced", async (wallet, event) => {
    let txHash = event?.log?.transactionHash || event?.transactionHash;
    let blockNumber = event?.log?.blockNumber || event?.blockNumber;
    
    await logEvent("UserSynced", "UserManagement", "user", txHash, wallet);
    console.log(`🔄 UserSynced | Wallet: ${wallet}`);
      // Update last_synced_at and status in users table
      try {
        // Fetch on-chain status
        let statusEnum = await userManagement.getUserStatus(wallet);
        const statusMap = { 0: 'pending', 1: 'active', 2: 'suspended', 3: 'inactive' };
        let statusString = statusMap[Number(statusEnum)] || 'unknown';
        await db.query(
          `UPDATE users SET last_synced_at = NOW(), status = $1, updatedat = NOW() WHERE LOWER(wallet_address) = LOWER($2)`,
          [statusString, wallet]
        );
        console.log(`🗂️ Updated user ${wallet} as synced with status: ${statusString}`);
      } catch (err) {
        console.error("❌ Error updating last_synced_at and status:", err.message);
      }
  });

  // UserViewed event (custom event from your contract)
  userManagement.on("UserViewed", async (wallet, event) => {
    let txHash = event?.log?.transactionHash || event?.transactionHash;
    let blockNumber = event?.log?.blockNumber || event?.blockNumber;
    
    await logEvent("UserViewed", "UserManagement", "user", txHash, wallet);
    console.log(`👀 UserViewed | Wallet: ${wallet}`);

      // Update last_viewed_at in users table
      try {
        await db.query(
          `UPDATE users SET last_viewed_at = NOW(), updatedat = NOW() WHERE LOWER(wallet_address) = LOWER($1)`,
          [wallet]
        );
        console.log(`🗂️ Updated user ${wallet} as viewed`);
      } catch (err) {
        console.error("❌ Error updating last_viewed_at:", err.message);
      }
  });

  console.log("🔗 Listening for blockchain events...");

  // =====================
  // PRESCRIPTIONMANAGEMENT CONTRACT EVENT LISTENERS
  // =====================

  // Connect to PrescriptionManagement contract
  const prescriptionManagement = await ethers.getContractAt(
    "PrescriptionManagement",
    deployedContracts.PRESCRIPTION_MANAGEMENT_ADDRESS
  );
  console.log(`   - PrescriptionManagement: ${deployedContracts.PRESCRIPTION_MANAGEMENT_ADDRESS}`);

  // PrescriptionCreated event
  prescriptionManagement.on("PrescriptionCreated", async (prescriptionId, databaseId, doctor, patient, prescriptionCode, drugName, quantity, validUntil, event) => {
    let txHash = event?.log?.transactionHash || event?.transactionHash;
    let blockNumber = event?.log?.blockNumber || event?.blockNumber;
    await logEvent("PrescriptionCreated", "PrescriptionManagement", "prescription", txHash, doctor);
    console.log(`📝 PrescriptionCreated | ID: ${prescriptionId} | Doctor: ${doctor} | Patient: ${patient} | Drug: ${drugName}`);
  });

  // PrescriptionUpdated event
  prescriptionManagement.on("PrescriptionUpdated", async (prescriptionId, prescriptionCode, updatedAt, event) => {
    let txHash = event?.log?.transactionHash || event?.transactionHash;
    let blockNumber = event?.log?.blockNumber || event?.blockNumber;
    await logEvent("PrescriptionUpdated", "PrescriptionManagement", "prescription", txHash);
    console.log(`✏️ PrescriptionUpdated | ID: ${prescriptionId} | Code: ${prescriptionCode} | UpdatedAt: ${updatedAt}`);
  });

  // PrescriptionExpired event
  prescriptionManagement.on("PrescriptionExpired", async (prescriptionId, doctor, patient, expiredAt, event) => {
    let txHash = event?.log?.transactionHash || event?.transactionHash;
    let blockNumber = event?.log?.blockNumber || event?.blockNumber;
    await logEvent("PrescriptionExpired", "PrescriptionManagement", "prescription", txHash, doctor);
    console.log(`⏰ PrescriptionExpired | ID: ${prescriptionId} | Doctor: ${doctor} | Patient: ${patient} | ExpiredAt: ${expiredAt}`);
  });

  // PrescriptionDispensed event
  prescriptionManagement.on("PrescriptionDispensed", async (prescriptionId, pharmacist, patient, dispensedDate, prescriptionCode, event) => {
    // ...existing code...
    let txHash = event?.log?.transactionHash || event?.transactionHash;
    let blockNumber = event?.log?.blockNumber || event?.blockNumber;
    await logEvent("PrescriptionDispensed", "PrescriptionManagement", "prescription", txHash, pharmacist);
    // Try to get drug name from prescriptionCode mapping or event args if available
    let drugName = '';
    // If you have a way to map prescriptionCode to drugName, add it here
    // For now, just leave drugName blank or fetch if possible
    console.log(`💊 PrescriptionDispensed | ID: ${prescriptionId} | Pharmacist: ${pharmacist} | Patient: ${patient} | Drug: ${drugName} | Code: ${prescriptionCode}`);
  });

  // Test event emission
  console.log("🧪 Testing event listeners...");
  try {
    // Test by viewing the current user
    await userManagement.viewUser(signer.address);
    console.log("✅ Event listener test completed");
  } catch (err) {
    console.log("⚠️ Event listener test failed (might not have permissions):", err.message);
  }


    // =====================
    // DRUGSUPPLYCHAIN CONTRACT EVENT LISTENERS (UPDATED)
    // =====================

    const drugSupplyChain = await ethers.getContractAt(
      "DrugSupplyChain",
      deployedContracts.DRUG_SUPPLY_CHAIN_ADDRESS
    );
    console.log(`   - DrugSupplyChain: ${deployedContracts.DRUG_SUPPLY_CHAIN_ADDRESS}`);

    // DrugBatchCreated event
    drugSupplyChain.on("DrugBatchCreated", async (
      batchId, manufacturerId, drugId, batchNumber, manufactureDate, expiryDate, quantity, storageTemperature, manufacturingFacility, qualityControlOfficerId, dateChecked, timestamp, event
    ) => {
      let txHash = event?.log?.transactionHash || event?.transactionHash;
      await logEvent("DrugBatchCreated", "DrugSupplyChain", "drugbatch", txHash);
      console.log(`📦 DrugBatchCreated | ID: ${batchId} | Manufacturer: ${manufacturerId} | Drug: ${drugId} | BatchNumber: ${batchNumber}`);
    });

    // DrugBatchEdited event
    drugSupplyChain.on("DrugBatchEdited", async (
      batchId, manufacturerId, drugId, batchNumber, manufactureDate, expiryDate, quantity, storageTemperature, manufacturingFacility, qualityControlOfficerId, dateChecked, timestamp, event
    ) => {
      let txHash = event?.log?.transactionHash || event?.transactionHash;
      await logEvent("DrugBatchEdited", "DrugSupplyChain", "drugbatch", txHash);
      console.log(`✏️ DrugBatchEdited | ID: ${batchId} | Manufacturer: ${manufacturerId} | Drug: ${drugId} | BatchNumber: ${batchNumber}`);
    });

    // DrugBatchDeleted event
    drugSupplyChain.on("DrugBatchDeleted", async (
      batchId, manufacturerId, drugId, batchNumber, timestamp, event
    ) => {
      let txHash = event?.log?.transactionHash || event?.transactionHash;
      await logEvent("DrugBatchDeleted", "DrugSupplyChain", "drugbatch", txHash);
      console.log(`🗑️ DrugBatchDeleted | ID: ${batchId} | Manufacturer: ${manufacturerId} | Drug: ${drugId} | BatchNumber: ${batchNumber}`);
    });

    // BatchRequested event
    drugSupplyChain.on("BatchRequested", async (
      requestId, batchId, pharmacist, quantityRequested, drugId, distributorId, timestamp, event
    ) => {
      let txHash = event?.log?.transactionHash || event?.transactionHash;
      await logEvent("BatchRequested", "DrugSupplyChain", "batchrequest", txHash, pharmacist);
      console.log(`📦 BatchRequested | RequestID: ${requestId} | BatchID: ${batchId} | Pharmacist: ${pharmacist}`);
    });

    // BatchRequestEdited event
    drugSupplyChain.on("BatchRequestEdited", async (
      requestId, batchId, pharmacist, quantityRequested, drugId, distributorId, status, timestamp, event
    ) => {
      let txHash = event?.log?.transactionHash || event?.transactionHash;
      await logEvent("BatchRequestEdited", "DrugSupplyChain", "batchrequest", txHash, pharmacist);
      console.log(`✏️ BatchRequestEdited | RequestID: ${requestId} | BatchID: ${batchId} | Status: ${status}`);
    });

    // BatchRequestDeleted event
    drugSupplyChain.on("BatchRequestDeleted", async (
      requestId, batchId, pharmacist, drugId, timestamp, event
    ) => {
      let txHash = event?.log?.transactionHash || event?.transactionHash;
      await logEvent("BatchRequestDeleted", "DrugSupplyChain", "batchrequest", txHash, pharmacist);
      console.log(`🗑️ BatchRequestDeleted | RequestID: ${requestId} | BatchID: ${batchId}`);
    });

    // BatchRequestStatusUpdated event
    drugSupplyChain.on("BatchRequestStatusUpdated", async (
      requestId, oldStatus, newStatus, timestamp, event
    ) => {
      let txHash = event?.log?.transactionHash || event?.transactionHash;
      await logEvent("BatchRequestStatusUpdated", "DrugSupplyChain", "batchrequest", txHash);
      console.log(`🔄 BatchRequestStatusUpdated | RequestID: ${requestId} | Old: ${oldStatus} | New: ${newStatus}`);
    });

    // ShipmentCreated event
    drugSupplyChain.on("ShipmentCreated", async (
      shipmentId, batchId, distributor, pharmacist, status, timestamp, event
    ) => {
      let txHash = event?.log?.transactionHash || event?.transactionHash;
      await logEvent("ShipmentCreated", "DrugSupplyChain", "shipment", txHash, distributor);
      console.log(`🚚 ShipmentCreated | ShipmentID: ${shipmentId} | BatchID: ${batchId} | Distributor: ${distributor}`);
    });

    // ShipmentEdited event
    drugSupplyChain.on("ShipmentEdited", async (
      shipmentId, batchId, distributor, pharmacist, status, timestamp, event
    ) => {
      let txHash = event?.log?.transactionHash || event?.transactionHash;
      await logEvent("ShipmentEdited", "DrugSupplyChain", "shipment", txHash, distributor);
      console.log(`✏️ ShipmentEdited | ShipmentID: ${shipmentId} | BatchID: ${batchId} | Status: ${status}`);
    });

    // ShipmentDeleted event
    drugSupplyChain.on("ShipmentDeleted", async (
      shipmentId, batchId, distributor, pharmacist, timestamp, event
    ) => {
      let txHash = event?.log?.transactionHash || event?.transactionHash;
      await logEvent("ShipmentDeleted", "DrugSupplyChain", "shipment", txHash, distributor);
      console.log(`🗑️ ShipmentDeleted | ShipmentID: ${shipmentId} | BatchID: ${batchId}`);
    });

    // ShipmentStatusUpdated event
    drugSupplyChain.on("ShipmentStatusUpdated", async (
      shipmentId, oldStatus, newStatus, timestamp, event
    ) => {
      let txHash = event?.log?.transactionHash || event?.transactionHash;
      await logEvent("ShipmentStatusUpdated", "DrugSupplyChain", "shipment", txHash);
      console.log(`🔄 ShipmentStatusUpdated | ShipmentID: ${shipmentId} | Old: ${oldStatus} | New: ${newStatus}`);
    });

    // =====================
    // REGULATOROVERSIGHT CONTRACT EVENT LISTENERS
    // =====================

    const regulatorOversight = await ethers.getContractAt(
      "RegulatorOversight",
      deployedContracts.REGULATOR_OVERSIGHT_ADDRESS
    );
    console.log(`   - RegulatorOversight: ${deployedContracts.REGULATOR_OVERSIGHT_ADDRESS}`);

    // AuditLogged event
    regulatorOversight.on("AuditLogged", async (auditId, regulator, description, entityType, entityId, timestamp, event) => {
      let txHash = event?.log?.transactionHash || event?.transactionHash;
      await logEvent("AuditLogged", "RegulatorOversight", "audit", txHash, regulator);
      console.log(`📝 AuditLogged | AuditID: ${auditId} | Regulator: ${regulator} | EntityType: ${entityType}`);
    });

    // EntityFlagged event
    regulatorOversight.on("EntityFlagged", async (flagId, flaggedBy, entityType, entityId, userAddress, reason, status, autoSuspended, timestamp, event) => {
      let txHash = event?.log?.transactionHash || event?.transactionHash;
      await logEvent("EntityFlagged", "RegulatorOversight", entityType.toLowerCase(), txHash, flaggedBy);
      console.log(`🚩 EntityFlagged | FlagID: ${flagId} | Type: ${entityType} | EntityID: ${entityId} | Status: ${status}`);
    });

    // FlagStatusUpdated event
    regulatorOversight.on("FlagStatusUpdated", async (flagId, oldStatus, newStatus, updatedBy, timestamp, event) => {
      let txHash = event?.log?.transactionHash || event?.transactionHash;
      await logEvent("FlagStatusUpdated", "RegulatorOversight", "flag", txHash, updatedBy);
      console.log(`🔄 FlagStatusUpdated | FlagID: ${flagId} | Old: ${oldStatus} | New: ${newStatus}`);
    });

    // AnomalyDetected event
    regulatorOversight.on("AnomalyDetected", async (reportId, anomalyType, severity, description, timestamp, event) => {
      let txHash = event?.log?.transactionHash || event?.transactionHash;
      await logEvent("AnomalyDetected", "RegulatorOversight", "anomaly", txHash);
      console.log(`⚡ AnomalyDetected | ReportID: ${reportId} | Type: ${anomalyType} | Severity: ${severity}`);
    });

    // UserAutoSuspended event (map to "UserSuspended")
    regulatorOversight.on("UserAutoSuspended", async (userAddress, flagCount, suspendedBy, suspensionEndTime, timestamp, event) => {
      let txHash = event?.log?.transactionHash || event?.transactionHash;
      await logEvent("UserSuspended", "RegulatorOversight", "user", txHash, suspendedBy);
      console.log(`⛔ UserSuspended | User: ${userAddress} | By: ${suspendedBy}`);
    });

    // UserSuspensionLifted event (map to "UserActivated")
    regulatorOversight.on("UserSuspensionLifted", async (userAddress, liftedBy, timestamp, event) => {
      let txHash = event?.log?.transactionHash || event?.transactionHash;
      await logEvent("UserActivated", "RegulatorOversight", "user", txHash, liftedBy);
      console.log(`✅ UserActivated | User: ${userAddress} | By: ${liftedBy}`);
    });

  // Keep the script running
  process.on('SIGINT', async () => {
    console.log('🛑 Shutting down event listener...');
    await db.end();
    process.exit(0);
  });

  // Keep alive
  setInterval(() => {
    console.log('⏰ Event listener still running...', new Date().toISOString());
  }, 60000);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});