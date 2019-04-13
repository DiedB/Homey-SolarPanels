# Solar Panels  
Let Homey monitor your solar panels. This app allows you to view production statistics using Insights, and lets you create triggers based on the current power output. For example, enable your car charger when your panels are producing!

## Upgrading to v3.0
Because of a change in device capabilities, you will have to re-add your inverters after the upgrade to v3.0.

## Release notes
* 3.0.2 - Add back Omnik, fix Fronius and SAJ bugs, fix flow triggers
* 3.0.0 - Remove unstable inverter brands (might be added back in the future), use settings API, clean up pairing screens and fix error handling, add back SAJ support
* 2.5.0 - Upgrade Fronius to SDK v2, improve error handling in pairing process
* 2.4.0 - Fixed pairing process for Homey v2.0
* 2.3.2 - Update SolarMAN API URL
* 2.3.0 - Upgrade GoodWe to SDK v2, support new GoodWe API
* 2.2.0 - Added support for Zeversolar systems
* 2.1.0 - Added support for Tigo Energy systems
* 2.0.0 - Support for Apps SDK v2 and Sungrow
* 1.4.3 - Fixed Omnik/SolarMAN/Trannergy API change, updated modules
* 1.4.2 - Fixed SolarEdge cron issue
* 1.4.1 - Added support for SAJ inverters, updated README
* 1.4.0 - Fixed app to work with Homey 0.10, code cleanup, updated modules
* 1.3.2 - Fixed GoodWe units
* 1.3.1 - Added support for Fronius inverters, changed units for correct represenation on 0.9.3
* 1.3.0 - Added support for Omnik, Trannergy, Ginlong, SolarMAN and GoodWe inverters. Switched to http.min and resolved crashes on connection problems
* 1.2.0 - Added support for SolarEdge inverters and fixed bugs
* 1.1.0 - Added experimental support for Enphase inverters
* 1.0.0 - First release

## To do
* Screensavers showing daily production
* More data than just power and energy

---
# Features
## Current production data
Homey shows your inverter as a sensor. This app currently supports two metrics: current power and current energy production (reset daily). It uses Homey's built-in capabilities because custom capabilities are not fully working yet. This will be solved in a later version.

![](http://i.imgur.com/Ozscz9k.png)

## Flow
Your inverter acts as a sensor for Homey. This allows you to use logic on your production data. Here is an example:

![](http://i.imgur.com/HyLuawu.png)

## Insights
Homey retrieves data from your inverter every five minutes, but only logs new data. You can add more than one inverter, and every inverter will be logged in a separate graph.

![](http://i.imgur.com/7VZiddt.png)
