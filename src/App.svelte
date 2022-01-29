<script lang="ts">
	import type { SecretNumberSnappInterface } from "./global";

	import { onMount } from "svelte";

	// snapp artifacts
	let snapp: SecretNumberSnappInterface;
	let isSnarkyLoaded = false;

	// app state
	let isDeployed = false;
	let isSet = false;
	let guess: number;
	let initialValue: number;
	let promptText = "Input a value to be the secret number";

	onMount(async () => {
		let snappSourceCode = await import("./snapp/secretNumberSnapp");
		console.log("loading snarky");
		await snappSourceCode.load();
		console.log("loaded snarky!");
		isSnarkyLoaded = true;
	});

	const setPuzzle = async function () {
		let snappSourceCode = await import("./snapp/secretNumberSnapp");

		console.log(initialValue);
		if (isDeployed) {
			await snapp.resetPuzzle(initialValue);
		} else {
			console.log(initialValue);
			snapp = await snappSourceCode.deploy(initialValue);
			isDeployed = true;
		}
		isSet = true;
		console.log(isDeployed);
		await setCorrectlyGuessed();
		promptText = "Submit a guess - What is the secret number?";
	};

	const setCorrectlyGuessed = async function () {
		console.log("setting state");
		const snappState = await snapp.getSnappState();
		console.log(snappState);
		if (snappState.isCorrect) {
			isSet = false;
			promptText = "Input a value to be the secret number";
		}
	};

	const evaluateGuess = async function () {
		await snapp.submitGuess(guess);
		await setCorrectlyGuessed();
	};
</script>

<main>
	<h1>Secret Number Snapp!</h1>
	{#if isSnarkyLoaded}
		<p>{promptText}</p>
		{#if isSet}
			<input bind:value={guess} type="number" />
			<button on:click={() => evaluateGuess()}>Submit Guess</button>
		{:else}
			<input bind:value={initialValue} type="number" />
			<button on:click={() => setPuzzle()}>Set Puzzle</button>
		{/if}
	{:else}
		<p>Waiting for Snarky JS to load...</p>
	{/if}
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>
