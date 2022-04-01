elementContainer = {
	releaseYearSlider: undefined,
	highestRatingSlider: undefined,
	inputRatingSlider: undefined,
	maxMovieLengthSlider: undefined,

	Setup: function () {
		// Setup sliders
		elementContainer.highestRatingSlider = noUiSlider.create(
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
		elementContainer.highestRatingSlider.on(
			"change",
			filmContainer.FetchPotentialResults
		);

		elementContainer.maxMovieLengthSlider = noUiSlider.create(
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
					return helpContainer.RuntimeToString(handleValue);
				},
			}
		);
		elementContainer.maxMovieLengthSlider.on(
			"change",
			filmContainer.FetchPotentialResults
		);

		elementContainer.releaseYearSlider = noUiSlider.create(
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
		elementContainer.releaseYearSlider.on(
			"change",
			filmContainer.FetchPotentialResults
		);

		elementContainer.inputRatingSlider = noUiSlider.create(
			document.querySelector("#rating_input"),
			{
				range: {
					min: 1,
					max: 10,
				},

				// Handles start at ...
				start: [5],
				step: 1,

				// Display colored bars between handles
				connect: true,

				// Put '0' at the bottom of the slider
				orientation: "horizontal",

				// Move handle on tap, bars are draggable
				behaviour: "tap-drag",
				tooltips: true,
				customFormatter: function (handleValue) {
					return `${Math.round(handleValue)} ★`;
				},
			}
		);
		elementContainer.inputRatingSlider.on(
			"change",
			eventContainer.RatingSliderChanged
		);

		this.ToggleFormDisplay();
	},

	CheckIfCollapsableGotSelectedChildren: function (collapseParent) {
		var clearBtn = collapseParent.querySelector("button");
		if (collapseParent.querySelectorAll("input:checked").length > 0) {
			collapseParent.classList.add("got-selected");
			if (clearBtn !== null) {
				collapseParent.querySelector("button").classList.remove("hide");
			}
		} else {
			collapseParent.classList.remove("got-selected");
			if (clearBtn !== null) {
				collapseParent.querySelector("button").classList.add("hide");
			}
		}
	},

	ToggleContainerState: function () {
		document.querySelector(".app").classList.toggle("toggled");
		this.CheckToggleContainerState();
	},
	SetToggleContainerState: function (set) {
		if (set) {
			document.querySelector(".app").classList.add("toggled");
		} else {
			document.querySelector(".app").classList.remove("toggled");
		}
		this.CheckToggleContainerState();
	},
	CheckToggleContainerState: function () {
		var toggled = document.querySelector(".app").classList.contains("toggled");
		document.querySelector(".menu-icon__cheeckbox").checked = toggled;
	},

	ToggleFormDisplay: function () {
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
	},

	DisableFetchBtns: function () {
		document.querySelectorAll(".fetch-btn-container").forEach((el) => {
			el.classList.add("loading");
			el.classList.remove("loaded");
		});
	},
	EnableFetchBtns: function () {
		document.querySelectorAll(".fetch-btn-container").forEach((el) => {
			el.classList.remove("loading");
			el.classList.add("loaded");
		});
	},
};

