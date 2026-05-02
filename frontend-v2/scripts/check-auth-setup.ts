/**
 * Check if authentication system is properly configured
 * Run this to verify your setup before starting the app
 *
 * Usage: bun run scripts/check-auth-setup.ts
 */

import { MongoClient } from 'mongodb';

const requiredEnvVars = [
	'MONGODB_URI',
	'MONGODB_DB_NAME',
	'JWT_SECRET',
	'RESEND_API_KEY',
	'EMAIL_FROM',
];

console.log('🔍 Checking Authentication Setup...\n');

// Check environment variables
console.log('📋 Environment Variables:');
let envCheckPassed = true;

for (const envVar of requiredEnvVars) {
	const value = process.env[envVar];
	if (!value) {
		console.log(`  ❌ ${envVar} - MISSING`);
		envCheckPassed = false;
	} else if (
		(envVar === 'JWT_SECRET' && value.length < 32) ||
		(envVar === 'JWT_SECRET' && value.includes('change-in-production'))
	) {
		console.log(`  ⚠️  ${envVar} - WEAK (use a stronger secret in production)`);
	} else if (envVar === 'RESEND_API_KEY' && value === 'your-resend-api-key') {
		console.log(`  ⚠️  ${envVar} - PLACEHOLDER (replace with real API key)`);
	} else {
		const maskedValue = envVar.includes('KEY') || envVar.includes('SECRET')
			? '***' + value.slice(-4)
			: value;
		console.log(`  ✓ ${envVar} - ${maskedValue}`);
	}
}

if (!envCheckPassed) {
	console.log('\n❌ Missing required environment variables!');
	console.log('   Please check your .env file\n');
	process.exit(1);
}

// Check MongoDB connection
console.log('\n🗄️  MongoDB Connection:');
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB_NAME || 'quantum_platform';

const client = new MongoClient(mongoUri);

try {
	await client.connect();
	console.log('  ✓ Connected successfully');

	const db = client.db(dbName);

	// Check collections
	const collections = await db.listCollections().toArray();
	console.log(`  ✓ Database: ${dbName}`);

	const hasUsers = collections.some((c) => c.name === 'users');
	const hasOtps = collections.some((c) => c.name === 'otps');

	if (hasUsers) {
		const userCount = await db.collection('users').countDocuments();
		console.log(`  ✓ Users collection exists (${userCount} users)`);
	} else {
		console.log('  ℹ️  Users collection will be created on first signup');
	}

	if (hasOtps) {
		console.log('  ✓ OTPs collection exists');
	} else {
		console.log('  ℹ️  OTPs collection will be created on first OTP request');
	}

	// Check indexes
	if (hasUsers) {
		const indexes = await db.collection('users').indexes();
		const hasEmailIndex = indexes.some((idx) => idx.key.email === 1);
		if (hasEmailIndex) {
			console.log('  ✓ Email index exists');
		} else {
			console.log('  ⚠️  Email index missing (run scripts/setup-mongo-indexes.ts)');
		}
	}

	console.log('\n✅ MongoDB setup looks good!');
} catch (error) {
	console.log('  ❌ Connection failed:', (error as Error).message);
	console.log('\n❌ MongoDB connection failed!');
	console.log('   Make sure MongoDB is running:\n');
	console.log('   macOS:  brew services start mongodb-community');
	console.log('   Docker: docker run -d -p 27017:27017 mongo:latest\n');
	process.exit(1);
} finally {
	await client.close();
}

// Check required files
console.log('\n📁 Required Files:');
const requiredFiles = [
	'src/lib/mongodb.ts',
	'src/lib/auth.ts',
	'src/lib/email.ts',
	'src/types/user.ts',
	'src/contexts/auth-context.tsx',
	'src/middleware.ts',
	'src/app/api/auth/signup/route.ts',
	'src/app/api/auth/signin/route.ts',
	'src/app/api/auth/request-otp/route.ts',
	'src/components/auth/signup-form.tsx',
	'src/components/auth/signin-form.tsx',
	'src/components/nav-user.tsx',
];

const fs = await import('fs');
let filesCheckPassed = true;

for (const file of requiredFiles) {
	if (fs.existsSync(file)) {
		console.log(`  ✓ ${file}`);
	} else {
		console.log(`  ❌ ${file} - MISSING`);
		filesCheckPassed = false;
	}
}

if (!filesCheckPassed) {
	console.log('\n❌ Some required files are missing!');
	process.exit(1);
}

// Final summary
console.log('\n═══════════════════════════════════════════════════');
console.log('✅ Authentication System Setup Complete!');
console.log('═══════════════════════════════════════════════════\n');

console.log('🚀 Ready to start:');
console.log('   bun run dev\n');

console.log('📱 Test the system:');
console.log('   1. Navigate to http://localhost:3000/signup');
console.log('   2. Create an account with your email');
console.log('   3. Check your inbox for the OTP code');
console.log('   4. Complete signup and explore!\n');

console.log('📚 Documentation:');
console.log('   • AUTHENTICATION_SETUP.md - Complete setup guide');
console.log('   • AUTH_README.md - System architecture\n');
