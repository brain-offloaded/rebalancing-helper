const { spawnSync } = require('node:child_process');

const rawArgs = process.argv.slice(2);

let migrationName;
const passthroughArgs = [];

for (let i = 0; i < rawArgs.length; i += 1) {
  const current = rawArgs[i];

  if (current === '--name') {
    const next = rawArgs[i + 1];
    if (!next || next.startsWith('-')) {
      console.error('Error: Missing value for --name. Usage: pnpm prisma:migrate --name <migration_name>');
      process.exit(1);
    }

    migrationName = next;
    i += 1;
    continue;
  }

  if (current.startsWith('--name=')) {
    const [, value] = current.split('=');
    if (!value) {
      console.error('Error: Missing value for --name. Usage: pnpm prisma:migrate --name <migration_name>');
      process.exit(1);
    }

    migrationName = value;
    continue;
  }

  passthroughArgs.push(current);
}

if (!migrationName) {
  console.error('Error: Missing --name. Usage: pnpm prisma:migrate --name <migration_name>');
  process.exit(1);
}

const prismaArgs = ['migrate', 'dev', '--create-only', '--name', migrationName, ...passthroughArgs];

const result = spawnSync('prisma', prismaArgs, { stdio: 'inherit' });

if (result.error) {
  console.error(`Failed to run prisma migrate: ${result.error.message}`);
  process.exit(1);
}

if (typeof result.status === 'number') {
  process.exit(result.status);
}

if (result.signal) {
  console.error(`prisma migrate exited due to signal: ${result.signal}`);
  process.exit(1);
}

process.exit(0);
