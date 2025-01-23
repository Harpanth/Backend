import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params

    const Wideo = await Video.findById(videoId)

    if(!Wideo){
        throw new ApiError(404,"Video not found")
    }
    // Checking if the user has liked the video
    const likedAlready = await Like.findOne({
        video:videoId,
        likedBy:req.user?._id
    })

    if(likedAlready){
        await Like.findByIdAndUpdate(likedAlready?._id)

        return res
            .status(200)
            .json( new ApiResponse(200,{isLiked:false}))
    }

    await Like.create({
        video:videoId,
        likedBy:req.user?._id
    })

    return res
        .status(200)
        .json( new ApiResponse(200, {isLiked: true}))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid commentId");
    }

    const likedAlready = Like.findOne({
        comment:commentId,
        likedBy: req.user?._id
    })

    if(likedAlready){
        await Comment.findByIdAndDelete(likedAlready?._id)

        return res  
            .status(200)
            .json( new ApiResponse(200,{isLiked:false}))
    }

    await Comment.create({
        comment:commentId,
        likedBy:req.user?._id
    })

    return res  
        .status(200)
        .json( new ApiResponse(200, {isLiked:true }))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid tweetId");
    }

    const likedAlready = Like.findOne({
        tweet:tweetId,
        likedBy:req.user._id
    })

    if(likedAlready){
        await Like.findByIdAndDelete(likedAlready?._id)

        return res
            .status(200)
            .json( new ApiResponse(200,{isLiked:false}))
    }

    await Like.create({
        tweet:tweetId,
        likedBy:req.user?._id
    })

    return res
            .status(200)
            .json( new ApiResponse(200,{isLiked:false}))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likedVideo = await Like.aggregate([
        {
            $match: {
                likedBy:mongoose.Schema.Types.ObjectId(req.user?._id)
            }   
        },
        {
            $lookup: {
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"likedVideo",
                pipeline: [
                    {
                        $lookup: {
                            from:"users",
                            localField:"_id",
                            foreignField:"owner",
                            as:"OwnerDetails"
                        }
                    },
                    {
                        $unwind:"$ownerDetails"
                    }
                ]
            }
        },
        {
            $unwind:"$likedVideo"
        },
        {
            sort:{
                createdAt:-1,
            }
        },
        {
            $project: {
                _id:0,
                likedVideo:{
                    _id:1,
                    "videoFile.url":1,
                    "thumbnail.url":1,
                    owner:1,
                    title:1,
                    description: 1,
                    views: 1,
                    duration: 1,
                    createdAt: 1,
                    isPublished: 1,
                    ownerDetails: {
                        username: 1,
                        fullName: 1,
                        "avatar.url": 1,
                    },
                }
            }
        }
    ])
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}