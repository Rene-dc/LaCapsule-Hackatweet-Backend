var express = require('express');
var router = express.Router();
const { checkBody } = require('../modules/checkBody');
const { formatElapsedTime } = require('../modules/formatElapsedTime');
const bcrypt = require('bcrypt');
const User = require('../models/users');
const moment = require('moment')

router.post('/signup', (req, res) => {

  if (!checkBody(req.body, ['username', 'password'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }

  // Check if the user has not already been registered
  User.findOne({ username: req.body.username }).then(data => {
    if (data === null) {
      const hash = bcrypt.hashSync(req.body.password, 10);

      const newUser = new User({
        firstname: req.body.firstname,
        username: req.body.username,
        password: hash,
      });

      newUser.save().then(newUser => {

        const {_id, username, firstname} = newUser;

        res.json({ result: true, userId: _id, username, firstname });
      });
    } else {
      // User already exists in database
      res.json({ result: false, error: 'User already exists' });
    }
  });
});

router.post('/signin', (req, res) => {
  if (!checkBody(req.body, ['username', 'password'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }

  User.findOne({ username: req.body.username }).then(data => {
    if (data && bcrypt.compareSync(req.body.password, data.password)) {

      const {_id, username, firstname} = data;

      return res.json({ result: true, userId: _id, username, firstname });

    } else {

      return res.status(404).send({ message:'User not found or wrong password' });

    }
  });
});

router.post('/follow', (req, res) => {

  const { follower, followed } = req.body;

  // Check if users exist
  User.find({
    '_id': { $in: [follower, followed] }
  }).then(users => {
    if (users.length < 2) {
      // One or both users not found
      return res.status(404).send({ message: "One or both users not found" });
    }

    // Check if already following
    User.findById(followed).then(user => {
      if (user.followedBy.includes(follower)) {
        // If already followed, unfollow
        return Promise.all([
          User.findByIdAndUpdate(followed, { $pull: { followedBy: follower }}, { new: true }),
          User.findByIdAndUpdate(follower, { $pull: { following: followed }}, { new: true })
        ]).then(([updatedFollowed, updatedFollower]) => {
          res.status(200).send({ message: "Unfollow successful", followed: updatedFollowed, follower: updatedFollower });
        }).catch(error => res.status(500).send(error)); // Error updating documents
      } else {
        // If not already followed, add to followers/following
        return Promise.all([
          User.findByIdAndUpdate(followed, { $addToSet: { followedBy: follower }}, { new: true }),
          User.findByIdAndUpdate(follower, { $addToSet: { following: followed }}, { new: true })
        ]).then(([updatedFollowed, updatedFollower]) => {
          res.status(200).send({ message: "Follow successful", followed: updatedFollowed, follower: updatedFollower });
        }).catch(error => res.status(500).send(error)); // Error updating documents
      }
    }).catch(error => res.status(500).send(error)); // Error finding followed user
  }).catch(error => res.status(500).send(error)); // Error finding users
});

router.get('/profile/:username', (req, res) => {
  
    User.findOne({username: req.params.username})
    .populate('followedBy')
    .populate('following')
    .populate('likedTweets')
    .populate('postedTweets')
    .then(user => {

      if (!user) {

        return res.status(404).send({ message: "User not found" });

      } else {

        const { firstname, username, likedTweets, postedTweets, followedBy, following } = user

        const tweetsByUser = postedTweets.map(tweet => {
        
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
      
        return res.json({ firstname, username, likedTweets, postedTweets: tweetsByUser, followedBy, following })  

      }

     
    })
});

module.exports = router;
