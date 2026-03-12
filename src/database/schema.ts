import * as SQLite from 'expo-sqlite';

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
    // Column might already exist
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
    // Column might already exist
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
    // Standard ALTER TABLE ADD COLUMN in SQLite is simple
    db.execSync('ALTER TABLE transactions ADD COLUMN budgetId TEXT;');
  } catch (e) {
    // Column might already exist
  }

  const count = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories',
  );
  if (count && count.count === 0) {
    const defaultCategories = [
      { id: '1', name: 'Food', type: 'expense', icon: 'fast-food' },
      { id: '2', name: 'Transport', type: 'expense', icon: 'car' },
      { id: '3', name: 'Housing', type: 'expense', icon: 'home' },
      {
        id: '4',
        name: 'Entertainment',
        type: 'expense',
        icon: 'game-controller',
      },
      { id: '5', name: 'Health', type: 'expense', icon: 'medkit' },
      { id: '6', name: 'Other', type: 'expense', icon: 'list' },
      { id: '7', name: 'Salary', type: 'income', icon: 'cash' },
      { id: '8', name: 'Other Income', type: 'income', icon: 'wallet' },
    ];

    const statement = db.prepareSync(
      'INSERT INTO categories (id, name, type, icon) VALUES (?, ?, ?, ?)',
    );
    try {
      defaultCategories.forEach((cat) => {
        statement.executeSync([cat.id, cat.name, cat.type, cat.icon]);
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
      ['1', 'Main', 'cash', 0, 0, '#2196f3', 'COP'],
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
