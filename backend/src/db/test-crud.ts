import { and, eq, gt, sql } from 'drizzle-orm';
import { db, pool } from './index';
import { vZoneOccupancy, zones } from './schema';

async function main() {
  console.log('Clean table...');
  await db.delete(zones);

  console.log('\n1. CREATE (INSERT)...');
  const inserted = await db
    .insert(zones)
    .values([
      { name: 'Recreational Pools', maxCapacity: 120, currentOccupancy: 45, minuteRate: '0.00' },
      { name: 'Sauna Zone', maxCapacity: 30, currentOccupancy: 28, minuteRate: '1.20' },
      { name: 'Water Slides', maxCapacity: 40, currentOccupancy: 15, minuteRate: '0.50' },
      { name: 'Old Zone', maxCapacity: 10, currentOccupancy: 0, minuteRate: '0.00', isActive: false },
    ])
    .returning();
  console.table(inserted);

  console.log('\n2. READ (SELECT with WHERE clause)...');
  const paidZones = await db
    .select()
    .from(zones)
    .where(and(eq(zones.isActive, true), gt(zones.minuteRate, '0.00')));
  console.table(paidZones);

  console.log('\n3. UPDATE (2 guests enter Sauna Zone -> 30/30 limit)...');
  const afterEntry = await db
    .update(zones)
    .set({ currentOccupancy: sql`${zones.currentOccupancy} + 2` })
    .where(eq(zones.name, 'Sauna Zone'))
    .returning();
  console.table(afterEntry);

  console.log('\n4. INTEGRITY TEST (attempting to exceed Sauna Zone capacity)...');
  try {
    await db
      .update(zones)
      .set({ currentOccupancy: sql`${zones.currentOccupancy} + 1` })
      .where(eq(zones.name, 'Sauna Zone'));
  } catch (err: unknown) {
    const message =
      err instanceof Error ? (err.cause as Error | undefined)?.message ?? err.message : String(err);
    console.log('Expected DB rejection (CHECK constraint):', message);
  }

  console.log('\n5. VIEW v_zone_occupancy...');
  console.table(await db.select().from(vZoneOccupancy));

  console.log('\n6. UPDATE + VIEW (30->20 guests in Sauna Zone)...');
  await db
    .update(zones)
    .set({ currentOccupancy: 20 })
    .where(eq(zones.name, 'Sauna Zone'));
  console.table(await db.select().from(vZoneOccupancy));

  console.log('\n7. DELETE (removing test zone)...');
  const deleted = await db
    .delete(zones)
    .where(eq(zones.name, 'Old Zone'))
    .returning();
  console.table(deleted);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => pool.end());