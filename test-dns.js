import dns from "node:dns/promises";

try {
  console.log("Resolving SRV...");
  const srv = await dns.resolveSrv("_mongodb._tcp.cluster0.brod8ce.mongodb.net");
  console.log("SRV:", srv);

  console.log("Resolving A...");
  const a = await dns.resolve4("ac-niemino-shard-00-00.brod8ce.mongodb.net");
  console.log("A:", a);
} catch (err) {
  console.error(err);
}