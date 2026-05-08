/**
 * Setup MongoDB indexes for the authentication system
 * Run this script once to create the necessary indexes
 *
 * Usage: bun run scripts/setup-mongo-indexes.ts
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'quantum_platform';

async function setupIndexes() {
	const client = new MongoClient(MONGODB_URI);

	try {
		await client.connect();
		console.log('✓ Connected to MongoDB');

		const db = client.db(MONGODB_DB_NAME);

		// Users collection indexes
		console.log('\n📚 Creating indexes for users collection...');
		await db.collection('users').createIndex({ email: 1 }, { unique: true });
		console.log('  ✓ Created unique index on email');

		await db.collection('users').createIndex({ createdAt: 1 });
		console.log('  ✓ Created index on createdAt');

		await db.collection('users').createIndex({ isActive: 1, trialEndsAt: 1 });
		console.log('  ✓ Created compound index on isActive and trialEndsAt');

		// OTPs collection indexes
		console.log('\n📧 Creating indexes for otps collection...');
		await db.collection('otps').createIndex({ email: 1, verified: 1 });
		console.log('  ✓ Created compound index on email and verified');

		await db.collection('otps').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
		console.log('  ✓ Created TTL index on expiresAt (auto-delete expired OTPs)');

		console.log('\n✅ All indexes created successfully!');
		console.log('\n📊 Database:', MONGODB_DB_NAME);
		console.log('🔗 URI:', MONGODB_URI);

	} catch (error) {
		console.error('❌ Error setting up indexes:', error);
		process.exit(1);
	} finally {
		await client.close();
		console.log('\n🔌 Disconnected from MongoDB');
	}
}

setupIndexes();
