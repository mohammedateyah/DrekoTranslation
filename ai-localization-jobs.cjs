const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const { createBatches } = require("./gemini-translation.cjs");
const { buildLocalizationFile } = require("./localization-adapters.cjs");

const MAX_SAVED_JOBS = 10;
const MAX_CACHE_ENTRIES = 20000;

function countTranslations(translations) {
  return Object.keys(translations).length;
}

function cacheKey(entry, options) {
  return crypto.createHash("sha256").update(JSON.stringify([
    options.model,
    options.sourceLanguage,
    options.category,
    options.glossary,
    options.gameTitle || "",
    options.gameDescription || "",
    entry.text,
    entry.previous || "",
    entry.following || ""
  ])).digest("hex");
}

function publicJob(job) {
  return {
    id: job.id,
    fileName: job.adapter.displayFileName || job.adapter.fileName,
    format: job.adapter.format,
    gameId: job.gameId,
    gameTitle: job.gameTitle,
    model: job.options.model,
    status: job.status,
    total: job.adapter.entries.length,
    completed: countTranslations(job.translations),
    errors: job.errors.map((error) => ({
      code: error.code,
      remainingEntries: (error.remainingEntries || []).slice(0, 100)
    })),
    createdAt: job.createdAt
  };
}

class AiLocalizationJobs {
  constructor({ stateFile, translateBatch, getSessionToken, onProgress }) {
    this.stateFile = stateFile;
    this.translateBatch = translateBatch;
    this.getSessionToken = getSessionToken;
    this.onProgress = onProgress;
    this.jobs = new Map();
    this.cache = {};
    this.activeJobId = null;
    this.controllers = new Map();
    this.saveChain = Promise.resolve();
    this.cacheWrites = 0;
  }

