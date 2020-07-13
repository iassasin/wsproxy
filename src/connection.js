const WebSocket = require('ws');
const Trigger = require('./trigger');

module.exports = class Connection {
	socket = null;

	triggers = {
		opened: new Trigger(),
		closed: new Trigger(),
		newEvents: new Trigger(),
	};

	events = [];

	constructor(address) {
		let sock = new WebSocket(address);
		this.socket = sock;

		sock.on('open', () => {
			this.triggers.opened.permament();
			this.triggers.closed.resetPermament();
		});

		sock.on('close', () => {
			this.triggers.opened.resetPermament();
			this.triggers.closed.permament();
		});

		sock.on('message', (data) => {
			this.events.push({
				type: 'message',
				data,
			});
			this.triggers.newEvents.trigger();
		});

		sock.on('error', (err) => {
			this.events.push({
				type: 'error',
				error: err && err.message || err,
			});

			this.triggers.newEvents.trigger();
		});
	}

	hasEvents() {
		return this.events.length > 0;
	}

	consumeEvents() {
		let events = this.events;
		this.events = [];

		return events;
	}

	send(data) {
		this.socket.send(data);
	}

	close() {
		this.socket.close();
	}
}