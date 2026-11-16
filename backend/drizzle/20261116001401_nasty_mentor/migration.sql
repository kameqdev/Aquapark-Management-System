CREATE TABLE "zones" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "zones_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(100) NOT NULL UNIQUE,
	"max_capacity" integer NOT NULL,
	"current_occupancy" integer DEFAULT 0 NOT NULL,
	"minute_rate" numeric(6,2) DEFAULT '0.00' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "chk_max_capacity_positive" CHECK ("max_capacity" > 0),
	CONSTRAINT "chk_minute_rate_non_negative" CHECK ("minute_rate" >= 0),
	CONSTRAINT "chk_occupancy_bounds" CHECK ("current_occupancy" >= 0 AND "current_occupancy" <= "max_capacity")
);
--> statement-breakpoint
CREATE VIEW "v_zone_occupancy" AS (select "id", "name", "current_occupancy", "max_capacity", ("max_capacity" - "current_occupancy") as "available_spots", ROUND(("current_occupancy"::NUMERIC / "max_capacity") * 100, 1) as "occupancy_percentage", CASE WHEN "current_occupancy" >= "max_capacity" THEN 'FULL (LOCKED)' ELSE 'AVAILABLE' END as "gate_status" from "zones" where "zones"."is_active" = true);