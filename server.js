const Koa = require('koa');
const KoaRouter = require('@koa/router');
const rawBody = require('raw-body');
const inflate = require('inflation');

const config = require('./config.json');

const Connection = require('./src/connection');
const {wait} = require('./src/utils');

let app =  new Koa();
let router = new KoaRouter();
let connections = {};
let nextConnectionId = 0;

app.use(async (ctx, next) => {
	let err = null;
	let startTime = Date.now();

	try {
		await next();
	} catch (e) {
		err = e;
	}

	let requestTime = Date.now() - startTime;

	console.info(`[${ctx.ip}] ${ctx.response.status} {${requestTime} ms} => ${ctx.method} ${ctx.url} [${ctx.headers['user-agent']}]`);

	if (err) throw err;
});

router.use(async (ctx, next) => {
	ctx.request.rawBody = await rawBody(inflate(ctx.req), {limit: '1mb'});
	await next();
});

router.post('/open', async ctx => {
	let connectionId = ++nextConnectionId;
	let conn = new Connection(config.wsUrl);
	connections[connectionId] = conn;
	await conn.triggers.opened;
	ctx.response.body = {connectionId};
});

router.use(async (ctx, next) => {
	let connId = ctx.request.query.connectionId;
	let conn = connections[connId];

	if (!conn) {
		ctx.response.status = 404;
		ctx.response.body = {message: 'Unknown connection id'};
		return;
	}

	ctx.state.connectionId = connId;
	ctx.state.connection = conn;

	await next();
});

router.get('/events', async ctx => {
	let conn = ctx.state.connection;

	if (!conn.hasEvents()) {
		await Promise.race([wait(config.maxPollTime), conn.triggers.newEvents]);
	}

	ctx.response.body = conn.consumeEvents();
});

router.post('/message', async ctx => {
	ctx.state.connection.send(ctx.request.rawBody);
	ctx.response.status = 204;
});

router.post('/close', async ctx => {
	let conn = ctx.state.connection;

	conn.close();
	await conn.triggers.closed;

	delete connections[ctx.state.connectionId];

	ctx.response.status = 204;
});

app.use(router.routes());

app.listen(
	config.listen.port,
	config.listen.address,
	() => console.info(`http server listen on ${config.listen.address}:${config.listen.port}`)
);
