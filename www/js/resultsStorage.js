const FILM_TYPE = {
	movie: 1,
	series: 2,
};

const LIST_TYPE = {
	history: 1,
	saved: 2,
	rating: 3,
};

var resultStorageContainer = {
	data: {
		savedResults: [],
		historyResults: [],
		ratedResults: [],
	},

	maxHistoryResults: 40,

	Setup: function () {
		this.Load();

		this.ReloadHistoryList();
		this.ReloadSavedList();
		this.ReloadRatedList();
	},
	InsertResultInHistory: function (result, type) {
		if (this.data.historyResults.length >= this.maxHistoryResults) {
			this.data.historyResults.pop();
		}

		var index = 0;
		for (const h of this.data.historyResults) {
			if (h.id === result.id) {
				this.data.historyResults.splice(index, 1);
				break;
			}
			index++;
		}

		result.fetched = new Date().toLocaleDateString();
		result.type = type;
		this.data.historyResults.unshift(result);

		this.Save();

		this.ReloadHistoryList();
	},
	InsertOrRemoveResultInSaved: function (result, type) {
		var removed = false;
		var index = 0;
		for (const o of this.data.savedResults) {
			if (o.id === result.id) {
				removed = true;
				this.data.savedResults.splice(index, 1);
				break;
			}
			index++;
		}

		if (!removed) {
			result.fetched = new Date().toLocaleDateString();
			result.type = type;
			this.data.savedResults.unshift(result);
		}

		this.Save();

		this.ReloadSavedList();

		return removed;
	},
	InsertResultInRated: function (result, rating, type) {
		var updatedRating = false;
		for (const o of this.data.ratedResults) {
			if (o.id === result.id) {
				this.data.ratedResults.rating = rating;
				updatedRating = true;
				break;
			}
		}

		if (!updatedRating) {
			result.fetched = new Date().toLocaleDateString();
			result.type = type;
			result.rating = rating;
			this.data.ratedResults.unshift(result);
		}

		this.Save();

		this.ReloadRatedList();
		this.ReloadHistoryList();
		this.ReloadSavedList();

		return updatedRating;
	},

	IncludedInSavedList: function (id) {
		for (const o of this.data.savedResults) {
			if (o.id === id) {
				return true;
			}
		}

		return false;
	},
	GetRatingForFilm: function (id) {
		for (const o of this.data.ratedResults) {
			if (o.id === id) {
				return o.rating;
			}
		}

		return null;
	},

	ReloadHistoryList: function () {
		var historyContainer = document.querySelector("#history_list");
		historyContainer.textContent = "";

		this.data.historyResults.forEach((h, index) => {
			historyContainer.insertAdjacentHTML(
				"beforeend",
				h.type === FILM_TYPE.movie
					? this.binder.BindMovieListObject(h, LIST_TYPE.history)
					: this.binder.BindSeriesListObject(h, LIST_TYPE.history)
			);
		});

		resultStorageContainer.events.SetupEvents();
	},
	ReloadSavedList: function () {
		var savedContainer = document.querySelector("#saved_list");
		savedContainer.textContent = "";

		this.data.savedResults.forEach((h, index) => {
			savedContainer.insertAdjacentHTML(
				"beforeend",
				h.type === FILM_TYPE.movie
					? this.binder.BindMovieListObject(h, LIST_TYPE.saved)
					: this.binder.BindSeriesListObject(h, LIST_TYPE.saved)
			);
		});

		resultStorageContainer.events.SetupEvents();
	},
	ReloadRatedList: function () {
		var ratedContainer = document.querySelector("#rated_list");
		ratedContainer.textContent = "";

		this.data.ratedResults.forEach((h, index) => {
			ratedContainer.insertAdjacentHTML(
				"beforeend",
				h.type === FILM_TYPE.movie
					? this.binder.BindMovieListObject(h, LIST_TYPE.rating)
					: this.binder.BindSeriesListObject(h, LIST_TYPE.rating)
			);
		});

		resultStorageContainer.events.SetupEvents();
	},

	Save: function () {
		json = JSON.stringify(this.data);

		window.localStorage.setItem("resultsSave", json);
	},
	Load: function () {
		resultsSave = JSON.parse(window.localStorage.getItem("resultsSave"));

		if (resultsSave !== null) {
			Object.assign(this.data, resultsSave);
		}
	},
	FindResultFromId: function (id) {
		for (const o of this.data.historyResults) {
			if (o.id === id) {
				return o;
			}
		}
		for (const o of this.data.savedResults) {
			if (o.id === id) {
				return o;
			}
		}
		for (const o of this.data.ratedResults) {
			if (o.id === id) {
				return o;
			}
		}
	},

	binder: {
		BindSeriesListObject: function (result, listType) {
			var rating = resultStorageContainer.GetRatingForFilm(result.id);
			return `						
			<li data-id="${result.id}">
				<img src="${tmdbPosterUrl + result.poster_path}" />
				<div>
					<h3>${result.name}</h3>
					<p>Series ${helpContainer.ListTypeToDescriptiveString(listType)} ${
				result.fetched
			}</p>
					<ul
						class="horizontal-list metadata-list small"
						id="tmdb_metadata">
						<li id="tmdb_rating" class="rating">
							<span class="rating">${result.vote_average}</span> ★
							${
								rating !== null
									? `<span class="user-rating color-red">(${resultStorageContainer.GetRatingForFilm(
											result.id
									  )} ★)</span>`
									: ""
							}
						</li>
						<li id="tmdb_year">${new Date(result.last_air_date).getFullYear()}</li>
						<li id="tmdb_duration">${result.number_of_seasons} season${
				result.number_of_seasons === 1 ? "" : "s"
			}</li>
					</ul>
				</div>
			</li>`;
		},
		BindMovieListObject: function (result, listType) {
			var rating = resultStorageContainer.GetRatingForFilm(result.id);
			return `						
			<li data-id="${result.id}">
				<img src="${tmdbPosterUrl + result.poster_path}" />
				<div>
					<h3>${result.title}</h3>
					<p>Movie ${helpContainer.ListTypeToDescriptiveString(listType)} ${
				result.fetched
			}</p>
					<ul
						class="horizontal-list metadata-list small"
						id="tmdb_metadata">
						<li id="tmdb_rating" class="rating">
							<span class="rating">${result.vote_average}</span> ★
							${
								rating !== null
									? `<span class="user-rating color-red">(${resultStorageContainer.GetRatingForFilm(
											result.id
									  )} ★)</span>`
									: ""
							}
						</li>
						<li id="tmdb_year">${new Date(result.release_date).getFullYear()}</li>
						<li id="tmdb_duration">${helpContainer.RuntimeToString(result.runtime)}</li>
					</ul>
				</div>
			</li>`;
		},
	},

	events: {
		SetupEvents: function () {
			document.querySelectorAll(".result-list > li").forEach((el) => {
				el.addEventListener(
					"click",
					resultStorageContainer.events.OnListItemClick
				);
			});
		},

		OnListItemClick: function (event) {
			var id = parseInt(event.currentTarget.dataset.id);
			var el = event.currentTarget;

			if (id !== undefined) {
				var obj = resultStorageContainer.FindResultFromId(id);

				if (obj !== undefined) {
					document.querySelector(".movie-container").classList.remove("hide");
					document.querySelector(".poster-scroll").classList.add("loading");
					elementContainer.SetToggleContainerState(false);

					filmContainer.SetSelectedFilm(obj);
				}
			}
		},
	},
};
