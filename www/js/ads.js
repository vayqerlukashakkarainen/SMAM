document.querySelector(".start-ad").addEventListener("click", function () {
	adsContainer.ShowRewardedAd();
});

var adsContainer = {
	npa: 0,
	iosAdId: "ca-app-pub-7908747033760630/3571170656",
	androidAdId: "ca-app-pub-7908747033760630/7071431961",
	devIosAdId: "ca-app-pub-3940256099942544/1712485313",
	devAndroidAdId: "ca-app-pub-3940256099942544/5224354917",
	adId: "",
	debug: false,
	rewarded: undefined,
	adLoadTries: 0,
	maxAdLoadTries: 3,
	form: undefined,
	consentStatus: 0,
	npa: "1",

	Setup: async function (save) {
		console.log("Setup ads");
		if (save.ads !== undefined) {
			this.consentStatus = save.ads.consentStatus;
		}

		if (this.debug) {
			admob.configure({
				testDeviceIds: [
					"8995bb506bc9386db0c4cbd69dd7b466",
					"DB6505B160C8BB680644D0C46BDEA3D9",
				],
			});
		}

		switch (cordova.platformId) {
			case "ios":
				if (this.debug) {
					this.adId = this.devIosAdId;
				} else {
					this.adId = this.iosAdId;
				}
				break;
			case "android":
				if (this.debug) {
					this.adId = this.devAndroidAdId;
				} else {
					this.adId = this.androidAdId;
				}
				break;
		}

		if (this.consentStatus === 0) {
			try {
				await consent.requestInfoUpdate();

				const formStatus = await consent.getFormStatus();
				if (formStatus === consent.FormStatus.Available) {
					this.form = await consent.loadForm();
					this.form.show();
				}

				this.consentStatus = 1;
				Save();
			} catch (error) {
				console.log(error);
			}
		}

		this.PrepareAd();
	},
	ResetConsent: function () {
		consent.reset();
	},
	LoadNewConsent: async function () {
		try {
			await consent.requestInfoUpdate();

			const formStatus = await consent.getFormStatus();
			if (formStatus === consent.FormStatus.Available) {
				this.form = await consent.loadForm();
				this.form.show();
			}
		} catch (error) {
			console.log(error);
		}
	},
	ShowRewardedAd: async function () {
		if (this.rewarded !== undefined) {
			if (this.adLoadTries >= this.maxAdLoadTries) {
				popcornContainer.HideMorePopcornContainer();
				popcornContainer.ShowReward(600, true);
				this.LoadAd();
			} else {
				console.log("Start ad");

				await this.rewarded.show();
			}

			this.adLoadTries = 0;
		}
	},
	PrepareAd: async function () {
		console.log("Preparing ad");

		this.rewarded = new admob.RewardedAd({
			adUnitId: this.adId,
			npa: this.npa,
		});

		this.rewarded.on("load", adsContainer.events.Load);
		this.rewarded.on("reward", adsContainer.events.GiveReward);
		this.rewarded.on("showFail", adsContainer.events.ShowFailed);
		this.rewarded.on("loadFail", adsContainer.events.LoadFailed);
		this.rewarded.on("dismiss", adsContainer.events.AdDismissed);

		this.LoadAd();
	},
	LoadAd: async function () {
		if (this.rewarded !== undefined) {
			console.log("Loading ad");
			await this.rewarded.load();
		} else {
			this.PrepareAd();
		}
	},
	events: {
		Load: async function (event) {
			console.log("Ad loaded");
		},
		AdDismissed: async function (event) {
			adsContainer.LoadAd();
		},
		GiveReward: async function (event) {
			console.log("Giving award!");
			popcornContainer.HideMorePopcornContainer();
			popcornContainer.ShowReward(1000, false);
			adsContainer.LoadAd();
		},
		LoadFailed: function (event) {
			if (adsContainer.adLoadTries < adsContainer.maxAdLoadTries) {
				setTimeout(function () {
					adsContainer.LoadAd();
					adsContainer.adLoadTries++;
					console.log(
						`Failed to load add, retrying... ${adsContainer.adLoadTries}`
					);
				}, 2000);
			}
		},
		ShowFailed: function (event) {
			popcornContainer.HideMorePopcornContainer();
			popcornContainer.ShowReward(600, true);
			adsContainer.LoadAd();
		},
	},
};