helpContainer = {
	RuntimeToString: function (runtime) {
		var rounded = Math.round(runtime);
		var hour = Math.floor(rounded / 60);
		var minutes = rounded - hour * 60;
		if (minutes === 0) {
			return `${hour} h`;
		}

		return `${hour} h ${minutes} min`;
	},

	OpenInTmdb: function (type, id) {
		var content_uri = theMovieDb.common.content_uri;

		var endpoint = `${content_uri}${
			type == FILM_TYPE.movie ? "movie" : "tv"
		}/${id}`;

		try {
			if (cordova.InAppBrowser !== undefined) {
				cordova.InAppBrowser.open(endpoint, "_system", "location=yes");
			}
		} catch (error) {
			console.error(error);
		}
	},

	ListTypeToDescriptiveString: function (listType) {
		switch (listType) {
			case LIST_TYPE.history:
				return "shown";
			case LIST_TYPE.saved:
				return "added";
			case LIST_TYPE.rating:
				return "rated";
		}

		return "added";
	},

	RadiansToAxis: function (radian) {
		return {
			x: this.Round(Math.cos(radian), 3),
			y: this.Round(Math.sin(radian), 3),
		};
	},
	AngleInRadians: function (p1, p2) {
		return Math.atan2(p2.y - p1.y, p2.x - p1.x);
	},
	AngleInDegrees: function (p1, p2) {
		return (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
	},
	Round: function (number, decimalPlaces) {
		const factorOfTen = Math.pow(10, decimalPlaces);
		return Math.round(number * factorOfTen) / factorOfTen;
	},
	GetDepthValue: function (obj, path, defaultValue) {
		let props;
		if (typeof obj === "undefined") return defaultValue;
		if (typeof path === "string") {
			props = path.split(".").reverse();
		} else {
			props = path;
		}
		if (path.length === 0) return obj || defaultValue;
		let current = props.pop();
		return this.GetDepthValue(obj[current], props, defaultValue);
	},
	ValidJson: function (check) {
		try {
			JSON.parse(check);
			return true;
		} catch (error) {
			console.log(error);
		}

		return false;
	},
};

var eventContainer = {
	Setup: function () {
		window.oncontextmenu = function (event) {
			event.preventDefault();
			event.stopPropagation();
			return false;
		};

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

		document.querySelectorAll(".close-modal").forEach((el) =>
			el.addEventListener("click", function (event) {
				event.target.closest(".modal-container").classList.add("hide");
			})
		);

		document
			.querySelector(".item.rating")
			.addEventListener("click", function () {
				var el = document.querySelector("#rate_container");

				el.querySelector(".rating-container").classList.remove("hide");
				el.querySelector(".rated-container").classList.add("hide");
			});
		document
			.querySelector(".item.bookmark")
			.addEventListener("click", function (event) {
				var removed = resultStorageContainer.InsertOrRemoveResultInSaved(
					filmContainer.lastFilmResult,
					filmContainer.lastFilmResultType
				);

				filmContainer.SetBookmarkLayout(!removed);
				if (!removed) {
					var rect = event.currentTarget.getBoundingClientRect();
					pJSDom[0].pJS.fn.add(10, rect.x, rect.y, 120);
					mediaContainer.PlayAudio(mediaContainer.audio.pop);
				}
			});

		document.querySelectorAll("*[data-target-modal]").forEach((el) => {
			el.addEventListener("click", function (event) {
				var target = document.querySelector(
					event.currentTarget.dataset.targetModal
				);

				if (target !== null) {
					target.classList.toggle("hide");
				}
			});
		});

		document
			.querySelector(".rate-movie")
			.addEventListener("click", function (event) {
				var rating = Math.round(elementContainer.inputRatingSlider.get());

				var updated = filmContainer.RateFilm(rating);

				document.querySelector(".rated-container").classList.remove("hide");
				document.querySelector(".rating-container").classList.add("hide");

				setTimeout(function () {
					document.querySelector("#rate_container").classList.add("hide");
					filmContainer.SetRatingLayout(rating);

					if (!updated) {
						var ratingEl = document.querySelector(
							".controls-container .rating"
						);
						var rect = ratingEl.getBoundingClientRect();
						mediaContainer.PlayAudio(mediaContainer.audio.bellMircowave);
						pJSDom[0].pJS.fn.add(
							5,
							rect.x + rect.width / 2,
							rect.y + rect.height / 2,
							0
						);
					}
				}, 2000);
			});

		document.querySelector(".item.tmdb").addEventListener("click", function () {
			if (
				filmContainer.lastFilmResult !== undefined &&
				filmContainer.lastFilmResult !== undefined
			) {
				helpContainer.OpenInTmdb(
					filmContainer.lastFilmResultType,
					filmContainer.lastFilmResult.id
				);
			}
		});
	},

	RatingSliderChanged: function (event) {
		console.log;
		var rating = Math.round(elementContainer.inputRatingSlider.get());
		var text = "";

		if (rating >= 10) {
			text = `This was SO great!!`;
		} else if (rating >= 7) {
			text = `I really liked this`;
		} else if (rating >= 4) {
			text = "I've seen better...";
		} else if (rating >= 2) {
			text = "This was not good";
		} else {
			text = "Pure garbage 💩";
		}

		var el = document.querySelector(".rating-dialog");
		el.style.animation = null;
		el.focus();
		el.style.animation = "heart 500ms ease";

		el.querySelector(".text").textContent = text;
		el.querySelector(".rating").textContent = `${rating} ★`;
	},
};
