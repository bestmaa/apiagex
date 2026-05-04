import { describe, expect, it } from 'vitest';

import { createInstallerPlan } from '../src/installer-plan.js';

describe('createInstallerPlan', () => {
  it('includes local SQLite setup for first-time users', () => {
    const plan = createInstallerPlan();

    expect(plan.databaseQuestions.sqlite).toEqual([
      {
        defaultValue: './data/apiagex.db',
        key: 'dbFile',
        label: 'SQLite database file',
        required: true,
      },
    ]);
  });

  it('asks required production database questions', () => {
    const plan = createInstallerPlan();

    expect(plan.databaseQuestions.postgres.map((question) => question.key)).toEqual([
      'dbHost',
      'dbPort',
      'dbName',
      'dbUser',
      'dbPassword',
    ]);
  });
});
