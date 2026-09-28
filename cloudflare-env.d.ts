declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    OTM_SETUP_SECRET?: string;
  }
}
