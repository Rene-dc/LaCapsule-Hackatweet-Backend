var express = require('express');
var router = express.Router();

const Tweet = require('../models/tweets');
const User = require('../models/users');

const moment = require('moment')
const {formatElapsedTime} = require('../modules/formatElapsedTime')

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


router.get('/search/:searchTerm', function(req, res, next) {

  const {searchTerm} = req.params
  const regex = new RegExp(searchTerm, 'i');


  Tweet.aggregate([
    {
      $lookup: {
        from: "users", // Assumes the users collection is named "users"
        localField: "postedBy",
        foreignField: "_id",
        as: "postedByDetails"
      }
    },
    {
      $match: {
        $or: [
          { content: { $regex: regex } },
          { "postedByDetails.username": { $regex: regex } }
        ]
      }
    },
    {
      $unwind: "$postedByDetails" 
    },
    {
      $project: {
        "username": "$postedByDetails.username",
        "firstname": "$postedByDetails.firstname",
        "content": 1,
        "date": 1,
      }
    }
  ])
  .then(tweets => {

    const searchResults = tweets.map(tweet => {
        
      let tweetTime = moment(tweet.date)
      let currentTime = moment();
      let elapsedTime = moment.duration(tweetTime.diff(currentTime))
      let formattedElapsedTime = formatElapsedTime(elapsedTime)
      
      return {
      firstname: tweet.firstname,
      username: tweet.username,
      content: tweet.content,
      elapsedTime: formattedElapsedTime,
      milliseconds: elapsedTime. asMilliseconds()
    };
  }).sort((a, b) => b.milliseconds - a.milliseconds);

      res.json({searchResults})
  })

});


module.exports = router;
