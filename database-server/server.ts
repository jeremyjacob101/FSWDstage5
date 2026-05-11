import authMiddleware from "./auth-middleware";
import jsonServer from "json-server";

const API_PORT_NUMBER = 1837;
const API_BASE_URL = `http://localhost:${API_PORT_NUMBER}`;

const server = jsonServer.create();
const router = jsonServer.router("./database-server/database/db.json");
const defaultMiddlewares = jsonServer.defaults();

server.use(defaultMiddlewares);
server.use(jsonServer.bodyParser);
server.use(authMiddleware as unknown as Parameters<typeof server.use>[0]);
server.use(router);

server.listen(API_PORT_NUMBER, () => {
  console.log(`JSON Server is running on ${API_BASE_URL}`);
});
