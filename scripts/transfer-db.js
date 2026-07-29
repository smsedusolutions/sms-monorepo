const mongoose = require('mongoose');

// Define your MongoDB Connection Strings here:
const mongostring1 = ''; // Source MongoDB URI (1)
const mongostring2 = ''; // Target MongoDB URI (2)

async function transferAllCollections() {
  if (!mongostring1) {
    console.error('❌ Error: Please set a valid MongoDB URI for "mongostring1" (Source).');
    process.exit(1);
  }
  if (!mongostring2) {
    console.error('❌ Error: Please set a valid MongoDB URI for "mongostring2" (Target).');
    process.exit(1);
  }

  console.log('🔄 Connecting to Source Database (mongostring1)...');
  const sourceConn = await mongoose.createConnection(mongostring1).asPromise();
  console.log('✅ Connected to Source Database successfully!');

  console.log('🔄 Connecting to Target Database (mongostring2)...');
  const targetConn = await mongoose.createConnection(mongostring2).asPromise();
  console.log('✅ Connected to Target Database successfully!');

  try {
    // Retrieve all collections from source database
    const rawCollections = await sourceConn.db.listCollections().toArray();

    // Filter out internal system collections (e.g. system.views, system.profile)
    const collections = rawCollections.filter(col => !col.name.startsWith('system.'));

    console.log(`\n📋 Found ${collections.length} collection(s) to transfer:`, collections.map(c => c.name));

    if (collections.length === 0) {
      console.log('⚠️ No collections found in source database. Nothing to transfer.');
      return;
    }

    for (const { name: collName } of collections) {
      console.log(`\n--------------------------------------------------`);
      console.log(`📦 Processing collection: "${collName}"`);

      const sourceColl = sourceConn.collection(collName);
      const targetColl = targetConn.collection(collName);

      // Fetch all documents from source
      const docs = await sourceColl.find({}).toArray();
      console.log(`📥 Read ${docs.length} document(s) from source "${collName}".`);

      if (docs.length === 0) {
        console.log(`ℹ️ Collection "${collName}" is empty in source database. Skipping.`);
        continue;
      }

      // Clear existing target collection to prevent duplicate _id conflicts
      console.log(`🗑️ Clearing existing data in target "${collName}"...`);
      const deleteResult = await targetColl.deleteMany({});
      console.log(`Cleared ${deleteResult.deletedCount || 0} existing document(s) from target.`);

      // Insert documents in batches to handle large collections efficiently
      const BATCH_SIZE = 1000;
      let insertedTotal = 0;

      for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const batch = docs.slice(i, i + BATCH_SIZE);
        const insertResult = await targetColl.insertMany(batch);
        insertedTotal += insertResult.insertedCount;
      }

      console.log(`✨ Successfully transferred ${insertedTotal} document(s) into target "${collName}".`);
    }

    console.log('\n==================================================');
    console.log('🎉 All collections transferred successfully!');
    console.log('==================================================');

  } catch (err) {
    console.error('❌ Error during transfer process:', err);
  } finally {
    console.log('\n🔌 Closing database connections...');
    await Promise.all([sourceConn.close(), targetConn.close()]);
    console.log('✅ Connections closed.');
  }
}

transferAllCollections().catch(err => {
  console.error('Fatal error execution:', err);
  process.exit(1);
});
