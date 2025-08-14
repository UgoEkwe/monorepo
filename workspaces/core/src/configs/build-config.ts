import type { WorkspaceMetadata } from '../types';

/**
 * Build configuration templates for different workspace types
 */
export const buildConfigs: Record<string, Partial<WorkspaceMetadata>> = {
  web: {
    type: 'web',
    language: 'typescript',
    framework: 'nextjs',
    buildConfig: {
      outputs: ['.next/**', 'out/**'],
      command: 'npm run build',
      devCommand: 'npm run dev',
      testCommand: 'npm run test',
    },
    features: {
      tailwind: true,
      supabase: true,
    },
  },
  mobile: {
    type: 'mobile',
    language: 'typescript',
    framework: 'expo',
    buildConfig: {
      outputs: ['dist/**', '.expo/**'],
      command: 'npm run build',
      devCommand: 'npm run start',
      testCommand: 'npm run test',
    },
    features: {
      supabase: true,
    },
  },
  backend: {
    type: 'backend',
    language: 'python',
    framework: 'fastapi',
    buildConfig: {
      outputs: ['__pycache__/**', 'dist/**'],
      command: 'python -m build',
      devCommand: 'python main.py',
      testCommand: 'pytest',
    },
    features: {
      database: true,
    },
  },
  service: {
    type: 'service',
    language: 'typescript',
    buildConfig: {
      outputs: ['dist/**'],
      command: 'npm run build',
      devCommand: 'npm run dev',
      testCommand: 'npm run test',
    },
  },
  library: {
    type: 'library',
    language: 'typescript',
    buildConfig: {
      outputs: ['dist/**'],
      command: 'npm run build',
      devCommand: 'npm run dev',
      testCommand: 'npm run test',
    },
  },
};

/**
 * Get build configuration for workspace type
 */
export function getBuildConfig(type: string): Partial<WorkspaceMetadata> {
  return buildConfigs[type] || buildConfigs.library;
}

/**
 * Generate Turbo pipeline configuration for workspace
 */
export function generateTurboPipeline(workspace: string, metadata: WorkspaceMetadata) {
  const pipeline: Record<string, any> = {};

  // Dev task
  pipeline[`dev:${workspace}`] = {
    cache: true,
    persistent: true,
    dependsOn: ['^build:core'],
    env: ['NODE_ENV', 'ENABLE_*'],
  };

  // Build task
  pipeline[`build:${workspace}`] = {
    dependsOn: ['^build'],
    outputs: metadata.buildConfig.outputs,
  };

  // Test task
  if (metadata.buildConfig.testCommand) {
    pipeline[`test:${workspace}`] = {
      dependsOn: [],
      cache: true,
      outputs: ['coverage/**'],
    };
  }

  return pipeline;
}