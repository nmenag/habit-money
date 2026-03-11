import * as SQLite from 'expo-sqlite';

export const getDb = () => {
  return SQLite.openDatabaseSync('finhabit.db');
};

export const initDb = () => {
  const db = getDb();

  db.execSync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      initialBalance REAL NOT NULL,
      currentBalance REAL NOT NULL,
      color TEXT
    );
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'expense',
      icon TEXT,
      color TEXT
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      categoryId TEXT,
      accountId TEXT NOT NULL,
      date TEXT NOT NULL,
      note TEXT,
      FOREIGN KEY(categoryId) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY(accountId) REFERENCES accounts(id) ON DELETE CASCADE
    );
  `);

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
      'INSERT INTO categories (id, name, type, icon) VALUES ($id, $name, $type, $icon)',
    );
    try {
      defaultCategories.forEach((cat) => {
        statement.executeSync({
          $id: cat.id,
          $name: cat.name,
          $type: cat.type,
          $icon: cat.icon,
        });
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
      'INSERT INTO accounts (id, name, type, initialBalance, currentBalance, color) VALUES ($id, $name, $type, $initialBalance, $currentBalance, $color)',
      {
        $id: '1',
        $name: 'Main',
        $type: 'cash',
        $initialBalance: 0,
        $currentBalance: 0,
        $color: '#2196f3',
      } as any,
    );
  }
};
