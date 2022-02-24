document.querySelector(".start-ad").addEventListener("click", function () {
	adsContainer.ShowRewardedAd();
});

var adsContainer = {
	npa: 0,
	init: false,
	iosAdId: "ca-app-pub-7908747033760630/3571170656",
	androidAdId: "ca-app-pub-7908747033760630/7071431961",
	devIosAdId: "ca-app-pub-3940256099942544/1712485313",
	devAndroidAdId: "ca-app-pub-3940256099942544/5224354917",
	adId: "",
	debug: false,
	rewarded: undefined,
	adLoadTries: 0,
	maxAdLoadTries: 3,

	Setup: async function () {
		if (admob !== undefined) {
			admob.configure({
				testDeviceIds: ["6aa9a13e4798787fd844b4654021422"],
			});
		}
		if (consent !== undefined) {
			switch (cordova.platformId) {
				case "ios":
					if (this.debug) {
						this.adId = this.devIosAdId;
					} else {
						this.adId = this.iosAdId;
					}

					this.npa = await consent.trackingAuthorizationStatus();
					/*
					trackingAuthorizationStatus:
					0 = notDetermined
					1 = restricted
					2 = denied
					3 = authorized
					*/
					const statusNew = await consent.requestTrackingAuthorization();
					this.npa = statusNew;

					break;
				case "android":
					if (this.debug) {
						this.adId = this.devAndroidAdId;
					} else {
						this.adId = this.androidAdId;
					}
					break;
			}

			const consentStatus = await consent.getConsentStatus();
			console.log(`consentStatus: ${consentStatus}`);
			if (consentStatus === consent.ConsentStatus.Required) {
				await consent.requestInfoUpdate();
			}

			const formStatus = await consent.getFormStatus();
			console.log(`formStatus: ${formStatus}`);
			console.log(
				`consent.FormStatus.Available: ${consent.FormStatus.Available}`
			);
			if (formStatus === consent.FormStatus.Available) {
				const form = await consent.loadForm();
				form.show();
			}

			this.init = true;
			this.PrepareAd();
		}
	},
	ShowRewardedAd: async function () {
		if (this.init && this.rewarded !== undefined) {
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
		if (this.init) {
			this.rewarded = new admob.RewardedAd({
				adUnitId: this.adId,
				npa: this.npa,
			});

			this.rewarded.on("load", adsContainer.events.Load);
			this.rewarded.on("reward", adsContainer.events.GiveReward);
			this.rewarded.on("showFail", adsContainer.events.ShowFailed);
			this.rewarded.on("loadFail", adsContainer.events.LoadFailed);

			this.LoadAd();
		}
	},
	LoadAd: async function () {
		if (this.rewarded !== undefined) {
			await this.rewarded.load();
		} else {
			this.PrepareAd();
		}
	},
	events: {
		Load: async function (event) {
			console.log("Ad loaded");
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
