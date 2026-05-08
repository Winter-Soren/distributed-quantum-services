import { ObjectId } from 'mongodb';

export interface User {
	_id?: ObjectId;
	email: string;
	firstName: string;
	lastName: string;
	organization: string;
	designation: string;
	trialEndsAt: Date;
	isActive: boolean;
	hasSubscription: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface OTPRecord {
	_id?: ObjectId;
	email: string;
	otp: string;
	expiresAt: Date;
	verified: boolean;
	createdAt: Date;
}

export interface Session {
	_id?: ObjectId;
	userId: ObjectId;
	token: string;
	expiresAt: Date;
	createdAt: Date;
}
