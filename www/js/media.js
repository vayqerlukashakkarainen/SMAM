var mediaContainer = {
	repeatedMedia: {
		medias: [],
		currentPlayingIndex: 0,
		SetMedias: function (audio) {
			for (var i = 0; i < 2; i++) {
				var media = new Media(audio.url, function () {});
				media.setVolume(audio.volume);
				this.medias.push(media);
			}

			this.medias[this.currentPlayingIndex].play();

			this.interval = setInterval(() => {
				this.currentPlayingIndex += 1;

				if (this.currentPlayingIndex >= this.medias.length) {
					this.currentPlayingIndex = 0;
				}

				this.medias[this.currentPlayingIndex].play();
			}, audio.audioLength - 200);
		},
		StopMedias: function () {
			for (var i = 0; i < this.medias.length; i++) {
				this.medias[i].stop();
				this.medias[i].release();
				this.medias[i] = undefined;
			}

			this.medias = [];
			this.currentPlayingIndex = 0;
			clearInterval(this.interval);
			this.interval = undefined;
		},

		interval: undefined,
	},
	audio: {
		pop: {
			url: "sounds/pop.mp3",
			maxInterval: 200,
			interval: undefined,
			volume: 1.0,
		},
		bellMircowave: {
			url: "sounds/bell_microwave.mp3",
			maxInterval: 200,
			interval: undefined,
			volume: 1.0,
		},
		popcornCernel: {
			url: "sounds/popcorn_cernel.mp3",
			maxInterval: 200,
			interval: undefined,
			volume: 0.1,
		},
		blbl: {
			url: "sounds/blbl.mp3",
			maxInterval: 200,
			interval: undefined,
			volume: 0.5,
			audioLength: 1632,
		},
		disco: {
			url: "sounds/disco.mp3",
			maxInterval: 200,
			interval: undefined,
			volume: 1.0,
			audioLength: 0,
		},
		discoDancing: {
			url: "sounds/disco_start.mp3",
			maxInterval: 200,
			interval: undefined,
			volume: 1.0,
			audioLength: 1824,
		},
	},
	prevMedia: undefined,
	PlayAudio: function (audio, saveMedia = false) {
		// Play the audio file at url
		if (Media !== undefined) {
			if (audio.interval === undefined) {
				var my_media = new Media(
					audio.url,
					// success callback
					function () {
						my_media.release();
					},
					// error callback
					function (err) {
						my_media.release();
						console.log("playAudio():Audio Error: " + err);
					}
				);
				// Play audio
				my_media.setVolume(audio.volume);
				my_media.play();

				if (saveMedia) {
					this.prevMedia = my_media;
				}

				audio.interval = setTimeout(function () {
					clearTimeout(audio.interval);
					audio.interval = undefined;
				}, audio.maxInterval);
			}
		}
	},
	PlayRepeatedMedia: function (audio) {
		this.repeatedMedia.SetMedias(audio);
	},
	StopAllMedia: function () {
		this.StopRepeatedMedia();
		if (this.prevMedia !== undefined) {
			this.prevMedia.stop();
			this.prevMedia.release();
			this.prevMedia = undefined;
		}
	},
	StopRepeatedMedia: function () {
		if (this.repeatedMedia.medias.length > 0) {
			this.repeatedMedia.StopMedias();
		}
	},
};
