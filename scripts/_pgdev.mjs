// Ephemeral Postgres for local verification only. Not part of the app.
import os from "node:os";
import path from "node:path";
import EmbeddedPostgres from "embedded-postgres";

// Keep the data dir OUTSIDE the project so Next's file watcher doesn't reload.
const pg = new EmbeddedPostgres({
  databaseDir: path.join(os.tmpdir(), "fn-pgdev"),
  user: "postgres",
  password: "postgres",
  port: 5433,
  persistent: false,
});

await pg.initialise();
await pg.start();
try {
  await pg.createDatabase("store");
} catch (e) {
  console.log("createDatabase:", e.message);
}
console.log("READY postgresql://postgres:postgres@localhost:5433/store");

const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
setInterval(() => {}, 1 << 30); // keep alive
