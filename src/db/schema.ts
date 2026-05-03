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
        currency TEXT NOT NULL DEFAULT 'COP',
        displayOrder INTEGER DEFAULT 0
      );
    `);
  } catch (e) {
    console.error('Error creating accounts table:', e);
  }

  try {
    db.execSync(
      "ALTER TABLE accounts ADD COLUMN currency TEXT NOT NULL DEFAULT 'COP';",
    );
  } catch {}

  try {
    db.execSync(
      'ALTER TABLE accounts ADD COLUMN displayOrder INTEGER DEFAULT 0;',
    );
  } catch {}

  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT DEFAULT 'expense',
        icon TEXT,
        color TEXT,
        displayOrder INTEGER DEFAULT 0
      );
    `);

    db.execSync(
      "UPDATE categories SET icon = 'controller-classic' WHERE icon = 'game-controller';",
    );
    db.execSync(
      "UPDATE categories SET icon = 'food' WHERE icon = 'fast-food';",
    );
    db.execSync(
      "UPDATE categories SET icon = 'medical-bag' WHERE icon = 'medkit';",
    );
    db.execSync(
      "UPDATE categories SET icon = 'format-list-bulleted' WHERE icon = 'list';",
    );
    db.execSync(
      "UPDATE categories SET icon = 'briefcase' WHERE icon = 'business';",
    );
    db.execSync(
      "UPDATE categories SET icon = 'tshirt-crew' WHERE icon = 'shirt';",
    );
    db.execSync("UPDATE categories SET icon = 'coffee' WHERE icon = 'cafe';");
    db.execSync(
      "UPDATE categories SET icon = 'dumbbell' WHERE icon = 'fitness';",
    );
    db.execSync(
      "UPDATE categories SET icon = 'music-note' WHERE icon = 'musical-notes';",
    );
    db.execSync(
      "UPDATE categories SET icon = 'hamburger' WHERE icon = 'fast-food';",
    );
    db.execSync(
      "UPDATE categories SET icon = 'baby-carriage' WHERE icon = 'stroller';",
    );
    db.execSync(
      "UPDATE goals SET icon = 'cash-outline' WHERE icon = 'piggy-bank';",
    );
    db.execSync("UPDATE goals SET icon = 'stats-chart' WHERE icon = 'chart';");
  } catch (e) {
    console.error('Error creating/migrating categories table:', e);
  }

  try {
    db.execSync(
      'ALTER TABLE categories ADD COLUMN displayOrder INTEGER DEFAULT 0;',
    );
  } catch {}

  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        amount REAL NOT NULL,
        color TEXT,
        categoryId TEXT,
        displayOrder INTEGER DEFAULT 0,
        FOREIGN KEY(categoryId) REFERENCES categories(id) ON DELETE SET NULL
      );
    `);
  } catch (e) {
    console.error('Error creating budgets table:', e);
  }

  try {
    db.execSync('ALTER TABLE budgets ADD COLUMN categoryId TEXT;');
  } catch {}

  try {
    db.execSync(
      'ALTER TABLE budgets ADD COLUMN displayOrder INTEGER DEFAULT 0;',
    );
  } catch {}

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
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
      CREATE INDEX IF NOT EXISTS idx_transactions_accountId ON transactions(accountId);
      CREATE INDEX IF NOT EXISTS idx_transactions_categoryId ON transactions(categoryId);
    `);
  } catch (e) {
    console.error('Error creating transactions table:', e);
  }

  try {
    db.execSync('ALTER TABLE transactions ADD COLUMN budgetId TEXT;');
  } catch {
    // Column might already exist
  }

  try {
    db.execSync('ALTER TABLE transactions ADD COLUMN toAccountId TEXT;');
  } catch {
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
        status TEXT DEFAULT 'active',
        displayOrder INTEGER DEFAULT 0
      );
    `);
  } catch (e) {
    console.error('Error creating goals table:', e);
  }

  try {
    db.execSync('ALTER TABLE goals ADD COLUMN displayOrder INTEGER DEFAULT 0;');
  } catch {}

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
        icon: 'food',
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
        icon: 'controller-classic',
        color: '#ff9800',
      },
      {
        id: '5',
        name: t.catHealth,
        type: 'expense',
        icon: 'medical-bag',
        color: '#e91e63',
      },
      {
        id: '6',
        name: t.catOther,
        type: 'expense',
        icon: 'format-list-bulleted',
        color: '#607d8b',
      },
      {
        id: '7',
        name: t.catSalary,
        type: 'income',
        icon: 'cash',
        color: '#16A34A',
      },
      {
        id: '8',
        name: t.catOtherIncome,
        type: 'income',
        icon: 'wallet',
        color: '#009688',
      },
      {
        id: '9',
        name: t.catInvestments,
        type: 'expense',
        icon: 'chart-line',
        color: '#3f51b5',
      },
      {
        id: '10',
        name: t.catGifts,
        type: 'expense',
        icon: 'gift',
        color: '#ff4081',
      },
      {
        id: '11',
        name: t.catRent,
        type: 'expense',
        icon: 'home-city',
        color: '#795548',
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
  } else {
    // Check if Investments category (ID 9) exists, if not, add it
    const checkInvestments = db.getFirstSync<{ id: string }>(
      "SELECT id FROM categories WHERE id = '9'",
    );
    if (!checkInvestments) {
      db.runSync(
        'INSERT INTO categories (id, name, type, icon, color) VALUES (?, ?, ?, ?, ?)',
        ['9', t.catInvestments, 'expense', 'chart-line', '#3f51b5'],
      );
    }

    // Check if Gifts category (ID 10) exists
    const checkGifts = db.getFirstSync<{ id: string }>(
      "SELECT id FROM categories WHERE id = '10'",
    );
    if (!checkGifts) {
      db.runSync(
        'INSERT INTO categories (id, name, type, icon, color) VALUES (?, ?, ?, ?, ?)',
        ['10', t.catGifts, 'expense', 'gift', '#ff4081'],
      );
    }

    // Check if Rent category (ID 11) exists
    const checkRent = db.getFirstSync<{ id: string }>(
      "SELECT id FROM categories WHERE id = '11'",
    );
    if (!checkRent) {
      db.runSync(
        'INSERT INTO categories (id, name, type, icon, color) VALUES (?, ?, ?, ?, ?)',
        ['11', t.catRent, 'expense', 'home-city', '#795548'],
      );
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
