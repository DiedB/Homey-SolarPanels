'use strict';

const Homey = require('homey');
const uuid = require('uuid/v4');

class Inverter extends Homey.Device {
    /* Overriden device methods */
    onInit() {
        this.log(`Initializing device`);

        if (this.getStoreValue('cronTask') === null) {
            this.createCronTask();
        } else {
            this.initializeCronTask(this.getStoreValue('cronTask'));
        }
    }

    onAdded() {
        this.log(`Added device`);
    }

    onDeleted() {
        deleteCronTask(this.getStoreValue('cronTask'));
        this.log(`Deleted device`);
    }
    
    /* App-specific methods */
    getCronString() {
        return '*/5 * * * *';
    }

    initializeCronTask(task) {
        Homey.ManagerCron.getTask(task)
            .then(result => {
                result.on('run', data => {
                    this.log(`Running task ${task}`);
                    this.checkProduction(data);
                });
                this.log(`Initialized cron job ${task}`);
            }).catch(error => {
                this.error(`Failed retrieving cron job ${task}`);
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

    deleteCronTask(task) {
        Homey.ManagerCron.getTask(taskName)
            .then(task => {
                Homey.ManagerCron.unregisterTask(task)
                    .then(result => {
                        this.log('Cron job deleted successfully');
                    }).catch(error => {
                        this.error(`Cron job deletion failed (${error}`);
                    });
            }).catch(error => {
                this.error(`Couldn't find cron job to delete`);
            });
    }

    checkProduction() {
        throw new Error('Expected override');
    }
}

module.exports = Inverter;