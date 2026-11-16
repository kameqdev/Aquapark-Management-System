import { eq, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  integer,
  numeric,
  pgTable,
  pgView,
  varchar,
} from 'drizzle-orm/pg-core';

export const zones = pgTable(
  'zones',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    maxCapacity: integer('max_capacity').notNull(),
    currentOccupancy: integer('current_occupancy').notNull().default(0),
    minuteRate: numeric('minute_rate', { precision: 6, scale: 2 })
      .notNull()
      .default('0.00'),
    isActive: boolean('is_active').notNull().default(true),
  },
  (table) => [
    check('chk_max_capacity_positive', sql`${table.maxCapacity} > 0`),
    check('chk_minute_rate_non_negative', sql`${table.minuteRate} >= 0`),
    check(
      'chk_occupancy_bounds',
      sql`${table.currentOccupancy} >= 0 AND ${table.currentOccupancy} <= ${table.maxCapacity}`
    ),
  ]
);

export const vZoneOccupancy = pgView('v_zone_occupancy').as((qb) =>
  qb
    .select({
      id: zones.id,
      name: zones.name,
      currentOccupancy: zones.currentOccupancy,
      maxCapacity: zones.maxCapacity,
      availableSpots: sql<number>`(${zones.maxCapacity} - ${zones.currentOccupancy})`.as(
        'available_spots'
      ),
      occupancyPercentage:
        sql<string>`ROUND((${zones.currentOccupancy}::NUMERIC / ${zones.maxCapacity}) * 100, 1)`.as(
          'occupancy_percentage'
        ),
      gateStatus:
        sql<string>`CASE WHEN ${zones.currentOccupancy} >= ${zones.maxCapacity} THEN 'FULL (LOCKED)' ELSE 'AVAILABLE' END`.as(
          'gate_status'
        ),
    })
    .from(zones)
    .where(eq(zones.isActive, true))
);