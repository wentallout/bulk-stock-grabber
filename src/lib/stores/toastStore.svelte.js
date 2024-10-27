// toastStore.js
import { writable } from 'svelte/store';

function createToastStore() {
	const { subscribe, update } = writable([]);

	let id = $state(0);

	function createToast(msg, options = {}) {
		const defaults = {
			id: ++id,
			msg,
			duration: 4000,
			pausable: false,
			dismissable: true,
			initial: 0,
			progress: 100,
			intro: { x: 256 },
			theme: {},
			classes: [],
			createdAt: Date.now(),
			pausedAt: null,
			component: null
		};

		const toast = { ...defaults, ...options };

		if (toast.duration !== Infinity) {
			toast.timeoutId = setTimeout(() => remove(toast.id), toast.duration);
			toast.intervalId = setInterval(() => updateProgress(toast.id), 10);
		}

		return toast;
	}

	function updateProgress(id) {
		update((toasts) => {
			const toast = toasts.find((t) => t.id === id);
			if (toast && !toast.pausedAt) {
				const elapsed = Date.now() - toast.createdAt;
				toast.progress = 100 - (elapsed / toast.duration) * 100;
				if (toast.progress <= 0) {
					clearInterval(toast.intervalId);
				}
			}
			return toasts;
		});
	}

	return {
		subscribe,
		push: (msg, options) => {
			const toast = createToast(msg, options);
			update((toasts) => [toast, ...toasts]);
			return toast.id;
		},
		pop: (id) => {
			if (id === undefined) {
				update((toasts) => {
					const [, ...rest] = toasts;
					return rest;
				});
			} else if (typeof id === 'number') {
				remove(id);
			} else if (id && typeof id.target === 'string') {
				update((toasts) => toasts.filter((t) => t.target !== id.target));
			}
		},
		remove,
		set: (id, options) => {
			update((toasts) => {
				const index = toasts.findIndex((t) => t.id === id);
				if (index !== -1) {
					toasts[index] = { ...toasts[index], ...options };
				}
				return toasts;
			});
		}
	};

	function remove(id) {
		update((toasts) => {
			const toast = toasts.find((t) => t.id === id);
			if (toast) {
				clearTimeout(toast.timeoutId);
				clearInterval(toast.intervalId);
			}
			return toasts.filter((t) => t.id !== id);
		});
	}
}

export const toastStore = createToastStore();

export const toast = {
	push: toastStore.push,
	pop: toastStore.pop,
	set: toastStore.set
};
