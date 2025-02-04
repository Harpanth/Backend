import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    
    //TODO: create playlist
    if(!name || !description){
        throw new ApiError(400, "name and description both are required")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner:req.user?._id
    })

    if(!playlist){
        return ApiError(500,"Unable to create the playlist try again")
    }

    return res
        .send(200)
        .json( new ApiResponse(200,"playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params

    if(!isValidObjectId(userId)){
        return new ApiError(400,"Invalid User Id")
    }

    const userPlaylist = await Playlist.aggregate([
        {
            $match:{
                owner:mongoose.Schema.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField:"videos",
                foreignField:"_id",
                as:"videos"
            }
        },
        {
            $addFields:{
                totalVideos:{
                    $size:"$videos"
                },
                totalViews:{
                    $sum:"$videos.view"
                },
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $project:{
                _id:1,
                name:1,
                description:1,
                totalVideos:1,
                totalViews:1,
                updatedAt:1,
                videos: {
                    _id: 1,
                    "videoFile.url": 1,
                    "thumbnail.url": 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    createdAt: 1,
                    views: 1
                },
                owner: {
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1
                }
            }
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(200,"Playlist fetched successfully"))
    //TODO: get user playlists
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid Playlist Id")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404,"Playlist not found")
    }

    const playlistVideos = await Playlist.aggregate([
        {
            $match:{
                _id:mongoose.Schema.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"videos",
                foreignField:"_id",
                as:"videos"
            }
        },
        {
            $match:{
                "video_is_published":true
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
            }
        },
        {
            $addFields:{
                totalVideos:{
                    $size:"$videos"
                },
                totalViews:{
                    $sum:"$videos.views"
                }
            }
        },
        {
            $project:{
                _id:1,
                name:1,
                description:1,
                totalViews:1,
                totalVideos:1,
                updatedAt:1
            }
        }
        


    ])

    return res
        .status(200)
        .json(new ApiResponse(200,playlistVideos[0],"User playlists fetched successfully"))
    //TODO: get playlist by id
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!isValidObjectId(playlistId)){
        return new ApiResponse(400,"Invalid Playlist Id")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404,"Playlist not found")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"Video not found")
    }

    if((playlist.owner?.toString() && video.owner?.toString) !== req.user?._id){
        return new ApiError(400,"only owner can do this action")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlist?._id, // Correctly passing the ID as the first argument
        {
            $addToSet: {
                videos: videoId, // Ensure this matches your schema (e.g., "videos" or "video")
            },
        },
        { new: true } // Ensure the updated document is returned
    );
    if (!updatedPlaylist) {
        throw new ApiError(
            400,
            "failed to add video to playlist please try again"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "Added video to playlist successfully"
            )
        );
});
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if(!isValidObjectId(playlistId)){
        return new ApiResponse(400,"Invalid Playlist Id")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404,"Playlist not found")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"Video not found")
    }

    const updatedPlaylist = await Playlist.findByIdAndDelete(
        playlist?._id,
        {
            $pull:{
                video:videoId
            }
        },
        {new: true}
    )
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedPlaylist,
            "Removed video from playlist successfully"
        )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"invalid playlist Id")
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if(playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "only owner can delete the playlist");
    }
    await Playlist.findByIdAndDelete(playlist?._id)
    // TODO: delete playlist
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "playlist deleted successfully"
        )
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if(!name || !description){
        throw new ApiError(400,"both name and description are necessary")
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        return new ApiError(400,"playlist not found")
    }

    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "only owner can edit the playlist");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlist?._id,
        {
            $set:{
                name,
                description,
            }
        },
        {new:true}
    )

    return res
    .status(200)
    .json(new ApiResponse(200, playlists, "User playlists fetched successfully"));
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}