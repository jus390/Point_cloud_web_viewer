const Koa = require("koa");
const Router = require("koa-router");
const BodyParser = require("koa-bodyparser");
const cors = require('@koa/cors');


const points = require("./controllers/points")

const server = new Koa();
const router = new Router();
server.use(cors())

server.use(async (ctx, next) => {
	const start = new Date();
	await next();
	const time = new Date() - start;
	console.log(`${ctx.method} ${ctx.url} - ${time} ms`);
	ctx.set("X-Response-Time", `${time} ms`);
});

router.get("/", points.fetchPoints);

router.post("/points", points.fetchPoints);
router.post("/points/batch", points.fetchPointsBatch);
router.post("/points/scale", points.scalePoints);
router.get("/points/generate", points.generatePoints);
router.get("/points/center", points.centerPoints);

server.use(BodyParser());
server.use(router.routes());
server.use(router.allowedMethods());

server.listen(1107);