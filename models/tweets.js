const mongoose = require('mongoose');

const tweetsSchema = mongoose.Schema({
    content: String,
    hashtags: Array,
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
    date: Date,
});

const Tweet = mongoose.model('tweets', tweetsSchema);

module.exports = Tweet;