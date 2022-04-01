/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready

var region = "notset";
var language = "en-US";
var opacityAccelerator = 400;
var scaleAccelerator = 800;

window.onanimationiteration = console.log;

var save = {
	guestSessionId: undefined,
	guestSessionExpiresAt: undefined,
	guestSessionUsed: false,
	resultsFetched: 0,
	moviesFetched: 0,
	seriesFetched: 0,
	languagesSelection: {
		// Insert all selected original languages when fetching results
	},
	genresSelection: {
		// Insert all the selected genres when fetching results
	},
	savedPopcorns: 0,
	popcornsUsed: 0,
	unlockedTypes: [],
	initValueClaimed: false,
	ads: {
		consentStatus: 0,
	},
};
function Save() {
	// Set all data
	save.savedPopcorns = popcornContainer.currentPopcorns;
	save.unlockedTypes = popcornContainer.unlockedTypes;
	save.initValueClaimed = popcornContainer.initValueClaimed;
	save.popcornsUsed = popcornContainer.popcornsUsed;

	save.ads.consentStatus =
		adsContainer.consentStatus === undefined ? 0 : adsContainer.consentStatus;

	json = JSON.stringify(save);

	window.localStorage.setItem("save", json);
}
function Load() {
	storageSave = JSON.parse(window.localStorage.getItem("save"));

	if (storageSave !== null) {
		Object.assign(save, storageSave);
	}
}

const tmdbPosterUrl = "https://www.themoviedb.org/t/p/w500";
const tmdbBannerUrl =
	"https://www.themoviedb.org/t/p/w1920_and_h800_multi_faces";
const tmdbIconUrl = "https://image.tmdb.org/t/p/original";

