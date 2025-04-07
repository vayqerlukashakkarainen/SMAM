filmContainer = {
	initialized: false,
	fetchingResultsTimer: undefined,
	fetchingTimeout: undefined,

	randomizedPage: -1,
	randomizedValueOnPage: -1,
	selectedRandomizedResult: -1,
	totalPages: -1,
	discoverResult: undefined,
	totalResults: 0,
	possibleResultsArray: undefined,
	discoverResult: undefined,
	randomizedResult: -1,
	selectedFilmId: -1,
	lastFilmResult: undefined,
	lastFilmResultType: undefined,

	fetchCost: 0,
	inBackground: false,

	resultsPerPage: 20,
	maxPageSelector: 1000,

	holdPopcornTimeoutTime: 1000,
	holdPopcornTimeout: undefined,
	holdInterval: undefined,
	loadImagesInterval: undefined,
	holdCounter: 0,

	Setup: function () {
		this.FetchMovieCategoriesFromTMDB();
		this.FetchTVShowCategoriesFromTMDB();
		this.FetchPotentialResults();
	},

	FetchMovieCategoriesFromTMDB: function () {
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
							.addEventListener("change", filmContainer.FetchPotentialResults);
					});
				}
			},
			function (responseText) {
				alert("Movie categories error: " + responseText);
			}
		);
	},
	FetchTVShowCategoriesFromTMDB: function () {
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
							.addEventListener("change", filmContainer.FetchPotentialResults);
					});
				}
			},
			function (responseText) {
				alert("TV Categorier error: " + responseText);
			}
		);
	},

	PerformFetchFilm: function (cost) {
		elementContainer.SetToggleContainerState(false);
		document.querySelector(".app").classList.remove("cb-error");
		document.querySelector(".app").classList.add("loading");
		document.querySelector("#toggle_overlay input").checked = false;
		this.fetchCost = cost;

		if (!this.inBackground) {
			if (this.fetchingTimeout != undefined) {
				clearTimeout(this.fetchingTimeout);
				this.fetchingTimeout = undefined;
			}
			this.fetchingTimeout = setTimeout(Perform, 100);
		} else {
			Perform();
		}

		function Perform() {
			if (filmContainer.RandomizeResult()) {
				var form = filmContainer.FetchOptionsFromForm();
				if (!filmContainer.inBackground) {
					clearTimeout(filmContainer.fetchingTimeout);
					filmContainer.fetchingTimeout = undefined;
					elementContainer.DisableFetchBtns();
				}
				filmContainer.ResetMovieInfoLayout();
				document.querySelector(".movie-grid-container").scrollTo(0, 0);

				switch (form.type) {
					case "1":
						theMovieDb.discover.getMovies(
							form.movieFilters,
							filmContainer.events.RandomlySelectFilm,
							filmContainer.events.FilmFetchErrorCallback
						);
						break;
					case "2":
						theMovieDb.discover.getTvShows(
							form.showFilters,
							filmContainer.events.RandomlySelectFilm,
							filmContainer.events.FilmFetchErrorCallback
						);
						break;
				}
			} else {
				document.querySelector(".movie-container").classList.remove("loading");
			}
		}
	},
	PerformOnHoldInterval: function (cost) {
		this.holdCounter++;

		switch (this.holdCounter) {
			case 1:
				document.querySelector(".movie-container").classList.remove("hide");
				document.querySelector(".movie-container").classList.add("loading");
				document.querySelector(".movie-container").classList.remove("loaded");
				document.querySelector(".poster-scroll").classList.add("loading");
				StartTimer();

				function StartTimer() {
					filmContainer.holdPopcornTimeout = setTimeout(function () {
						if (filmContainer.holdPopcornTimeoutTime > 100) {
							filmContainer.holdPopcornTimeoutTime -= 150;
						}

						var rect = document.querySelector("body").getBoundingClientRect();
						pJSDom[0].pJS.fn.add(1, rect.width / 2, rect.height / 2, 120);

						StartTimer();
					}, filmContainer.holdPopcornTimeoutTime);
				}
				break;
			case 5:
				filmContainer.inBackground = true;
				document.querySelector(".app").classList.add("disco");
				if (filmContainer.discoverResult !== undefined) {
					filmContainer.loadImagesInterval = setInterval(() => {
						document.querySelector(
							".disco-container img"
						).src = `${tmdbPosterUrl}${
							filmContainer.discoverResult.results[
								Math.floor(Math.random() * 20)
							].poster_path
						}`;
					}, 50);
				}
				mediaContainer.PlayRepeatedMedia(mediaContainer.audio.blbl);
				filmContainer.PerformFetchFilm(cost);
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
	},

	SetSelectedFilm: function (object) {
		this.selectedFilmId = object.id;

		this.ResetMovieInfoLayout();
		this.SetPosterAndBanner(object);

		if (object.type === FILM_TYPE.movie) {
			filmContainer.events.LoadMovieData(object, true);
		} else if (object.type === FILM_TYPE.series) {
			filmContainer.events.LoadSeriesData(object, true);
		}

		providersContainer.FetchWatchProviders(filmContainer.selectedFilmId);
	},
	SetPosterAndBanner: function (discover) {
		document.querySelector(
			"#tmdb_poster"
		).src = `${tmdbPosterUrl}${discover.poster_path}`;
		document.querySelector(
			"#tmdb_banner"
		).src = `${tmdbBannerUrl}${discover.backdrop_path}`;
	},

	FetchPotentialResults: function () {
		elementContainer.DisableFetchBtns();

		clearTimeout(this.fetchingResultsTimer);
		this.fetchingResultsTimer = setTimeout(OnTimeout, 1000);

		function OnTimeout() {
			var form = filmContainer.FetchOptionsFromForm();

			switch (form.type) {
				case "1":
					theMovieDb.discover.getMovies(
						form.movieFilters,
						filmContainer.events.LoadPotentialResults,
						filmContainer.events.DiscoryErrorCallback
					);
					break;
				case "2":
					theMovieDb.discover.getTvShows(
						form.showFilters,
						filmContainer.events.LoadPotentialResults,
						filmContainer.events.DiscoryErrorCallback
					);
					break;
			}
		}
	},

	RandomizeResult: function () {
		if (this.possibleResultsArray !== undefined) {
			if (this.possibleResultsArray.length > 0) {
				this.selectedRandomizedResult = Math.floor(
					Math.random() * this.possibleResultsArray.length
				);
				this.randomizedResult =
					this.possibleResultsArray[this.selectedRandomizedResult];
				var randomPageNotCieled =
					(this.randomizedResult === 0 ? 1 : this.randomizedResult) /
					this.resultsPerPage;
				this.randomizedPage = Math.ceil(
					Number.isInteger(randomPageNotCieled)
						? randomPageNotCieled + 1
						: randomPageNotCieled
				);
				this.randomizedValueOnPage =
					this.randomizedResult -
					(this.randomizedPage - 1) * this.resultsPerPage;
				return true;
			} else {
				document
					.querySelector("#no_results_left_container")
					.classList.remove("hide");
				return false;
			}
		} else {
			var randomSeed =
				this.totalPages > this.resultsPerPage * this.maxPageSelector
					? this.resultsPerPage * this.maxPageSelector
					: this.totalPages;
			this.randomizedPage = Math.floor(Math.random() * randomSeed) + 1;
			return true;
		}
	},
	ResetMovieInfoLayout: function () {
		var bookmarkEl = document.querySelector(".bookmark");
		filmContainer.SetBookmarkLayout(false);
		filmContainer.SetRatingLayout(null);

		// Poster and banner
		document.querySelector("#tmdb_poster").src = "img/poster_template.jpg";
		document.querySelector("#tmdb_banner").src = "img/banner.jpg";
	},
	SetBookmarkLayout: function (bookmarked) {
		var bookmarkEl = document.querySelector(".controls-container .bookmark");
		if (!bookmarked) {
			bookmarkEl.classList.remove("filled");
			bookmarkEl.querySelector("h3").textContent = "Save";
			bookmarkEl.querySelector("img").src = "img/hearts/heart_64.png";
		} else {
			bookmarkEl.classList.add("filled");
			bookmarkEl.querySelector("h3").textContent = "Saved";
			bookmarkEl.querySelector("img").src =
				"img/hearts/heart_filled_red_64.png";
		}
	},
	RateFilm: function (rating) {
		if (
			filmContainer.lastFilmResult !== undefined &&
			rating !== undefined &&
			rating > 0 &&
			rating <= 10
		) {
			if (
				filmContainer.lastFilmResultType === FILM_TYPE.movie &&
				save.guestSessionId !== undefined
			) {
				theMovieDb.movies.rateGuest(
					{
						id: filmContainer.lastFilmResult.id,
						guest_session_id: save.guestSessionId,
					},
					rating,
					function () {
						save.guestSessionUsed = true;
					},
					function () {
						console.log(error);
					}
				);
			} else if (
				filmContainer.lastFilmResultType === FILM_TYPE.series &&
				save.guestSessionId !== undefined
			) {
				theMovieDb.tv.rateGuest(
					{
						id: filmContainer.lastFilmResult.id,
						guest_session_id: save.guestSessionId,
					},
					rating,
					function () {
						save.guestSessionUsed = true;
					},
					function (error) {
						console.log(error);
					}
				);
			}

			var updated = resultStorageContainer.InsertResultInRated(
				filmContainer.lastFilmResult,
				rating,
				filmContainer.lastFilmResultType
			);

			Save();

			return updated;
		}
	},
	SetRatingLayout: function (rating) {
		var ratingEl = document.querySelector(".controls-container .rating");
		if (rating !== null) {
			ratingEl.classList.add("filled");
			ratingEl.querySelector("span.text").textContent = "Rated ";
			ratingEl.querySelector("span.rating").textContent = `${rating} ★`;
			elementContainer.inputRatingSlider.set(rating);
			if (rating == 10) {
				ratingEl.querySelector("img").src = "img/stars/star_64.png";
			} else {
				ratingEl.querySelector("img").src = "img/stars/star_half_64.png";
			}
		} else {
			ratingEl.classList.remove("filled");
			ratingEl.querySelector("span.text").textContent = "Rate";
			ratingEl.querySelector("span.rating").textContent = "";
			ratingEl.querySelector("img").src = "img/stars/star_empty_64.png";
			elementContainer.inputRatingSlider.set(5);
		}

		eventContainer.RatingSliderChanged(undefined);
	},
	ResetRandomValues: function () {
		this.randomizedResult = -1;
		this.randomizedPage = -1;
		this.randomizedValueOnPage = -1;
		this.selectedRandomizedResult = -1;
		if (this.totalResults > 0) {
			const initArrayLength =
				this.totalResults > this.resultsPerPage * this.maxPageSelector
					? this.resultsPerPage * this.maxPageSelector
					: this.totalResults;
			this.possibleResultsArray = new Array(initArrayLength)
				.fill(0)
				.map((v, index) => (v = index));
		} else {
			this.possibleResultsArray = undefined;
		}
	},
	ResetHoldInterval: function () {
		clearInterval(this.holdInterval);
		clearInterval(this.loadImagesInterval);
		this.holdInterval = undefined;
		this.loadImagesInterval = undefined;
		this.holdPopcornTimeoutTime = 1000;
		clearTimeout(this.holdPopcornTimeout);
		this.holdPopcornTimeout = undefined;
		this.holdCounter = 0;
		document.querySelector(".app").classList.remove("disco");
		document.querySelector(".app").classList.remove("fsah");
		mediaContainer.StopAllMedia();
		this.inBackground = false;
	},

	FetchOptionsFromForm: function () {
		var formElement = document.querySelector("#filter_form");
		var type = formElement.querySelector("input[name='type_cb']:checked").value;

		return {
			type: type,
			movieFilters: {
				language: language,
				page: GetRandomSelectedPage(),
				"primary_release_date.gte": new Date(
					`${Math.round(elementContainer.releaseYearSlider.get()[0])}-01-01`
				)
					.toISOString()
					.split("T")[0],
				"primary_release_date.lte": new Date(
					`${Math.round(elementContainer.releaseYearSlider.get()[1])}-12-31`
				)
					.toISOString()
					.split("T")[0],
				"vote_average.gte": Math.round(
					elementContainer.highestRatingSlider.get()[0]
				),
				"vote_average.lte": Math.round(
					elementContainer.highestRatingSlider.get()[1]
				),
				"vote_count.gte": GetMaxVotesFromOriginalLanguages(),
				with_genres: GenerateInputFromFieldset(type, "movie_generes"),
				"with_runtime.lte": Math.round(
					elementContainer.maxMovieLengthSlider.get()
				),
				with_watch_providers: GenerateInputFromFieldset(
					type,
					"movie_providers"
				),
				watch_region: providersContainer.providerCurrentRegionIso,
				with_original_language: GenerateInputFromFieldset(
					undefined,
					"original_languages"
				),
			},
			showFilters: {
				language: language,
				page: GetRandomSelectedPage(),
				"air_date.gte": new Date(
					`${Math.round(elementContainer.releaseYearSlider.get()[0])}-01-01`
				)
					.toISOString()
					.split("T")[0],
				"air_date.lte": new Date(
					`${Math.round(elementContainer.releaseYearSlider.get()[1])}-12-31`
				)
					.toISOString()
					.split("T")[0],
				"vote_average.gte": Math.round(
					elementContainer.highestRatingSlider.get()[0]
				),
				"vote_average.lte": Math.round(
					elementContainer.highestRatingSlider.get()[1]
				),
				"vote_count.gte": GetMaxVotesFromOriginalLanguages(),
				with_genres: GenerateInputFromFieldset(type, "shows_generes"),
				with_watch_providers: GenerateInputFromFieldset(type, "tv_providers"),
				watch_region: providersContainer.providerCurrentRegionIso,
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
			if (
				document.querySelector(
					`#filter_form input[name="explorer_cb"]:checked`
				) !== null
			) {
				return 0;
			}

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
			return filmContainer.randomizedPage === -1
				? 1
				: filmContainer.randomizedPage;
		}
	},

	events: {
		DiscoryErrorCallback: function () {
			document.querySelector(".app").classList.add("disc-error");
		},
		FilmFetchErrorCallback: function () {
			document.querySelector(".app").classList.add("cb-error");
			filmContainer.events.LoadingDataDone();
		},
		LoadPotentialResults: function (responseText) {
			var response = JSON.parse(responseText);
			filmContainer.discoverResult = response;

			elementContainer.EnableFetchBtns();

			document.querySelectorAll(".fetch-btn-container").forEach((el) => {
				el.querySelector(".pot-results > span").textContent =
					response.total_results;
				filmContainer.totalPages = response.total_pages;
			});

			filmContainer.totalResults = response.total_results;
			filmContainer.ResetRandomValues();

			if (!filmContainer.initialized) {
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
				filmContainer.initialized = true;
			}
		},

		RandomlySelectFilm: function (discoverText) {
			var response = JSON.parse(discoverText);

			filmContainer.selectedFilmId =
				response.results[filmContainer.randomizedValueOnPage].id;

			filmContainer.SetPosterAndBanner(
				response.results[filmContainer.randomizedValueOnPage]
			);

			save.resultsFetched += 1;
			switch (filmContainer.FetchOptionsFromForm().type) {
				case "1":
					theMovieDb.movies.getById(
						{ id: filmContainer.selectedFilmId },
						filmContainer.events.LoadMovieData,
						filmContainer.events.FilmFetchErrorCallback
					);
					break;
				case "2":
					theMovieDb.tv.getById(
						{ id: filmContainer.selectedFilmId },
						filmContainer.events.LoadSeriesData,
						filmContainer.events.FilmFetchErrorCallback
					);
					break;
			}

			providersContainer.FetchWatchProviders(filmContainer.selectedFilmId);
		},

		LoadMovieData: function (responseText, bySetting = false) {
			var filmResult = helpContainer.ValidJson(responseText)
				? JSON.parse(responseText)
				: responseText;

			if (!bySetting) {
				save.moviesFetched += 1;
				popcornContainer.UsePopcorns(filmContainer.fetchCost);
			}

			document.querySelector("#tmdb_title").textContent = filmResult.title;
			document.querySelector("#tmdb_description").textContent =
				filmResult.overview;
			document.querySelector("#tmdb_rating > span.rating").textContent =
				filmResult.vote_average.toFixed(1);
			document.querySelector("#tmdb_year").textContent = new Date(
				filmResult.release_date
			).getFullYear();
			document.querySelector("#tmdb_duration").textContent =
				helpContainer.RuntimeToString(filmResult.runtime);
			document.querySelector("#tmdb_categories").innerHTML = "";

			filmResult.genres.forEach((genre) => {
				document
					.querySelector("#tmdb_categories")
					.insertAdjacentHTML("beforeend", `<li>${genre.name}</li>`);
			});

			filmContainer.lastFilmResult = filmResult;
			filmContainer.lastFilmResultType = FILM_TYPE.movie;

			filmContainer.SetBookmarkLayout(
				resultStorageContainer.IncludedInSavedList(filmResult.id)
			);
			filmContainer.SetRatingLayout(
				resultStorageContainer.GetRatingForFilm(filmResult.id)
			);

			if (!bySetting) {
				resultStorageContainer.InsertResultInHistory(
					filmResult,
					FILM_TYPE.movie
				);
			}
			if (!filmContainer.inBackground) {
				filmContainer.events.LoadingDataDone();
			}
		},
		LoadSeriesData: function (responseText, bySetting = false) {
			var seriesResult = helpContainer.ValidJson(responseText)
				? JSON.parse(responseText)
				: responseText;

			if (!bySetting) {
				popcornContainer.UsePopcorns(filmContainer.fetchCost);
				save.seriesFetched += 1;
			}

			document.querySelector("#tmdb_title").textContent = seriesResult.name;
			document.querySelector("#tmdb_description").textContent =
				seriesResult.overview;
			document.querySelector("#tmdb_rating > span.rating").textContent =
				seriesResult.vote_average.toFixed(1);
			document.querySelector("#tmdb_year").textContent = `${new Date(
				seriesResult.first_air_date
			).getFullYear()} - ${new Date(seriesResult.last_air_date).getFullYear()}`;
			document.querySelector("#tmdb_duration").textContent = `${
				seriesResult.number_of_seasons
			} season${seriesResult.number_of_seasons === 1 ? "" : "s"}`;
			document.querySelector("#tmdb_categories").innerHTML = "";

			seriesResult.genres.forEach((genre) => {
				document
					.querySelector("#tmdb_categories")
					.insertAdjacentHTML("beforeend", `<li>${genre.name}</li>`);
			});

			filmContainer.lastFilmResult = seriesResult;
			filmContainer.lastFilmResultType = FILM_TYPE.series;

			filmContainer.SetBookmarkLayout(
				resultStorageContainer.IncludedInSavedList(seriesResult.id)
			);
			filmContainer.SetRatingLayout(
				resultStorageContainer.GetRatingForFilm(seriesResult.id)
			);

			if (!bySetting) {
				resultStorageContainer.InsertResultInHistory(
					seriesResult,
					FILM_TYPE.series
				);
			}
			if (!filmContainer.inBackground) {
				filmContainer.events.LoadingDataDone(seriesResult);
			}
		},
		LoadingDataDone: function () {
			filmContainer.possibleResultsArray.splice(
				filmContainer.selectedRandomizedResult,
				1
			);
			if (!filmContainer.inBackground) {
				setTimeout(Perform, 100);
			} else {
				Perform();
			}

			function Perform() {
				elementContainer.EnableFetchBtns();
				document.querySelector(".movie-container").classList.remove("loading");
				document.querySelector(".movie-container").classList.add("loaded");
				document.querySelector(".app").classList.remove("loading");
				try {
					mediaContainer.PlayAudio(mediaContainer.audio.pop);
				} catch (error) {
					console.log(error);
				}
			}
		},
	},
};

providersContainer = {
	providerCurrentRegionIso: undefined,
	availableProviders: undefined,

	Setup: function () {
		this.FetchAvailableProviderRegions(function () {
			if (providersContainer.providerCurrentRegionIso !== undefined) {
				providersContainer.FetchMovieProviders(
					providersContainer.providerCurrentRegionIso
				);
				providersContainer.FetchTVProviders(
					providersContainer.providerCurrentRegionIso
				);
			} else {
				document
					.querySelector(`#filter_form fieldset[name="tv_providers"]`)
					.classList.add("d-none");
				document
					.querySelector(`#filter_form fieldset[name="movie_providers"]`)
					.classList.add("d-none");
			}
		});

		this.SetupBindings();
	},

	SetupBindings() {
		document
			.querySelector("#fetch_providers")
			.addEventListener("click", function () {
				providersContainer.FetchWatchProviders();
			});
	},

	FetchAvailableProviderRegions: function (onSuccess) {
		theMovieDb.providers.getAvailableRegions(
			{},
			function (responseText) {
				var obj = JSON.parse(responseText);

				this.availableProviders = obj.results;
				providersContainer.SetProviderForCurrentLanguage();

				onSuccess();
			},
			function (responseText) {
				alert("Fetch available provider regions error: " + responseText);
			}
		);
	},
	SetProviderForCurrentLanguage: function () {
		var iso = languageContainer.FetchIso_3166_1FromLocale(region);

		if (iso !== undefined && availableProviders !== undefined) {
			document.querySelectorAll("span[data-insert-country]").forEach((el) => {
				el.textContent = languageContainer.GetCountryName(iso);
			});

			availableProviders.forEach((provider) => {
				if (provider.iso_3166_1.toLowerCase() === iso.toLowerCase()) {
					providersContainer.providerCurrentRegionIso = iso;
					return;
				}
			});
		}
	},

	FetchWatchProviders: function (filmId) {
		document.querySelector(".app").classList.remove("wp-error");

		switch (filmContainer.FetchOptionsFromForm().type) {
			case "1":
				theMovieDb.movies.getWatchProviders(
					{ id: filmId },
					providersContainer.events.LoadProviders,
					providersContainer.events.WatchProviderErrorCallback
				);
				break;
			case "2":
				theMovieDb.tv.getWatchProviders(
					{ id: filmId },
					providersContainer.events.LoadProviders,
					providersContainer.events.WatchProviderErrorCallback
				);
				break;
		}
	},
	FetchMovieProviders: function (with_region) {
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
						if (
							!providersContainer.filters.FilterOutProvider(
								provider.provider_name
							)
						) {
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
									elementContainer.CheckIfCollapsableGotSelectedChildren(
										event.target.closest("fieldset.collapsable")
									);
									filmContainer.FetchPotentialResults();
								});
						}
					});
				}
			},
			function (responseText) {
				alert("Fetch movie providers error: " + responseText);
			}
		);
	},
	FetchTVProviders: function (with_region) {
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
								elementContainer.CheckIfCollapsableGotSelectedChildren(
									event.target.closest("fieldset.collapsable")
								);
								filmContainer.FetchPotentialResults();
							});
					});
				}
			},
			function (responseText) {
				alert("Fetch TV Providers error: " + responseText);
			}
		);
	},
	events: {
		LoadProviders: function (responseText) {
			document.querySelector("#stream_from .stream-providers").textContent = "";
			document.querySelector("#rent_buy_from .stream-providers").textContent =
				"";

			var providersJson = JSON.parse(responseText);

			var countryProvider = helpContainer.GetDepthValue(
				providersJson.results,
				`${providersContainer.providerCurrentRegionIso}`,
				undefined
			);

			if (countryProvider !== undefined) {
				if (countryProvider.flatrate !== undefined) {
					countryProvider.flatrate.forEach((provider) => {
						if (
							!providersContainer.filters.FilterOutProvider(
								provider.provider_name
							)
						) {
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
				if (countryProvider.free !== undefined) {
					countryProvider.free.forEach((provider) => {
						if (
							!providersContainer.filters.FilterOutProvider(
								provider.provider_name
							)
						) {
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
						if (
							!providersContainer.filters.FilterOutProvider(
								provider.provider_name
							)
						) {
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
							if (
								!providersContainer.filters.FilterOutProvider(
									provider.provider_name
								)
							) {
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
		},
		WatchProviderErrorCallback: function () {
			document.querySelector(".app").classList.add("wp-error");
		},
	},
	filters: {
		FilterOutProvider: function (providerName) {
			if (cordova.platformId === "ios") {
				return providerName.toLowerCase().includes("google");
			}

			return false;
		},
	},
};