  async initialize() {
    try {
      const saved = JSON.parse(await fs.readFile(this.stateFile, "utf8"));
      if (saved.version !== 1 || !Array.isArray(saved.jobs) ||
          !saved.cache || typeof saved.cache !== "object") {
        throw new Error("INVALID_AI_JOB_STATE");
      }
      this.cache = saved.cache;
      const cacheKeys = Object.keys(this.cache);
      for (const key of cacheKeys.slice(0, Math.max(0, cacheKeys.length - MAX_CACHE_ENTRIES))) {
        delete this.cache[key];
      }
      for (const job of saved.jobs) {
        if (!job || typeof job.id !== "string" || !job.adapter ||
            !Array.isArray(job.adapter.entries) || !job.translations) continue;
        if (job.options && typeof job.options === "object") {
          job.options.gameTitle ||= job.gameTitle || "";
          job.options.gameDescription ||= "";
        }
        if (job.status === "running") job.status = "interrupted";
        this.jobs.set(job.id, job);
      }
      this.cacheWrites = 0;
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    await this.persist();
  }

  async persist() {
    const snapshot = JSON.stringify({
      version: 1,
      cache: this.cache,
      jobs: [...this.jobs.values()].slice(-MAX_SAVED_JOBS)
    });
    this.saveChain = this.saveChain.catch(() => {}).then(async () => {
      await fs.mkdir(path.dirname(this.stateFile), { recursive: true });
      const temporaryFile = `${this.stateFile}.tmp`;
      await fs.writeFile(temporaryFile, snapshot, { mode: 0o600 });
      await fs.rename(temporaryFile, this.stateFile);
    });
    return this.saveChain;
  }

  list() {
    return [...this.jobs.values()].map(publicJob).reverse();
  }

  listForGame(gameId) {
    return this.list().filter((job) => job.gameId === gameId);
  }

  get(jobId) {
    return this.jobs.get(jobId) || null;
  }

  async create({
    adapter,
    sourcePath,
    gameId,
    gameTitle,
    gameDescription,
    model,
    sourceLanguage,
    category,
    glossary
  }) {
    if (this.activeJobId) throw Object.assign(new Error("TRANSLATION_JOB_ALREADY_RUNNING"), {
      code: "TRANSLATION_JOB_ALREADY_RUNNING"
    });
    if (!this.getSessionToken()) throw Object.assign(new Error("AUTH_REQUIRED"), {
      code: "AUTH_REQUIRED"
    });
    const safeGlossary = typeof glossary === "string" ? glossary.trim() : "";
    if (safeGlossary.length > 10000) throw Object.assign(new Error("INVALID_TRANSLATION_OPTIONS"), {
      code: "INVALID_TRANSLATION_OPTIONS"
    });
    const job = {
      id: crypto.randomUUID(),
      adapter,
      sourcePath,
      gameId,
      gameTitle,
      translations: Object.create(null),
      options: {
        model,
        sourceLanguage,
        category,
        glossary: safeGlossary,
        gameTitle,
        gameDescription
      },
      status: "running",
      errors: [],
      createdAt: new Date().toISOString()
    };
    this.jobs.set(job.id, job);
    this.activeJobId = job.id;
    const controller = new AbortController();
    this.controllers.set(job.id, controller);
    try {
      await this.persist();
    } catch (error) {
      this.jobs.delete(job.id);
      this.activeJobId = null;
      this.controllers.delete(job.id);
      throw Object.assign(new Error("Unable to create a persistent localization job."), {
        code: "AI_JOB_STORAGE_FAILED"
      });
    }
    void this.run(job, controller);
    return publicJob(job);
  }

  async resume(jobId) {
    if (this.activeJobId) throw Object.assign(new Error("TRANSLATION_JOB_ALREADY_RUNNING"), {
      code: "TRANSLATION_JOB_ALREADY_RUNNING"
    });
    const job = this.jobs.get(jobId);
    if (!job || !["failed", "cancelled", "interrupted"].includes(job.status)) {
      throw Object.assign(new Error("TRANSLATION_JOB_NOT_RESUMABLE"), {
        code: "TRANSLATION_JOB_NOT_RESUMABLE"
      });
    }
    if (!this.getSessionToken()) throw Object.assign(new Error("AUTH_REQUIRED"), {
      code: "AUTH_REQUIRED"
    });
    job.status = "running";
    job.errors = [];
    this.activeJobId = job.id;
    const controller = new AbortController();
    this.controllers.set(job.id, controller);
    try {
      await this.persist();
    } catch (error) {
      job.status = "interrupted";
      this.activeJobId = null;
      this.controllers.delete(job.id);
      throw Object.assign(new Error("Unable to save the resumed localization job."), {
        code: "AI_JOB_STORAGE_FAILED"
      });
    }
    void this.run(job, controller);
    return publicJob(job);
  }

  cancel(jobId) {
    const controller = this.controllers.get(jobId);
    if (!controller) return false;
    controller.abort();
    return true;
  }

  async run(job, controller) {
    const entries = job.adapter.entries;
    try {
      const batches = createBatches(entries);
      const entryIndexes = new Map(entries.map((entry, index) => [entry.id, index]));
      for (const batch of batches) {
        if (controller.signal.aborted) throw Object.assign(new Error("TRANSLATION_CANCELLED"), {
          code: "TRANSLATION_CANCELLED"
        });
        const pending = [];
        for (const entry of batch) {
          if (Object.hasOwn(job.translations, entry.id)) continue;
          const index = entryIndexes.get(entry.id);
          const contextualEntry = {
            ...entry,
            previous: index > 0 ? entries[index - 1].text : "",
            following: index + 1 < entries.length ? entries[index + 1].text : ""
          };
          const key = cacheKey(contextualEntry, job.options);
          if (typeof this.cache[key] === "string") {
            job.translations[entry.id] = this.cache[key];
          } else {
            pending.push(contextualEntry);
          }
        }
        if (pending.length) {
          const result = await this.translateBatch({
            idToken: this.getSessionToken(),
            model: job.options.model,
            entries: pending,
            options: job.options,
            signal: controller.signal
          });
          for (const entry of pending) {
            if (Object.hasOwn(result.translations, entry.id)) {
              job.translations[entry.id] = result.translations[entry.id];
              const key = cacheKey(entry, job.options);
              this.cache[key] = result.translations[entry.id];
              this.cacheWrites += 1;
              if (this.cacheWrites % 256 === 0) {
                const cacheKeys = Object.keys(this.cache);
                if (cacheKeys.length > MAX_CACHE_ENTRIES) {
                  for (const oldKey of cacheKeys.slice(0, cacheKeys.length - MAX_CACHE_ENTRIES)) {
                    delete this.cache[oldKey];
                  }
                }
              }
            }
          }
          if (result.errors.length) {
            job.errors = result.errors;
            await this.persist();
            this.onProgress?.(publicJob(job));
            const remainingEntries = result.errors
              .map((error) => error.id)
              .filter((id) => typeof id === "string");
            throw Object.assign(new Error(result.errors[0].code), {
              code: result.errors[0].code,
              remainingEntries
            });
          }
        }
        try {
          await this.persist();
        } catch (error) {
          console.error("Unable to persist AI localization progress:", error?.code || error?.name || "UNKNOWN");
          throw Object.assign(new Error("Unable to save translation progress."), {
            code: "AI_JOB_STORAGE_FAILED"
          });
        }
        this.onProgress?.(publicJob(job));
      }
      job.status = "completed";
    } catch (error) {
      job.status = error?.code === "TRANSLATION_CANCELLED" ||
        controller.signal.aborted ? "cancelled" : "failed";
      job.errors = [{
        code: error?.code || "TRANSLATION_FAILED",
        remainingEntries: error?.remainingEntries || entries
          .filter((entry) => !Object.hasOwn(job.translations, entry.id))
          .map((entry) => entry.id)
      }];
    } finally {
      this.activeJobId = null;
      this.controllers.delete(job.id);
      try {
        await this.persist();
      } catch (error) {
        job.status = "failed";
        job.errors = [{ code: "AI_JOB_STORAGE_FAILED", remainingEntries: [] }];
        console.error("Unable to save final AI localization state:", error?.code || error?.name || "UNKNOWN");
      }
      this.onProgress?.(publicJob(job));
    }
  }

  export(jobId) {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== "completed") {
      throw Object.assign(new Error("TRANSLATION_JOB_NOT_COMPLETE"), {
        code: "TRANSLATION_JOB_NOT_COMPLETE"
      });
    }
    return {
      fileName: job.adapter.displayFileName || job.adapter.fileName,
      sourcePath: job.adapter.archive?.sourceArchivePath || job.sourcePath,
      contents: buildLocalizationFile(job.adapter, job.translations),
      ...(job.adapter.archive ? { archive: job.adapter.archive } : {})
    };
  }
}

module.exports = { AiLocalizationJobs };
