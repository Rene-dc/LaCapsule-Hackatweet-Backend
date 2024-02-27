const mongoose = require('mongoose');

const usersSchema = mongoose.Schema({
    firstname: String,
    username: String,
    password: String,
    profilePic: String,
    likedTweets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'tweets' }],
    postedTweets:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'tweets' }],
    followedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],

});

const User = mongoose.model('users', usersSchema);

module.exports = User;