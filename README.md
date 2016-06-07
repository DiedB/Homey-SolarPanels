### PV Production Tracker for Homey  

Let Homey monitor your solar panels. This app allows you to view production statistics using Insights, and lets you create triggers based on the current power output. For example, enable your car charger when your panels are producing!

#### Supported data sources
* PVOutput
* SolarEdge
* Enphase
* GoodWe
* Omnik

#### Release notes
* 1.3.0 - Added support for Omnik and GoodWe inverters. Switched to http.min which should also resolve crashes
* 1.2.0 - Added support for SolarEdge inverters and fixed bugs
* 1.1.0 - Added experimental support for Enphase inverters
* 1.0.0 - First release

#### To do
* Screensavers showing daily production
* Speech input/output
* Improve inverter support

---
#### Adding an inverter
##### PVOutput
Get your System ID and read only API key from PVOutput. Add the inverter as a device in the Homey devices panel, and give the inverter a name (this will be used as the name for the device).

![](http://i.imgur.com/REJxrUg.png)

##### SolarEdge
Get your System ID and API key from SolarEdge. Add the inverter as a device in the Homey devices panel, and give the inverter a name (this will be used as the name for the device).

##### Enphase
Create an account at https://developer.enphase.com/. Authorize your API account to access your system (instructions after logging in). Please let me know if everything works for you, Enphase support has only been tested on a demo system.

##### Omnik
Use your login data for the Omnik Portal, as well as the plant ID found in the URL after logging into the Omnik Portal.

##### GoodWe
Use your Station ID. I don't know how to get this ID (I don't have a GoodWe inverter myself, got an ID by e-mail), if an owner can make a small guide I'd appreciate it.

---
#### Current production data

Homey shows your inverter as a sensor. This app currently supports two metrics: current power and current energy production (reset daily). It uses Homey's built-in capabilities because custom capabilities are not fully working yet. Therefore, it reports current energy production as power usage. This will be solved in a later version.

![](http://i.imgur.com/Ozscz9k.png)

---
#### Flow 

Your inverter acts as a sensor for Homey. This allows you to use logic on your production data. Here is an example:

![](http://i.imgur.com/HyLuawu.png)

---
#### Insights 

![](http://i.imgur.com/7VZiddt.png)

Homey retrieves data from PVOutput every minute, but only logs new data. You can add more than one inverter, and every inverter will be logged in a separate graph.
