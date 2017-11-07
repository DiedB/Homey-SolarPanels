'use strict';

const Homey = require('homey');
const uuid = require('uuid/v4');

class Inverter extends Homey.Device {
    /* Overriden device methods */
    onInit() {
        this.log('Initializing device');

        if (this.getStoreValue('cronTask') === null) {
            this.createCronTask();
        } else {
            this.initializeCronTask();
        }
    }

    onAdded() {
        this.log('Added device');
    }

    onDeleted() {
        this.deleteCronTask();
        this.log('Deleted device');
    }
    
    /* App-specific methods */
    getCronString() {
        return '*/5 * * * *';
    }

    initializeCronTask() {
        const taskName = this.getStoreValue('cronTask');
        Homey.ManagerCron.getTask(taskName)
            .then(result => {
                result.on('run', data => {
                    this.log(`Running task ${taskName}`);
                    this.checkProduction();
                });
                this.log(`Initialized cron job ${taskName}`);
            }).catch(error => {
                this.error(`Failed retrieving cron job ${taskName}`);
                this.createCronTask();
            });
    }
        
    createCronTask() {
        const taskName = uuid().replace(/[^a-zA-Z0-9]+/g,'');
        Homey.ManagerCron.registerTask(taskName, this.getCronString(), this.getData())
            .then(task => {
                this.log(`Cron job ${taskName} created successfully`);
                this.setStoreValue('cronTask', taskName).catch(error => {
                     this.error('Failed setting cron task name');
                });
                this.initializeCronTask(taskName);
            }).catch(error => {
                this.error(`Cron job creation failed (${error})`);
            });
    }

    deleteCronTask() {
        const taskName = this.getStoreValue('cronTask');
        Homey.ManagerCron.unregisterTask(taskName)
            .then(result => {
                this.log('Cron job deleted successfully');
            }).catch(error => {
                this.error(`Cron job deletion failed (${error}`);
            });
    }

    checkProduction() {
        throw new Error('Expected override');
    }
}

module.exports = Inverter;