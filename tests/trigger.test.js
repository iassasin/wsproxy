const Trigger = require('../src/trigger');

const wait = time => new Promise(res => setTimeout(res, time));

describe('Trigger', () => {
	test('resumes on trigger await', async () => {
		let trigger = new Trigger();

		let triggerer = wait(5).then(() => {
			trigger.trigger('test');
		});

		await Promise.all([triggerer, (async () => {
			expect(await trigger).toBe('test');
		})()]);
	}, 1000);

	test('resumes on trigger two times', async () => {
		let trigger = new Trigger();

		let triggerer = wait(5).then(() => {
			trigger.trigger('test');
			return wait(5);
		}).then(() => {
			trigger.trigger('pass');
		});

		let cont = jest.fn();

		await Promise.all([triggerer, (async () => {
			expect(await hookTrigger(trigger, cont)).toBe('test');
			expect(await hookTrigger(trigger, cont)).toBe('pass');
		})()]);

		expect(cont.mock.calls.length).toBe(2);
	}, 1000);

	test('resumes on trigger only once', async () => {
		let trigger = new Trigger();

		let triggerer = wait(5).then(() => {
			trigger.trigger('test');
			trigger.trigger('no');
			return wait(5);
		}).then(() => {
			trigger.trigger('no 2');
		});

		let cont = jest.fn();

		await Promise.all([triggerer, (async () => {
			expect(await hookTrigger(trigger, cont)).toBe('test');
		})()]);

		expect(cont.mock.calls.length).toBe(1);
	}, 1000);
});

async function hookTrigger(trigger, hook) {
	return new Promise((res, rej) => trigger.then(r => {
		hook();
		res(r);
	}, rej))
}