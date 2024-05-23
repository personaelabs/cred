import { Client } from 'pg';

const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

export const credddDb = new Client({
  connectionString: DATABASE_URL,
});

export const getGroups = async () => {
  const groups = await credddDb.query<{
    id: string;
    displayName: string;
  }>(`  SELECT
      id,
      "displayName"
    FROM
      "Group"
    WHERE
      state = 'Recordable'
      `);

  return groups.rows;
};
