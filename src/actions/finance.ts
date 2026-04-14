'use server';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function fetchInitialData() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return { isLoggedIn: false };
  }

  // @ts-ignore - session.user.id is injected via callback
  const userId = session.user.id;

  if (!process.env.DATABASE_URL) {
    console.log("No DATABASE_URL found, skipping Postgres fetch.");
    return { isLoggedIn: true, userId, state: null };
  }
  
  try {
    const record = await prisma.appStateSync.findUnique({
      where: { userId }
    });

    if (record && record.state) {
      return { isLoggedIn: true, userId, state: record.state };
    }
    return { isLoggedIn: true, userId, state: null };
  } catch (error) {
    console.error("Failed to fetch data from Postgres:", error);
    return { isLoggedIn: true, userId, state: null };
  }
}

export async function syncStateToDb(state: any) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return { isLoggedIn: false };
  }

  // @ts-ignore
  const userId = session.user.id;

  if (!process.env.DATABASE_URL) {
    console.log("No DATABASE_URL found, skipping Postgres sync.");
    return { isLoggedIn: true, userId, success: false, reason: 'no_db_url' };
  }

  try {
    await prisma.appStateSync.upsert({
      where: { userId },
      update: { state },
      create: { userId, state }
    });

    return { isLoggedIn: true, userId, success: true };
  } catch (error) {
    console.error("Failed to sync state to Postgres:", error);
    return { isLoggedIn: true, userId, success: false, error };
  }
}