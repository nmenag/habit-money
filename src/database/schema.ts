import * as Localization from 'expo-localization';
import * as SQLite from 'expo-sqlite';
import { translations } from '../i18n/translations';

let cachedDb: SQLite.SQLiteDatabase | null = null;

export const getDb = () => {
  if (!cachedDb) {
    cachedDb = SQLite.openDatabaseSync('finhabit.db');
  }
  return cachedDb;
};

export const initDb = () => {
  const db = getDb();

  db.execSync('PRAGMA journal_mode = WAL;');

  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        initialBalance REAL NOT NULL,
        currentBalance REAL NOT NULL,
        color TEXT,
        currency TEXT NOT NULL DEFAULT 'COP'
      );
    `);
  } catch (e) {
    console.error('Error creating accounts table:', e);
  }

  try {
    db.execSync(
      "ALTER TABLE accounts ADD COLUMN currency TEXT NOT NULL DEFAULT 'COP';",
    );
  } catch (e) {
  }

  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT DEFAULT 'expense',
        icon TEXT,
        color TEXT
      );
    `);
  } catch (e) {
    console.error('Error creating categories table:', e);
  }

  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        amount REAL NOT NULL,
        color TEXT,
        categoryId TEXT,
        FOREIGN KEY(categoryId) REFERENCES categories(id) ON DELETE SET NULL
      );
    `);
  } catch (e) {
    console.error('Error creating budgets table:', e);
  }

  try {
    db.execSync('ALTER TABLE budgets ADD COLUMN categoryId TEXT;');
  } catch (e) {
  }

  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        val TEXT NOT NULL
      );
    `);

    // Migration: If table was created with old names, try to rename columns
    // SQLite doesn't support multiple renames in one go easily, so we check columns
    const columns = db.getAllSync<{ name: string }>(
      'PRAGMA table_info(settings)',
    );
    const hasKey = columns.some((c) => c.name === 'key');
    if (hasKey) {
      db.execSync("ALTER TABLE settings RENAME COLUMN 'key' TO 'id'");
      db.execSync("ALTER TABLE settings RENAME COLUMN 'value' TO 'val'");
    }
  } catch (e) {
    console.error('Error creating/migrating settings table:', e);
  }

  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        categoryId TEXT,
        accountId TEXT NOT NULL,
        budgetId TEXT,
        date TEXT NOT NULL,
        note TEXT,
        FOREIGN KEY(categoryId) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY(accountId) REFERENCES accounts(id) ON DELETE CASCADE
      );
    `);
  } catch (e) {
    console.error('Error creating transactions table:', e);
  }

  try {
    db.execSync('ALTER TABLE transactions ADD COLUMN budgetId TEXT;');
  } catch (e) {
    // Column might already exist
  }

  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        targetAmount REAL NOT NULL,
        currentAmount REAL NOT NULL DEFAULT 0,
        color TEXT,
        icon TEXT,
        deadline TEXT,
        status TEXT DEFAULT 'active'
      );
    `);
  } catch (e) {
    console.error('Error creating goals table:', e);
  }

  const locales = Localization.getLocales();
  const langCode = locales[0]?.languageCode === 'es' ? 'es' : 'en';
  const t = (translations as any)[langCode];

  const count = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories',
  );
  if (count && count.count === 0) {
    const defaultCategories = [
      {
        id: '1',
        name: t.catFood,
        type: 'expense',
        icon: 'fast-food',
        color: '#f44336',
      },
      {
        id: '2',
        name: t.catTransport,
        type: 'expense',
        icon: 'car',
        color: '#2196f3',
      },
      {
        id: '3',
        name: t.catHousing,
        type: 'expense',
        icon: 'home',
        color: '#9c27b0',
      },
      {
        id: '4',
        name: t.catEntertainment,
        type: 'expense',
        icon: 'game-controller',
        color: '#ff9800',
      },
      {
        id: '5',
        name: t.catHealth,
        type: 'expense',
        icon: 'medkit',
        color: '#e91e63',
      },
      {
        id: '6',
        name: t.catOther,
        type: 'expense',
        icon: 'list',
        color: '#607d8b',
      },
      {
        id: '7',
        name: t.catSalary,
        type: 'income',
        icon: 'cash',
        color: '#4caf50',
      },
      {
        id: '8',
        name: t.catOtherIncome,
        type: 'income',
        icon: 'wallet',
        color: '#009688',
      },
    ];

    const statement = db.prepareSync(
      'INSERT INTO categories (id, name, type, icon, color) VALUES (?, ?, ?, ?, ?)',
    );
    try {
      defaultCategories.forEach((cat) => {
        statement.executeSync([
          cat.id,
          cat.name,
          cat.type,
          cat.icon,
          cat.color,
        ]);
      });
    } finally {
      statement.finalizeSync();
    }
  }

  const accountCount = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM accounts',
  );
  if (accountCount && accountCount.count === 0) {
    db.runSync(
      'INSERT INTO accounts (id, name, type, initialBalance, currentBalance, color, currency) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['1', t.defaultAccountName, 'bank', 0, 0, '#2196f3', 'COP'],
    );
  }

  const settingsCount = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM settings',
  );
  if (settingsCount && settingsCount.count === 0) {
    db.runSync('INSERT INTO settings (id, val) VALUES (?, ?)', [
      'currency',
      'COP',
    ]);
  }
};
