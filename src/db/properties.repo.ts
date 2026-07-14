import { getDb } from './client';
import type { PropertyApi, PropertyDetailApi, Region, PropertyStatus } from '../types/api';
import type { Property, Room } from '../types/domain';

function fromApi(p: PropertyApi, syncedAt: number): Property {
  return {
    id: p.id,
    name: p.name,
    address: p.address,
    unitCount: p.unit_count,
    region: p.region,
    lastInspectedAt: p.last_inspected_at,
    status: p.status,
    version: p.version,
    syncedAt,
  };
}

function rowToProperty(row: any): Property {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    unitCount: row.unit_count,
    region: row.region,
    lastInspectedAt: row.last_inspected_at,
    status: row.status,
    version: row.version,
    syncedAt: row.synced_at,
  };
}

export async function upsertProperties(list: PropertyApi[]): Promise<void> {
  if (list.length === 0) return;
  const db = await getDb();
  const now = Date.now();
  await db.withTransactionAsync(async () => {
    for (const p of list) {
      const property = fromApi(p, now);
      await db.runAsync(
        `INSERT INTO properties (id, name, address, unit_count, region, last_inspected_at, status, version, synced_at)
         VALUES ($id, $name, $address, $unit_count, $region, $last_inspected_at, $status, $version, $synced_at)
         ON CONFLICT(id) DO UPDATE SET
           name=excluded.name, address=excluded.address, unit_count=excluded.unit_count,
           region=excluded.region, last_inspected_at=excluded.last_inspected_at,
           status=excluded.status, version=excluded.version, synced_at=excluded.synced_at`,
        {
          $id: property.id,
          $name: property.name,
          $address: property.address,
          $unit_count: property.unitCount,
          $region: property.region,
          $last_inspected_at: property.lastInspectedAt,
          $status: property.status,
          $version: property.version,
          $synced_at: property.syncedAt,
        },
      );
    }
  });
}

export async function upsertPropertyDetail(detail: PropertyDetailApi): Promise<void> {
  const db = await getDb();
  await upsertProperties([detail]);
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM rooms WHERE property_id = ?', [detail.id]);
    for (const room of detail.rooms) {
      await db.runAsync(
        'INSERT INTO rooms (property_id, id, label, floor) VALUES (?, ?, ?, ?)',
        [detail.id, room.id, room.label, room.floor],
      );
    }
  });
}

export interface SearchParams {
  q?: string;
  region?: Region;
  status?: PropertyStatus;
  limit?: number;
  offset?: number;
}

export async function searchProperties(params: SearchParams): Promise<Property[]> {
  const db = await getDb();
  const limit = Math.min(params.limit ?? 50, 200);
  const offset = params.offset ?? 0;

  const clauses: string[] = [];
  const args: Record<string, any> = { $limit: limit, $offset: offset };

  if (params.q) {
    clauses.push('(name LIKE $q COLLATE NOCASE OR address LIKE $q COLLATE NOCASE)');
    args.$q = `%${params.q}%`;
  }
  if (params.region) {
    clauses.push('region = $region');
    args.$region = params.region;
  }
  if (params.status) {
    clauses.push('status = $status');
    args.$status = params.status;
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = await db.getAllAsync(
    `SELECT * FROM properties ${where} ORDER BY name ASC LIMIT $limit OFFSET $offset`,
    args,
  );
  return rows.map(rowToProperty);
}

export async function getProperty(id: string): Promise<Property | null> {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT * FROM properties WHERE id = ?', [id]);
  return row ? rowToProperty(row) : null;
}

export async function getRoomsForProperty(propertyId: string): Promise<Room[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ property_id: string; id: string; label: string; floor: number }>(
    'SELECT * FROM rooms WHERE property_id = ? ORDER BY floor ASC, label ASC',
    [propertyId],
  );
  return rows.map((r) => ({ propertyId: r.property_id, id: r.id, label: r.label, floor: r.floor }));
}

export async function countProperties(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM properties');
  return row?.count ?? 0;
}
