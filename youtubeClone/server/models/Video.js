const mongoose = require('mongoose');
const Schema = mongoose.Schema
const videoSchema = mongoose.Schema({
    
    writer:{
        type: Schema.Types.ObjectId,
        ref:'User' //메모 : User 모델 참고 하고 있어서 type id만 있어도 r
                   // 거기에 대한 유저정보 참조해줌
    },
    title : {
        type: String,
        maxlength:50
    },
    description : {
        type:String
    },
    privacy:{
        type: Number
    },
    filePath : {
        type: String,
    },
    catogory: String,
    views : {
        type: Number,
        default: 0 
    },
    duration :{
        type: String
    },
    thumbnail: {
        type: String
    }

},{timestamps:true})


const Video = mongoose.model('Video', videoSchema);

module.exports = { Video }