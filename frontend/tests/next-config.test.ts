import { execFileSync } from 'child_process';
import { describe, expect, it } from 'vitest';

describe('next image config', () => {
  it('allows signed backend image URLs under /api/v1/images', () => {
    const output = execFileSync(
      'node',
      ['-e', "const config=require('./next.config.js'); process.stdout.write(JSON.stringify(config.images ?? {}));"],
      {
        cwd: process.cwd(),
        encoding: 'utf8',
      }
    );
    const images = JSON.parse(output);

    expect(images.localPatterns).toContainEqual({
      pathname: '/api/v1/images/**',
    });
  });
});
