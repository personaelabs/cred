import { IDBPDatabase, openDB } from 'idb';
import { useEffect, useState } from 'react';

export const DB_NAME = 'creddd';
export const STORE_NAME = 'account';

/**
 * Returns an IndexedDB database object.
 */
const useIdb = () => {
  const [db, setDb] = useState<IDBPDatabase | null>(null);

  useEffect(() => {
    (async () => {
      const _db = await openDB(DB_NAME, 3, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            // Create a store of objects
            db.createObjectStore(STORE_NAME);
          }
        },
      });

      setDb(_db);
    })();
  }, []);

  return db;
};

export default useIdb;
