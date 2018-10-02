const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

//Post model
const Post = require('../../config/models/Post');

//Profile model
const Profile = require('../../config/models/Profile');

//Validation
const validatePostInput = require('../validation/post');

//@ route    GET api/posts/test
//@desc      Tests post route
//@access    Public

router.get('/test', (req, res) => res.json({
    msg: "posts Works"
}));

//@ route    GET api/posts
//@desc      Get posts
//@access    Public
router.get('/', (req, res) => {
  Post.find()
    .sort({ date: -1})
    .then(posts => res.json(posts))
    .catch(err => res.status(404).json({ nopostsfound: 'No post found with that ID' }));
});

//@ route    GET api/post/:id
//@desc      Get posts by id
//@access    Public
router.get('/:id', (req, res) => {
  Post.findById(req.params.id)
    .then(post => res.json(post))
    .catch(err => 
      res.status(404).json({ nopostfound: 'No post found with that ID' }));
});

//@ route    POST api/posts
//@desc      Create post
//@access    Private
router.post(
  '/',
   passport.authenticate('jwt', {session: false}), 
   (req, res) => {
  const { errors, isValid} = validatePostInput(req.body);

  // Validation
  if(!isValid) {
    //If any errors, send 400 with errors object
    return res.status(400).json(errors);
  }

  const newPost = new Post({
    text: req.body.text,
    name: req.body.name,
    avatar: req.body.name,
    user: req.user.id
  });

  newPost.save().then(post => res.json(post));
});

//@ route    DELETE api/posts/:id
//@desc      Delete post
//@access    Private
router.delete('/:id', passport.authenticate('jwt', { session: false}), (req, res) => {
  Profile.findOne({ user: req.user.id})
  .then(profile => {
    Post.findById(req.params.id)
    .then(post => {
      //Check for post owner
      if(post.user.toString()!== req.user.id) {
        return res.status(401).json({ notauthorised: 'User not authorised' })
      }

      //Delete
      post.remove().then(() => res.json({ success: true}));
    })
    .catch(err => res.status(404).json({ postnotfound: 'No post found witht he ID'}));
  })
})

//@ route    POST api/posts/like/:id
//@desc      like post
//@access    Private
router.post(
  '/like/:id', passport.authenticate('jwt', { session: false}), 
(req, res) => {
  profile.findOne({ user: req.user.id}).then(profile => {
    Post.findById(req.params.id)
    .then(post => {
       if(post.likes.filter(like => like.user.toString( )=== req.user.id).length > 0) {
          return res.status(400).json({ alreadyliked: 'User already like this post' })
       }
       //Add user id to likes array
       post.likes.unshift({ user: req.user.id });
       
       post.save().then(post => res.json(post));
    }) 
    .catch(err => res.status(404).json({ postnotfound: 'No post found witht he ID'}));
  })
})

//@ route    POST api/posts/unlike/:id
//@desc      unlike post
//@access    Private
//Here comes the PROMISE

router.post(
  '/unlike/:id', passport.authenticate('jwt', { session: false}), 
(req, res) => {
  profile.findOne({ user: req.user.id}).then(profile => {
    Post.findById(req.params.id)
    .then(post => {
       if(post.likes.filter(like => like.user.toString()=== req.user.id)
       .length === 0
       ) {
          return res
          .status(400)
          .json({ alreadyliked: 'You have not yet liked this post' })
       }

       //Remove Index
       const removeIndex = post.likes
         .map(item => item.user.toString())
         .indexOf(req.user.id);

         //Splice the Array
       post.likes.splice(removeIndex, 1);

        //Dont forget to Save
    post.save().then(post => res.json(post));
    }) 
   
    .catch(err => res.status(404).json({ postnotfound: 'No post found witht the ID'}));
  });
});

//@ route    POST api/posts/comment/:id
//@desc      Add comment to a post
//@access    Private
//Here comes the PROMISE
router.post(
  '/comment/:id',
  passport.authenticate('jwt', { session: false}),
  (req, res) => {
  const { errors, isValid} = validatePostInput(req.body);

  // Validation
  if(!isValid) {
    //If any errors, send 400 with errors object
    return res.status(400).json(errors);
  }

  Post.findById(req.params.id)
  .then(post => {
    const newComment = {
      text: req.body.text,
      name: req.body.name,
      avatar: req.body.avatar,
      user: req.user.id
    }
   //Comments go in Here
   post.comments.unshift(newComment);

   //Save
   post.save().then(post => res.json(post))
  })
  .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
});

//@ route    DELETE api/posts/comment/:id
//@desc      Remove comment from post
//@access    Private
//& the PROMISE
router.delete(
  '/comment/:id/:comment_id',
  passport.authenticate('jwt', { session: false}),
  (req, res) => {
  Post.findById(req.params.id)
  .then(post => {
    //Check if comment exists using filter
    if(post.comments.filter(comment => comment._id.toString() === req.params.comment_id).length === 0) {
       return res.status(404).json({ commentnotexists: 'Comment does not exist'});
    }
    //Remove Index
    const removeIndex = post.comments
      .map(item => item._id.toString())
      .indexOf(req.params.comment_id);
  //Splice comments from index
  post.comment.splice(removeIndex, 1);
  
  post.save().then(post => res.json(post))
  })
  .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
});

module.exports = router;