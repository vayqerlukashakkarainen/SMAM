const types = {
	number: "number",
};
const UnlockableTypes = {
	WatchProviders: 1,
};

var popcornContainer = {
	claimValues: {
		chance: 50000,
		RandomizeValue: function () {
			var value = Math.floor(Math.random() * this.chance);
			var r = 0;

			this.values.forEach((val) => {
				if (value >= val.range[0] && value <= val.range[1]) {
					r = val.amount;
				}
			});

			return r;
		},
		values: [
			{
				range: [0, 2000],
				amount: 100,
			},
			{
				range: [1000, 1100],
				amount: 200,
			},
			{
				range: [2000, 2050],
				amount: 500,
			},
		],
	},
	startupClaimValue: 750,
	currentPopcorns: 0,
	popcornsUsed: 0,
	initValueClaimed: false,
	previousCost: 0,
	unlockedTypes: [],

	Setup: function (settings) {
		if (settings !== null) {
			this.initValueClaimed = settings.initValueClaimed;
			this.unlockedTypes = settings.unlockedTypes;
			this.AddPopcorns(settings.savedPopcorns, false, false);
			this.popcornsUsed = settings.popcornsUsed;
		}

		this.unlockedTypes.forEach((type) => {
			document
				.querySelectorAll(`*[data-unlock-type="${type}"]`)
				.forEach((el) => {
					el.dataset.popcornUnlocked = 1;
				});
		});

		this.ScanIfElementsIsLocked();
		this.RandomizeClaimOnStartup();
	},

	UsePopcorns: function (cost) {
		if (typeof cost !== types.number) {
			cost = parseInt(cost);
		}

		if (this.GotEnoughPopcorns(cost)) {
			this.currentPopcorns -= cost;
			this.previousCost = cost;
			this.popcornsUsed += cost;

			setTimeout(function () {
				var el = document.querySelector(
					"#popcorn_current_value_holder > span.popcorn"
				);
				var rect = el.getBoundingClientRect();

				pJSDom[0].pJS.fn.add(
					Math.floor(cost / 10),
					rect.x + rect.width / 2,
					rect.y + rect.height / 2,
					160
				);
				el.style.animation = null;
				el.focus();
				el.style.animation = "pulse 200ms ease";
			}, 200);

			this.UpdatePopcornValueHolders();

			this.ScanIfElementsIsLocked();

			Save();
			return true;
		}

		return false;
	},
	GotEnoughPopcorns: function (cost) {
		if (typeof cost !== types.number) {
			cost = parseInt(cost);
		}

		return this.currentPopcorns >= cost;
	},
	AddPopcorns: function (popcornsToAdd, scanElements = true, playAudio = true) {
		this.currentPopcorns += popcornsToAdd;
		var el = document.querySelector(
			"#popcorn_current_value_holder > span.popcorn"
		);

		this.UpdatePopcornValueHolders();
		el.style.animation = null;
		el.focus();
		el.style.animation = "pulse 100ms ease";
		if (playAudio) {
			mediaContainer.PlayAudio(mediaContainer.audio.popcornCernel);
		}

		Save();

		if (scanElements) {
			this.ScanIfElementsIsLocked();
		}
	},
	UpdatePopcornValueHolders: function () {
		document
			.querySelectorAll(".popcorn-current-value-container > span.popcorn")
			.forEach((el) => {
				el.textContent = this.currentPopcorns;
			});
	},
	GetRandomClaimText: function () {
		var texts = ["Yum!", "POPCORNS!!", "Claim", "Oh, nice!"];

		return texts[Math.floor(Math.random() * texts.length)];
	},
	GetRandomPraiseText: function () {
		var texts = [
			"Nice job!",
			"Thank you!",
			"We are happy you are here.",
			"You are awesome!",
		];

		return texts[Math.floor(Math.random() * texts.length)];
	},

	RandomizeClaimOnStartup: function () {
		var claimValue = 0;
		if (!this.initValueClaimed) {
			claimValue = this.startupClaimValue;
			document.querySelector(".app").classList.add("init");
		} else {
			claimValue = this.claimValues.RandomizeValue();
		}

		if (claimValue > 0) {
			document.querySelector(".intro > div").insertAdjacentHTML(
				"beforeend",
				`						
                <button data-claim-id="c2" data-claim-target="c2" data-init="${
									!this.initValueClaimed ? 1 : 0
								}" class="btn-default gold claim">
                    ${
											this.initValueClaimed
												? this.GetRandomClaimText()
												: "Get started"
										} <span class="popcorn" data-value="${claimValue}">${claimValue}</span>
                </button>`
			);

			this.ScanClaims();
		}
	},

	ScanClaims: function () {
		document.querySelectorAll(".claim").forEach((el) => {
			el.addEventListener("click", popcornContainer.events.ClaimOnClick);
		});
	},
	AddLockEvents: function () {
		document.querySelectorAll(".pop-lock").forEach((el) => {
			el.addEventListener("click", popcornContainer.events.PopLockClick);
		});
	},
	UnlockType: function (type) {
		if (type !== undefined) {
			switch (parseInt(type)) {
				case UnlockableTypes.WatchProviders:
					this.unlockedTypes.push(type);
					document
						.querySelectorAll(`*[data-unlock-type="${type}"]`)
						.forEach((el) => {
							el.dataset.popcornUnlocked = 1;
							this.RemovePopLock(el);
						});
					break;
			}
		}

		Save();
	},

	ScanIfElementsIsLocked: function () {
		document.querySelectorAll("*[data-popcorn-cost]").forEach((el) => {
			var cost = parseInt(el.dataset.popcornCost);
			var unlockable = el.dataset.popcornUnlocked !== undefined;
			if (cost > this.currentPopcorns || unlockable) {
				if (el.querySelector(".pop-lock") === null) {
					if (el.dataset.popcornUnlocked !== "1") {
						el.insertAdjacentHTML(
							"afterbegin",
							`
							<div class="pop-lock">
								<span class="popcorn neutral">Click to unlock${
									unlockable ? ` for ${cost}` : ""
								}</span>
							</div>`
						);
					}
				}
			} else {
				if (el.dataset.popcornUnlocked === undefined) {
					this.RemovePopLock(el);
				}
			}
		});

		this.AddLockEvents();
	},

	RemovePopLock: function (parentEl) {
		var popEl = parentEl.querySelector(".pop-lock");
		if (popEl !== null) {
			popEl.style.animation = "unlock 1s ease";
			popEl.addEventListener("animationend", function (event) {
				event.target.remove();
			});
		}
	},
	ShowReward: function (amount, adFailed) {
		if (amount > 0) {
			if (adFailed) {
				document.querySelector("#get_reward_container p").textContent =
					"The ad failed to load, but it's not your fault. So here is a reward anyway!";
			} else {
				document.querySelector(
					"#get_reward_container p"
				).textContent = `${this.GetRandomPraiseText()} Thank you for supporting us. Here is your reward`;
			}
			document.querySelector("#get_reward_container").classList.remove("hide");
			document.querySelector("#get_reward_container > div").insertAdjacentHTML(
				"beforeend",
				`						
                <button data-claim-id="c1" data-claim-target="c1" class="btn-default gold claim">
                    ${this.GetRandomClaimText()} <span class="popcorn" data-value="${amount}">${amount}</span>
                </button>`
			);

			this.ScanClaims();
		}
	},
	HideMorePopcornContainer: function () {
		document.querySelector("#more_popcorn_container").classList.add("hide");
	},

	events: {
		PopLockClick: function (event) {
			var el = event.currentTarget;
			event.preventDefault();
			event.stopPropagation();

			var parent = el.closest("*[data-popcorn-unlocked]");
			if (parent !== null) {
				var popcorns = parent.dataset.popcornCost;
				if (popcorns !== undefined) {
					if (popcornContainer.UsePopcorns(parent.dataset.popcornCost)) {
						popcornContainer.UnlockType(parent.dataset.unlockType);
						return;
					}
				}
			}

			document
				.querySelector("#more_popcorn_container")
				.classList.remove("hide");
		},
		ClaimOnClick: function (event) {
			var el = event.currentTarget;

			if (el.dataset.init === "1") {
				document
					.querySelector("#popcorn_info_container")
					.classList.remove("hide");
			} else {
				var popcorns = el.querySelector("*[data-value]").dataset.value;
				if (popcorns !== undefined) {
					var rect = event.currentTarget.getBoundingClientRect();
					pJSDom[0].pJS.fn.add(
						parseInt(popcorns) / 10,
						rect.x + rect.width / 2,
						rect.y + rect.height / 2,
						0
					);
				}

				document.querySelector(".app").classList.remove("init");

				// Remove the claim btn
				var claimTarget = el.dataset.claimTarget;
				if (claimTarget !== undefined) {
					popcornContainer.initValueClaimed = true;

					document
						.querySelectorAll(`.claim[data-claim-id="${claimTarget}"]`)
						.forEach((elTarget) => {
							// Fallback remove
							var timeoutRemove = setTimeout(function () {
								elTarget.remove();
							}, 2000);

							elTarget.style.animation = "claim 500ms ease";
							elTarget.addEventListener("transitionend", function () {
								clearTimeout(timeoutRemove);
								elTarget.remove();
							});
							elTarget.addEventListener("animationend", function () {
								elTarget.classList.add("remove");
							});
						});
				}

				// Hide container
				document.querySelector("#get_reward_container").classList.add("hide");

				mediaContainer.PlayAudio(mediaContainer.audio.bellMircowave);
			}
		},
	},
};
