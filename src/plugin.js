import videojs from 'video.js';
import vast from 'vast-client';
import { version as VERSION } from '../package.json';

const Plugin = videojs.getPlugin('plugin');

// Default options for the plugin.
const defaults = {};

/**
 * An advanced Video.js plugin. For more information on the API
 *
 * See: https://blog.videojs.com/feature-spotlight-advanced-plugins/
 */
class NonlinVast extends Plugin {

  /**
   * Create a NonlinVast plugin instance.
   *
   * @param  {Player} player
   *         A Video.js Player instance.
   *
   * @param  {Object} [options]
   *         An optional options object.
   *
   *         While not a core part of the Video.js plugin architecture, a
   *         second argument of options is a convenient way to accept inputs
   *         from your plugin's caller.
   */
  constructor(player, options) {
    // the parent class will add player under this.player
    super(player);

    this.options = videojs.mergeOptions(defaults, options);

    this.player.ready(() => {
      this.player.addClass('vjs-nonlin-vast');
    });

    this.player.on('vast-ready', this.onVastReady);
    this.player.on('adscanceled', this.onAdsCanceled);

    this.getContent();
  }

  getContent() {
    // query vast url given in options
    vast.client.get(this.options.url, (response) => {
      if (response) {

        for (let adIdx = 0; adIdx < response.ads.length; adIdx++) {
          let ad = response.ads[adIdx];

          for (let creaIdx = 0; creaIdx < ad.creatives.length; creaIdx++) {
            let creative = ad.creatives[creaIdx];

            if (creative.type === "nonlinear" && creative.variations.length) {
              this.player.vastTracker = new vast.tracker(ad, creative, creative.variations[0]);
            }
          }

          if (this.player.vastTracker) {
            // vast tracker and content is ready to go, trigger event
            this.player.trigger('vast-ready');
            this.player.vastTracker.on('clickthrough', this.onClickThrough);
            this.setAd();
            break;
          } else {
            // Inform ad server we can't find suitable media file for this ad
            vast.util.track(ad.errorURLTemplates, { ERRORCODE: 403 });
          }
        }
      }

      if (!this.player.vastTracker) {
        this.player.trigger('adscanceled');
      }
    });
  }

  setAd() {
    let variation = this.player.vastTracker.variation;

    if(variation.type.substr(0,5) === 'image') {
      let adOverlay = document.createElement("div");
      let adDiv = document.createElement("div");
      let adAnchor = document.createElement("a");
      let adImg = document.createElement("img");
      let adCloseBtn = document.createElement("button");

      this.player.el().appendChild(adOverlay)
      adOverlay.appendChild(adDiv);
      adDiv.appendChild(adAnchor);
      adAnchor.appendChild(adImg);
      adDiv.appendChild(adCloseBtn);
      adOverlay.setAttribute('class', 'nonlinear-ad');
      adAnchor.setAttribute('href',variation.nonlinearClickThroughURLTemplate);
      adImg.setAttribute('width',variation.width);
      adImg.setAttribute('height',variation.height);
      adImg.setAttribute('src',variation.staticResource);
      console.log('added')
    }
  }

  onVastReady(event) { /*vast-ready event*/ }

  onAdsCanceled(event) { /*adscanceled event*/ }

  onClickThrough(event) { /*clickthrough event*/ }

}

// Define default values for the plugin's `state` object here.
NonlinVast.defaultState = {};

// Include the version number.
NonlinVast.VERSION = VERSION;

// Register the plugin with video.js.
videojs.registerPlugin('nonlinVast', NonlinVast);

export default NonlinVast;
