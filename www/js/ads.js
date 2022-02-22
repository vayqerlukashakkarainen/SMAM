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

	Setup: async function () {
		if (admob !== undefined) {
			admob.configure({
				testDeviceIds: ["ae01ce688fa07399fef10caa2f4ed93c"],
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
			if (consentStatus === consent.ConsentStatus.Required) {
				await consent.requestInfoUpdate();
			}

			const formStatus = await consent.getFormStatus();
			if (formStatus === consent.FormStatus.Available) {
				const form = await consent.loadForm();
				form.show();
			}

			console.log(this.npa);
			this.init = true;
			this.PrepareAd();
		}
	},
	ShowAdsContainer: function (fromType) {},
	ShowRewardedAd: async function () {
		if (this.init && this.rewarded !== undefined) {
			console.log("Start ad");

			await this.rewarded.show();

			this.PrepareAd();
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
			this.rewarded.on("showFailed", adsContainer.events.ShowFailed);
			this.rewarded.on("loadFailed", adsContainer.events.LoadFailed);

			await this.rewarded.load();
		}
	},
	events: {
		Load: async function (event) {
			console.log("Ad loaded");
		},
		GiveReward: async function (event) {
			popcornContainer.HideMorePopcornContainer();
			popcornContainer.ShowReward(1000);
		},
		LoadFailed: function (event) {
			adsContainer.PrepareAd();
		},
		ShowFailed: function (event) {
			alert("Ad failed to show, please try again");
		},
	},
};
