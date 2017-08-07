'use strict';

const Homey = require('homey');

class SolarPanels extends Homey.App {
	onInit() {
		this.log('Running');
	}
}

module.exports = SolarPanels; 