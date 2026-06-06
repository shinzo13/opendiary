import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		include: ['src/**/*.{test,spec}.ts'],
		// auth.ts reads JWT_SECRET at import time
		env: { JWT_SECRET: 'test-secret-key' }
	}
});
