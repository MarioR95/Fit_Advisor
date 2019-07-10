const cheerio = require('cheerio');
//const request = require('request');
const request = require('sync-request');
var MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const url = 'mongodb://localhost:27017';
const dbName = 'Fit_AdvisorDB';
const SITE = 'www.workout-routine.com'
const equipment = ['dumbbells', 'barbell', 'gym', 'ball', 'bands'];
const muscularRoutines = ['hot-abs', 'strong-back', "large-chest", 'broad-shoulders', 'ripped-arms', 'defined-legs'];
const muscularGroups = ['abs', 'back', 'chest', 'shoulders', 'arms', 'legs'];

MongoClient.connect(url, {useNewUrlParser:true}, function(err, client) {
    assert.equal(null, err);
    var db = client.db('Fit_AdvisorDB');
    const collection = db.collection('WorkoutRoutine');
    console.log('Starting insertion...');
    for(i=0; i < equipment.length; i++){
        for(j=0; j < muscularGroups.length; j++){
            var scrapeUrl = 'https://' + SITE + '/' + equipment[i] + "/" + muscularRoutines[j];
            var res = request('GET', scrapeUrl);
            console.log('statusCode:', res.statusCode);
            if(res.statusCode != 404){
                var $ = cheerio.load(res.getBody());
                
                var woutRoutine = {
                    title:"",
                    description:"",
                    muscularGroup:"",
                    equipment:"",
                    routine:[{
                        title:"",
                        img:"",
                        sets:"",
                        reps:"",
                        notes:""
                    }]
                };

                woutRoutine['title'] = cleanText('title', $('title').text());
                woutRoutine['description'] = cleanText('description', $('p').first().text());
                woutRoutine['muscularGroup'] = muscularGroups[j];
                woutRoutine['equipment'] = equipment[i];
                      
                $('th.tableName').each(function(index, elem) {
                    woutRoutine.routine[index] = {};
                    woutRoutine.routine[index]['title'] = $(this).text();
                })
                $('td.tableImage img').each(function(index, elem) {
                    woutRoutine.routine[index]['img'] = 'https://' + SITE + '/' + equipment[i] + '/' + muscularRoutines[j] + '/' + $(this).attr('src');
                })
                $('td.tableSets').each(function(index, elem) {
                    woutRoutine.routine[index]['sets'] = $(this).text();
                })
                $('td.tableReps').each(function(index, elem) {
                    woutRoutine.routine[index]['reps'] = $(this).text();
                })
                $('td.tableNotes').each(function(index, elem) {
                    woutRoutine.routine[index]['notes'] = cleanText('description', $(this).text());
                })

                addToCollection(woutRoutine, collection); //Add workout routine object to Mongo collection
            }
        }
    }
    console.log('Insertion ended')
    client.close();
});

function cleanText(type, text){
    if(type == 'title')
        return text.split(" | ")[0];
    else
        return text.replace(/[\n\t]/g, '');
}

function addToCollection(woutRoutine, collection){
    collection.insertOne(woutRoutine, function(err, result) {
        assert.equal(err, null);
    });
}




