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

var save = {
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

var supportedOriginalLanguages = [
	{
		language: "English",
		iso_639_1: "en",
		maxVotes: 300,
	},
	{
		language: "Spanish",
		iso_639_1: "es",
		maxVotes: 100,
	},
	{
		language: "Mandarin",
		iso_639_1: "zh",
		maxVotes: 50,
	},
	{
		language: "French",
		iso_639_1: "fr",
		maxVotes: 100,
	},
	{
		language: "Arabic",
		iso_639_1: "ar",
		maxVotes: 10,
	},
	{
		language: "Russian",
		iso_639_1: "ru",
		maxVotes: 50,
	},
	{
		language: "Indonesian",
		iso_639_1: "id",
		maxVotes: 10,
	},
];

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

	Load();
	mediaContainer.Setup();
	adsContainer.Setup(save);
	popcornContainer.Setup(save);

	if (navigator.globalization !== undefined) {
		navigator.globalization.getLocaleName(
			function (locale) {
				var iso = languageContainer
					.FetchIso_639FromLocale(locale.value)
					.toLowerCase();

				region = locale.value;
				var locales = supportedOriginalLanguages.filter(function (country) {
					return country.iso_639_1 === iso;
				});
				console.log(`Locale: ${locale.value}`);

				if (locales.length === 0) {
					supportedOriginalLanguages.unshift({
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

	const tmdbPosterUrl = "https://www.themoviedb.org/t/p/w500";
	const tmdbBannerUrl =
		"https://www.themoviedb.org/t/p/w1920_and_h800_multi_faces";
	const tmdbIconUrl = "https://image.tmdb.org/t/p/original";

	var highestRatingSlider = undefined;
	var maxMovieLengthSlider = undefined;
	var releaseYearSlider = undefined;

	Init();
	ToggleFormDisplay();

	window.oncontextmenu = function (event) {
		event.preventDefault();
		event.stopPropagation();
		return false;
	};

	var opacityAccelerator = 400;
	var scaleAccelerator = 800;
	document
		.querySelector(".movie-grid-container")
		.addEventListener("scroll", function (event) {
			var scroll = event.target.scrollTop;

			var opacity = 0.7 - scroll / opacityAccelerator;
			var scale = 1.1 - scroll / scaleAccelerator;

			if (opacity >= 0.2 && opacity <= 0.7) {
				document.querySelector(".banner").style.opacity =
					Math.round((opacity + Number.EPSILON) * 100) / 100;
			}

			if (scale <= 1.1 && scale >= 1) {
				document.querySelector(".banner").style.transform = `scale(${
					Math.round((scale + Number.EPSILON) * 100) / 100
				})`;
			}
		});

	document
		.querySelector("#tmdb_poster")
		.addEventListener("error", function (el) {
			el.target.src = "img/poster_template.jpg";
		});
	document
		.querySelector("#tmdb_banner")
		.addEventListener("error", function (el) {
			el.target.src = "img/banner.jpg";
		});

	observer = new MutationObserver((changes) => {
		changes.forEach((change) => {
			if (change.attributeName.includes("src")) {
				change.target.classList.add("loading");
			}
		});
	});
	document.querySelectorAll("img").forEach((el) => {
		el.addEventListener("load", function (event) {
			event.target.classList.remove("loading");
		});

		observer.observe(el, { attributes: true });
	});

	document.querySelectorAll(".tab-links > *").forEach((el) => {
		el.addEventListener("click", function (e) {
			var group = e.target.dataset.tabGroup;
			var id = e.target.dataset.tabTarget;

			document
				.querySelectorAll(`.tab-links > *.active[data-tab-group="${group}"]`)
				.forEach((links) => {
					links.classList.remove("active");
				});
			document
				.querySelectorAll(`.tab.active[data-tab-group="${group}"]`)
				.forEach((groups) => {
					groups.classList.remove("active");
				});

			e.target.classList.add("active");
			document
				.querySelector(`.tab[data-tab-group="${group}"][data-tab-id="${id}"]`)
				.classList.add("active");
		});
	});

	document
		.querySelector(`#toggle_overlay`)
		.addEventListener("click", function () {
			document.querySelector(".menu-icon__cheeckbox").checked =
				!document.querySelector(".menu-icon__cheeckbox").checked;
			document.querySelector(".app").classList.toggle("toggled");
		});
	document.querySelectorAll(".collapsable").forEach((el) => {
		el.addEventListener("click", function (event) {
			el.classList.toggle("collapsed");
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

			CheckIfCollapsableGotSelectedChildren(parent);
			FetchPotentialResults();
		});
	});

	document
		.querySelector("#fetch_providers")
		.addEventListener("click", function () {
			FetchWatchProviders();
		});

	var holdInterval = undefined;
	var loadImagesInterval = undefined;
	var holdCounter = 0;
	var fetchCost = 0;
	var inBackground = false;
	document.querySelectorAll(".fetch-film").forEach((el) => {
		el.addEventListener("click", function (e) {
			var cost = el.dataset.popcornCost;

			if (popcornContainer.GotEnoughPopcorns(cost)) {
				document.querySelector(".movie-container").classList.remove("hide");
				document.querySelector(".movie-container").classList.add("loading");
				document.querySelector(".movie-container").classList.remove("loaded");
				document.querySelector(".poster-scroll").classList.add("loading");

				if (el.classList.contains("start-over")) {
					ResetRandomValues();
					document
						.querySelector("#no_results_left_container")
						.classList.add("hide");
				}

				PerformFetchFilm(cost);
			}
		});
		el.addEventListener("touchstart", function () {
			var cost = el.dataset.popcornCost;

			if (popcornContainer.GotEnoughPopcorns(cost)) {
				if (!el.classList.contains("start-over")) {
					holdInterval = setInterval(() => {
						PerformOnHoldInterval(cost);
					}, 200);
				}
			}
		});
		el.addEventListener("touchend", function () {
			if (holdInterval !== undefined) {
				if (el.classList.contains("start-over")) {
					ResetRandomValues();
					document
						.querySelector("#no_results_left_container")
						.classList.add("hide");
				}

				if (inBackground) {
					LoadingDataDone();
				}
				ResetHoldInterval();
			}
		});
	});

	function Init() {
		// Bind inputs TODO: Fix so this also binds original languages
		document.querySelectorAll("#filter_form input").forEach((input) => {
			input.addEventListener("change", FetchPotentialResults);
		});
		document
			.querySelectorAll("#filter_form input[name='type_cb']")
			.forEach((input) => {
				input.addEventListener("change", ToggleFormDisplay);
			});

		FetchMovieCategoriesFromTMDB();
		FetchTVShowCategoriesFromTMDB();
		FetchAvailableProviderRegions(function () {
			if (providerCurrentRegionIso !== undefined) {
				FetchMovieProviders(providerCurrentRegionIso);
				FetchTVProviders(providerCurrentRegionIso);
			} else {
				document
					.querySelector(`#filter_form fieldset[name="tv_providers"]`)
					.classList.add("d-none");
				document
					.querySelector(`#filter_form fieldset[name="movie_providers"]`)
					.classList.add("d-none");
			}
		});

		// Setup sliders
		highestRatingSlider = noUiSlider.create(
			document.querySelector("#highest_rating"),
			{
				range: {
					min: 1,
					max: 10,
				},

				// Handles start at ...
				start: [1, 10],
				step: 1,

				// Display colored bars between handles
				connect: true,

				// Put '0' at the bottom of the slider
				orientation: "horizontal",

				// Move handle on tap, bars are draggable
				behaviour: "drag",
				tooltips: true,
				customFormatter: function (handleValue) {
					return `${Math.round(handleValue)} ★`;
				},
			}
		);
		highestRatingSlider.on("change", FetchPotentialResults);

		maxMovieLengthSlider = noUiSlider.create(
			document.querySelector("#max_movie_length"),
			{
				range: {
					min: 60,
					max: 300,
				},

				// Handles start at ...
				start: [300],
				step: 15,

				// Display colored bars between handles
				connect: true,

				// Put '0' at the bottom of the slider
				orientation: "horizontal",

				// Move handle on tap, bars are draggable
				behaviour: "drag",
				tooltips: true,
				customFormatter: function (handleValue) {
					return RuntimeToString(handleValue);
				},
			}
		);
		maxMovieLengthSlider.on("change", FetchPotentialResults);

		releaseYearSlider = noUiSlider.create(
			document.querySelector("#release_year"),
			{
				range: {
					min: 1920,
					max: new Date().getFullYear(),
				},

				// Handles start at ...
				start: [1920, new Date().getFullYear()],
				step: 1,

				// Display colored bars between handles
				connect: true,

				// Put '0' at the bottom of the slider
				orientation: "horizontal",

				// Move handle on tap, bars are draggable
				behaviour: "drag",
				tooltips: true,
				customFormatter: function (handleValue) {
					return `${Math.round(handleValue)}`;
				},
			}
		);
		releaseYearSlider.on("change", FetchPotentialResults);

		FetchPotentialResults();
	}

	function ResetHoldInterval() {
		clearInterval(holdInterval);
		clearInterval(loadImagesInterval);
		holdInterval = undefined;
		loadImagesInterval = undefined;
		holdPopcornTimeoutTime = 1000;
		clearTimeout(holdPopcornTimeout);
		holdPopcornTimeout = undefined;
		holdCounter = 0;
		document.querySelector(".app").classList.remove("disco");
		document.querySelector(".app").classList.remove("fsah");
		mediaContainer.StopAllMedia();
		inBackground = false;
	}
	var holdPopcornTimeoutTime = 1000;
	var holdPopcornTimeout = undefined;
	function PerformOnHoldInterval(cost) {
		holdCounter++;

		switch (holdCounter) {
			case 1:
				document.querySelector(".movie-container").classList.remove("hide");
				document.querySelector(".movie-container").classList.add("loading");
				document.querySelector(".movie-container").classList.remove("loaded");
				document.querySelector(".poster-scroll").classList.add("loading");
				StartTimer();

				function StartTimer() {
					holdPopcornTimeout = setTimeout(function () {
						if (holdPopcornTimeoutTime > 100) {
							holdPopcornTimeoutTime -= 150;
						}

						var rect = document.querySelector("body").getBoundingClientRect();
						pJSDom[0].pJS.fn.add(1, rect.width / 2, rect.height / 2, 120);

						StartTimer();
					}, holdPopcornTimeoutTime);
				}
				break;
			case 5:
				inBackground = true;
				document.querySelector(".app").classList.add("disco");
				if (discoverResult !== undefined) {
					loadImagesInterval = setInterval(() => {
						document.querySelector(
							".disco-container img"
						).src = `${tmdbPosterUrl}${
							discoverResult.results[Math.floor(Math.random() * 20)].poster_path
						}`;
					}, 50);
				}
				mediaContainer.PlayRepeatedMedia(mediaContainer.audio.blbl);
				PerformFetchFilm(cost);
				break;
			case 5 * 3:
				mediaContainer.PlayAudio(mediaContainer.audio.discoDancing, true);
				break;
			case 5 * 5:
				document.querySelector(".app").classList.add("fsah");
				mediaContainer.PlayAudio(mediaContainer.audio.disco, true);
				mediaContainer.StopRepeatedMedia();
				break;
		}
	}

	var fetchingResultsTimer = undefined;
	function FetchPotentialResults() {
		DisableFetchBtns();

		clearTimeout(fetchingResultsTimer);
		fetchingResultsTimer = setTimeout(OnTimeout, 1000);

		function OnTimeout() {
			var form = FetchOptionsFromForm();

			switch (form.type) {
				case "1":
					theMovieDb.discover.getMovies(
						form.movieFilters,
						LoadPotentialResults,
						DiscoryErrorCallback
					);
					break;
				case "2":
					theMovieDb.discover.getTvShows(
						form.showFilters,
						LoadPotentialResults,
						DiscoryErrorCallback
					);
					break;
			}
		}
	}

	function DisableFetchBtns() {
		document.querySelectorAll(".fetch-btn-container").forEach((el) => {
			el.classList.add("loading");
			el.classList.remove("loaded");
		});
	}
	function EnableFetchBtns() {
		document.querySelectorAll(".fetch-btn-container").forEach((el) => {
			el.classList.remove("loading");
			el.classList.add("loaded");
		});
	}

	var initialized = false;
	var resultsPerPage = 20;
	var maxPageSelector = 1000;
	var totalResults = 0;
	function LoadPotentialResults(responseText) {
		var response = JSON.parse(responseText);
		discoverResult = response;

		EnableFetchBtns();

		document.querySelectorAll(".fetch-btn-container").forEach((el) => {
			el.querySelector(".pot-results > span").textContent =
				response.total_results;
			totalPages = response.total_pages;
		});

		totalResults = response.total_results;
		ResetRandomValues();

		if (!initialized) {
			var posterEl = document.querySelector(".poster-scroll");
			posterEl.classList.remove("loading");

			response.results.forEach((result) => {
				posterEl.querySelector("ul").insertAdjacentHTML(
					"beforeend",
					`
                        <li>
                            <img src="${tmdbPosterUrl}${result.poster_path}" />
                        </li>`
				);
			});

			posterEl.classList.add("loaded");
			initialized = true;
		}
	}

	var fetchingTimeout = undefined;
	function PerformFetchFilm(cost) {
		document.querySelector(".app").classList.remove("toggled");
		document.querySelector(".app").classList.remove("cb-error");
		document.querySelector(".app").classList.add("loading");
		document.querySelector("#toggle_overlay input").checked = false;
		fetchCost = cost;

		if (!inBackground) {
			if (fetchingTimeout != undefined) {
				clearTimeout(fetchingTimeout);
				fetchingTimeout = undefined;
			}
			fetchingTimeout = setTimeout(Perform, 100);
		} else {
			Perform();
		}

		function Perform() {
			if (RandomizeResult()) {
				var form = FetchOptionsFromForm();
				if (!inBackground) {
					clearTimeout(fetchingTimeout);
					fetchingTimeout = undefined;
					DisableFetchBtns();
				}
				ResetPosterAndBanner();
				document.querySelector(".movie-grid-container").scrollTo(0, 0);

				switch (form.type) {
					case "1":
						theMovieDb.discover.getMovies(
							form.movieFilters,
							RandomlySelectFilm,
							FilmFetchErrorCallback
						);
						break;
					case "2":
						theMovieDb.discover.getTvShows(
							form.showFilters,
							RandomlySelectFilm,
							FilmFetchErrorCallback
						);
						break;
				}
			}
		}
	}

	// From the result, we generate an array with all the possible values, from the array
	// we pop the value so we
	var possibleResultsArray = undefined;
	var discoverResult = undefined;
	var randomizedResult = -1;
	var randomizedPage = -1;
	var randomizedValueOnPage = -1;
	var selectedRandomizedResult = -1;
	var totalPages = -1;
	var selectedFilmId = -1;
	function RandomizeResult() {
		if (possibleResultsArray !== undefined) {
			if (possibleResultsArray.length > 0) {
				selectedRandomizedResult = Math.floor(
					Math.random() * possibleResultsArray.length
				);
				randomizedResult = possibleResultsArray[selectedRandomizedResult];
				var randomPageNotCieled =
					(randomizedResult === 0 ? 1 : randomizedResult) / resultsPerPage;
				randomizedPage = Math.ceil(
					Number.isInteger(randomPageNotCieled)
						? randomPageNotCieled + 1
						: randomPageNotCieled
				);
				randomizedValueOnPage =
					randomizedResult - (randomizedPage - 1) * resultsPerPage;
				return true;
			} else {
				document
					.querySelector("#no_results_left_container")
					.classList.remove("hide");
				return false;
			}
		} else {
			var randomSeed =
				totalPages > resultsPerPage * maxPageSelector
					? resultsPerPage * maxPageSelector
					: totalPages;
			randomizedPage = Math.floor(Math.random() * randomSeed) + 1;
			return true;
		}
	}
	function ResetRandomValues() {
		randomizedResult = -1;
		randomizedPage = -1;
		randomizedValueOnPage = -1;
		selectedRandomizedResult = -1;
		if (totalResults > 0) {
			const initArrayLength =
				totalResults > resultsPerPage * maxPageSelector
					? resultsPerPage * maxPageSelector
					: totalResults;
			possibleResultsArray = new Array(initArrayLength)
				.fill(0)
				.map((v, index) => (v = index));
		} else {
			possibleResultsArray = undefined;
		}
	}
	function RandomlySelectFilm(discoverText) {
		var response = JSON.parse(discoverText);

		selectedFilmId = response.results[randomizedValueOnPage].id;

		SetPosterAndBanner(response.results[randomizedValueOnPage]);

		save.resultsFetched += 1;
		switch (FetchOptionsFromForm().type) {
			case "1":
				theMovieDb.movies.getById(
					{ id: selectedFilmId },
					LoadMovieData,
					FilmFetchErrorCallback
				);
				break;
			case "2":
				theMovieDb.tv.getById(
					{ id: selectedFilmId },
					LoadSeriesData,
					FilmFetchErrorCallback
				);
				break;
		}

		FetchWatchProviders();
	}

	function FetchWatchProviders() {
		document.querySelector(".app").classList.remove("wp-error");

		switch (FetchOptionsFromForm().type) {
			case "1":
				theMovieDb.movies.getWatchProviders(
					{ id: selectedFilmId },
					LoadProviders,
					WatchProviderErrorCallback
				);
				break;
			case "2":
				theMovieDb.tv.getWatchProviders(
					{ id: selectedFilmId },
					LoadProviders,
					WatchProviderErrorCallback
				);
				break;
		}
	}

	function ResetPosterAndBanner() {
		document.querySelector("#tmdb_poster").src = "img/poster_template.jpg";
		document.querySelector("#tmdb_banner").src = "img/banner.jpg";
	}
	function SetPosterAndBanner(discover) {
		document.querySelector(
			"#tmdb_poster"
		).src = `${tmdbPosterUrl}${discover.poster_path}`;
		document.querySelector(
			"#tmdb_banner"
		).src = `${tmdbBannerUrl}${discover.backdrop_path}`;
	}
	function LoadMovieData(responseText) {
		var filmResult = JSON.parse(responseText);

		save.moviesFetched += 1;
		popcornContainer.UsePopcorns(fetchCost);
		document.querySelector("#tmdb_title").textContent = filmResult.title;
		document.querySelector("#tmdb_description").textContent =
			filmResult.overview;
		document.querySelector("#tmdb_rating > span.rating").textContent =
			filmResult.vote_average;
		document.querySelector("#tmdb_year").textContent = new Date(
			filmResult.release_date
		).getFullYear();
		document.querySelector("#tmdb_duration").textContent = RuntimeToString(
			filmResult.runtime
		);
		document.querySelector("#tmdb_categories").innerHTML = "";

		filmResult.genres.forEach((genre) => {
			document
				.querySelector("#tmdb_categories")
				.insertAdjacentHTML("beforeend", `<li>${genre.name}</li>`);
		});

		if (!inBackground) {
			LoadingDataDone();
		}
	}
	function LoadSeriesData(responseText) {
		var seriesResult = JSON.parse(responseText);

		popcornContainer.UsePopcorns(fetchCost);
		save.seriesFetched += 1;
		document.querySelector("#tmdb_title").textContent = seriesResult.name;
		document.querySelector("#tmdb_description").textContent =
			seriesResult.overview;
		document.querySelector("#tmdb_rating > span.rating").textContent =
			seriesResult.vote_average;
		document.querySelector("#tmdb_year").textContent = new Date(
			seriesResult.first_air_date
		).getFullYear();
		document.querySelector("#tmdb_duration").textContent = `${
			seriesResult.number_of_seasons
		} season${seriesResult.number_of_seasons === 1 ? "" : "s"}`;
		document.querySelector("#tmdb_categories").innerHTML = "";

		seriesResult.genres.forEach((genre) => {
			document
				.querySelector("#tmdb_categories")
				.insertAdjacentHTML("beforeend", `<li>${genre.name}</li>`);
		});

		if (!inBackground) {
			LoadingDataDone();
		}
	}
	function LoadProviders(responseText) {
		document.querySelector("#stream_from .stream-providers").textContent = "";
		document.querySelector("#rent_buy_from .stream-providers").textContent = "";

		var providersJson = JSON.parse(responseText);

		var countryProvider = GetDepthValue(
			providersJson.results,
			`${providerCurrentRegionIso}`,
			undefined
		);

		if (countryProvider !== undefined) {
			if (countryProvider.flatrate !== undefined) {
				countryProvider.flatrate.forEach((provider) => {
					if (!FilterOutProvider(provider.provider_name)) {
						document
							.querySelector("#stream_from .stream-providers")
							.insertAdjacentHTML(
								"beforeend",
								`
                        <div class="provider" data-id="${provider.provider_id}">
                            <img src="${tmdbIconUrl}${provider.logo_path}"/>
                            <p>${provider.provider_name}</p>
                        </div>`
							);
					}
				});
			}
			if (countryProvider.rent !== undefined) {
				countryProvider.rent.forEach((provider) => {
					if (!FilterOutProvider(provider.provider_name)) {
						document
							.querySelector("#rent_buy_from .stream-providers")
							.insertAdjacentHTML(
								"beforeend",
								`
                            <div class="provider" data-id="${provider.provider_id}">
                                <img src="${tmdbIconUrl}${provider.logo_path}"/>
                                <p>${provider.provider_name}</p>
                            </div>`
							);
					}
				});
			}
			if (countryProvider.buy !== undefined) {
				countryProvider.buy.forEach((provider) => {
					if (
						document.querySelector(
							`#rent_buy_from .stream-providers > *[data-id="${provider.provider_id}"]`
						) === null
					) {
						if (!FilterOutProvider(provider.provider_name)) {
							document
								.querySelector("#rent_buy_from .stream-providers")
								.insertAdjacentHTML(
									"beforeend",
									`
                                <div class="provider" data-id="${provider.provider_id}">
                                    <img src="${tmdbIconUrl}${provider.logo_path}"/>
                                    <p>${provider.provider_name}</p>    
                                </div>`
								);
						}
					}
				});
			}

			document.querySelector("#powered_by_jw").classList.remove("hide");

			document.querySelectorAll(".provider-container img").forEach((el) => {
				el.addEventListener("error", function (event) {
					event.target.src = "img/wp_error_64.png";
				});
			});
		} else {
			document.querySelector("#powered_by_jw").classList.add("hide");
		}

		if (
			document.querySelector("#rent_buy_from .stream-providers").childNodes
				.length === 0
		) {
			document.querySelector("#rent_buy_from").classList.add("hide");
		} else {
			document.querySelector("#rent_buy_from").classList.remove("hide");
		}

		if (
			document.querySelector("#stream_from .stream-providers").childNodes
				.length === 0
		) {
			document.querySelector("#stream_from").classList.add("hide");
		} else {
			document.querySelector("#stream_from").classList.remove("hide");
		}
	}

	function LoadingDataDone() {
		possibleResultsArray.splice(selectedRandomizedResult, 1);
		if (!inBackground) {
			setTimeout(Perform, 100);
		} else {
			Perform();
		}

		function Perform() {
			EnableFetchBtns();
			document.querySelector(".movie-container").classList.remove("loading");
			document.querySelector(".movie-container").classList.add("loaded");
			document.querySelector(".app").classList.remove("loading");
			mediaContainer.PlayAudio(mediaContainer.audio.pop);
		}
	}

	function FilterOutProvider(providerName) {
		if (cordova.platformId === "ios") {
			return providerName.toLowerCase().includes("google");
		}

		return false;
	}

	function WatchProviderErrorCallback() {
		document.querySelector(".app").classList.add("wp-error");
	}
	function DiscoryErrorCallback() {
		document.querySelector(".app").classList.add("disc-error");
	}
	function FilmFetchErrorCallback() {
		document.querySelector(".app").classList.add("cb-error");
		LoadingDataDone();
	}

	function ToggleFormDisplay() {
		var formElement = document.querySelector("#filter_form");

		var selectedType = formElement.querySelector(
			`input[name="type_cb"]:checked`
		).value;

		var elements = formElement.querySelectorAll("fieldset");
		for (var i = 0; i < elements.length; i++) {
			elements[i].classList.remove("hide");

			if (elements[i].dataset.entType) {
				if (elements[i].dataset.entType !== selectedType) {
					elements[i].classList.add("hide");
				}
			}
		}

		var fetchBtnsSpan = document.querySelectorAll(
			".fetch-film:not(.ignore) > span"
		);
		for (var i = 0; i < fetchBtnsSpan.length; i++) {
			var typeStr = selectedType === "1" ? "MOVIE" : "SERIES";
			fetchBtnsSpan[i].textContent = `SHOW ME A ${typeStr}`;
		}
	}

	function FetchMovieCategoriesFromTMDB() {
		theMovieDb.genres.getMovieList(
			{ language: language },
			function (responseText) {
				var obj = JSON.parse(responseText);

				if (obj.genres !== undefined) {
					var movieContainer = document.querySelector(
						`#filter_form fieldset[name="movie_generes"] > div.c-container`
					);
					obj.genres.forEach((genre) => {
						movieContainer.insertAdjacentHTML(
							"beforeend",
							`
                            <label class="cb-container" data-id="${genre.id}">
                                <input type="checkbox" value="${genre.id}">
                                <span class="checkmark">${genre.name}</span>
                            </label>`
						);

						document
							.querySelector(
								`fieldset[name="movie_generes"] label[data-id="${genre.id}"]`
							)
							.addEventListener("change", FetchPotentialResults);
					});
				}
			},
			function (responseText) {
				alert("Movie categories error: " + responseText);
			}
		);
	}

	function FetchTVShowCategoriesFromTMDB() {
		theMovieDb.genres.getTvList(
			{ language: language },
			function (responseText) {
				var obj = JSON.parse(responseText);

				if (obj.genres !== undefined) {
					var showsContainer = document.querySelector(
						`#filter_form fieldset[name="shows_generes"] > div.c-container`
					);
					obj.genres.forEach((genre) => {
						showsContainer.insertAdjacentHTML(
							"beforeend",
							`
                            <label class="cb-container" data-id="${genre.id}">
                                <input type="checkbox" value="${genre.id}">
                                <span class="checkmark">${genre.name}</span>
                            </label>`
						);

						document
							.querySelector(
								`fieldset[name="shows_generes"] label[data-id="${genre.id}"]`
							)
							.addEventListener("change", FetchPotentialResults);
					});
				}
			},
			function (responseText) {
				alert("TV Categorier error: " + responseText);
			}
		);
	}

	var availableProviders = undefined;
	var providerCurrentRegionIso = undefined;
	function SetProviderForCurrentLanguage() {
		var iso = languageContainer.FetchIso_3166_1FromLocale(region);

		if (iso !== undefined && availableProviders !== undefined) {
			document.querySelectorAll("span[data-insert-country]").forEach((el) => {
				el.textContent = languageContainer.GetCountryName(iso);
			});

			availableProviders.forEach((provider) => {
				if (provider.iso_3166_1.toLowerCase() === iso.toLowerCase()) {
					providerCurrentRegionIso = iso;
					return;
				}
			});
		}
	}
	function FetchAvailableProviderRegions(onSuccess) {
		theMovieDb.providers.getAvailableRegions(
			{},
			function (responseText) {
				var obj = JSON.parse(responseText);

				availableProviders = obj.results;
				SetProviderForCurrentLanguage();

				onSuccess();
			},
			function (responseText) {
				alert("Fetch available provider regions error: " + responseText);
			}
		);
	}
	function FetchMovieProviders(with_region) {
		console.log(`Fetching providers with region: ${with_region}`);
		theMovieDb.providers.getMovieProviders(
			{ watch_region: with_region },
			function (responseText) {
				var obj = JSON.parse(responseText);

				if (obj.results !== undefined) {
					var providerContainer = document.querySelector(
						`#filter_form fieldset[name="movie_providers"] > div.c-container`
					);
					obj.results.forEach((provider) => {
						if (!FilterOutProvider(provider.provider_name)) {
							providerContainer.insertAdjacentHTML(
								"beforeend",
								`
                                <label class="cb-container provider" data-id="${provider.provider_id}">
                                    <input type="checkbox" value="${provider.provider_id}">
                                    <span class="checkmark"><img src="${tmdbIconUrl}${provider.logo_path}" /><span>${provider.provider_name}</span></span>
                                </label>`
							);

							document
								.querySelector(
									`fieldset[name="movie_providers"] label[data-id="${provider.provider_id}"]`
								)
								.addEventListener("change", function (event) {
									CheckIfCollapsableGotSelectedChildren(
										event.target.closest("fieldset.collapsable")
									);
									FetchPotentialResults();
								});
						}
					});
				}
			},
			function (responseText) {
				alert("Fetch movie providers error: " + responseText);
			}
		);
	}
	function FetchTVProviders(with_region) {
		theMovieDb.providers.getTvProviders(
			{ watch_region: with_region },
			function (responseText) {
				var obj = JSON.parse(responseText);

				if (obj.results !== undefined) {
					var providerContainer = document.querySelector(
						`#filter_form fieldset[name="tv_providers"] > div.c-container`
					);
					obj.results.forEach((provider) => {
						providerContainer.insertAdjacentHTML(
							"beforeend",
							`
                                <label class="cb-container provider" data-id="${provider.provider_id}">
                                    <input type="checkbox" value="${provider.provider_id}">
                                    <span class="checkmark"><img src="${tmdbIconUrl}${provider.logo_path}" /><span>${provider.provider_name}</span></span>
                                </label>`
						);

						document
							.querySelector(
								`fieldset[name="tv_providers"] label[data-id="${provider.provider_id}"]`
							)
							.addEventListener("change", function (event) {
								CheckIfCollapsableGotSelectedChildren(
									event.target.closest("fieldset.collapsable")
								);
								FetchPotentialResults();
							});
					});
				}
			},
			function (responseText) {
				alert("Fetch TV Providers error: " + responseText);
			}
		);
	}

	function CheckIfCollapsableGotSelectedChildren(collapseParent) {
		if (collapseParent.querySelectorAll("input:checked").length > 0) {
			collapseParent.classList.add("got-selected");
			collapseParent.querySelector("button").classList.remove("hide");
		} else {
			collapseParent.classList.remove("got-selected");
			collapseParent.querySelector("button").classList.add("hide");
		}
	}

	function RuntimeToString(runtime) {
		var rounded = Math.round(runtime);
		var hour = Math.floor(rounded / 60);
		var minutes = rounded - hour * 60;
		if (minutes === 0) {
			return `${hour} h`;
		}

		return `${hour} h ${minutes} min`;
	}
	function FetchOptionsFromForm() {
		var formElement = document.querySelector("#filter_form");
		var type = formElement.querySelector("input[name='type_cb']:checked").value;

		return {
			type: type,
			movieFilters: {
				language: language,
				page: GetRandomSelectedPage(),
				"primary_release_date.gte": new Date(
					`${Math.round(releaseYearSlider.get()[0])}-01-01`
				)
					.toISOString()
					.split("T")[0],
				"primary_release_date.lte": new Date(
					`${Math.round(releaseYearSlider.get()[1])}-12-31`
				)
					.toISOString()
					.split("T")[0],
				"vote_average.gte": Math.round(highestRatingSlider.get()[0]),
				"vote_average.lte": Math.round(highestRatingSlider.get()[1]),
				"vote_count.gte": GetMaxVotesFromOriginalLanguages(),
				with_genres: GenerateInputFromFieldset(type, "movie_generes"),
				"with_runtime.lte": Math.round(maxMovieLengthSlider.get()),
				with_watch_providers: GenerateInputFromFieldset(
					type,
					"movie_providers"
				),
				watch_region: providerCurrentRegionIso,
				with_original_language: GenerateInputFromFieldset(
					undefined,
					"original_languages"
				),
			},
			showFilters: {
				language: language,
				page: GetRandomSelectedPage(),
				"air_date.gte": new Date(
					`${Math.round(releaseYearSlider.get()[0])}-01-01`
				)
					.toISOString()
					.split("T")[0],
				"air_date.lte": new Date(
					`${Math.round(releaseYearSlider.get()[1])}-12-31`
				)
					.toISOString()
					.split("T")[0],
				"vote_average.gte": Math.round(highestRatingSlider.get()[0]),
				"vote_average.lte": Math.round(highestRatingSlider.get()[1]),
				"vote_count.gte": GetMaxVotesFromOriginalLanguages(),
				with_genres: GenerateInputFromFieldset(type, "shows_generes"),
				with_watch_providers: GenerateInputFromFieldset(type, "tv_providers"),
				watch_region: providerCurrentRegionIso,
				with_original_language: GenerateInputFromFieldset(
					undefined,
					"original_languages"
				),
			},
		};

		function GenerateInputFromFieldset(type, elementName) {
			var r = "";
			document
				.querySelectorAll(
					`#filter_form fieldset[name="${elementName}"]${
						type === undefined ? "" : `[data-ent-type="${type}"]`
					} label`
				)
				.forEach((label) => {
					if (label.querySelector("input:checked")) {
						r += `${label.querySelector("input:checked").value}%7C`;
					}
				});
			return r.slice(0, -3);
		}

		function GetMaxVotesFromOriginalLanguages() {
			var fallbackMaxVotes = 300;
			var maxVotesSelected = 0;

			document
				.querySelectorAll(
					`#filter_form fieldset[name="original_languages"] input:checked`
				)
				.forEach((el) => {
					var votes = parseInt(el.dataset.voteValue);
					if (votes > maxVotesSelected) {
						maxVotesSelected = votes;
					}
				});

			return maxVotesSelected === 0 ? fallbackMaxVotes : maxVotesSelected;
		}

		function GetRandomSelectedPage() {
			return randomizedPage === -1 ? 1 : randomizedPage;
		}
	}

	function GetDepthValue(obj, path, defaultValue) {
		let props;
		if (typeof obj === "undefined") return defaultValue;
		if (typeof path === "string") {
			props = path.split(".").reverse();
		} else {
			props = path;
		}
		if (path.length === 0) return obj || defaultValue;
		let current = props.pop();
		return GetDepthValue(obj[current], props, defaultValue);
	}

	function LoadOriginalLanguages() {
		// Load original languages
		var originalLangContainer = document.querySelector(
			`#filter_form fieldset[name="original_languages"] > div.c-container`
		);
		supportedOriginalLanguages.forEach((lang) => {
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
					CheckIfCollapsableGotSelectedChildren(
						event.target.closest("fieldset.collapsable")
					);
					FetchPotentialResults();
				});
		});
	}

	document.querySelectorAll(".close-modal").forEach((el) =>
		el.addEventListener("click", function (event) {
			event.target.closest(".modal-container").classList.add("hide");
		})
	);
}

const round = (number, decimalPlaces) => {
	const factorOfTen = Math.pow(10, decimalPlaces);
	return Math.round(number * factorOfTen) / factorOfTen;
};

const angleInDegrees = (p1, p2) => {
	return (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
};
const angleInRadians = (p1, p2) => {
	return Math.atan2(p2.y - p1.y, p2.x - p1.x);
};

const radiansToAxis = (radian) => {
	return {
		x: round(Math.cos(radian), 3),
		y: round(Math.sin(radian), 3),
	};
};
