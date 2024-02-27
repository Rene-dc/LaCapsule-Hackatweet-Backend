var express = require('express');
var router = express.Router();
const { checkBody } = require('../modules/checkBody');
const Tweet = require('../models/tweets');
const User = require('../models/users');
const moment = require('moment');
const { formatElapsedTime } = require('../modules/formatElapsedTime');

router.get('/', function(req, res) {

  Tweet.find({}).populate('postedBy').populate('likedBy').then(tweets => {

    const allTweets = tweets.map(tweet => {
        
        let tweetTime = moment(tweet.date)
        let currentTime = moment();
        let elapsedTime = moment.duration(tweetTime.diff(currentTime))
        let formattedElapsedTime = formatElapsedTime(elapsedTime)
        let postedAt = tweetTime.format('MMMM Do YYYY, [at] h:mma');
        
        return {
        id: tweet._id,
        firstname: tweet.postedBy ? tweet.postedBy.firstname : 'Unknown',
        username: tweet.postedBy ? tweet.postedBy.username : 'Unknown',
        content: tweet.content,
        likedBy: tweet.likedBy ? tweet.likedBy.map(user => user.username ? user.username : 'Unknown') : [],
        numberOfLikes: tweet.likedBy ? tweet.likedBy.length : 0,
        postedAt,
        elapsedTime: formattedElapsedTime,
        milliseconds: elapsedTime. asMilliseconds()
      };
    }).sort((a, b) => b.milliseconds - a.milliseconds);


    res.json({ allTweets });
  })

});

router.get('/hashtag/:hashtag', function(req, res) {
  
  Tweet.find({hashtags: req.params.hashtag }).populate('postedBy').populate('likedBy').then(tweets => {

    const hashtagTweets = tweets.map(tweet => {
        
        let tweetTime = moment(tweet.date)
        let currentTime = moment();
        let elapsedTime = moment.duration(tweetTime.diff(currentTime))
        let formattedElapsedTime = formatElapsedTime(elapsedTime)
        let postedAt = tweetTime.format('MMMM Do YYYY, [at] h:mma');
        
        return {
        id: tweet._id,
        firstname: tweet.postedBy ? tweet.postedBy.firstname : 'Unknown',
        username: tweet.postedBy ? tweet.postedBy.username : 'Unknown',
        content: tweet.content,
        likedBy: tweet.likedBy ? tweet.likedBy.map(user => user.username ? user.username : 'Unknown') : [],
        numberOfLikes: tweet.likedBy ? tweet.likedBy.length : 0,
        postedAt,
        elapsedTime: formattedElapsedTime,
        milliseconds: elapsedTime. asMilliseconds()
      };
    }).sort((a, b) => b.milliseconds - a.milliseconds);

    res.json({ hashtagTweets });
  })

});

router.get('/personalfeed/:user', function(req, res) {
  
  User.findById(req.params.user)
    .then(user => {
      Tweet.find({hashtags: { $in: user.following }}).then(personalFeed => {

        const allTweets = personalFeed.map(tweet => {
        
            let tweetTime = moment(tweet.date)
            let currentTime = moment();
            let elapsedTime = moment.duration(tweetTime.diff(currentTime))
            let formattedElapsedTime = formatElapsedTime(elapsedTime)
            let postedAt = tweetTime.format('MMMM Do YYYY, [at] h:mma');
            
            return {
            id: tweet._id,
            firstname: tweet.postedBy ? tweet.postedBy.firstname : 'Unknown',
            username: tweet.postedBy ? tweet.postedBy.username : 'Unknown',
            content: tweet.content,
            likedBy: tweet.likedBy ? tweet.likedBy.map(user => user.username ? user.username : 'Unknown') : [],
            numberOfLikes: tweet.likedBy ? tweet.likedBy.length : 0,
            postedAt,
            elapsedTime: formattedElapsedTime,
            milliseconds: elapsedTime. asMilliseconds()
          };
        }).sort((a, b) => b.milliseconds - a.milliseconds);
    
        res.json({ personalFeed: allTweets });
      })
  })

});

router.get('/trends', function(req, res) {
    
    Tweet.aggregate([
        { $unwind: "$hashtags" },
        { 
            $group: {
                _id: "$hashtags", 
                count: { $sum: 1 } 
            }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
    ]).then(trends => {
        console.log('blabla')
        if(trends.length === 0) {
            return res.status(200).send({ message: "No trends found", trends: [] });
        }

          res.json({trends});
          
    }).catch(error => {
        console.error("Error fetching trends:", error);
        res.status(500).send({ message: "Error fetching trends", error });
    });
});

router.post('/add', function(req, res) {

    if (!checkBody(req.body, ['content', 'hashtags', 'postedBy'])) {
        res.json({ result: false, error: 'Missing or empty fields' });
        return;
      }
  
  const newTweet = new Tweet({
    content: req.body.content,
    hashtags: req.body.hashtags,
    postedBy: req.body.postedBy,
    date: moment(),
  });

  newTweet.save().then(newTweet => {
    User.findByIdAndUpdate(
        newTweet.postedBy,
        { $push: { postedTweets: newTweet._id } },
        { new: true, useFindAndModify: false } // Options
    ).then(updatedUser => {
        if (!updatedUser) {
            res.json({ result: false, error: 'User not found' });
            return;
        }
        res.json({ result: true, tweetId: newTweet._id });
    }).catch(err => {
        res.status(500).json({ result: false, error: 'Failed to update user with new tweet' });
    });
}).catch(err => {
    res.status(500).json({ result: false, error: 'Failed to save new tweet' });
});

});

router.post('/like', function(req, res) {
    const { id, user } = req.body; 
  
    Tweet.findById(id)
      .then(tweet => {
        if (!tweet) {
          return res.status(404).send({ message: "Tweet not found" });
        }
  
        const likedByIndex = tweet.likedBy.findIndex(userId => userId.toString() === user);
        
        let userUpdatePromise;
  
        if (likedByIndex > -1) {
          tweet.likedBy.splice(likedByIndex, 1);
          userUpdatePromise = User.findByIdAndUpdate(user, { $pull: { likedTweets: tweet._id } }, { new: true });
        } else {
          tweet.likedBy.push(user);
          userUpdatePromise = User.findByIdAndUpdate(user, { $push: { likedTweets: tweet._id } }, { new: true });
        }
        return Promise.all([tweet.save(), userUpdatePromise]);
      })
      .then(results => {
        const [updatedTweet, updatedUser] = results;
        res.json({ result: true, updatedTweet, updatedUser }); 
      })
      .catch(error => res.status(500).send(error));
  });

router.get('/delete/:id', function(req, res) {
    const { id } = req.params; // Extracting the tweet ID from the route parameter

    Tweet.findByIdAndDelete(id)
        .then(deletedTweet => {
            if (!deletedTweet) {
                return res.status(404).json({ result: false, message: "Tweet not found" });
            }
            res.json({ result: true, message: "Tweet successfully deleted" });
        })
        .catch(error => {
            res.status(500).json({ result: false, error });
        });
});
  

module.exports = router;
