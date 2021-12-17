const express = require('express');
const router = express.Router();
const { Video } = require("../models/Video");
const { Subscriber} = require('../models/Subscriber')
const { auth } = require("../middleware/auth");
const multer = require("multer")
var ffmpeg = require('fluent-ffmpeg');

var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`)
    },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname)
        if (ext !== '.mp4' || ext !== '.jpg'|| ext !== '.png') {
            return cb(res.status(400).end('only jpg, png, mp4 is allowed'), false);
        }
        cb(null, true)
    }
})
var upload = multer({ storage: storage }).single("file")
//=================================
//             Video
//=================================



//비디오를 서버에 저장한다.
router.post("/uploadfiles",(req,res)=>{
    upload(req, res, err => {
        if (err) {
            return res.json({ success: false, err })
        }
        return res.json({ success: true, filePath: res.req.file.path, fileName: res.req.file.filename })
    })
})

router.post('/uploadVideo',(req,res)=>{
    //비디오 정보들을 저장한다.
    
    const video =  new Video(req.body) //받아온 모든 정보 변수에 담기
    video.save((err,doc)=>{ //모든 정보 담은 변수 db에 저장
        if(err) return res.json({success:false,err})
        res.status(200).json({success:true})
    }) 
    
    
})

router.post('/thumbnail', (req,res)=>{
    //썸네일 생성 하고 비디오 러닝타임도 가져오기 >위에 ffmpeg import한다
    
    //비디오 정보 가져오기
    //썸네일 생성
    let thumbsFilePath ="";
    let fileDuration ="";
    //***에러 사항 ffmpeg설치하고 환경변수등록도 했는데 ffprove 찾을 수 없다고 나옴 근데 이걸로 되네*/
    ffmpeg.setFfmpegPath('C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe')
    ffmpeg.ffprobe(req.body.filePath, function(err,metadata){
        console.dir(metadata);
        console.log(metadata.format.duration);

        fileDuration = metadata.format.duration;
    })


    ffmpeg(req.body.filePath)
        .on('filenames', function (filenames) {
            console.log('Will generate ' + filenames.join(', '))
            thumbsFilePath = "uploads/thumbnails/" + filenames[0];
        })
        .on('end', function () {
            console.log('Screenshots taken');
            return res.json({ success: true, thumbsFilePath: thumbsFilePath, fileDuration: fileDuration})
        })
        .screenshots({
            // Will take screens at 20%, 40%, 60% and 80% of the video
            count: 3,
            folder: 'uploads/thumbnails',
            size:'320x240',
            // %b input basename ( filename w/o extension )
            filename:'thumbnail-%b.png'
        });
})


router.get("/getVideos", (req, res) => {
    
    Video.find()
    .populate('writer')
    .exec((err, videos) => {
        if(err) return res.status(400).send(err);
        res.status(200).json({ success: true, videos })
    })
    
});


router.post("/getVideoDetail", (req, res) => {
    console.log(req.body.videoId)
    Video.findOne({ "_id" : req.body.videoId })
    .populate('writer')
    .exec((err, video) => {
        if(err) return res.status(400).send(err);
        res.status(200).json({ success: true, video })
    })
});


router.post("/getSubscriptionVideos", (req, res) => {
    //자신의 아이디를 가지고 구독하는 사람들을 찾는다.
    Subscriber.find({ 'userFrom': req.body.userFrom })
    .exec((err, subscribers)=> {
        if(err) return res.status(400).send(err);

        let subscribedUser = [];

        subscribers.map((subscriber, i)=> {
            subscribedUser.push(subscriber.userTo)
        })


        // 찾은 사람들의 비디오를 가지고 온다
        Video.find({ writer: { $in: subscribedUser }})
            .populate('writer')
            .exec((err, videos) => {
                if(err) return res.status(400).send(err);
                res.status(200).json({ success: true, videos })
            })
    })
});



module.exports = router;
