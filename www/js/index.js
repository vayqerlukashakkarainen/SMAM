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

var region = "sv-SE";
var language = "en-US";

var supportedOriginalLanguages = [
    {
        "language": "English",
        "iso_639_1": "en"
    },
    {
        "language": "Spanish",
        "iso_639_1": "es"
    },
    {
        "language": "Mandarin",
        "iso_639_1": "zh"
    },
    {
        "language": "French",
        "iso_639_1": "fr"
    },
    {
        "language": "Arabic",
        "iso_639_1": "ar"
    },
    {
        "language": "Russian",
        "iso_639_1": "ru"
    },
    {
        "language": "Indonesian",
        "iso_639_1": "id"
    }
]
    
document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
    
	console.log("Running cordova-" + cordova.platformId + "@" + cordova.version);

	// TODO: Fetch device language and move the main scope here
    if (navigator.globalization !== undefined) {
        navigator.globalization.getLocaleName(
            function (locale) {
                var locales = supportedOriginalLanguages.filter(function (country) {
                    return country.iso_639_1 === locale;
                });

                if (locales.length === 0) {
                    supportedOriginalLanguages.unshift({
                        "language": GetCountryName(locale),
                        "iso_639_1": locale
                    })
                }
            },
            function () {
                
            }
        );
    }
}


