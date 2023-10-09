const Photo = require('../models/photo.model');
const sanitaze = require('sanitize-html');
const Voter = require('../models/voters.model');
const requestIp = require('request-ip');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    if(title && author && email && file) { // if fields are not empty...

      const sanitizedTitle = sanitaze(title, { allowedTags: [], allowedAttributes: {} });
      const sanitizedAuthor = sanitaze(author, { allowedTags: [], allowedAttributes: {} });

      const emailValidation = /^[A-Za-z0-9_!#$%&'*+\/=?`{|}~^.-]+@[A-Za-z0-9.-]+$/;

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExt = fileName.split('.').slice(-1)[0];
      if ((fileExt === 'jpg' || fileExt === 'png' || fileExt === 'gif')) {
        const newPhoto = new Photo({ title: sanitizedTitle, author: sanitizedAuthor, email: emailValidation, src: fileName, votes: 0 });
        await newPhoto.save(); // ...save new photo in DB
        res.json(newPhoto);
      } 
      else {
        throw new Error('Wrong input!');
      }

    } else {
      throw new Error('Wrong input!');
    }

  } catch(err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {

  try {

    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    const clientIp = requestIp.getClientIp(req);
    const voter = await Voter.findOne({ user: clientIp })

    if (!voter) {

      const newVoter = new Voter({ user: clientIp, votes: photoToUpdate._id })
      await newVoter.save();
      photoToUpdate.votes++;
      photoToUpdate.save();
      res.send({ message: 'OK' });

    } else {

      if(voter.votes.includes(photoToUpdate._id)) {
        throw new Error('You have already voted...!');

      } else {
        voter.votes.push(photoToUpdate._id);
        voter.save();
        photoToUpdate.votes++;
        photoToUpdate.save();
        res.send({ message: 'OK' });
      }
    }
      
  } catch(err) {
    res.status(500).json(err);
  }
    
};
