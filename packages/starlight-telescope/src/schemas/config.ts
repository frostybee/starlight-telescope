import { z } from 'zod';

// Keyboard shortcut schema
export const ShortcutSchema = z
  .object({
    key: z.string().default('/'),
    ctrl: z.boolean().default(true),
    meta: z.boolean().default(true), // Cmd on Mac
    shift: z.boolean().default(false),
    alt: z.boolean().default(false),
  })
  .default({});

// Fuse.js options schema - optimized for quick page navigation
export const FuseOptionsSchema = z
  .object({
    threshold: z.number().min(0).max(1).default(0.3),
    ignoreLocation: z.boolean().default(true),
    distance: z.number().default(100),
    minMatchCharLength: z.number().default(2),
    findAllMatches: z.boolean().default(false),
    keys: z
      .array(
        z.object({
          name: z.string(),
          weight: z.number(),
        })
      )
      .default([
        { name: 'title', weight: 1.0 },
        { name: 'path', weight: 0.6 },
        { name: 'tags', weight: 0.5 },
        { name: 'description', weight: 0.3 },
      ]),
  })
  .default({});

// Theme customization schema
export const ThemeSchema = z
  .object({
    overlayBackground: z.string().optional(),
    modalBackground: z.string().optional(),
    modalBackgroundAlt: z.string().optional(),
    accentColor: z.string().optional(),
    accentHover: z.string().optional(),
    accentSelected: z.string().optional(),
    textPrimary: z.string().optional(),
    textSecondary: z.string().optional(),
    border: z.string().optional(),
    borderActive: z.string().optional(),
    pinColor: z.string().optional(),
    tagColor: z.string().optional(),
  })
  .default({});

// Main config schema
export const TelescopeConfigSchema = z
  .object({
    shortcut: ShortcutSchema,
    fuseOptions: FuseOptionsSchema,
    recentPagesCount: z.number().min(0).max(20).default(5),
    maxResults: z.number().min(1).max(100).default(20),
    debounceMs: z.number().min(0).max(1000).default(100),
    theme: ThemeSchema,
  })
  .default({});

// Inferred types
export type TelescopeConfig = z.infer<typeof TelescopeConfigSchema>;
export type TelescopeUserConfig = z.input<typeof TelescopeConfigSchema>;
export type TelescopeShortcut = z.infer<typeof ShortcutSchema>;
export type TelescopeFuseOptions = z.infer<typeof FuseOptionsSchema>;
export type TelescopeTheme = z.infer<typeof ThemeSchema>;

// Page data structure
export interface TelescopePage {
  title: string;
  path: string;
  description?: string;
  tags?: string[];
}
