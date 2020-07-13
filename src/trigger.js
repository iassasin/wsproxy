module.exports = class Trigger {
	// { type: 'error' | 'success', data: any}
	#permamentResult = null;
	#subscribers = [];

	then(resolved, rejected) {
		if (this.#permamentResult) {
			let res = this.#permamentResult;
			res.type === 'error' ? resolved(res.data) : rejected(res.data);
		} else {
			this.#subscribers.push({resolved, rejected});
		}
	}

	trigger(data, error = false) {
		let subs = this.#subscribers;
		this.#subscribers = [];

		for (let sub of subs) {
			error ? sub.rejected(data) : sub.resolved(data);
		}
	}

	permament(data, error = false) {
		let subs = this.#subscribers;
		this.#subscribers = [];
		this.#permamentResult = {
			type: error ? 'error' : 'success',
			data,
		}

		for (let sub of subs) {
			error ? sub.rejected(data) : sub.resolved(data);
		}
	}
};