document.addEventListener("deviceready", onDeviceReady, false);
function onDeviceReady() {
	console.log("Running cordova-" + cordova.platformId + "@" + cordova.version);
	particlesJS.load("particles-js", function () {
		console.log("callback - particles.js config loaded");
	});
	var rect = document
		.querySelector("#popcorn_current_value_holder")
		.getBoundingClientRect();
	pJSDom[0].pJS.particles.move.physicsEngine.dragToPoint.x =
		rect.x + rect.width / 2;
	pJSDom[0].pJS.particles.move.physicsEngine.dragToPoint.y =
		rect.y + rect.height / 2;

	if (navigator.globalization !== undefined) {
		navigator.globalization.getLocaleName(
			function (locale) {
				var iso = languageContainer
					.FetchIso_639FromLocale(locale.value)
					.toLowerCase();

				region = locale.value;
				var locales = languageContainer.supportedOriginalLanguages.filter(
					function (country) {
						return country.iso_639_1 === iso;
					}
				);
				console.log(`Locale: ${locale.value}`);

				if (locales.length === 0) {
					languageContainer.supportedOriginalLanguages.unshift({
						language: languageContainer.GetLanguage(iso).name,
						iso_639_1: iso,
						maxVotes: 20,
					});
					LoadOriginalLanguages();
				} else {
					LoadOriginalLanguages();
				}
			},
			function () {
				// On error
				LoadOriginalLanguages();
			}
		);
	} else {
		LoadOriginalLanguages();
	}

	Load();
	mediaContainer.Setup();
	adsContainer.Setup(save);
	popcornContainer.Setup(save);
	resultStorageContainer.Setup();
	elementContainer.Setup();
	eventContainer.Setup();
	filmContainer.Setup();
	providersContainer.Setup();

	Init();

	// Check if the guest session is still valid...
	var expired = false;

	if (save.guestSessionExpiresAt !== undefined && !save.guestSessionUsed) {
		try {
			var expires = new Date(save.guestSessionExpiresAt);

			if (expires < new Date()) {
				expired = true;
			}
		} catch (error) {
			expired = true;
			console.log(error);
		}
	} else {
		expired = true;
	}

	if (expired) {
		theMovieDb.authentication.generateGuestSession(
			function (result) {
				var obj = JSON.parse(result);

				save.guestSessionId = obj.guest_session_id;
				save.guestSessionExpiresAt = obj.expires_at;

				Save();
			},
			function () {}
		);
	}

	document
		.querySelector(`#toggle_overlay`)
		.addEventListener("click", function () {
			elementContainer.ToggleContainerState();
		});
	document.querySelectorAll(".collapsable").forEach((el) => {
		el.addEventListener("click", function (event) {
			el.classList.toggle("collapsed");
		});
	});

	document.querySelectorAll("fieldset.collapsable input").forEach((el) => {
		el.addEventListener("click", function (event) {
			var parent = el.closest("fieldset");

			elementContainer.CheckIfCollapsableGotSelectedChildren(parent);
			filmContainer.FetchPotentialResults();
		});
	});
	document.querySelectorAll(".clear-input").forEach((el) => {
		el.addEventListener("click", function (event) {
			event.preventDefault();
			event.stopPropagation();

			var parent = el.closest("fieldset");

			parent.querySelectorAll(".cb-container input:checked").forEach((inp) => {
				inp.checked = false;
			});

			elementContainer.CheckIfCollapsableGotSelectedChildren(parent);
			filmContainer.FetchPotentialResults();
		});
	});

	document
		.querySelector("#fetch_providers")
		.addEventListener("click", function () {
			providersContainer.FetchWatchProviders();
		});

	document.querySelectorAll(".fetch-film").forEach((el) => {
		el.addEventListener("click", function (e) {
			var cost = el.dataset.popcornCost;

			if (popcornContainer.GotEnoughPopcorns(cost)) {
				document.querySelector(".movie-container").classList.remove("hide");
				document.querySelector(".movie-container").classList.add("loading");
				document.querySelector(".movie-container").classList.remove("loaded");
				document.querySelector(".poster-scroll").classList.add("loading");

				if (el.classList.contains("start-over")) {
					filmContainer.ResetRandomValues();
					document
						.querySelector("#no_results_left_container")
						.classList.add("hide");
				}

				filmContainer.PerformFetchFilm(cost);
			}
		});
		el.addEventListener("touchstart", function () {
			var cost = el.dataset.popcornCost;

			if (popcornContainer.GotEnoughPopcorns(cost)) {
				if (!el.classList.contains("start-over")) {
					filmContainer.holdInterval = setInterval(() => {
						filmContainer.PerformOnHoldInterval(cost);
					}, 200);
				}
			}
		});
		el.addEventListener("touchend", function () {
			if (filmContainer.holdInterval !== undefined) {
				if (el.classList.contains("start-over")) {
					filmContainer.ResetRandomValues();
					document
						.querySelector("#no_results_left_container")
						.classList.add("hide");
				}

				if (filmContainer.inBackground) {
					filmContainer.events.LoadingDataDone();
				}
				filmContainer.ResetHoldInterval();
			}
		});
	});

	function Init() {
		// Bind inputs TODO: Fix so this also binds original languages
		document.querySelectorAll("#filter_form input").forEach((input) => {
			input.addEventListener("change", filmContainer.FetchPotentialResults);
		});
		document
			.querySelectorAll("#filter_form input[name='type_cb']")
			.forEach((input) => {
				input.addEventListener("change", elementContainer.ToggleFormDisplay);
			});
	}

	function LoadOriginalLanguages() {
		// Load original languages
		var originalLangContainer = document.querySelector(
			`#filter_form fieldset[name="original_languages"] > div.c-container`
		);
		languageContainer.supportedOriginalLanguages.forEach((lang) => {
			originalLangContainer.insertAdjacentHTML(
				"beforeend",
				`
            <label class="cb-container" data-id="${lang.iso_639_1}">
                <input type="checkbox" data-vote-value="${lang.maxVotes}" value="${lang.iso_639_1}">
                <span class="checkmark">${lang.language}</span>
            </label>`
			);

			document
				.querySelector(
					`fieldset[name="original_languages"] label[data-id="${lang.iso_639_1}"]`
				)
				.addEventListener("change", function (event) {
					elementContainer.CheckIfCollapsableGotSelectedChildren(
						event.target.closest("fieldset.collapsable")
					);
					filmContainer.FetchPotentialResults();
				});
		});
	}
}