MainScope();
function MainScope() {

    var audioPop = new Audio('../www/sounds/pop.mp3');
    const tmdbPosterUrl = "https://www.themoviedb.org/t/p/w500";
    const tmdbBannerUrl = "https://www.themoviedb.org/t/p/w1920_and_h800_multi_faces";
    const tmdbIconUrl = "https://image.tmdb.org/t/p/original"

    var highestRatingSlider = undefined;
    var maxMovieLengthSlider = undefined;
    var releaseYearSlider = undefined;

    Init();
    ToggleFormDisplay();

    document.querySelector("#tmdb_poster").addEventListener("error", function(el) {
        el.src = "../img/poster_template.jpg";
    });
    document.querySelector("#tmdb_banner").addEventListener("error", function(el) {
        el.src = "../img/banner.jpg";
    });

    document.querySelector("#toggle_overlay").onclick = function () {
        document.querySelector(".app").classList.toggle("toggled");
    };
    document
    .querySelectorAll(".collapsable")
    .forEach((el) => {
        el.addEventListener("click", function(event) {
            el.classList.toggle("collapsed");
        });
    });

    document
    .querySelectorAll(".clear-input")
    .forEach((el) => {
        el.addEventListener("click", function(event) {
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
    .querySelectorAll(".fetch-film")
    .forEach((el) => {
        el.addEventListener("click", function() {
            if (el.classList.contains("start-over")) {
                ResetRandomValues();
                document.querySelector(".no-results-left-container").classList.add("hide");
            }

            PerformFetchFilm();
        });
    });

    var fetchingResultsTimer = undefined;
    function FetchPotentialResults() {

        document.querySelectorAll(".fetch-btn-container").forEach((el) => {
            el.classList.add("loading");
            el.classList.remove("loaded");
        });

        clearTimeout(fetchingResultsTimer);
        fetchingResultsTimer = setTimeout(OnTimeout, 1000);

        function OnTimeout() {
            var form = FetchOptionsFromForm();

            switch(form.type) {
                case "1":
                    theMovieDb.discover.getMovies(form.movieFilters, LoadPotentialResults, ErrorCallback);
                    break;
                case "2":
                    theMovieDb.discover.getTvShows(form.showFilters, LoadPotentialResults, ErrorCallback);
                    break;
            }
        }
    }

    var initialized = false;
    var resultsPerPage = 20;
    var maxPageSelector = 500;
    var totalResults = 0;
    function LoadPotentialResults(responseText) {
        var response = JSON.parse(responseText);
        document.querySelectorAll(".fetch-btn-container").forEach((el) => {
            el.querySelector(".pot-results > span").textContent = response.total_results;
            el.classList.remove("loading");
            el.classList.add("loaded");

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
    var fetchingRequestsMade = 0;
    function PerformFetchFilm() {
        document.querySelector(".movie-container").classList.remove("hide");
        document.querySelector(".movie-container").classList.add("loading");
        document.querySelector(".movie-container").classList.remove("loaded");
        document.querySelector(".poster-scroll").classList.add("loading");

        document.querySelector(".app").classList.remove("toggled");
        document.querySelector("#toggle_overlay input").checked = false;

        if (fetchingTimeout != undefined) {
            fetchingRequestsMade++;
            clearTimeout(fetchingTimeout);
            fetchingTimeout = undefined;
            console.log(fetchingRequestsMade);
        }

        fetchingTimeout = setTimeout(function() {
            if (RandomizeResult()) {
                var form = FetchOptionsFromForm();
                fetchingRequestsMade = 0;
                clearTimeout(fetchingTimeout);
                fetchingTimeout = undefined;
    
                switch(form.type) {
                    case "1":
                        theMovieDb.discover.getMovies(form.movieFilters, RandomlySelectFilm, ErrorCallback);
                        break;
                    case "2":
                        theMovieDb.discover.getTvShows(form.showFilters, RandomlySelectFilm, ErrorCallback);
                        break;
                }
            }
        }, 200);
    }

    // From the result, we generate an array with all the possible values, from the array
    // we pop the value so we 
    var possibleResultsArray = undefined;
    var randomizedResult = -1;
    var randomizedPage = -1;
    var randomizedValueOnPage = -1;
    var selectedRandomizedResult = -1;
    var totalPages = -1;
    function RandomizeResult() {

        if (possibleResultsArray !== undefined) {
            if (possibleResultsArray.length > 0) {
                selectedRandomizedResult = Math.floor(Math.random() * possibleResultsArray.length);
                randomizedResult = possibleResultsArray[selectedRandomizedResult];
                var randomPageNotCieled = (randomizedResult === 0 ? 1 : randomizedResult) / resultsPerPage;
                randomizedPage = Math.ceil(Number.isInteger(randomPageNotCieled) ? randomPageNotCieled + 1 : randomPageNotCieled);
                randomizedValueOnPage = randomizedResult - ((randomizedPage - 1) * resultsPerPage);
                return true;
            }
            else {
                document.querySelector(".no-results-left-container").classList.remove("hide");
                return false;
            }
        }
        else {
            var randomSeed = totalPages > resultsPerPage * maxPageSelector ? resultsPerPage * maxPageSelector : totalPages;
            randomizedPage =  Math.floor(Math.random() * randomSeed) + 1;
            return true;
        }
    }
    function ResetRandomValues() {
        randomizedResult = -1;
        randomizedPage = -1;
        randomizedValueOnPage = -1;
        selectedRandomizedResult = -1;
        if (totalResults > 0) {
            const initArrayLength = totalResults > resultsPerPage * maxPageSelector ? resultsPerPage * maxPageSelector : totalResults;
            possibleResultsArray = new Array(initArrayLength).fill(0).map((v, index) => v = index);
        }
        else {
            possibleResultsArray = undefined;
        }
    }
    function RandomlySelectFilm(discoverText) {
        var response = JSON.parse(discoverText);

        var id = response.results[randomizedValueOnPage].id;

        possibleResultsArray.splice(selectedRandomizedResult, 1);

        CheckIfThereAreAnyResultsLeft();

        switch(FetchOptionsFromForm().type) {
            case "1":
                theMovieDb.movies.getById({ id: id }, LoadMovieData, ErrorCallback); 
                theMovieDb.movies.getWatchProviders({ id: id }, LoadProviders, ErrorCallback);
                break;
            case "2":
                theMovieDb.tv.getById({ id: id }, LoadSeriesData, ErrorCallback);
                theMovieDb.tv.getWatchProviders({ id: id }, LoadProviders, ErrorCallback);
                break;
        }
    }

    function CheckIfThereAreAnyResultsLeft() {
        if (possibleResultsArray.length === 0) {

        }
    }

    // Callbacks
    function LoadMovieData(responseText) {
        var filmResult = JSON.parse(responseText);

        document.querySelector("#tmdb_title").textContent = filmResult.title;
        document.querySelector("#tmdb_description").textContent = filmResult.overview;
        document.querySelector("#tmdb_poster").src = `${tmdbPosterUrl}${filmResult.poster_path}`;
        document.querySelector("#tmdb_banner").src = `${tmdbBannerUrl}${filmResult.backdrop_path}`;
        document.querySelector("#tmdb_rating > span.rating").textContent = filmResult.vote_average;
        document.querySelector("#tmdb_rating > span > span.count").textContent = filmResult.vote_count;
        document.querySelector("#tmdb_year").textContent = new Date(filmResult.release_date).getFullYear();
        document.querySelector("#tmdb_duration").textContent = RuntimeToString(filmResult.runtime);
        document.querySelector("#tmdb_categories").innerHTML = "";

        filmResult.genres.forEach((genre) => {
            document.querySelector("#tmdb_categories").insertAdjacentHTML(
                "beforeend",
                `<li>${genre.name}</li>`
            );
        });

        setTimeout(function() {
            document.querySelector(".movie-container").classList.remove("loading");
            document.querySelector(".movie-container").classList.add("loaded");
            audioPop.play();
        }, 250);
    }
    function LoadProviders(responseText) {

        document.querySelector("#stream_from .stream-providers").textContent = "";
        document.querySelector("#rent_buy_from .stream-providers").textContent = "";

        var providersJson = JSON.parse(responseText);

        var countryProvider = GetDepthValue(providersJson.results, `${providerCurrentLanguageIso}`, undefined);

        if (countryProvider !== undefined) {
            if (countryProvider.flatrate !== undefined) {
                countryProvider.flatrate.forEach((provider) => {
                    document.querySelector("#stream_from .stream-providers").insertAdjacentHTML(
                        "beforeend",
                        `
                    <div class="provider" data-id="${provider.provider_id}">
                        <img src="${tmdbIconUrl}${provider.logo_path}"/>
                        <p>${provider.provider_name}</p>
                    </div>`
                    );
                });
            }
            if (countryProvider.rent !== undefined) {
                countryProvider.rent.forEach((provider) => {
                    document.querySelector("#rent_buy_from .stream-providers").insertAdjacentHTML(
                        "beforeend",
                        `
                        <div class="provider" data-id="${provider.provider_id}">
                        <img src="${tmdbIconUrl}${provider.logo_path}"/>
                        <p>${provider.provider_name}</p>
                        </div>`                    );
                });
            }
            if (countryProvider.buy !== undefined) {
                countryProvider.buy.forEach((provider) => {
                    if (document.querySelector(`#rent_buy_from .stream-providers > *[data-id="${provider.provider_id}"]`) === null) {
                        document.querySelector("#rent_buy_from .stream-providers").insertAdjacentHTML(
                            "beforeend",
                            `
                            <div class="provider" data-id="${provider.provider_id}">
                            <img src="${tmdbIconUrl}${provider.logo_path}"/>
                            <p>${provider.provider_name}</p>
                            </div>`                        );
                    }
                });
            }

            document.querySelector("#powered_by_jw").classList.remove("hide");
        }
        else {
            document.querySelector("#powered_by_jw").classList.add("hide");
        }

        if (document.querySelector("#rent_buy_from .stream-providers").childNodes.length === 0) {
            document.querySelector("#rent_buy_from").classList.add("hide");
        }
        else {
            document.querySelector("#rent_buy_from").classList.remove("hide");
        }

        if (document.querySelector("#stream_from .stream-providers").childNodes.length === 0) {
            document.querySelector("#stream_from").classList.add("hide");
        }
        else {
            document.querySelector("#stream_from").classList.remove("hide");
        }
    }
    function LoadSeriesData(responseText) {
        var seriesResult = JSON.parse(responseText);

        document.querySelector("#tmdb_title").textContent = seriesResult.name;
        document.querySelector("#tmdb_description").textContent = seriesResult.overview;
        document.querySelector("#tmdb_poster").src = `${tmdbPosterUrl}${seriesResult.poster_path}`;
        document.querySelector("#tmdb_banner").src = `${tmdbBannerUrl}${seriesResult.backdrop_path}`;
        document.querySelector("#tmdb_rating > span.rating").textContent = seriesResult.vote_average;
        document.querySelector("#tmdb_rating > span > span.count").textContent = seriesResult.vote_count;
        document.querySelector("#tmdb_year").textContent = new Date(seriesResult.first_air_date).getFullYear();
        document.querySelector("#tmdb_duration").textContent = `${seriesResult.number_of_seasons} season${(seriesResult.number_of_seasons === 1 ? "" : "s")}`;
        document.querySelector("#tmdb_categories").innerHTML = "";

        seriesResult.genres.forEach((genre) => {
            document.querySelector("#tmdb_categories").insertAdjacentHTML(
                "beforeend",
                `<li>${genre.name}</li>`
            );
        });

        setTimeout(function() {
            document.querySelector(".movie-container").classList.remove("loading");
            document.querySelector(".movie-container").classList.add("loaded");
            audioPop.play();
        }, 250);
    }
    function ErrorCallback(responseText) {
        alert(`CB Error ${responseText}`);
    }
    

    document
        .querySelectorAll("#filter_form input[name='type_cb']")
        .forEach((input) => {
            input.addEventListener("change", ToggleFormDisplay);
        });

    function Init() {

        // Bind inputs
        document
        .querySelectorAll("#filter_form input")
        .forEach((input) => {
            input.addEventListener("change", FetchPotentialResults);
        });

        FetchMovieCategoriesFromTMDB();
        FetchTVShowCategoriesFromTMDB()
        FetchAvailableProviderRegions(function() {
            FetchMovieProviders(providerCurrentLanguageIso);
            FetchTVProviders(providerCurrentLanguageIso);
        });

        // Setup sliders
        highestRatingSlider = noUiSlider.create(document.querySelector("#highest_rating"), {

            range: {
                'min': 1,
                'max': 10
            },
        
            // Handles start at ...
            start: [1, 10],
            step: 1,
        
            // Display colored bars between handles
            connect: true,
        
            // Put '0' at the bottom of the slider
            orientation: 'horizontal',
        
            // Move handle on tap, bars are draggable
            behaviour: 'drag',
            tooltips: true,
            customFormatter: function (handleValue) {
                return `${Math.round(handleValue)} ★`
            }
        });
        highestRatingSlider.on("change", FetchPotentialResults);

        maxMovieLengthSlider = noUiSlider.create(document.querySelector("#max_movie_length"), {

            range: {
                'min': 60,
                'max': 300.
            },
        
            // Handles start at ...
            start: [300],
            step: 15,
        
            // Display colored bars between handles
            connect: true,
        
            // Put '0' at the bottom of the slider
            orientation: 'horizontal',
        
            // Move handle on tap, bars are draggable
            behaviour: 'drag',
            tooltips: true,
            customFormatter: function (handleValue) {
                return RuntimeToString(handleValue);
            }
        });
        maxMovieLengthSlider.on("change", FetchPotentialResults);

        releaseYearSlider = noUiSlider.create(document.querySelector("#release_year"), {

            range: {
                'min': 1920,
                'max': 2022
            },
        
            // Handles start at ...
            start: [1920, 2022],
            step: 1,
        
            // Display colored bars between handles
            connect: true,
        
            // Put '0' at the bottom of the slider
            orientation: 'horizontal',
        
            // Move handle on tap, bars are draggable
            behaviour: 'drag',
            tooltips: true,
            customFormatter: function(handleValue) {
                return `${Math.round(handleValue)}`
            }
        });
        releaseYearSlider.on("change", FetchPotentialResults);
            
        // Load original languages
        var originalLangContainer = document.querySelector(
            `#filter_form fieldset[name="original_languages"] > div.c-container`
        );
        supportedOriginalLanguages.forEach((lang) => {
            originalLangContainer.insertAdjacentHTML(
                "beforeend",
                `
            <label class="cb-container" data-id="${lang.iso_639_1}">
                <input type="checkbox" value="${lang.iso_639_1}">
                <span class="checkmark">${lang.language}</span>
            </label>`
            );

            document.querySelector(`fieldset[name="original_languages"] label[data-id="${lang.iso_639_1}"]`)
            .addEventListener("change", function(event) {
                CheckIfCollapsableGotSelectedChildren(event.target.closest('fieldset.collapsable'));
                FetchPotentialResults();
            });
        });

        FetchPotentialResults();
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

        var fetchBtnsSpan = document.querySelectorAll(".fetch-film:not(.ignore) > span");
        for (var i = 0; i < fetchBtnsSpan.length; i++) {
            var typeStr = selectedType === "1" ? "MOVIE" : "SERIES";
            fetchBtnsSpan[i].textContent = `SHOW ME A ${typeStr}`
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

                        document.querySelector(`fieldset[name="movie_generes"] label[data-id="${genre.id}"]`)
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

                        document.querySelector(`fieldset[name="shows_generes"] label[data-id="${genre.id}"]`)
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
    var providerCurrentLanguageIso = undefined;
    function SetProviderForCurrentLanguage() {
        var iso = region.split("-")[1];

        if (iso !== undefined && availableProviders !== undefined) {
            availableProviders.forEach((provider) => {
                if (provider.iso_3166_1 === iso) {
                    providerCurrentLanguageIso = iso;
                    return;
                }
            });
        }
    }
    function FetchAvailableProviderRegions(onSuccess) {
        theMovieDb.providers.getAvailableRegions( 
            {  },
            function (responseText) {
                var obj = JSON.parse(responseText);

                availableProviders = obj.results;
                SetProviderForCurrentLanguage();

                onSuccess();
            },
            function (responseText) {
                alert("Fetch available provider regions error: " + responseText);
            }
        )
    }
    function FetchMovieProviders(with_region) {
        theMovieDb.providers.getMovieProviders(
            { watch_region: with_region },
            function (responseText) {
                var obj = JSON.parse(responseText);

                if (obj.results !== undefined) {
                    var providerContainer = document.querySelector(
                        `#filter_form fieldset[name="movie_providers"] > div.c-container`
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

                        document.querySelector(`fieldset[name="movie_providers"] label[data-id="${provider.provider_id}"]`)
                        .addEventListener("change", function(event) {
                            CheckIfCollapsableGotSelectedChildren(event.target.closest('fieldset.collapsable'));
                            FetchPotentialResults();
                        });
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

                        document.querySelector(`fieldset[name="tv_providers"] label[data-id="${provider.provider_id}"]`)
                        .addEventListener("change", function(event) {
                            CheckIfCollapsableGotSelectedChildren(event.target.closest('fieldset.collapsable'));
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
        }
        else {
            collapseParent.classList.remove("got-selected");
            collapseParent.querySelector("button").classList.add("hide");
        }
    }

    function RuntimeToString(runtime) {
        var rounded = Math.round(runtime);
        var hour = Math.floor(rounded / 60);
        var minutes = rounded - (hour * 60);
        if (minutes === 0) {
            return `${hour} h`
        }

        return `${hour} h ${minutes} min`
    }
    function FetchOptionsFromForm() {
        var formElement = document.querySelector("#filter_form");
        var type = formElement.querySelector("input[name='type_cb']:checked").value;

        return {
            type: type,
            movieFilters: {
                "language": language,
                "page": GetRandomSelectedPage(),
                "primary_release_date.gte": new Date(`${Math.round(releaseYearSlider.get()[0])}-01-01`).toISOString().split('T')[0],
                "primary_release_date.lte": new Date(`${Math.round(releaseYearSlider.get()[1])}-12-31`).toISOString().split('T')[0],
                "vote_average.gte": Math.round(highestRatingSlider.get()[0]),
                "vote_average.lte": Math.round(highestRatingSlider.get()[1]),
                "vote_count.gte": 400,
                "with_genres": GenerateInputFromFieldset(type, "movie_generes"),
                "with_runtime.lte": Math.round(maxMovieLengthSlider.get()),
                "with_watch_providers": GenerateInputFromFieldset(type, "movie_providers"),
                "watch_region": providerCurrentLanguageIso,
                "with_original_language": GenerateInputFromFieldset(undefined, "original_languages")
            },
            showFilters: {
                "language": language,
                "page": GetRandomSelectedPage(),
                "air_date.gte": new Date(`${Math.round(releaseYearSlider.get()[0])}-01-01`).toISOString().split('T')[0],
                "air_date.lte": new Date(`${Math.round(releaseYearSlider.get()[1])}-12-31`).toISOString().split('T')[0],
                "vote_average.gte": Math.round(highestRatingSlider.get()[0]),
                "vote_average.lte": Math.round(highestRatingSlider.get()[1]),
                "vote_count.gte": 400,
                "with_genres": GenerateInputFromFieldset(type, "shows_generes"),
                "with_watch_providers": GenerateInputFromFieldset(type, "tv_providers"),
                "watch_region": providerCurrentLanguageIso,
                "with_original_language": GenerateInputFromFieldset(undefined, "original_languages")
            },
        };

        function GenerateInputFromFieldset(type, elementName) {
            var r = ""
            document
            .querySelectorAll(`#filter_form fieldset[name="${elementName}"]${type === undefined ? "" : `[data-ent-type="${type}"]`} label`)
            .forEach((label) => {
                if (label.querySelector("input:checked")) {
                    r += `${label.querySelector("input:checked").value}%7C`
                }
            });
            return r.slice(0, -3);
        }

        function GetRandomSelectedPage() {
            return randomizedPage === -1 ? 1 : randomizedPage;
        }
    }

    function GetDepthValue(obj, path, defaultValue) {
        let props;
        if (typeof obj === "undefined") return defaultValue;
        if (typeof path  === "string") {
        props = path.split(".").reverse();
        } else {
        props = path;
        } 
        if (path.length === 0) return obj || defaultValue;
        let current = props.pop();
        return GetDepthValue(obj[current], props, defaultValue);
    }
}
