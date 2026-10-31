import "server-only";
import { db } from "./db";
import { env } from "./env";

// Well-known AppSetting keys
export const SETTINGS_KEYS = {
  apiKey: "xrouter_api_key",
  enabledModels: "enabled_models", // string[] — when null/absent, all models are allowed
  baseUrl: "xrouter_base_url",
} as const;

async function getSetting<T>(key: string): Promise<T | null> {
  const row = await db.appSetting.findUnique({ where: { key } });
  return row ? ((row.value as unknown) as T) : null;
}

async function setSetting<T>(key: string, value: T) {
  await db.appSetting.upsert({
    where: { key },
    create: { key, value: value as never },
    update: { value: value as never },
  });
}

/** Effective API key: admin override in DB, else env. */
export async function getApiKey(): Promise<string> {
  const stored = await getSetting<string>(SETTINGS_KEYS.apiKey);
  return stored && stored.trim() ? stored : env.xrouterApiKey;
}

export async function getBaseUrl(): Promise<string> {
  const stored = await getSetting<string>(SETTINGS_KEYS.baseUrl);
  return stored && stored.trim() ? stored : env.xrouterBaseUrl;
}

/** null = all models allowed; array = allow-list of model ids. */
export async function getEnabledModels(): Promise<string[] | null> {
  return getSetting<string[]>(SETTINGS_KEYS.enabledModels);
}

export async function setApiKey(value: string) {
  await setSetting(SETTINGS_KEYS.apiKey, value);
}
export async function setEnabledModels(ids: string[] | null) {
  await setSetting(SETTINGS_KEYS.enabledModels, ids);
}

export async function getAllSettings() {
  return {
    apiKeySet: Boolean(await getSetting<string>(SETTINGS_KEYS.apiKey)),
    apiKeyPreview: maskKey(await getApiKey()),
    baseUrl: await getBaseUrl(),
    enabledModels: await getEnabledModels(),
  };
}

function maskKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "••••";
  return `${key.slice(0, 5)}…${key.slice(-4)}`;
}
