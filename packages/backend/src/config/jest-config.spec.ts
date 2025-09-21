import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Jest 커버리지 설정', () => {
  it('엔티티 파일을 커버리지에서 제외하도록 정의한다', () => {
    const packageJsonPath = join(__dirname, '..', '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    const patterns: string[] = packageJson.jest?.collectCoverageFrom ?? [];

    expect(patterns).toEqual(expect.arrayContaining(['!**/*.entities.ts']));
  });
});
