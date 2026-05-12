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
    db.execSync(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT DEFAULT 'expense',
        icon TEXT DEFAULT 'tag',
        color TEXT,
        displayOrder INTEGER DEFAULT 0
      );
    `);

    // Set default icon if missing
    db.execSync(
      "UPDATE categories SET icon = 'tag' WHERE icon IS NULL OR icon = '';",
    );
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
        displayOrder INTEGER DEFAULT 0,
        FOREIGN KEY(categoryId) REFERENCES categories(id) ON DELETE SET NULL
      );
    `);
  } catch (e) {
    console.error('Error creating budgets table:', e);
  }

  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        val TEXT NOT NULL
      );
    `);
  } catch (e) {
    console.error('Error creating settings table:', e);
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
        toAccountId TEXT,
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
    db.execSync(`
      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        targetAmount REAL NOT NULL,
        currentAmount REAL NOT NULL DEFAULT 0,
        color TEXT,
        icon TEXT DEFAULT 'trophy',
        deadline TEXT,
        status TEXT DEFAULT 'active',
        displayOrder INTEGER DEFAULT 0
      );
    `);

    try {
      db.execSync(
        "UPDATE goals SET icon = 'trophy' WHERE icon IS NULL OR icon = '';",
      );
    } catch {}
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
      {
        id: '12',
        name: t.catBills,
        type: 'expense',
        icon: 'receipt',
        color: '#ff5722',
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
    // Ensure existing databases get the new category if missing
    try {
      const billsCat = db.getFirstSync<{ id: string }>(
        "SELECT id FROM categories WHERE id = '12' OR name = ? OR name = ?",
        [t.catBills, 'Bills & Taxes'],
      );
      if (!billsCat) {
        const maxOrder = db.getFirstSync<{ maxOrder: number }>(
          'SELECT MAX(displayOrder) as maxOrder FROM categories',
        );
        const displayOrder = (maxOrder?.maxOrder || 0) + 1;
        db.runSync(
          'INSERT INTO categories (id, name, type, icon, color, displayOrder) VALUES (?, ?, ?, ?, ?, ?)',
          ['12', t.catBills, 'expense', 'receipt', '#ff5722', displayOrder],
        );
      }
    } catch (e) {
      console.error('Error adding Bills & Taxes category to existing DB:', e);
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
