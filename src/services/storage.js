const STORAGE_VERS = "agenthub_versions_v2";
const STORAGE_AGENTS = "agenthub_agents_v2";
const STORAGE_CONFIG = "agenthub_config_v1";

function getStorage() {
  if (typeof window !== "undefined" && window.storage) {
    return {
      async get(key) {
        const r = await window.storage.get(key);
        return r ? JSON.parse(r.value) : null;
      },
      async set(key, value) {
        await window.storage.set(key, JSON.stringify(value));
      }
    };
  }
  if (typeof localStorage !== "undefined") {
    return {
      async get(key) {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      },
      async set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    };
  }
  const mem = new Map();
  return {
    async get(key) { return mem.get(key) ?? null; },
    async set(key, value) { mem.set(key, value); }
  };
}

const store = getStorage();

export async function loadAgents() {
  return store.get(STORAGE_AGENTS);
}

export async function saveAgents(agents) {
  return store.set(STORAGE_AGENTS, agents);
}

export async function loadVersions() {
  return store.get(STORAGE_VERS);
}

export async function saveVersions(versions) {
  return store.set(STORAGE_VERS, versions);
}

export async function loadConfig() {
  return store.get(STORAGE_CONFIG);
}

export async function saveConfig(config) {
  return store.set(STORAGE_CONFIG, config);
}

export function fmtTs(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" }) + " " +
    d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
}
