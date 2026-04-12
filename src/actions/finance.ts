'use server';

import prisma from '@/lib/prisma';

export async function fetchInitialData() {
  if (!process.env.DATABASE_URL) {
    console.log("No DATABASE_URL found, skipping Postgres fetch.");
    return null;
  }
  
  try {
    const record = await prisma.appStateSync.findUnique({
      where: { id: 'default' }
    });

    if (record && record.state) {
      return record.state;
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch data from Postgres:", error);
    return null;
  }
}

export async function syncStateToDb(state: any) {
  if (!process.env.DATABASE_URL) {
    console.log("No DATABASE_URL found, skipping Postgres sync.");
    return { success: false, reason: 'no_db_url' };
  }

  try {
    await prisma.appStateSync.upsert({
      where: { id: 'default' },
      update: { state },
      create: { id: 'default', state }
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to sync state to Postgres:", error);
    return { success: false, error };
  }
}