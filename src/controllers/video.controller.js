import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary,deleteOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video
    if ([title, description].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }

    const videoFileLocalPath = req.files?.videoFile[0].path;
    const thumbnailLocalPath = req.files?.thumbnail[0].path;

    if (!videoFileLocalPath) {
        throw new ApiError(400, "File path is required")
    }
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnail path is required")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!videoFile) {
        return new ApiError(404, "Video file not found")
    }
    if (!thumbnail) {
        throw new ApiError(404, "Thumbnail not found")
    }

    const video = await Video.create({
        title,
        description,
        duration: videoFile.duration,
        videoFile: {
            url: videoFile.url,
            public_id: videoFile._id
        },
        thumbnail: {
            url: thumbnail._url,
            public_id: thumbnail._id
        },
        owner: req.user?._id,
        isPublished: false
    })

    const videos = await Video.findById(video._id);
    if (!videos) {
        throw new ApiError(500, "Video upload Failed");
    }

    throw res
        .status(200)
        .json(new ApiResponse(200, videos, "Video uploaded successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid VideoId")
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Schema.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers",
                        }
                    },
                    {
                        $addFields: {
                            $subscriberCount: {
                                $size: "$subscribers"
                            },
                            isSubscribed: {
                                $cond: {
                                    if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                                    then: true,
                                    else: false
                                }
                            }
                        }
                    }
                ],
            },
        },
        {
            $project: {
                username: 1,
                "avatar.url": 1,
                $subscriberCount: 1,
                isSubscribed: 1,
            }
        },
        {
            $addFields: {
                likedCount: {
                    $size: "$likes"
                },
                owner: {
                    $first: "$owner"
                },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$likes.likedBy"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                "videoFile.url": 1,
                title: 1,
                description: 1,
                views: 1,
                createdAt: 1,
                duration: 1,
                comment: 1,
                owner: 1,
                likedCount: 1,
                isLiked: 1,
            }
        }
    ])

    if (!video) {
        throw new ApiError(500, "failed to fetch video");
    }
    // increment views if video fetched successfully
    await Video.findByIdAndUpdate({
        $inc: {
            views: 1,
        }
    });
    // add this video to user watch history

    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $addToSet: {
                watchHistory: videoId
            }
        }
    )

    return res
        .status(200)
        .json(new ApiResponse(200, video[0], "Video details fetched Successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const { title, description } = req.body

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid VideoId")
    }

    if (!title && !description) {
        return new ApiError(400, "All fields are required")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video Not Found")
    }

    if (!video?.owner.toString() !== req.user?._id.toString()) {
        return new ApiError(400, "Only owner can update the video")
    }

    const thumbnailToDelete = video.thumbnail.public_id;

    const thumbnailLocalPath = req.files?.path;

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnail path required")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail) {
        throw new ApiError(400, "thumbnail not required")
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title: title,
                description: description,
                thumbnail: {
                    public_id: thumbnail.public_id,
                    url: thumbnail.url
                },
            },
        },
        { new: true },
    )

    if(!updateVideo){
        throw new ApiError(500,"Failed to update the video")
    }
    if(updateVideo){
        await deleteOnCloudinary(thumbnailToDelete)
    }

    return res
        .status(200)
        .json( new ApiResponse(200,updateVideo,"Video updated Successfully"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid Video Id")
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "No video found");
    }

    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(
            400,
            "You can't delete this video as you are not the owner"
        );
    }

    const videoDeleted = await Video.findByIdAndDelete(videoId)

    if (!videoDeleted) {
        throw new ApiError(400, "Failed to delete the video please try again");
    }

    await deleteOnCloudinary(video.thumbnail.public_id)
    await deleteOnCloudinary(video.videoFile.public_id,"video")

    await Like.deleteMany({
        videoId
    })

    await Comment.deleteMany({
        videoId
    })

    return res
        .status(200)
        .json(new ApiResponse(200, deleteVideo,"Video Deleted Successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        return new ApiError(400,"Invalid videoId")
    }

    const video = Video.findById(videoId);

    if(!video){
        throw new ApiError(404,"video not found")
    }

    if(!video?.owner.toString() !== req.user?._id.toString()){
        return new ApiError(400,"Only owner can perform this operation of toggling publish");
    }

    const updated = await Video.findByIdAndUpdate(
        videoId,{
            $set: {
                isPublished:!video.isPublished
            }
        },{ new: true })

    if(!updated){
        throw new ApiError(400,"Failed to toggle the Publish status")   
    }

    return res
        .status(200)
        .json(
            200,
            {isPublished:updated.isPublished},
            "IsPublished toggled successfully"
        )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}